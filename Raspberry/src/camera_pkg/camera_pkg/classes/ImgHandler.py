import rclpy
from rclpy.node import Node
import cv2

class ImgHandler:
    
    def process_image(node=None):
        # Extraindo dimensões alvo
        target_width = node.general_params['img_format']['height_target']
        target_heigth = node.general_params['img_format']['width_target']
        # Extraindo dimensões originais da imagem
        height = node.cv_image.shape[0]
        width = node.cv_image.shape[1]
        # Retorna tudo
        return cv2.resize(node.cv_image, (target_width, target_heigth), interpolation=cv2.INTER_AREA), width, height