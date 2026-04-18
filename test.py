import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Image
from cv_bridge import CvBridge
import cv2

class CaptureTest(Node):
    def __init__(self):
        super().__init__('capture_test')
        self.bridge = CvBridge()
        self.sub = self.create_subscription(Image, '/camera/image_raw', self.cb, 10)

    def cb(self, msg):
        img = self.bridge.imgmsg_to_cv2(msg, desired_encoding='bgr8')
        cv2.imwrite('/tmp/frame_test.png', img)
        self.get_logger().info(f'Salvo! Shape: {img.shape}')

def main(args=None):
    rclpy.init(args=args)
    node = CaptureTest()
    rclpy.spin_once(node, timeout_sec=5)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
#sudo apt install libcamera-ipa
#sudo apt install libcamera-v4l2
#sudo apt install ros-jazzy-camera-ros ros-jazzy-libcamera

# Fez FUNFAR:
#sudo apt install ros-jazzy-v4l2-camera
#sudo apt install ros-jazzy-image-transport ros-jazzy-compressed-image-transport
#sudo apt install ros-jazzy-rviz2
#sudo apt install libogre-1.12-dev libogre-1.12.10
#sudo apt install -y ros-jazzy-camera-ros