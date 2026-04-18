import rclpy
from camera_pkg.classes.ImgPublisher import ImgPublisher

def main(args=None):
    # Inicializa/coleta argumentos passados para o nó
    rclpy.init(args=args)
    
    # Inicializa nó com seus métodos
    img_publisher = ImgPublisher()
    
    # Coloca nó para rodar
    rclpy.spin(img_publisher)

    # Destroy the node explicitly
    img_publisher.destroy_node()
    rclpy.shutdown()


if __name__ == '__main__':
    main()