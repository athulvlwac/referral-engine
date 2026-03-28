import httpx
import asyncio
async def main():
    async with httpx.AsyncClient() as c:
        r = await c.post('http://127.0.0.1:8000/auth/register', json={'name':'A', 'email':'a@a.com', 'password':'abcdefges', 'referral_code':''})
        print(r.status_code)
        print(r.text)
asyncio.run(main())
