import asyncio
import websockets
import json
import base64
import cv2
import numpy as np
import yaml
import os

def get_parameters():
    # Caminho do diretório config relativo a este arquivo .py
    config_dir = os.path.join(os.path.dirname(__file__), 'config')
    # Lê e extrai parâmetros
    with open(os.path.join(config_dir, 'general_config.yml')) as f:
        general_params = yaml.safe_load(f)
        f.close()
    # Retosna Parâmetros
    return general_params
        
async def consume():
    
    uri = "ws://192.168.0.245:9999"
    async with websockets.connect(uri) as ws:
        # Assina o tópico
        subscribe = {
            "op": "subscribe",
            "topic": "/rasp1_camera_output",
            "type": "custom_msgs/RaspImg"
        }
        await ws.send(json.dumps(subscribe))
        
        async for msg in ws:
            data = json.loads(msg)
            img_data = base64.b64decode(data['msg']['comp_img']['data'])
            img_array = np.frombuffer(img_data, dtype=np.uint8)
            frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
            cv2.imshow('Camera', frame)
            cv2.waitKey(1)

asyncio.run(consume())