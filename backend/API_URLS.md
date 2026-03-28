# Obsidian Pulse (Backend) — API URLs & How They Work

## Run locally

```powershell
Set-Location D:\WAC\assesment\backend
.\venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
```

Base URL (default): `http://127.0.0.1:8000`

FastAPI docs:
- Swagger UI: `GET /docs`
- OpenAPI JSON: `GET /openapi.json`

## Data model (high level)

- **User**: node in the referral graph (`id`, `name`, `email`, `reward_balance`, `status`)
- **Referral**: directed edge `child_id -> parent_id` (each child can have only **one** parent)
- **FraudLog**: records blocked attempts (`reason`: `self` / `velocity` / `cycle`, plus `details`)
- **SystemMetrics**: singleton counters used by the dashboard metrics endpoint

## Endpoints

### Users

#### `POST /users/create`
Creates a new user.

Request body:
```json
{ "name": "Alice", "email": "alice@example.com" }
```

Notes:
- Rejects duplicate emails with `400`.

#### `GET /users`
Lists all users (ordered by `id`).

#### `GET /users/{user_id}`
Returns a single user or `404` if not found.

### Referrals

#### `POST /referral/claim`
Creates a referral edge `child_id -> parent_id` **only if** it keeps the graph a DAG.

Request body:
```json
{ "child_id": 2, "parent_id": 1 }
```

Validation pipeline (in order):
1. **Self-referral**: blocks `child_id == parent_id` (`400`) and logs fraud (`reason="self"`).
2. **User existence**: both users must exist (`404`).
3. **Single parent rule**: child must not already have a parent (`400`).
4. **Velocity limiting**: blocks > 5 claims in a 60s sliding window per child (`429`) and logs fraud (`reason="velocity"`).
5. **Cycle detection**: walks upward from `parent_id` to ensure it never reaches `child_id` (`400`) and logs fraud (`reason="cycle"`).

On success:
- Inserts the referral row.
- Updates `SystemMetrics.total_referrals` and `SystemMetrics.valid_referrals`.
- Distributes rewards upward (see “Rewards” below).

#### `GET /referrals`
Lists all referral edges (most recent first).

### Graph

#### `GET /user/{user_id}/graph?depth=3`
Returns a downward referral tree rooted at `user_id`, up to `depth` levels.

Notes:
- Returns `404` if the root user does not exist.

### Rewards

#### `GET /user/{user_id}/rewards`
Returns a user’s current `reward_balance` (and an empty breakdown list in the current implementation).

Reward rules (on successful referral claim):
- Base: `1000.0`
- Depth: `3` levels
- Percentages: Level 1 = `10%`, Level 2 = `5%`, Level 3 = `2%`

### Fraud / Audit

#### `GET /fraud/flags`
Returns all fraud logs (most recent first).

### Dashboard / Metrics

#### `GET /dashboard/metrics`
Returns aggregated system metrics:
- `total_users` is a live DB count.
- Other counters come from `SystemMetrics` (updated during referral claims and fraud logging).
- `avg_referral_depth` is computed by walking ancestor chains.

### Activity Feed

#### `GET /activity/feed?limit=20`
Returns a combined list of recent referral successes + fraud events, sorted by `timestamp` desc.

Response shape (example item):
```json
{
  "type": "referral_success",
  "title": "Referral Success",
  "description": "Bob was referred by Alice",
  "timestamp": "2026-03-28T01:23:45.678901"
}
```

## Quick smoke test (optional)

With the API running, the seed script will create users, create a valid chain, and attempt fraud cases:

```powershell
Set-Location D:\WAC\assesment\backend
.\venv\Scripts\python seed.py
```

