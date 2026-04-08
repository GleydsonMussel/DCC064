#!/usr/bin/env python3

import rospy
import uuid
from sensor_msgs.msg import CompressedImage, Image
from std_msgs.msg import String

def main():
    # Inicia No
    rospy.init_node('send_img_node')
    pub = rospy.Publisher('imgs_collected', String, queue_size=10)
    rate = rospy.Rate(10) # 10hz
    while not rospy.is_shutdown():
        hello_str = "hello world %s" % rospy.get_time()
        rospy.loginfo(hello_str)
        pub.publish(hello_str)
        rate.sleep()

if __name__ == "__main__":
    main()