from setuptools import setup, find_packages
import os
from glob import glob

package_name = 'camera_pkg'

setup(
    name=package_name,
    version='0.0.0',
    packages=find_packages(exclude=['test']),
    data_files=[
        ('share/ament_index/resource_index/packages',
            ['resource/' + package_name]),
        ('share/' + package_name, ['package.xml']),
        # launch files
        (os.path.join('share', package_name, 'launch'),
         glob('launch/*.launch.py')),
    ],
    install_requires=['setuptools'],
    zip_safe=True,
    maintainer='raptor',
    maintainer_email='raptor@todo.todo',
    description='Package for sending images collected via rosbridge',
    license='Apache-2.0',
    entry_points={
        'console_scripts': [
            'get_img_node = camera_pkg.get_img_node:main'
        ],
    },
)