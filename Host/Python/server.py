import asyncio
import websockets
import websockets.exceptions

clients = set()

async def handler(ws):
    clients.add(ws)
    print("Cliente conectado:", len(clients))

    try:
        async for msg in ws:
            print("Mensagem recebida no servidor (bytes):", len(msg))

            dead = set()
            for c in list(clients):
                if c != ws:
                    try:
                        await c.send(msg)
                    except websockets.exceptions.ConnectionClosed:
                        dead.add(c)

            clients.difference_update(dead)

    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        clients.discard(ws)

async def main():
    async with websockets.serve(handler, "0.0.0.0", 9000, origins=None, ping_interval=None):
        print("Servidor rodando em 9000")
        await asyncio.Future()

asyncio.run(main())