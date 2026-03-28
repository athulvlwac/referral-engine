"""
Test suite for the Referral Engine API.

Covers:
- User creation
- Valid referral chains
- DAG cycle detection and prevention
- Self-referral rejection
- Velocity limiting
- Reward distribution
- Graph traversal
- Dashboard metrics
- Fraud logging
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import Base, get_db
from app.main import app
from app.models import SystemMetrics
from app.services import fraud as fraud_module

# ── Test database setup (in-memory SQLite) ────────────────────
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test_referral.db"
test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


async def override_get_db():
    async with TestSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    """Create tables before each test and drop them after."""
    # Reset in-memory velocity tracker between tests
    fraud_module._velocity_tracker.clear()

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    # Seed the SystemMetrics singleton
    async with TestSessionLocal() as session:
        session.add(SystemMetrics(id=1))
        await session.commit()

    yield

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client():
    """Async HTTP test client."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  USER TESTS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestUserCreation:
    """Tests for POST /users/create"""

    @pytest.mark.asyncio
    async def test_create_user_success(self, client):
        """Should create a user and return 201."""
        resp = await client.post("/users/create", json={"name": "Alice", "email": "alice@test.com"})
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Alice"
        assert data["email"] == "alice@test.com"
        assert data["reward_balance"] == 0.0
        assert data["status"] == "active"

    @pytest.mark.asyncio
    async def test_create_user_duplicate_email(self, client):
        """Should reject duplicate email with 400."""
        await client.post("/users/create", json={"name": "Alice", "email": "alice@test.com"})
        resp = await client.post("/users/create", json={"name": "Alice2", "email": "alice@test.com"})
        assert resp.status_code == 400
        assert "already registered" in resp.json()["detail"]

    @pytest.mark.asyncio
    async def test_list_users(self, client):
        """Should list all created users."""
        await client.post("/users/create", json={"name": "A", "email": "a@test.com"})
        await client.post("/users/create", json={"name": "B", "email": "b@test.com"})
        resp = await client.get("/users")
        assert resp.status_code == 200
        assert len(resp.json()) == 2

    @pytest.mark.asyncio
    async def test_get_user_by_id(self, client):
        """Should return user by ID."""
        create_resp = await client.post("/users/create", json={"name": "Alice", "email": "alice@test.com"})
        user_id = create_resp.json()["id"]
        resp = await client.get(f"/users/{user_id}")
        assert resp.status_code == 200
        assert resp.json()["name"] == "Alice"

    @pytest.mark.asyncio
    async def test_get_user_not_found(self, client):
        """Should return 404 for nonexistent user."""
        resp = await client.get("/users/999")
        assert resp.status_code == 404


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  REFERRAL & DAG TESTS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestReferralClaim:
    """Tests for POST /referral/claim — DAG enforcement."""

    async def _create_users(self, client, count):
        """Helper to create N users."""
        users = []
        for i in range(count):
            resp = await client.post("/users/create", json={
                "name": f"User{i+1}",
                "email": f"user{i+1}@test.com"
            })
            users.append(resp.json())
        return users

    @pytest.mark.asyncio
    async def test_valid_referral(self, client):
        """Should accept a valid referral and return 201."""
        users = await self._create_users(client, 2)
        resp = await client.post("/referral/claim", json={
            "child_id": users[1]["id"],
            "parent_id": users[0]["id"]
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["child_id"] == users[1]["id"]
        assert data["parent_id"] == users[0]["id"]

    @pytest.mark.asyncio
    async def test_valid_chain(self, client):
        """Should accept a chain: A <- B <- C <- D."""
        users = await self._create_users(client, 4)
        for i in range(1, 4):
            resp = await client.post("/referral/claim", json={
                "child_id": users[i]["id"],
                "parent_id": users[i-1]["id"]
            })
            assert resp.status_code == 201, f"Chain step {i} failed: {resp.json()}"

    @pytest.mark.asyncio
    async def test_self_referral_rejected(self, client):
        """Should reject self-referral with 400."""
        users = await self._create_users(client, 1)
        resp = await client.post("/referral/claim", json={
            "child_id": users[0]["id"],
            "parent_id": users[0]["id"]
        })
        assert resp.status_code == 400
        assert "Self-referral" in resp.json()["detail"]

    @pytest.mark.asyncio
    async def test_duplicate_parent_rejected(self, client):
        """Should reject if child already has a parent."""
        users = await self._create_users(client, 3)
        resp = await client.post("/referral/claim", json={
            "child_id": users[1]["id"],
            "parent_id": users[0]["id"]
        })
        assert resp.status_code == 201

        resp = await client.post("/referral/claim", json={
            "child_id": users[1]["id"],
            "parent_id": users[2]["id"]
        })
        assert resp.status_code == 400
        assert "already has a referrer" in resp.json()["detail"]

    @pytest.mark.asyncio
    async def test_cycle_detection_direct(self, client):
        """
        Should detect a direct cycle.
        Chain: A <- B, then try B <- A (cycle!)
        """
        users = await self._create_users(client, 2)
        await client.post("/referral/claim", json={
            "child_id": users[1]["id"],
            "parent_id": users[0]["id"]
        })
        resp = await client.post("/referral/claim", json={
            "child_id": users[0]["id"],
            "parent_id": users[1]["id"]
        })
        assert resp.status_code == 400
        assert "cycle" in resp.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_cycle_detection_transitive(self, client):
        """
        Should detect a transitive cycle.
        Chain: A <- B <- C <- D, then try A <- D (cycle!)
        """
        users = await self._create_users(client, 4)
        for i in range(1, 4):
            await client.post("/referral/claim", json={
                "child_id": users[i]["id"],
                "parent_id": users[i-1]["id"]
            })

        resp = await client.post("/referral/claim", json={
            "child_id": users[0]["id"],
            "parent_id": users[3]["id"]
        })
        assert resp.status_code == 400
        assert "cycle" in resp.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_nonexistent_user_rejected(self, client):
        """Should return 404 if user doesn't exist."""
        users = await self._create_users(client, 1)
        resp = await client.post("/referral/claim", json={
            "child_id": users[0]["id"],
            "parent_id": 999
        })
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_referral_list(self, client):
        """Should list all referrals."""
        users = await self._create_users(client, 3)
        r1 = await client.post("/referral/claim", json={"child_id": users[1]["id"], "parent_id": users[0]["id"]})
        assert r1.status_code == 201
        r2 = await client.post("/referral/claim", json={"child_id": users[2]["id"], "parent_id": users[1]["id"]})
        assert r2.status_code == 201
        resp = await client.get("/referrals")
        assert resp.status_code == 200
        assert len(resp.json()) == 2


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  REWARD TESTS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestRewards:
    """Tests for reward distribution."""

    async def _create_chain(self, client, count):
        """Helper: create users and build a chain."""
        users = []
        for i in range(count):
            resp = await client.post("/users/create", json={
                "name": f"User{i+1}", "email": f"user{i+1}@test.com"
            })
            users.append(resp.json())
        for i in range(1, count):
            r = await client.post("/referral/claim", json={
                "child_id": users[i]["id"],
                "parent_id": users[i-1]["id"]
            })
            assert r.status_code == 201
        return users

    @pytest.mark.asyncio
    async def test_direct_parent_reward(self, client):
        """Direct parent should receive 10% of base reward (100)."""
        users = await self._create_chain(client, 2)
        resp = await client.get(f"/user/{users[0]['id']}/rewards")
        assert resp.status_code == 200
        # User1 gets 10% of 1000 = 100 when User2 joins
        assert resp.json()["total_reward_balance"] == 100.0

    @pytest.mark.asyncio
    async def test_multilevel_rewards(self, client):
        """Rewards should propagate up to 3 levels."""
        users = await self._create_chain(client, 4)
        # U2 joins: U1 gets 100
        # U3 joins: U2 gets 100, U1 gets 50
        # U4 joins: U3 gets 100, U2 gets 50, U1 gets 20
        # U1 total: 100 + 50 + 20 = 170
        resp = await client.get(f"/user/{users[0]['id']}/rewards")
        assert resp.json()["total_reward_balance"] == 170.0

        # U2 total: 100 + 50 = 150
        resp = await client.get(f"/user/{users[1]['id']}/rewards")
        assert resp.json()["total_reward_balance"] == 150.0

        # U3 total: 100
        resp = await client.get(f"/user/{users[2]['id']}/rewards")
        assert resp.json()["total_reward_balance"] == 100.0

    @pytest.mark.asyncio
    async def test_reward_not_found(self, client):
        """Should return 404 for nonexistent user."""
        resp = await client.get("/user/999/rewards")
        assert resp.status_code == 404


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  GRAPH TESTS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestGraph:
    """Tests for GET /user/{id}/graph."""

    @pytest.mark.asyncio
    async def test_graph_single_user(self, client):
        """Graph of user with no children should have 1 node."""
        await client.post("/users/create", json={"name": "Alice", "email": "a@test.com"})
        resp = await client.get("/user/1/graph")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_nodes"] == 1
        assert data["root"]["children"] == []

    @pytest.mark.asyncio
    async def test_graph_with_children(self, client):
        """Graph should show children in tree structure."""
        for i in range(3):
            await client.post("/users/create", json={"name": f"U{i+1}", "email": f"u{i+1}@test.com"})
        r1 = await client.post("/referral/claim", json={"child_id": 2, "parent_id": 1})
        assert r1.status_code == 201
        r2 = await client.post("/referral/claim", json={"child_id": 3, "parent_id": 1})
        assert r2.status_code == 201

        resp = await client.get("/user/1/graph")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_nodes"] == 3
        assert len(data["root"]["children"]) == 2

    @pytest.mark.asyncio
    async def test_graph_not_found(self, client):
        """Should return 404 for nonexistent user."""
        resp = await client.get("/user/999/graph")
        assert resp.status_code == 404


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  FRAUD & METRICS TESTS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestFraudAndMetrics:
    """Tests for fraud logging and dashboard metrics."""

    @pytest.mark.asyncio
    async def test_fraud_log_on_self_referral(self, client):
        """Self-referral should create a fraud log entry."""
        await client.post("/users/create", json={"name": "Alice", "email": "a@test.com"})
        await client.post("/referral/claim", json={"child_id": 1, "parent_id": 1})

        resp = await client.get("/fraud/flags")
        assert resp.status_code == 200
        logs = resp.json()
        assert len(logs) >= 1
        assert logs[0]["reason"] == "self"

    @pytest.mark.asyncio
    async def test_fraud_log_on_cycle(self, client):
        """Cycle attempt should create a fraud log entry."""
        for i in range(2):
            await client.post("/users/create", json={"name": f"U{i+1}", "email": f"u{i+1}@test.com"})
        await client.post("/referral/claim", json={"child_id": 2, "parent_id": 1})
        await client.post("/referral/claim", json={"child_id": 1, "parent_id": 2})

        resp = await client.get("/fraud/flags")
        logs = resp.json()
        cycle_logs = [l for l in logs if l["reason"] == "cycle"]
        assert len(cycle_logs) >= 1

    @pytest.mark.asyncio
    async def test_dashboard_metrics(self, client):
        """Dashboard should reflect correct counts."""
        for i in range(3):
            await client.post("/users/create", json={"name": f"U{i+1}", "email": f"u{i+1}@test.com"})
        r1 = await client.post("/referral/claim", json={"child_id": 2, "parent_id": 1})
        assert r1.status_code == 201
        r2 = await client.post("/referral/claim", json={"child_id": 3, "parent_id": 2})
        assert r2.status_code == 201

        resp = await client.get("/dashboard/metrics")
        assert resp.status_code == 200
        m = resp.json()
        assert m["total_users"] == 3
        assert m["total_referrals"] == 2
        assert m["valid_referrals"] == 2
        assert m["total_rewards_distributed"] > 0

    @pytest.mark.asyncio
    async def test_metrics_track_cycle_prevention(self, client):
        """cycles_prevented should increment on cycle detection."""
        for i in range(2):
            await client.post("/users/create", json={"name": f"U{i+1}", "email": f"u{i+1}@test.com"})
        await client.post("/referral/claim", json={"child_id": 2, "parent_id": 1})
        await client.post("/referral/claim", json={"child_id": 1, "parent_id": 2})  # cycle

        resp = await client.get("/dashboard/metrics")
        m = resp.json()
        assert m["cycles_prevented"] >= 1
        assert m["fraud_attempts"] >= 1

    @pytest.mark.asyncio
    async def test_activity_feed(self, client):
        """Activity feed should return recent events."""
        for i in range(2):
            await client.post("/users/create", json={"name": f"U{i+1}", "email": f"u{i+1}@test.com"})
        await client.post("/referral/claim", json={"child_id": 2, "parent_id": 1})

        resp = await client.get("/activity/feed")
        assert resp.status_code == 200
        assert len(resp.json()) >= 1
