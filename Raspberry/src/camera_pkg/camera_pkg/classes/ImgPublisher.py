import rclpy
from rclpy.node import Node
from sensor_msgs.msg import CompressedImage, Image
from camera_pkg.classes.ImgHandler import ImgHandler
import cv2
from cv_bridge import CvBridge
import numpy as np

class ImgPublisher(Node):
    
    def __init__(self, device:str="rasp1", cameras:list=['0']):
        # Usando construtor de Node
        super().__init__('img_publisher')
        # FPS desejado para coleta
        self.desired_fps = 30
        # Cria CvBridge para converter formatos de imagens
        self.bridge = CvBridge()
        # Salvando Lista de Câmeras
        self.cameras = cameras
        # Cria Publishers
        self.create_pubs(device)
        # Cria Subscribers
        self.create_subs()
        # Criando Timer Callback 
        timer_period = 1/self.desired_fps  # seconds
        self.timer = self.create_timer(timer_period, self.timer_callback)

    def create_pubs(self, device:str):
        # Criando Publishers que permitam várias câmeras e inicializando campos de frames salvos
        self.img_publishers = {}
        self.frames_to_deliver = {}
        for camera in self.cameras:
            self.img_publishers[camera] = self.create_publisher(CompressedImage, device+'_camera_'+camera, self.desired_fps) 
            self.frames_to_deliver[camera] = None
        self.publishers_test = self.create_publisher(Image, "/test_camera", self.desired_fps) 
    
    def create_subs(self):
        self.subscriber = self.create_subscription(Image, '/camera/image_raw', self.img_raw_callback, 10)

    def img_raw_callback(self, msg):
        try:
            cv_image = self.bridge.imgmsg_to_cv2(msg, desired_encoding='bgr8')

            out_msg = self.bridge.cv2_to_imgmsg(cv_image, encoding='bgr8')
            out_msg.header.stamp = self.get_clock().now().to_msg()
            out_msg.header.frame_id = "camera_frame"
            self.publishers_test.publish(out_msg)

        except Exception as e:
            self.get_logger().error(f"Erro no img_raw_callback: {e}")
        
        
        
    def timer_callback(self):
        # Percorre todas as câmeras, publicando todas as imagens coletadas
        for camera in self.cameras:
            if self.frames_to_deliver[camera] != None:
                msg = CompressedImage()
                msg.header.stamp = self.get_clock().now().to_msg()
                msg.format = "jpeg"
                msg.data = self.frames_to_deliver[camera]
                self.publishers[camera].publish(msg)
            # Limpa Frames para Enviar
            self.frames_to_deliver[camera] = None