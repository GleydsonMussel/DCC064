import asyncio
import websockets

clients = set()

async def handler(ws):
    clients.add(ws)
    print("Cliente conectado:", len(clients))

    try:
        async for msg in ws:
            print("Mensagem recebida no servidor (bytes):", len(msg))

            for c in list(clients):
                if c != ws:
                    await c.send(msg)

    finally:
        clients.remove(ws)

async def main():
    async with websockets.serve(handler, "0.0.0.0", 9000):
        print("Servidor rodando em 9000")
        await asyncio.Future()

asyncio.run(main())