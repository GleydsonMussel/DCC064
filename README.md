# DCC064

Repositório para códigos do trabalho da disciplina DCC064 - Sistemas Distribuídos.

## Git

### Submódulos
Para o ROS conseguir acessar e coletar `frames` com a câmera da Raspberry, é necessário ter o submódulo baixado. Sendo assim, execute logo após clonar:

```console
git submodule update --recursive --init
```

## ROS

### Build
Para realizar o build:

```console
colcon build --cmake-args -DCMAKE_BUILD_TYPE=Release
```

### Launch
Para executar o launch:

```console
ros2 launch camera_pkg system.launch.py
```

### Rviz
Para rodar o `rviz`, com o objetivo de visualizar as imagens publicadas:

```console
ros2 run rviz2 rviz2
```

### Publicação de imagens

As Raspberrys publicam as imagens utilizando portas no intervalo de `[10001:10999]`, por meio do Rosbridge WebSocket.  
A porta utilizada pela Raspberry para publicar os dados é definida via arquivo de parâmetros `.yml`, presente em:

`./Raspberry/src/camera_pkg/camera_pkg/config/rasp_config.yml`

## Host

Os hosts publicam as imagens segmentadas também via WebSocket, porém nas portas do intervalo `[9001:9999]`, para consumo pelos frontends.