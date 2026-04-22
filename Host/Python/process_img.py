import asyncio
import cv2
from classes.ImgHandler import ImgHandler
from classes.HandlePipeline import HandlePipeline

async def main(img_handler, is_video:bool=False):
    # Inicializa vetor com handlers
    handler_objs = []
    # Percorre itens
    for ori_device_name, device in img_handler.general_params["devices"].items():
        # Criando handler para conexao
        handler = HandlePipeline(
            device["ip"],
            device["port"],
            "127.0.0.1",
            device["destiny_port"],
            device["mac_adress"],
            ori_device_name
        )
        await handler.start_sender()
        handler_objs.append(handler)
        
        # Video
        if is_video:
            asyncio.create_task(handler.video_test(img_handler=img_handler))
        # ROS
        else:
            asyncio.create_task(handler.consume(img_handler))
            
    # mantém o loop vivo
    while True:
        await asyncio.sleep(1)
        
if __name__ == "__main__":
    img_handler = ImgHandler()
    asyncio.run(main(img_handler, img_handler.general_params["is_video"]))
