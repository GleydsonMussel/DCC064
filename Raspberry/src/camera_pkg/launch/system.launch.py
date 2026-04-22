from launch import LaunchDescription
from launch_ros.actions import Node

def generate_launch_description():
    return LaunchDescription([
        # Nó da biblioteca para extrair e coletar imagens usando a câmera da Raspberry
        Node(
            package='camera_ros',
            executable='camera_node',
            name='camera',
            output='screen',
            parameters=[{
                'width': 640,
                'height': 480,
                'format': 'RGB888',  
                'framerate': 30,
            }]
        ),
        # Nó em Python para coletar as imagens
        Node(
            package='camera_pkg',
            executable='get_img_node',
            name='get_img_node',
            output='screen'
        ),
        # Rosbridge que publica as mensagens para qualquer nó na rede
        Node(
            package='rosbridge_server',
            executable='rosbridge_websocket',
            name='rosbridge_websocket',
            output='screen',
            parameters=[{
                'port': 10001,
            }]
        ),
    ])