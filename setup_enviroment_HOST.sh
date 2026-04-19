#!/usr/bin/env bash
set -e

# =====================================================
# Raspberry Pi 4 + Ubuntu Server 24.04 ARM64
# ROS 2 JAZZY + ROSBRIDGE
# Stable version for Noble
# =====================================================

echo "=================================================="
echo " HOST "
echo "=================================================="

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
python3-opencv \
locales \
nano \
tmux \
htop \
net-tools

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