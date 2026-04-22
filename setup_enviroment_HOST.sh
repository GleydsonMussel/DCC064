#!/usr/bin/env bash
set -e

# =====================================================
# Qualquer Host que tenha Python >= 3.11.x
# =====================================================

echo "=================================================="
echo " HOST "
echo "=================================================="

# -------------------------------------------------
# Update system
# -------------------------------------------------
sudo apt update

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

# -------------------------------------------------
# Creating venv
# -------------------------------------------------
echo "Creating Venv"
python3 -m venv ./Host/Python/venv
./Host/Python/venv/bin/pip install --upgrade pip
./Host/Python/venv/bin/pip install -r ./Host/Python/config/requirements.txt

echo ""
echo "=================================================="
echo " INSTALL COMPLETE "
echo "=================================================="
echo ""
echo "Run:"
echo "source ./Host/Python/venv/bin/activate"
echo ""
echo "=================================================="