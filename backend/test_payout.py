import httpx
import asyncio
async def test():
    async with httpx.AsyncClient() as c:
        resp = await c.post('http://127.0.0.1:8000/auth/login', data={'username':'admin@example.com', 'password':'password123'})
        token = resp.json()['access_token']
        resp = await c.post('http://127.0.0.1:8000/rewards/process-batch', headers={'Authorization': f'Bearer {token}'})
        print('Batch:', resp.status_code, resp.json())
        resp = await c.post('http://127.0.0.1:8000/rewards/4/payout', headers={'Authorization': f'Bearer {token}'})
        print('Payout 4:', resp.status_code, resp.json())
asyncio.run(test())
