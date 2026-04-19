#!/usr/bin/env bash
set -e

# =====================================================
# Raspberry Pi 4 + Ubuntu Server 24.04 ARM64
# ROS 2 JAZZY + ROSBRIDGE
# Stable version for Noble
# =====================================================

echo "=================================================="
echo " Raspberry Pi 4 / Ubuntu 24.04 / ROS2 JAZZY "
echo "=================================================="

export DEBIAN_FRONTEND=noninteractive

# -------------------------------------------------
# Update system
# -------------------------------------------------
sudo apt update
sudo apt upgrade -y

# -------------------------------------------------
# Base packages
# -------------------------------------------------
sudo apt install -y \
curl \
wget \
git \
gnupg \
lsb-release \
software-properties-common \
build-essential \
cmake \
python3-pip \
python3-venv \
python3-argcomplete \
python3-colcon-common-extensions \
python3-vcstool \
python3-rosdep \
python3-opencv \
locales \
nano \
tmux \
htop \
net-tools

# -------------------------------------------------
# Locale
# -------------------------------------------------
sudo locale-gen en_US en_US.UTF-8
sudo update-locale LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8

# -------------------------------------------------
# ROS repo
# -------------------------------------------------
sudo mkdir -p /usr/share/keyrings

if [ ! -f /usr/share/keyrings/ros-archive-keyring.gpg ]; then
curl -sSL https://raw.githubusercontent.com/ros/rosdistro/master/ros.key | \
sudo gpg --dearmor -o /usr/share/keyrings/ros-archive-keyring.gpg
fi

echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/ros-archive-keyring.gpg] http://packages.ros.org/ros2/ubuntu noble main" | \
sudo tee /etc/apt/sources.list.d/ros2.list >/dev/null

sudo apt update

# -------------------------------------------------
# ROS Jazzy
# -------------------------------------------------
sudo apt install -y \
ros-jazzy-ros-base \
ros-jazzy-rosbridge-suite \
ros-jazzy-image-transport \
ros-jazzy-compressed-image-transport \
ros-jazzy-cv-bridge \
ros-jazzy-vision-opencv \
ros-jazzy-tf2-tools \
ros-jazzy-rosbridge-suite

# -------------------------------------------------
# rosdep
# -------------------------------------------------
sudo rosdep init || true
rosdep update

# -------------------------------------------------
# Auto source
# -------------------------------------------------
if ! grep -q "/opt/ros/jazzy/setup.bash" ~/.bashrc; then
echo "" >> ~/.bashrc
echo "# ROS2 Jazzy" >> ~/.bashrc
echo "source /opt/ros/jazzy/setup.bash" >> ~/.bashrc
fi

mkdir -p ~/ros2_ws/src

echo ""
echo "=================================================="
echo " INSTALL COMPLETE "
echo "=================================================="
echo ""
echo "Run:"
echo "source ~/.bashrc"
echo ""
echo "Test:"
echo "ros2 topic list"
echo ""
echo "Rosbridge:"
echo "ros2 launch rosbridge_server rosbridge_websocket_launch.xml"
echo ""
echo "Recommended:"
echo "sudo reboot"
echo "=================================================="