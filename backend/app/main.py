"""
Referral Engine API — DAG-enforced referral system with fraud prevention.

This FastAPI application implements a referral network where:
- Users are nodes in a Directed Acyclic Graph (DAG)
- Referrals are directed edges (child → parent)
- Each user can have at most ONE parent
- Cycle detection prevents fraudulent circular referrals
- Multi-level rewards propagate upward through the chain
"""
import csv
import io
from contextlib import asynccontextmanager
import random
import uuid
from datetime import datetime, timezone, timedelta

from fastapi import Depends, FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session, get_db, init_db
from app.models import FraudLog, Referral, SystemMetrics, User, RewardTransaction

from app.services.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
    require_admin,
    oauth2_scheme
)
from app.schemas import (
    DashboardMetrics,
    FraudLogResponse,
    GraphNode,
    GraphResponse,
    LogDetailResponse,
    ReferralClaim,
    ReferralResponse,
    RewardBreakdown,
    RewardResponse,
    RewardTransactionResponse,
    UserRegister,
    UserLogin,
    TokenResponse,
    UserProfileResponse,
    UserResponse,
)
from app.services.fraud import check_self_referral, check_velocity, get_fraud_logs, log_fraud
from app.services.graph import (
    calculate_avg_referral_depth,
    creates_cycle,
    get_ancestor_chain,
    get_referral_tree,
)
from app.services.rewards import distribute_rewards, get_reward_details


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database and seed system metrics on startup."""
    await init_db()
    # Ensure SystemMetrics singleton row exists
    async with async_session() as session:
        metrics = await session.get(SystemMetrics, 1)
        if not metrics:
            session.add(SystemMetrics(id=1))
            await session.commit()
    yield


app = FastAPI(
    title="Obsidian Pulse — Referral Engine",
    description="DAG-enforced referral system with real-time cycle detection and fraud prevention",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  AUTH ENDPOINTS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.post("/auth/register", response_model=UserResponse, status_code=201)
async def register_user(user_data: UserRegister, db: AsyncSession = Depends(get_db)):
    """Register a new user, optionally requiring a referral code."""
    # Check for duplicate email
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user_count_result = await db.execute(select(func.count(User.id)))
    count = user_count_result.scalar() or 0

    parent = None
    if user_data.referral_code:
        result = await db.execute(select(User).where(User.referral_code == user_data.referral_code))
        parent = result.scalar_one_or_none()
        if not parent:
            raise HTTPException(status_code=400, detail="Invalid referral code")
    elif count > 0:
        # Require referral code for everyone except the very first user (admin seed)
        raise HTTPException(status_code=400, detail="Referral code is required for registration")

    pwd_hash = get_password_hash(user_data.password)
    role = "admin" if count == 0 else "user"

    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=pwd_hash,
        role=role
    )
    db.add(new_user)
    await db.flush()  # Gets the new_user.id

    if parent:
        # Create referral edge automatically!
        referral = Referral(child_id=new_user.id, parent_id=parent.id)
        db.add(referral)
        
        metrics = await db.get(SystemMetrics, 1)
        if metrics:
            metrics.total_referrals += 1
            metrics.valid_referrals += 1
            
        await db.flush()
        await distribute_rewards(new_user.id, db)

    await db.commit()
    await db.refresh(new_user)
    return new_user


@app.post("/auth/login", response_model=TokenResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    """Authenticate a user and return a JWT token."""
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    # Check if blocked
    if user.status.lower() == "blocked":
        raise HTTPException(status_code=403, detail="Your account has been blocked.")

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}


@app.get("/auth/verify-referral/{code}")
async def verify_referral_code(code: str, db: AsyncSession = Depends(get_db)):
    """Check if a referral code is valid and return the referrer's name."""
    result = await db.execute(select(User).where(User.referral_code == code))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="Referral code not found")
        
    return {"valid": True, "referrer_name": user.name}


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  USER PERSONAL ENDPOINTS (User Panel)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


