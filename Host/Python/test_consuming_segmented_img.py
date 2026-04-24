import asyncio
import websockets
import json
import base64
import cv2
import numpy as np

# Decoda e exibe imagem exibindo janela da OpenCV
async def decode_and_show(data):
    try:
        jpg_b64 = data["image"]

        jpg_bytes = base64.b64decode(jpg_b64)
        img_array = np.frombuffer(jpg_bytes, dtype=np.uint8)
        frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

        if frame is not None:
            cv2.imshow("Receiver", frame)
            cv2.waitKey(1)

            print(
                "Recebido de:",
                data.get("origin_device_name"),
                "| MAC:",
                data.get("origin_mac_adress")
            )

    except Exception as e:
        print("Erro ao decodificar frame:", e)

# Consome imagens recebidas via websocket
async def consume():
    uri = "ws://127.0.0.1:9000"
    while True:  # loop de reconexão
        try:
            print("Conectando em", uri)
            async with websockets.connect(uri) as ws:
                print("Conectado!")

                async for msg in ws:
                    try:
                        data = json.loads(msg)
                        await decode_and_show(data)

                    except Exception as e:
                        print("Erro no frame:", e)

        except (ConnectionRefusedError, OSError):
            print("Servidor não disponível, tentando novamente em 2s...")
            await asyncio.sleep(2)

        except Exception as e:
            print("Erro geral:", e)
            await asyncio.sleep(2)


if __name__ == "__main__":
    try:
        asyncio.run(consume())
    finally:
        cv2.destroyAllWindows()