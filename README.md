# DCC064

Repositorio para codigos do trabalho da disciplina DCC064, Sistemas Distribuidos.

## Git

### Submodulos
Para o ROS conseguir acessar e coletar `frames` com a câmera da Rasp, é necessário ter o submódulo baixado, sendo assim, 
execute logo após clonar:
```console
git submodule update --recursive --init
``` 
## ROS

### Buildar
Para buildar:
```console
colcon build --cmake-args -DCMAKE_BUILD_TYPE=Release
```

### Launch
Para dar `Launch`:
```console
ros2 launch camera_pkg system.launch.py
```

### Rviz
Para rodar o `rviz`, no intuito de visualizar as imagens publicadas:
```console
ros2 run rviz2 rviz2
```
