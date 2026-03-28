"""
Multi-level reward distribution engine.

When a valid referral is created (child → parent), rewards propagate UPWARD
through the ancestor chain. Each level receives a configurable percentage
of the base reward amount.

Configuration:
─────────────
- REWARD_BASE: Fixed reward amount per successful referral (default: ₹1000)
- REWARD_DEPTH: How many levels up to distribute (default: 3)
- REWARD_PERCENTAGES: Percentage at each level [L1, L2, L3]
  - Level 1 (direct parent): 10% = ₹100
  - Level 2 (grandparent):    5% = ₹50
  - Level 3 (great-grandparent): 2% = ₹20
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Referral, SystemMetrics, User

# ── Reward Configuration ──────────────────────────────────────
REWARD_BASE = 1000.0          # Base reward amount (₹)
REWARD_DEPTH = 3              # Max levels to distribute upward
REWARD_PERCENTAGES = [0.10, 0.05, 0.02]  # % at each level


async def distribute_rewards(
    child_id: int,
    db: AsyncSession,
) -> list[dict]:
    """
    Distribute rewards upward through the referral chain.

    Process:
    1. Start from the child's direct parent
    2. Walk up the ancestor chain (up to REWARD_DEPTH levels)
    3. At each level, credit the ancestor with: REWARD_BASE * REWARD_PERCENTAGES[level]
    4. Update SystemMetrics.total_rewards_distributed

    Returns a breakdown of all rewards distributed.
    """
    breakdown = []
    current_id = child_id
    total_distributed = 0.0

    for level in range(REWARD_DEPTH):
        # Find the parent at this level
        result = await db.execute(
            select(Referral.parent_id).where(Referral.child_id == current_id)
        )
        parent_id = result.scalar_one_or_none()

        if parent_id is None:
            break  # Reached root of the chain

        # Calculate reward for this level
        reward_amount = REWARD_BASE * REWARD_PERCENTAGES[level]

        # Credit the parent's reward balance
        parent_user = await db.get(User, parent_id)
        if parent_user:
            parent_user.reward_balance += reward_amount
            total_distributed += reward_amount

            breakdown.append({
                "level": level + 1,
                "user_id": parent_id,
                "user_name": parent_user.name,
                "percentage": REWARD_PERCENTAGES[level],
                "amount": reward_amount,
            })

        current_id = parent_id

    # Update global metrics
    metrics = await db.get(SystemMetrics, 1)
    if metrics:
        metrics.total_rewards_distributed += total_distributed

    return breakdown


async def get_reward_details(user_id: int, db: AsyncSession) -> dict:
    """
    Get reward details for a specific user including their balance
    and a breakdown of rewards received from their referral subtree.
    """
    user = await db.get(User, user_id)
    if not user:
        return None

    return {
        "user_id": user_id,
        "total_reward_balance": user.reward_balance,
    }
