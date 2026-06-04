import asyncio
import websockets
import json
import base64
import cv2
import numpy as np
import time

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
        while True:
            try:
                async with websockets.connect(uri) as ws:
                    print(f"Conectado em {uri}")
                    subscribe = {
                        "op": "subscribe",
                        "topic": "/rasp1_camera_output",
                        "type": "custom_msgs/RaspImg"
                    }
                    await ws.send(json.dumps(subscribe))
                    recv_count = 0
                    proc_count = 0
                    t0 = time.time()
                    async for msg in ws:
                        data = json.loads(msg)
                        img_data = base64.b64decode(data['msg']['comp_img']['data'])
                        img_array = np.frombuffer(img_data, dtype=np.uint8)
                        frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
                        if frame is not None:
                            recv_count += 1
                            annoted_img = img_handler.segment_objs(frame)
                            await self.send(annoted_img)
                            proc_count += 1
                            elapsed = time.time() - t0
                            if elapsed >= 1.0:
                                print(f"[{self.origin_device_name}] recebimento: {recv_count / elapsed:.1f} FPS | processamento: {proc_count / elapsed:.1f} FPS")
                                recv_count = 0
                                proc_count = 0
                                t0 = time.time()
            except (ConnectionRefusedError, OSError):
                print(f"{uri} indisponível, tentando novamente em 2s...")
                await asyncio.sleep(2)
            except Exception as e:
                print(f"Erro em consume ({uri}): {e}")
                await asyncio.sleep(2)
    
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
        if annotated_img is None:
            return

        h, w = annotated_img.shape[:2]
        max_w = 640
        if w > max_w:
            scale = max_w / w
            annotated_img = cv2.resize(
                annotated_img,
                (max_w, int(h * scale)),
                interpolation=cv2.INTER_AREA,
            )

        success, buffer = cv2.imencode(
            '.jpg',
            annotated_img,
            [int(cv2.IMWRITE_JPEG_QUALITY), 72],
        )
        if not success:
            return
        jpg_bytes = base64.b64encode(buffer).decode('utf-8')
        # Monta mensagem
        message = {
            "image": jpg_bytes,
            "ori_mac_adress": self.origin_mac_adress, 
            "origin_device_name": self.origin_device_name
        }
        # Envia mensagem
        await self.out_ws.send(json.dumps(message))
        
