cmake_minimum_required(VERSION 3.0.2)
project(camera_pkg)

## Compile as C++11, supported in ROS Kinetic and newer
# add_compile_options(-std=c++11)

## Find catkin macros and libraries
find_package(catkin REQUIRED COMPONENTS
  roscpp
  rospy
  std_msgs
  sensor_msgs
  message_generation
)

## System dependencies
# find_package(Boost REQUIRED COMPONENTS system)

################################################
## Declare ROS messages, services and actions ##
################################################

## Declare message files (adicione suas msgs aqui)
add_message_files(
  FILES
  EncodedImg.msg
)

## Instalar arquivos de launch
install(DIRECTORY launch/
  DESTINATION ${CATKIN_PACKAGE_SHARE_DESTINATION}/launch
  FILES_MATCHING PATTERN "*.launch"
)

## Declare dependencies of messages (ex: std_msgs)
generate_messages(
  DEPENDENCIES
  std_msgs
  sensor_msgs
)

###################################
## catkin specific configuration ##
###################################
catkin_package(
  CATKIN_DEPENDS message_runtime roscpp rospy std_msgs
)

###########
## Build ##
###########

## Include directories
include_directories(
  include
  ${catkin_INCLUDE_DIRS}
)

## Para C++: descomente se tiver nós em C++
# add_executable(${PROJECT_NAME}_node src/camera_pkg_node.cpp)
# add_dependencies(${PROJECT_NAME}_node ${${PROJECT_NAME}_EXPORTED_TARGETS} ${catkin_EXPORTED_TARGETS})
# target_link_libraries(${PROJECT_NAME}_node ${catkin_LIBRARIES})

#############
## Install ##
#############

## Instalar scripts Python (seus nós)
catkin_install_python(PROGRAMS
  src/send_img_node.py
  DESTINATION ${CATKIN_PACKAGE_BIN_DESTINATION}
)

# Instalar o módulo CameraHandler
install(DIRECTORY include/camera_pkg
  DESTINATION ${CATKIN_PACKAGE_PYTHON_DESTINATION}
)