import asyncio
import websockets
import json
import base64
import cv2
import numpy as np

class HandlePipeline():
    
    def __init__(self, origin_ip, origin_port, destiny_ip, destiny_port, mac_adress, origin_device_name):
        # Parametros para recebimento de dados
        self.origin_ip = origin_ip
        self.origin_port = origin_port
        self.origin_mac_adress = mac_adress
        self.origin_device_name = origin_device_name
        # Parametros para envio de dados
        self.out_url = "ws://"+destiny_ip+":"+destiny_port 
        
    # Inicializa sender 
    async def start_sender(self):
        self.out_ws = await websockets.connect(self.out_url)
    
    # Recebe assincronamente todas as imagens
    async def consume(self, img_handler):
        uri = "ws://"+self.origin_ip+":"+self.origin_port
        async with websockets.connect(uri) as ws:
            # Assina o tópico
            subscribe = {
                "op": "subscribe",
                "topic": "/rasp1_camera_output",
                "type": "custom_msgs/RaspImg"
            }
            await ws.send(json.dumps(subscribe))
            # Disseca mensagem recebida
            async for msg in ws:
                data = json.loads(msg)
                img_data = base64.b64decode(data['msg']['comp_img']['data'])
                img_array = np.frombuffer(img_data, dtype=np.uint8)
                frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
                if frame is not None:
                    # Passa para segmentacao
                    annoted_img = img_handler.segment_objs(frame)
                    # Envia imagem anotada
                    await self.send(annoted_img)
    
    # Recebe assincronamente videos
    async def video_test(self, video_path=0, img_handler=None):
        video = cv2.VideoCapture(video_path)
        while True:
            ret, frame = video.read()
            if ret:
                annoted_img = img_handler.segment_objs(frame)
                await self.send(annoted_img)
                await asyncio.sleep(0.04)  # ~20 FPS mais seguro
                
    # Envia Dados
    async def send(self, annotated_img):
        if self.out_ws is None:
            return
        # compressão JPEG
        success, buffer = cv2.imencode('.jpg', annotated_img)
        if not success:
            return
        # base64 encode
        jpg_bytes = base64.b64encode(buffer).decode('utf-8')
        # Monta mensagem
        message = {
            "image": jpg_bytes,
            "ori_mac_adress": self.origin_mac_adress, 
            "origin_device_name": self.origin_device_name
        }
        # Envia mensagem
        await self.out_ws.send(json.dumps(message))
        
