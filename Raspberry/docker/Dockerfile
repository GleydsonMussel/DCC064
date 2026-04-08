# Use Ubuntu 20.04 as the base image
FROM ubuntu:20.04

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV LANG=C.UTF-8

# Install curl and gnupg2 first to allow adding the ROS repository
RUN apt-get update && apt-get install -y \
    curl \
    gnupg2 \
    && rm -rf /var/lib/apt/lists/*

# Add ROS Noetic repository and set up keys (using focal for Ubuntu 20.04 explicitly)
RUN sh -c 'echo "deb http://packages.ros.org/ros/ubuntu focal main" > /etc/apt/sources.list.d/ros-latest.list'

RUN curl -s https://raw.githubusercontent.com/ros/rosdistro/master/ros.asc | apt-key add -

# Update and install basic dependencies
RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y \
    lsb-release \
    sudo \
    wget \
    build-essential \
    python3-pip \
    python3-dev \
    python3-rosdep \
    python3-rosinstall \
    python3-rosinstall-generator \
    python3.8-venv \
    bash-completion \
    && rm -rf /var/lib/apt/lists/*

# Install ROS Noetic Desktop
RUN apt-get update && apt-get install -y \
    ros-noetic-desktop-full \
    && rm -rf /var/lib/apt/lists/*

# Install additional dependencies for Catkin and ROS tools
RUN apt-get update && apt-get install -y \
    python3-catkin-tools \
    && rm -rf /var/lib/apt/lists/*

# Setup ROS environment
RUN echo "source /opt/ros/noetic/setup.bash" >> ~/.bashrc

# Initialize rosdep
RUN rosdep init && rosdep update

# Source on ROS
RUN /bin/bash -c "source /opt/ros/noetic/setup.bash"

# Already change the folder to workspace
WORKDIR /workspace

CMD ["bash"]