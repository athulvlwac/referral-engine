"""
Seed script for the User/Admin Auth & Referral Engine.

Demonstrates:
1. Creating an Admin user (first user)
2. Admin generating a code and User registering via code
3. Verifying the DAG was created during registration
"""
import asyncio
import sys
import io

# Fix Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

import httpx

BASE_URL = "http://127.0.0.1:8000"

async def main():
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=30) as client:
        print("=" * 60)
        print("  REFERRAL ENGINE - NEW AUTH SEED SCRIPT")
        print("=" * 60)

        # -- Step 1: Create Admin (First User) --
        print("\n[Step 1] Creating Admin User (Alice)...")
        admin_payload = {
            "name": "Alice Admin",
            "email": "admin@example.com",
            "password": "password123",
            "referral_code": ""
        }
        resp = await client.post("/auth/register", json=admin_payload)
        if resp.status_code == 201:
            admin_data = resp.json()
            print(f"  [OK] Admin Created: {admin_data['name']} (Role: {admin_data['role']})")
        else:
            print(f"  [FAIL] {resp.json()}")
            return

        # -- Step 1.5: Login as Admin --
        print("\n[Step 1.5] Logging in as Admin...")
        login_resp = await client.post("/auth/login", data={"username": "admin@example.com", "password": "password123"})
        if login_resp.status_code == 200:
            token = login_resp.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            print("  [OK] Logged in successfully. Token acquired.")
        else:
            print("  [FAIL] Login failed.")
            return

        # Get Admin's Referral Code
        alice_code = admin_data["referral_code"]

        # -- Step 2: Register User via Referral Link --
        print(f"\n[Step 2] Registering Bob using Alice's referral code ({alice_code})...")
        bob_payload = {
            "name": "Bob User",
            "email": "bob@example.com",
            "password": "password123",
            "referral_code": alice_code
        }
        resp = await client.post("/auth/register", json=bob_payload)
        if resp.status_code == 201:
            bob_data = resp.json()
            bob_code = bob_data["referral_code"]
            print(f"  [OK] Bob Registered! (Role: {bob_data['role']})")
        else:
            print(f"  [FAIL] {resp.json()}")
            return
            
        print(f"\n[Step 2.5] Registering Charlie using Bob's referral code ({bob_code})...")
        charlie_payload = {
            "name": "Charlie Subuser",
            "email": "charlie@example.com",
            "password": "password123",
            "referral_code": bob_code
        }
        resp = await client.post("/auth/register", json=charlie_payload)
        if resp.status_code == 201:
             print("  [OK] Charlie Registered!")

        # -- Step 3: Admin Views Dashboard --
        print("\n[Step 3] Admin fetching dashboard metrics...")
        resp = await client.get("/dashboard/metrics", headers=headers)
        if resp.status_code == 200:
            m = resp.json()
            print(f"  [OK] Total Users: {m['total_users']}, Total Referrals: {m['total_referrals']}")

        # -- Step 4: User Views Their Panel --
        print("\n[Step 4] Bob viewing his personal User Panel...")
        bob_login = await client.post("/auth/login", data={"username": "bob@example.com", "password": "password123"})
        bob_token = bob_login.json()["access_token"]
        bob_headers = {"Authorization": f"Bearer {bob_token}"}
        
        resp = await client.get("/user/me", headers=bob_headers)
        if resp.status_code == 200:
            profile = resp.json()
            print(f"  [OK] Bob's Profile fetched! Direct Referrals: {profile['direct_referrals_count']}, Code: {profile['user']['referral_code']}")

        print("\n" + "=" * 60)
        print("  SEED COMPLETE - Auth System is ready!")
        print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
