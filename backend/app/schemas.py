"""
Pydantic schemas for request/response validation.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


# ── User Schemas ──────────────────────────────────────────────
class UserRegister(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=6)
    referral_code: str = Field(None, description="Required for regular users, optional for admin initialization.")

class UserLogin(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    referral_code: str
    created_at: datetime
    reward_balance: float
    status: str

    model_config = {"from_attributes": True}

class UserProfileResponse(BaseModel):
    user: UserResponse
    direct_referrals_count: int


# ── Referral Schemas ──────────────────────────────────────────
class ReferralClaim(BaseModel):
    child_id: int = Field(..., description="The user being referred (new user)")
    parent_id: int = Field(..., description="The referrer (existing user)")


class ReferralResponse(BaseModel):
    id: int
    child_id: int
    parent_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Graph Schemas ─────────────────────────────────────────────
class GraphNode(BaseModel):
    user_id: int
    name: str
    depth: int
    children: list["GraphNode"] = []


class GraphResponse(BaseModel):
    root: GraphNode
    total_nodes: int


# ── Reward Schemas ────────────────────────────────────────────
class RewardBreakdown(BaseModel):
    level: int
    user_id: int
    user_name: str
    percentage: float
    amount: float


class RewardResponse(BaseModel):
    user_id: int
    total_reward_balance: float
    breakdown: list[RewardBreakdown] = []


class RewardTransactionResponse(BaseModel):
    id: int
    user_id: int
    amount: float
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class LogDetailResponse(BaseModel):
    event_id: int
    timestamp: datetime
    ip_address: str
    user_agent: str
    method: str
    path: str
    headers: dict[str, str]


# ── Fraud Schemas ─────────────────────────────────────────────
class FraudLogResponse(BaseModel):
    id: int
    user_id: int
    reason: str
    details: Optional[str]
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Dashboard Metrics ─────────────────────────────────────────
class DashboardMetrics(BaseModel):
    total_users: int
    total_referrals: int
    valid_referrals: int
    rejected_referrals: int
    fraud_attempts: int
    cycles_prevented: int
    total_rewards_distributed: float
    avg_referral_depth: float
