import rclpy
from rclpy.node import Node
import cv2

class ImgHandler:
    def resize_img(img=None, node=None):
        node.get_logger().warn('Chamei o Método')