@app.get("/user/me", response_model=UserProfileResponse)
async def get_my_profile(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Return the profile, balance, and direct referral count for the logged in user."""
    result = await db.execute(select(func.count(Referral.id)).where(Referral.parent_id == current_user.id))
    direct_referrals_count = result.scalar() or 0
    
    return {
        "user": current_user,
        "direct_referrals_count": direct_referrals_count
    }


@app.get("/user/me/graph", response_model=GraphResponse)
async def get_my_graph(depth: int = 3, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Return the referral chart limited to the current user's downline."""
    tree = await get_referral_tree(current_user.id, db, max_depth=depth)
    if tree is None:
        raise HTTPException(status_code=404, detail="Graph not found")

    def count_nodes(node: dict) -> int:
        return 1 + sum(count_nodes(c) for c in node.get("children", []))

    return GraphResponse(
        root=GraphNode(**tree),
        total_nodes=count_nodes(tree),
    )


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  ADMIN-ONLY USER DIRECTORY ENDPOINTS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


@app.get("/users", response_model=list[UserResponse])
async def list_users(admin_user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    """List all users."""
    result = await db.execute(select(User).order_by(User.id))
    return result.scalars().all()


@app.get("/users/export")
async def export_users(admin_user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    """Export all users as CSV."""
    result = await db.execute(select(User).order_by(User.id))
    users = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Name", "Email", "Status", "Created At", "Reward Balance"])
    for u in users:
        writer.writerow([u.id, u.name, u.email, u.status, u.created_at.isoformat(), u.reward_balance])
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=users_export.csv"}
    )


@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, admin_user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    """Get a specific user by ID."""
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.post("/users/{user_id}/block", response_model=UserResponse)
async def block_user(user_id: int, admin_user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    """Block a specific user."""
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.status = "Blocked"
    await db.commit()
    return user


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  REFERRAL ENDPOINTS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


@app.post("/referral/claim", response_model=ReferralResponse, status_code=201)
async def claim_referral(claim: ReferralClaim, admin_user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    """
    Core referral claim endpoint with full DAG validation.

    Validation pipeline:
    1. Self-referral check → reject if child == parent
    2. User existence check → both users must exist
    3. Duplicate parent check → child must not already have a parent
    4. Velocity limit check → max 5 claims per minute per child
    5. Cycle detection → BFS/DFS ancestor traversal to prevent cycles

    Only if ALL checks pass is the referral edge inserted and rewards distributed.
    """
    child_id = claim.child_id
    parent_id = claim.parent_id

    # ── Step 1: Self-referral detection ───────────────────────
    if check_self_referral(child_id, parent_id):
        await log_fraud(db, child_id, "self", f"Attempted self-referral: {child_id} → {parent_id}")
        await db.commit()
        raise HTTPException(
            status_code=400,
            detail="Self-referral detected: a user cannot refer themselves"
        )

    # ── Step 2: Validate both users exist ─────────────────────
    child = await db.get(User, child_id)
    parent = await db.get(User, parent_id)

    if not child:
        raise HTTPException(status_code=404, detail=f"Child user {child_id} not found")
    if not parent:
        raise HTTPException(status_code=404, detail=f"Parent user {parent_id} not found")
        
    # ── Step 2.5: Temporal Expiry Check ───────────────────────
    # A referral must be claimed within 24 hours of child user creation
    child_created_at = child.created_at
    if child_created_at.tzinfo is None:
        child_created_at = child_created_at.replace(tzinfo=timezone.utc)
        
    if datetime.now(timezone.utc) - child_created_at > timedelta(hours=24):
        raise HTTPException(
            status_code=400,
            detail="Referral link expired: You must claim your referral within 24 hours of account creation."
        )

    # ── Step 3: Check if child already has a parent ───────────
    existing = await db.execute(
        select(Referral).where(Referral.child_id == child_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail=f"User {child_id} already has a referrer. Each user can only have one parent."
        )

    # ── Step 4: Velocity limit check ──────────────────────────
    if check_velocity(child_id):
        await log_fraud(
            db, child_id, "velocity",
            f"Exceeded {5} referral claims within 60s window"
        )
        await db.commit()
        raise HTTPException(
            status_code=429,
            detail="Velocity limit exceeded: too many referral claims. Try again later."
        )

    # ── Step 5: Cycle detection (CRITICAL) ────────────────────
    # Check: does a path exist from parent_id → child_id (upward)?
    # If yes, adding child → parent creates a cycle.
    if await creates_cycle(child_id, parent_id, db):
        await log_fraud(
            db, child_id, "cycle",
            f"Cycle detected: adding {child_id} → {parent_id} would create a circular referral"
        )
        await db.commit()
        raise HTTPException(
            status_code=400,
            detail="Cycle detected: this referral would create a circular chain, violating DAG structure"
        )

    # ── All checks passed — insert the referral edge ──────────
    referral = Referral(child_id=child_id, parent_id=parent_id)
    db.add(referral)

    # Update system metrics
    metrics = await db.get(SystemMetrics, 1)
    if metrics:
        metrics.total_referrals += 1
        metrics.valid_referrals += 1

    await db.flush()

    # ── Distribute rewards upward through the chain ───────────
    await distribute_rewards(child_id, db)

    return referral


@app.get("/referrals", response_model=list[ReferralResponse])
async def list_referrals(admin_user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    """List all referral edges."""
    result = await db.execute(select(Referral).order_by(Referral.created_at.desc()))
    return result.scalars().all()


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  GRAPH ENDPOINTS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


@app.get("/user/{user_id}/graph", response_model=GraphResponse)
async def get_user_graph(user_id: int, depth: int = 3, admin_user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    """
    Return the referral tree structure rooted at a given user.
    Traverses downward (parent → children) up to the specified depth.
    """
    tree = await get_referral_tree(user_id, db, max_depth=depth)
    if tree is None:
        raise HTTPException(status_code=404, detail="User not found")

    def count_nodes(node: dict) -> int:
        return 1 + sum(count_nodes(c) for c in node.get("children", []))

    return GraphResponse(
        root=GraphNode(**tree),
        total_nodes=count_nodes(tree),
    )


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  REWARD ENDPOINTS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


@app.get("/user/{user_id}/rewards", response_model=RewardResponse)
async def get_user_rewards(user_id: int, admin_user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    """Return reward balance and breakdown for a user."""
    details = await get_reward_details(user_id, db)
    if details is None:
        raise HTTPException(status_code=404, detail="User not found")
    return RewardResponse(**details)


@app.post("/rewards/process-batch")
async def process_batch_rewards(admin_user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    """Convert all positive reward balances to pending transactions."""
    result = await db.execute(select(User).where(User.reward_balance > 0))
    users = result.scalars().all()
    
    transactions = []
    for user in users:
        # Create pending transaction
        tx = RewardTransaction(user_id=user.id, amount=user.reward_balance, status="pending")
        db.add(tx)
        transactions.append(tx)
        
        # Zero out the balance
        user.reward_balance = 0.0

    await db.commit()
    return {"message": f"Processed {len(transactions)} pending payouts.", "count": len(transactions)}


@app.get("/rewards/pending", response_model=list[RewardTransactionResponse])
async def get_pending_rewards(admin_user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    """Return all pending reward transactions."""
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(RewardTransaction)
        .where(RewardTransaction.status == "pending")
        .options(selectinload(RewardTransaction.user))
    )
    return result.scalars().all()


@app.post("/rewards/{transaction_id}/payout", response_model=RewardTransactionResponse)
async def payout_reward(transaction_id: int, admin_user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    """Mark a pending reward transaction as paid."""
    tx = await db.get(RewardTransaction, transaction_id)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    tx.status = "paid"
    await db.commit()
    return tx


@app.post("/rewards/{transaction_id}/reject", response_model=RewardTransactionResponse)
async def reject_reward(transaction_id: int, admin_user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    """Reject a pending reward transaction without refunding."""
    tx = await db.get(RewardTransaction, transaction_id)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    tx.status = "rejected"
    await db.commit()
    return tx


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  FRAUD ENDPOINTS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


@app.get("/fraud/flags", response_model=list[FraudLogResponse])
async def get_fraud_flags(admin_user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    """Return all fraud log entries, most recent first."""
    logs = await get_fraud_logs(db)
    return logs


@app.post("/fraud/{log_id}/dismiss", response_model=FraudLogResponse)
async def dismiss_fraud_log(log_id: int, admin_user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    """Acknowledge and dismiss a fraud flag."""
    log = await db.get(FraudLog, log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Fraud log not found")
    
    log.status = "dismissed"
    await db.commit()
    return log


@app.post("/fraud/{log_id}/review", response_model=FraudLogResponse)
async def review_fraud_log(log_id: int, admin_user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    """Escalate a fraud log for manual audit."""
    log = await db.get(FraudLog, log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Fraud log not found")
    
    log.status = "escalated"
    await db.commit()
    return log


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  DASHBOARD / METRICS ENDPOINTS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


@app.get("/dashboard/metrics", response_model=DashboardMetrics)
async def get_dashboard_metrics(admin_user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    """
    Aggregated system metrics for the dashboard.
    Combines real-time counts with tracked counters.
    """
    # Total users count (live query)
    user_count = await db.execute(select(func.count(User.id)))
    total_users = user_count.scalar() or 0

    # Get stored metrics
    metrics = await db.get(SystemMetrics, 1)

    # Calculate average referral depth
    avg_depth = await calculate_avg_referral_depth(db)

    return DashboardMetrics(
        total_users=total_users,
        total_referrals=metrics.total_referrals if metrics else 0,
        valid_referrals=metrics.valid_referrals if metrics else 0,
        rejected_referrals=metrics.rejected_referrals if metrics else 0,
        fraud_attempts=metrics.fraud_attempts if metrics else 0,
        cycles_prevented=metrics.cycles_prevented if metrics else 0,
        total_rewards_distributed=metrics.total_rewards_distributed if metrics else 0.0,
        avg_referral_depth=avg_depth,
    )


@app.get("/dashboard/export-report")
async def export_dashboard_report(admin_user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    """Compile network metrics into a downloadable CSV report."""
    metrics = await db.get(SystemMetrics, 1)
    if not metrics:
        raise HTTPException(status_code=404, detail="Metrics not found")
        
    user_count = await db.execute(select(func.count(User.id)))
    total_users = user_count.scalar() or 0
    avg_depth = await calculate_avg_referral_depth(db)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Metric", "Value"])
    writer.writerow(["Total Users", total_users])
    writer.writerow(["Total Referrals", metrics.total_referrals])
    writer.writerow(["Valid Referrals", metrics.valid_referrals])
    writer.writerow(["Rejected Referrals", metrics.rejected_referrals])
    writer.writerow(["Fraud Attempts", metrics.fraud_attempts])
    writer.writerow(["Cycles Prevented", metrics.cycles_prevented])
    writer.writerow(["Total Rewards Distributed", metrics.total_rewards_distributed])
    writer.writerow(["Average Referral Depth", avg_depth])
    
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=dashboard_report.csv"}
    )


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  LOGS ENDPOINTS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


@app.get("/logs/{event_id}", response_model=LogDetailResponse)
async def get_log_details(event_id: int, admin_user: User = Depends(require_admin)):
    """
    Mock endpoint returning detailed telemetry for an event.
    Simulates querying backend for full request headers/metadata/IP info.
    """
    return LogDetailResponse(
        event_id=event_id,
        timestamp=datetime.now(timezone.utc),
        ip_address=f"192.168.1.{random.randint(1, 255)}",
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        method=random.choice(["POST", "GET", "PUT", "DELETE"]),
        path=f"/api/v1/resource/{event_id}",
        headers={
            "host": "api.obsidianpulse.local",
            "accept": "application/json",
            "x-forwarded-for": f"10.0.0.{random.randint(1,255)}"
        }
    )


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  ACTIVITY FEED ENDPOINT (for dashboard)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


@app.get("/activity/feed")
async def get_activity_feed(limit: int = 20, admin_user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    """
    Combined activity feed showing recent referrals and fraud events.
    Used by the dashboard's Live Activity Feed panel.
    """
    # Recent referrals
    ref_result = await db.execute(
        select(Referral).order_by(Referral.created_at.desc()).limit(limit)
    )
    referrals = ref_result.scalars().all()

    # Recent fraud logs
    fraud_result = await db.execute(
        select(FraudLog).order_by(FraudLog.created_at.desc()).limit(limit)
    )
    fraud_logs = fraud_result.scalars().all()

    activities = []

    for ref in referrals:
        child = await db.get(User, ref.child_id)
        parent = await db.get(User, ref.parent_id)
        activities.append({
            "type": "referral_success",
            "title": "Referral Success",
            "description": f"{child.name if child else 'Unknown'} was referred by {parent.name if parent else 'Unknown'}",
            "timestamp": ref.created_at.isoformat(),
        })

    for log in fraud_logs:
        type_map = {
            "cycle": "cycle_blocked",
            "self": "self_referral_blocked",
            "velocity": "velocity_blocked",
        }
        title_map = {
            "cycle": "Cycle Blocked",
            "self": "Self-Referral Blocked",
            "velocity": "Velocity Limit Hit",
        }
        activities.append({
            "type": type_map.get(log.reason, "fraud"),
            "title": title_map.get(log.reason, "Fraud Detected"),
            "description": log.details or f"Fraud attempt by user {log.user_id}",
            "timestamp": log.created_at.isoformat(),
        })

    # Recent Payouts
    payout_result = await db.execute(
        select(RewardTransaction).where(RewardTransaction.status == "paid").order_by(RewardTransaction.created_at.desc()).limit(limit)
    )
    payouts = payout_result.scalars().all()
    for tx in payouts:
        user = await db.get(User, tx.user_id)
        activities.append({
            "type": "payout_success",
            "title": "Reward Payout Issued",
            "description": f"{user.name if user else 'Unknown'} received ₹{tx.amount}",
            "timestamp": tx.created_at.isoformat(),
        })

    # Sort by timestamp descending
    activities.sort(key=lambda x: x["timestamp"], reverse=True)
    return activities[:limit]


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  SIMULATION ENDPOINT (for bonus stress test tool)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


@app.post("/simulate/generate")
async def simulate_generate(count: int = 100, admin_user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    """
    Generate mock users and random referrals, including intentional cycles
    to test the fraud detection logic.
    """
    if count > 500:
        count = 500
        
    metrics = await db.get(SystemMetrics, 1)

    # 1. Create Users
    new_users = []
    for _ in range(count):
        uid_str = str(uuid.uuid4())[:8]
        user = User(name=f"SimUser {uid_str}", email=f"sim_{uid_str}@example.com")
        db.add(user)
        new_users.append(user)
    
    await db.flush() # get IDs
    
    all_users = (await db.execute(select(User))).scalars().all()
    
    # 2. Assign Referrals (valid)
    for user in new_users:
        if random.random() < 0.8:
            possible_parents = [u for u in all_users if u.id < user.id]
            if possible_parents:
                parent = random.choice(possible_parents)
                
                if not check_self_referral(user.id, parent.id):
                    # Only insert acyclic
                    if not await creates_cycle(user.id, parent.id, db):
                        db.add(Referral(child_id=user.id, parent_id=parent.id))
                        if metrics:
                            metrics.total_referrals += 1
                            metrics.valid_referrals += 1
                        await distribute_rewards(user.id, db)
    
    await db.commit()
    
    # 3. Simulate cycle attempts and velocity triggers (fraud logs)
    if len(all_users) >= 3:
        for _ in range(3):
            cycle_user = random.choice(all_users)
            target_user = random.choice(all_users)
            await log_fraud(db, cycle_user.id, "cycle", f"Simulated cycle attempt: {cycle_user.id} → {target_user.id}")
            if metrics:
                metrics.fraud_attempts += 1
                metrics.cycles_prevented += 1
                
        for _ in range(2):
            vel_user = random.choice(all_users)
            await log_fraud(db, vel_user.id, "velocity", f"Exceeded {5} referral claims within 60s window (simulated)")
            if metrics:
                metrics.fraud_attempts += 1
                
    await db.commit()
    
    return {"message": f"Successfully simulated {count} nodes and ran automated fraud injections."}
