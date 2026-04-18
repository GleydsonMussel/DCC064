import rclpy
from rclpy.node import Node
from sensor_msgs.msg import CompressedImage, Image
from camera_pkg.classes.ImgHandler import ImgHandler
import cv2
from cv_bridge import CvBridge

class ImgPublisher(Node):
    
    def __init__(self, device:str="rasp1"):
        # Usando construtor de Node
        super().__init__('img_publisher')
        # Frequência desejada para publicação (Hz)
        self.desired_pub_frequency = 15
        # Dispositivo de orígem para as imagens
        self.device = device
        # Inicializando campo que armazena as imagens recebidas
        self.cv_image = None
        # Define Frame Id para Imagens
        self.imgs_frame_id = self.device+"_camera_frame"
        # Cria CvBridge para converter formatos de imagens
        self.bridge = CvBridge()
        # Cria Publishers
        self.create_pubs()
        # Cria Subscribers
        self.create_subs()
        # Criando Timer Callback 
        timer_period = 1/self.desired_pub_frequency  # seconds
        self.timer = self.create_timer(timer_period, self.timer_callback)

    # Criando Publishers
    def create_pubs(self):
        self.debug_img_publisher = self.create_publisher(Image, "/debug_"+self.device+"_camera", 10)
        self.img_publisher = self.create_publisher(CompressedImage, "/"+self.device+"_camera_output", 10) 
    
    # Criando Subscriber
    def create_subs(self):
        self.subscriber = self.create_subscription(Image, '/camera/image_raw', self.img_raw_callback, 10)
    
    # Cria Callback para receber as imagens
    def img_raw_callback(self, msg):
        try:
            self.cv_image = self.bridge.imgmsg_to_cv2(msg, desired_encoding='bgr8')
            # Publica msg original direto, sem reconverter
            msg.header.frame_id = self.imgs_frame_id
            self.debug_img_publisher.publish(msg)
        except Exception as e:
            self.get_logger().error(f"Erro no img_raw_callback: {e}")
            self.cv_image = None
    
    # Cria Timer Callback para lidar com porcessamento mais pesado do nó e enviar mensagem
    def timer_callback(self):
        if self.cv_image is not None:
            treated_image = ImgHandler.process_image(self)
            try:
                # Converte para JPEG e cria CompressedImage
                _, buffer = cv2.imencode('.jpg', treated_image)
                # Cria e popula mensagem a ser enviada
                msg = CompressedImage()
                msg.header.stamp = self.get_clock().now().to_msg()
                msg.header.frame_id = self.imgs_frame_id
                msg.format = "jpeg"
                msg.data = buffer.tobytes()
                self.img_publisher.publish(msg)
            except Exception as e:
                self.get_logger().error(f"Erro no timer_callback: {e}")
            finally:
                self.cv_image = None
        #else:
            #self.get_logger().warn(f"No new Image to Publish")