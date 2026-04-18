from launch import LaunchDescription
from launch_ros.actions import Node

def generate_launch_description():
    return LaunchDescription([

        Node(
            package='camera_ros',
            executable='camera_node',
            name='camera',
            output='screen',
            parameters=[{
                'width': 640,
                'height': 480,
                'format': 'RGB888',  # ← adiciona essa linha
            }]
        ),

        Node(
            package='camera_pkg',
            executable='get_img_node',
            name='get_img_node',
            output='screen'
        ),
    ])