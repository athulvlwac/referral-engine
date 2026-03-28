"""
Fraud detection and prevention service.

Implements three fraud detection mechanisms:
1. Self-referral detection — user cannot refer themselves
2. Velocity limiting — max N referrals per minute per user (in-memory tracking)
3. Cycle detection — delegated to graph.py, logged here

All fraud attempts are logged to the FraudLog table for audit purposes.
"""
import time
from collections import defaultdict

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import FraudLog, SystemMetrics, User

# ── Velocity Limiting ─────────────────────────────────────────
# In-memory tracker: {user_id: [timestamp, timestamp, ...]}
# Tracks recent referral claim timestamps per user
_velocity_tracker: dict[int, list[float]] = defaultdict(list)

VELOCITY_LIMIT = 5          # Max referrals allowed
VELOCITY_WINDOW = 60.0      # Time window in seconds (1 minute)


def check_velocity(user_id: int) -> bool:
    """
    Check if a user has exceeded the referral velocity limit.

    Maintains a sliding window of recent referral timestamps.
    If more than VELOCITY_LIMIT claims occur within VELOCITY_WINDOW seconds,
    the request is flagged as velocity abuse.

    Returns True if limit is EXCEEDED (fraud detected).
    """
    now = time.time()
    timestamps = _velocity_tracker[user_id]

    # Prune timestamps outside the sliding window
    _velocity_tracker[user_id] = [t for t in timestamps if now - t < VELOCITY_WINDOW]

    if len(_velocity_tracker[user_id]) >= VELOCITY_LIMIT:
        return True  # Rate limit exceeded

    # Record this attempt
    _velocity_tracker[user_id].append(now)
    return False


def check_self_referral(child_id: int, parent_id: int) -> bool:
    """
    Detect self-referral: a user cannot refer themselves.
    Returns True if self-referral is detected (fraud).
    """
    return child_id == parent_id


async def log_fraud(
    db: AsyncSession,
    user_id: int,
    reason: str,
    details: str = None,
) -> FraudLog:
    """
    Record a fraud attempt in the database.
    Also increments the global fraud_attempts counter and
    specific counters based on fraud type.
    """
    fraud_log = FraudLog(user_id=user_id, reason=reason, details=details)
    db.add(fraud_log)

    # Update system metrics
    metrics = await db.get(SystemMetrics, 1)
    if metrics:
        metrics.fraud_attempts += 1
        metrics.rejected_referrals += 1
        if reason == "cycle":
            metrics.cycles_prevented += 1

    return fraud_log


async def get_fraud_logs(db: AsyncSession) -> list[FraudLog]:
    """Retrieve all fraud log entries, most recent first."""
    from sqlalchemy import select

    result = await db.execute(
        select(FraudLog).order_by(FraudLog.created_at.desc())
    )
    return result.scalars().all()


async def flag_user(db: AsyncSession, user_id: int) -> None:
    """Flag a user account for suspicious activity."""
    user = await db.get(User, user_id)
    if user:
        user.status = "flagged"
