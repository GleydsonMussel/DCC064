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

## Raspberry Pi

As credenciais para acessar a Raspberry são:
```console
usuario: raptor
senha: raptor123
```
## Host

O Host recebe imagens das Raspberrys (ou da webcam local em modo de teste), realiza a segmentação via YOLO e republica as imagens segmentadas via WebSocket para consumo pelos frontends.

### Arquitetura

```
Raspberry Pi → Rosbridge (:10001) → process_img.py → server.py (:9000) → Frontend
Webcam (modo teste)               ↗
```

- **`server.py`** — servidor relay WebSocket; recebe imagens segmentadas do `process_img.py` e as retransmite para todos os frontends conectados.
- **`process_img.py`** — pipeline principal; consome frames (ROS ou webcam), segmenta com YOLO e envia ao `server.py`.

### Dependências

```console
pip install -r Host/Python/config/requirements.txt
```

### Configuração

Edite o arquivo `Host/Python/config/general_config.yml`:

```yaml
devices:
  rasp1:
    mac_adress: "<MAC da Raspberry>"
    ip: "<IP da Raspberry>"
    port: "<porta Rosbridge da Raspberry>"   # intervalo [10001:10999]
    destiny_port: "<porta local do server>"  # intervalo [9001:9999]
model: "./Host/Python/models/yolo26n-seg.pt" # yolo26n-seg.pt | yolo26s-seg.pt | yolo26m-seg.pt
is_video: false  # true = usa webcam local para testes; false = consome via ROS
```

### Subindo o Host

> Os comandos devem ser executados a partir da **raiz do repositório**.

**1. Inicie o servidor relay** (em um terminal separado):

```console
python Host/Python/server.py
```

**2. Inicie o pipeline de segmentação:**

```console
python Host/Python/process_img.py
```

#### Modo de teste (webcam local)

Para testar sem a Raspberry, defina `is_video: true` no `general_config.yml`. O pipeline usará a webcam do Host (dispositivo `/dev/video0`) como fonte de frames.