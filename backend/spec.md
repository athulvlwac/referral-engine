# Backend Specification — Referral Engine API

## Overview
FastAPI-based REST API implementing a DAG-enforced referral system with cycle detection, multi-level rewards, and fraud prevention.

---

## Module Breakdown

### 1. `database.py` — Database Layer
- **Engine**: Async SQLAlchemy with aiosqlite (SQLite)
- **Session Factory**: `async_sessionmaker` with `expire_on_commit=False`
- **Dependency**: `get_db()` — yields async session with auto-commit/rollback
- **Init**: `init_db()` — creates all tables on app startup

### 2. `models.py` — ORM Models

| Model | Table | Purpose |
|-------|-------|---------|
| `User` | `users` | Graph node — id, name, email, reward_balance, status, created_at |
| `Referral` | `referrals` | Directed edge — child_id → parent_id with timestamps |
| `FraudLog` | `fraud_logs` | Audit record — user_id, reason (cycle/self/velocity), details |
| `SystemMetrics` | `system_metrics` | Singleton row — aggregate counters for dashboard |

**Constraints**:
- `User.email` is unique
- `Referral.child_id` and `Referral.parent_id` are FKs to `users.id`
- `SystemMetrics` always has exactly one row (id=1)

### 3. `schemas.py` — Pydantic Validation
- `UserCreate` / `UserResponse` — user input/output
- `ReferralClaim` / `ReferralResponse` — referral input/output
- `GraphNode` / `GraphResponse` — recursive tree structure
- `RewardBreakdown` / `RewardResponse` — reward details
- `FraudLogResponse` — fraud log output
- `DashboardMetrics` — aggregated system stats

### 4. `services/graph.py` — DAG Logic
- **`creates_cycle(child_id, parent_id, db)`**: Iterative ancestor traversal. Walks from parent upward; returns True if child is found (cycle). O(d) time.
- **`get_referral_tree(user_id, db, max_depth)`**: Builds downward tree from user. Recursive async with depth limit.
- **`get_ancestor_chain(user_id, db)`**: Returns full ancestor list walking upward.
- **`calculate_avg_referral_depth(db)`**: Average depth across all users with parents.

### 5. `services/rewards.py` — Reward Engine
- **Config**: Base ₹1000, Depth 3, Percentages [10%, 5%, 2%]
- **`distribute_rewards(child_id, db)`**: Walks ancestor chain up to 3 levels, credits each ancestor's `reward_balance`, updates `SystemMetrics.total_rewards_distributed`.
- **`get_reward_details(user_id, db)`**: Returns user's current reward balance.

### 6. `services/fraud.py` — Fraud Detection
- **Self-referral**: `check_self_referral(child, parent)` — returns True if same ID
- **Velocity**: `check_velocity(user_id)` — in-memory sliding window (5 per 60s)
- **Logging**: `log_fraud(db, user_id, reason, details)` — writes FraudLog + updates metrics
- **Flagging**: `flag_user(db, user_id)` — sets user status to "flagged"

### 7. `main.py` — API Routes

| Method | Endpoint | Handler | Description |
|--------|----------|---------|-------------|
| POST | `/users/create` | `create_user` | Create user, check duplicate email |
| GET | `/users` | `list_users` | List all users |
| GET | `/users/{id}` | `get_user` | Get user by ID |
| POST | `/referral/claim` | `claim_referral` | 5-step validation + insert + rewards |
| GET | `/referrals` | `list_referrals` | All referral edges |
| GET | `/user/{id}/graph` | `get_user_graph` | Referral tree (configurable depth) |
| GET | `/user/{id}/rewards` | `get_user_rewards` | Reward balance |
| GET | `/fraud/flags` | `get_fraud_flags` | All fraud logs |
| GET | `/dashboard/metrics` | `get_dashboard_metrics` | Aggregated metrics |
| GET | `/activity/feed` | `get_activity_feed` | Combined activity feed |

### 8. `seed.py` — Demo Data
- Creates 8 users (Alice through Hank)
- Builds two referral branches from Alice
- Tests cycle rejection, self-referral rejection, velocity throttling
- Prints dashboard metrics and tree visualization

---

## Referral Claim Pipeline (POST /referral/claim)

```
Request → Self-referral? → Users exist? → Already has parent? → Velocity OK? → No cycle? → INSERT + REWARDS
            ↓ yes            ↓ no            ↓ yes                ↓ no           ↓ yes
         FraudLog          404 Error       400 Error           FraudLog       FraudLog
         (self)                                                (velocity)     (cycle)
```

---

## Running

```bash
# Install dependencies
pip install -r requirements.txt

# Start server
uvicorn app.main:app --reload

# Seed demo data (server must be running)
python seed.py

# API docs
http://127.0.0.1:8000/docs
```
