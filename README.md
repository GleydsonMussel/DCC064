# DCC064

Repositório para códigos do trabalho da disciplina DCC064 - Sistemas Distribuídos.

## Git

### Submódulos
Para o ROS conseguir acessar e coletar `frames` com a câmera da Raspberry, é necessário ter o submódulo baixado. Sendo assim, execute logo após clonar:

```console
git submodule update --recursive --init
```

## ROS 

Toda a parte do `ROS` roda na Raspberry, a qual possui o Sistema Operacional Ubuntu `24.04` Server Edition

Utiliza-se `ROS 2` na versão `Jazzy`

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

### Backend
A seguir estão as informações relativas as `Backend` implementado em `Python`

#### Dependências
```console
pip install -r Host/Python/config/requirements.txt
```

#### Configuração
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

#### Subindo Backend

- **`server.py`** — servidor relay WebSocket; recebe imagens segmentadas do `process_img.py` e as retransmite para todos os frontends conectados.
- **`process_img.py`** — pipeline principal; consome frames (ROS ou webcam), segmenta com YOLO e envia ao `server.py`.

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

### Frontend
A seguir estão as informações relativas as `Frontend` implementado usando `Next`

#### NVM
Recomenda-se a instalação do `nvm` para gerenciamento da versão do Node:

```console
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash
source ~/.bashrc
```

Para verificar a instalação, rode:

```console
nvm --version
```

Se tudo instalou corretamente, a versão atual do `nvm` instalado deve aparecer no terminal.

#### Node
Tendo o `nvm` instalado, hora de baixar o node, para tanto, basta rodar:

```console
nvm install 22.13.0
```

Certifique-se de colocar esta versão como a padrão do sistema

#### Dependências do Projeto
Para instalar as dependências do `node` necessárias para nossa aplicação, basta, da raíz do projeto:

```console
cd ./Host/Frontend/
npm install
```

#### Subindo Frontend
Feito isso, para subir o `Frontend`:

```console
npm run dev
```

A aplicação vai subir no `localhost` porta `3000`:

```console
http://localhost:3000
``` 

Esta aplicação consome as imagens publicadas pelo `Backend`, de cada `Raspberry` conectada

## To Do

Aqui tem uma breve listas de pendências a serem resolvidas

### Múltiplas Raspberrys

É necessário que o Frontend exiba quais as Raspberrys disponíveis para visualizar informação, o usuário então seleciona aquela que deseja e
é levado para a tela que já existe hoje

### Apresentação

Construir uma apresentação contendo:

* Parte Teórica do ROS

* Parte Teórica do que Implementamos

* Parte Prática do que Implementamos

#### Parte Teórica do ROS

Explicar o que é o framework, quais seus recursos (Nós, Tópicos, Serviços, Bridges), capacidade de rodar descentralizado e uso mais indicado.

#### Parte Teórica do que Implementamos

Falar um pouco do modelo YOLO que adotamos, o que é, como funciona (rapidamente), o que faz (Detecção e Segmentação)

#### Parte Prática do que Implementamos

Falar da arquitetura `Física`: 

* Separação dos Componente (Rasp e Host).

* Como transmitimos dados entre as entidades. 

* Especificar: Modelo da Rasp, Modelo da câmera e Specs do Host.

Falar da Arquitetura `Lógica`: 

* O que a Rasp faz usando ROS.

* O que o Backend do Host faz e em que está implementado.

* O que o Frontend do Host pode fazer e em que está implementado.

Mostrar exemplo funcionando em tempo real