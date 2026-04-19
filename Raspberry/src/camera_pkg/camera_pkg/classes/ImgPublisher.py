import rclpy
from rclpy.node import Node
from sensor_msgs.msg import CompressedImage, Image
from custom_msgs.msg import RaspImg
from camera_pkg.classes.ImgHandler import ImgHandler
import cv2
from cv_bridge import CvBridge
import yaml
import os
from ament_index_python.packages import get_package_share_directory

class ImgPublisher(Node):
    
    def __init__(self):
        # Usando construtor de Node
        super().__init__('img_publisher')
        # Inicializa campo para os parâmetros gerais
        self.general_params = None
        # Inicializa campo para os parâmetros de dispositivo
        self.device_params = None
        # Carrega parâmetros
        self.load_config()
        # Frequência desejada para publicação (Hz)
        self.desired_pub_frequency = 15
        # Inicializando campo que armazena as imagens recebidas
        self.cv_image = None
        # Define Frame Id para Imagens
        self.imgs_frame_id = self.device_params["device_name"]+"_camera_frame"
        # Cria CvBridge para converter formatos de imagens
        self.bridge = CvBridge()
        # Cria Publishers
        self.create_pubs()
        # Cria Subscribers
        self.create_subs()
        # Criando Timer Callback 
        timer_period = 1/self.desired_pub_frequency  # seconds
        self.timer = self.create_timer(timer_period, self.timer_callback)

    def load_config(self):
        # Determina caminho até o diretório com os arquivos de parâmetro
        config_dir = os.path.join(get_package_share_directory('camera_pkg'),'config')
        # Lê o arquivo general_parameters
        with open(os.path.join(config_dir, 'general_params.yml')) as f:
            self.general_params = yaml.safe_load(f)
            f.close()
        # Lê o arquivo da rasp_parameters
        with open(os.path.join(config_dir, 'rasp_config.yml')) as f:
            self.device_params = yaml.safe_load(f)

    # Criando Publishers
    def create_pubs(self):
        self.debug_img_publisher = self.create_publisher(Image, "/debug_"+self.device_params["device_name"]+"_camera", 10)
        self.img_publisher = self.create_publisher(RaspImg, "/"+self.device_params["device_name"]+"_camera_output", 10) 
    
    # Criando Subscriber
    def create_subs(self):
        self.subscriber = self.create_subscription(Image, '/camera/image_raw', self.img_raw_callback, 10)
    
    # Cria Callback para receber as imagens
    def img_raw_callback(self, msg):
        try:
            self.cv_image = self.bridge.imgmsg_to_cv2(msg, desired_encoding='bgr8')
            # Publica msg original direto, sem reconverter
            if not self.general_params["is_production"]:
                msg.header.frame_id = self.imgs_frame_id
                self.debug_img_publisher.publish(msg)
        except Exception as e:
            self.get_logger().error(f"Erro no img_raw_callback: {e}")
            self.cv_image = None
    
    # Cria Timer Callback para lidar com porcessamento mais pesado do nó e enviar mensagem
    def timer_callback(self):
        if self.cv_image is not None:
            # Manda imagem para tratamento
            treated_image, ori_width, ori_height = ImgHandler.process_image(self)
            try:
                # Converte para JPEG e cria CompressedImage
                _, buffer = cv2.imencode(self.general_params["img_format"]["img_target_encode"], treated_image)
                # Cria e popula CompressedImage
                comp_img = CompressedImage()
                comp_img.format = self.general_params["img_format"]["img_target_format"]
                comp_img.data = buffer.tobytes()
                # Cria e popula mensagem a ser enviada
                msg = RaspImg()
                msg.header.stamp = self.get_clock().now().to_msg()
                msg.header.frame_id = self.imgs_frame_id
                msg.device_uuid = self.device_params["uuid"]
                msg.original_width = ori_width
                msg.original_height = ori_height
                msg.comp_img = comp_img
                # Publica mensagem
                self.img_publisher.publish(msg)
            except Exception as e:
                self.get_logger().error(f"Erro no timer_callback: {e}")
            finally:
                self.cv_image = None