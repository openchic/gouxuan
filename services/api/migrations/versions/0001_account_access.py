"""Create only the three tables used by account authentication."""

import sqlalchemy as sa
from alembic import op

revision = '0001_account_access'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', sa.Uuid(), primary_key=True),
        sa.Column('email', sa.String(320), nullable=False, unique=True),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('role', sa.String(16), nullable=False, server_default='user'),
        sa.Column(
            'is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')
        ),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.CheckConstraint("role IN ('user', 'admin')", name='user_role'),
        sa.CheckConstraint('email = lower(btrim(email))', name='normalized_email'),
    )
    op.create_table(
        'auth_sessions',
        sa.Column('id', sa.Uuid(), primary_key=True),
        sa.Column('user_id', sa.Uuid(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('device_name', sa.String(120), nullable=False),
        sa.Column('access_token_hash', sa.LargeBinary(), nullable=False, unique=True),
        sa.Column('access_expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('idle_expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('absolute_expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('revoked_at', sa.DateTime(timezone=True)),
        sa.Column('revoked_reason', sa.String(32)),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column('last_refreshed_at', sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            'octet_length(access_token_hash) = 32', name='access_hash_length'
        ),
        sa.CheckConstraint(
            'access_expires_at <= idle_expires_at AND idle_expires_at <= absolute_expires_at',
            name='session_expiration_order',
        ),
        sa.CheckConstraint(
            '(revoked_at IS NULL) = (revoked_reason IS NULL)',
            name='session_revocation_reason',
        ),
    )
    op.create_index(
        'ix_auth_sessions_user_created', 'auth_sessions', ['user_id', 'created_at']
    )
    op.create_index(
        'ix_auth_sessions_idle_expires', 'auth_sessions', ['idle_expires_at']
    )
    op.create_table(
        'refresh_tokens',
        sa.Column('token_hash', sa.LargeBinary(), primary_key=True),
        sa.Column(
            'session_id',
            sa.Uuid(),
            sa.ForeignKey('auth_sessions.id', ondelete='CASCADE'),
            nullable=False,
        ),
        sa.Column(
            'issued_at',
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column('consumed_at', sa.DateTime(timezone=True)),
        sa.CheckConstraint('octet_length(token_hash) = 32', name='refresh_hash_length'),
    )
    op.create_index('ix_refresh_tokens_session_id', 'refresh_tokens', ['session_id'])
    op.create_index(
        'uq_refresh_tokens_unconsumed_session',
        'refresh_tokens',
        ['session_id'],
        unique=True,
        postgresql_where=sa.text('consumed_at IS NULL'),
    )


def downgrade() -> None:
    op.drop_table('refresh_tokens')
    op.drop_table('auth_sessions')
    op.drop_table('users')
