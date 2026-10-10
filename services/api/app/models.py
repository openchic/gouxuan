from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    LargeBinary,
    String,
    func,
    text,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = 'users'
    __table_args__ = (
        CheckConstraint("role IN ('user', 'admin')", name='user_role'),
        CheckConstraint('email = lower(btrim(email))', name='normalized_email'),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(String(320), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(16), default='user', server_default='user')
    is_active: Mapped[bool] = mapped_column(default=True, server_default=text('true'))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class AuthSession(Base):
    __tablename__ = 'auth_sessions'
    __table_args__ = (
        CheckConstraint(
            'octet_length(access_token_hash) = 32', name='access_hash_length'
        ),
        CheckConstraint(
            'access_expires_at <= idle_expires_at AND idle_expires_at <= absolute_expires_at',
            name='session_expiration_order',
        ),
        CheckConstraint(
            '(revoked_at IS NULL) = (revoked_reason IS NULL)',
            name='session_revocation_reason',
        ),
        Index('ix_auth_sessions_user_created', 'user_id', 'created_at'),
        Index('ix_auth_sessions_idle_expires', 'idle_expires_at'),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(ForeignKey('users.id'))
    device_name: Mapped[str] = mapped_column(String(120))
    access_token_hash: Mapped[bytes] = mapped_column(LargeBinary, unique=True)
    access_expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    idle_expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    absolute_expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    revoked_reason: Mapped[str | None] = mapped_column(String(32))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    last_refreshed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class RefreshToken(Base):
    __tablename__ = 'refresh_tokens'
    __table_args__ = (
        CheckConstraint('octet_length(token_hash) = 32', name='refresh_hash_length'),
        Index(
            'uq_refresh_tokens_unconsumed_session',
            'session_id',
            unique=True,
            postgresql_where=text('consumed_at IS NULL'),
        ),
    )

    token_hash: Mapped[bytes] = mapped_column(LargeBinary, primary_key=True)
    session_id: Mapped[UUID] = mapped_column(
        ForeignKey('auth_sessions.id', ondelete='CASCADE'), index=True
    )
    issued_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    consumed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
