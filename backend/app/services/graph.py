"""
DAG (Directed Acyclic Graph) enforcement service.

Core invariant: The referral graph must ALWAYS remain acyclic.

Users = Nodes, Referrals = Directed edges (child → parent).
Each user can have at most ONE parent (single-parent tree structure within the DAG).

Cycle Detection Strategy:
─────────────────────────
To check if adding edge (child → parent) creates a cycle, we traverse the
ancestor chain starting from `parent_id` upward. If we ever reach `child_id`,
then adding this edge would create a cycle (child → parent → ... → child).

This works because:
- Edges point from child to parent (upward)
- A cycle exists iff the proposed parent is already a descendant of the child
- Equivalently: if walking UP from parent eventually reaches child

Time complexity: O(d) where d = depth of the ancestor chain from parent_id
Space complexity: O(1) — iterative traversal, no recursion stack
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Referral, User


async def creates_cycle(child_id: int, parent_id: int, db: AsyncSession) -> bool:
    """
    Detect if adding edge child_id → parent_id would create a cycle.

    Algorithm (Iterative Ancestor Traversal):
    1. Start at the proposed parent (parent_id)
    2. Walk up the ancestor chain by following parent edges
    3. If we reach child_id → CYCLE DETECTED (reject)
    4. If we reach a node with no parent → NO CYCLE (safe to insert)

    Why this works:
    - We're checking: "Is child_id an ancestor of parent_id?"
    - If yes, then adding child → parent creates: child → parent → ... → child (cycle!)
    - If no, the graph remains acyclic.

    Returns True if a cycle would be created, False otherwise.
    """
    current_id = parent_id

    # Walk up the ancestor chain from the proposed parent
    while current_id is not None:
        # If we've reached the child, adding this edge creates a cycle
        if current_id == child_id:
            return True

        # Find the parent of the current node
        result = await db.execute(
            select(Referral.parent_id).where(Referral.child_id == current_id)
        )
        row = result.scalar_one_or_none()
        current_id = row  # None if no parent exists (root node reached)

    return False


async def get_referral_tree(user_id: int, db: AsyncSession, max_depth: int = 3) -> dict:
    """
    Build the referral tree (downward) from a given user up to max_depth.
    Returns a nested dictionary representing the tree structure.
    """
    user = await db.get(User, user_id)
    if not user:
        return None

    async def build_subtree(uid: int, name: str, depth: int) -> dict:
        node = {"user_id": uid, "name": name, "depth": depth, "children": []}

        if depth >= max_depth:
            return node

        # Find all children of this user
        result = await db.execute(
            select(Referral.child_id).where(Referral.parent_id == uid)
        )
        child_ids = result.scalars().all()

        for cid in child_ids:
            child_user = await db.get(User, cid)
            if child_user:
                child_node = await build_subtree(cid, child_user.name, depth + 1)
                node["children"].append(child_node)

        return node

    return await build_subtree(user_id, user.name, 0)


async def get_ancestor_chain(user_id: int, db: AsyncSession) -> list[int]:
    """
    Get the full ancestor chain for a user (walking upward).
    Returns list of user IDs from immediate parent to root.
    """
    ancestors = []
    current_id = user_id

    while True:
        result = await db.execute(
            select(Referral.parent_id).where(Referral.child_id == current_id)
        )
        parent_id = result.scalar_one_or_none()

        if parent_id is None:
            break

        ancestors.append(parent_id)
        current_id = parent_id

    return ancestors


async def calculate_avg_referral_depth(db: AsyncSession) -> float:
    """
    Calculate the average depth of all users in the referral graph.
    Depth = length of the ancestor chain for each user.
    """
    result = await db.execute(select(User.id))
    user_ids = result.scalars().all()

    if not user_ids:
        return 0.0

    total_depth = 0
    users_with_parents = 0

    for uid in user_ids:
        ancestors = await get_ancestor_chain(uid, db)
        depth = len(ancestors)
        if depth > 0:
            total_depth += depth
            users_with_parents += 1

    return round(total_depth / max(users_with_parents, 1), 2)
