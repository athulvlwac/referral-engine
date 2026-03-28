"""
SQLAlchemy ORM models representing the referral DAG system.

Users = Nodes in the graph
Referrals = Directed edges (child → parent)
FraudLog = Audit trail for rejected/suspicious activity
SystemMetrics = Aggregated counters for dashboard reporting
"""
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class RewardTransaction(Base):
    __tablename__ = "reward_transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending | paid | rejected
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), default=lambda: datetime.now(timezone.utc)
    )

    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])


import uuid

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default="user")  # admin | user
    referral_code: Mapped[str] = mapped_column(
        String(20), unique=True, nullable=False, default=lambda: uuid.uuid4().hex[:8].upper()
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), default=lambda: datetime.now(timezone.utc)
    )
    reward_balance: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(20), default="active")  # active | flagged | Blocked

    # Relationships
    referrals_as_child: Mapped[list["Referral"]] = relationship(
        "Referral", foreign_keys="Referral.child_id", back_populates="child"
    )
    referrals_as_parent: Mapped[list["Referral"]] = relationship(
        "Referral", foreign_keys="Referral.parent_id", back_populates="parent"
    )


class Referral(Base):
    __tablename__ = "referrals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    child_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    parent_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), default=lambda: datetime.now(timezone.utc)
    )

    child: Mapped["User"] = relationship("User", foreign_keys=[child_id], back_populates="referrals_as_child")
    parent: Mapped["User"] = relationship("User", foreign_keys=[parent_id], back_populates="referrals_as_parent")


class FraudLog(Base):
    __tablename__ = "fraud_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    reason: Mapped[str] = mapped_column(String(50), nullable=False)  # cycle | self | velocity
    details: Mapped[str] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="unreviewed")  # unreviewed | dismissed | escalated
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), default=lambda: datetime.now(timezone.utc)
    )


class SystemMetrics(Base):
    """
    Singleton-style table storing aggregate counters.
    Always has exactly one row (id=1).
    """
    __tablename__ = "system_metrics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    total_referrals: Mapped[int] = mapped_column(Integer, default=0)
    valid_referrals: Mapped[int] = mapped_column(Integer, default=0)
    rejected_referrals: Mapped[int] = mapped_column(Integer, default=0)
    fraud_attempts: Mapped[int] = mapped_column(Integer, default=0)
    cycles_prevented: Mapped[int] = mapped_column(Integer, default=0)
    total_rewards_distributed: Mapped[float] = mapped_column(Float, default=0.0)
