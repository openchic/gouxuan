from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict, EmailStr, Field, SecretStr, field_validator

from app import auth
from app.api.contracts import ErrorResponse, Response

router = APIRouter(
    prefix='/v1/auth',
    tags=['auth'],
    responses={
        401: {'model': ErrorResponse},
        422: {'model': ErrorResponse},
        503: {'model': ErrorResponse},
    },
)


class LoginRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')

    email: EmailStr
    password: SecretStr = Field(min_length=1, max_length=1024)
    device_name: str = Field(default='desktop', min_length=1, max_length=120)

    @field_validator('email', mode='before')
    @classmethod
    def normalize_email(cls, value: object) -> object:
        return value.strip().lower() if isinstance(value, str) else value


class RefreshRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')

    refresh_token: SecretStr = Field(min_length=1, max_length=256)


@router.post('/login')
async def login(
    request: LoginRequest, database: auth.Database
) -> Response[auth.Credentials]:
    """Log in with an operator-managed email/password account."""
    credentials = await auth.login(
        database,
        str(request.email),
        request.password.get_secret_value(),
        request.device_name,
    )
    return Response(data=credentials)


@router.post('/refresh')
async def refresh(
    request: RefreshRequest, database: auth.Database
) -> Response[auth.Credentials]:
    """Rotate credentials; a reused refresh token revokes the device session."""
    return Response(
        data=await auth.refresh(database, request.refresh_token.get_secret_value())
    )


@router.get('/me')
async def me(
    identity: Annotated[auth.Identity, Depends(auth.current_identity)],
) -> Response[auth.Account]:
    """Read the currently authenticated account."""
    return Response(data=identity.account)


@router.post('/logout')
async def logout(
    database: auth.Database,
    identity: Annotated[auth.Identity, Depends(auth.current_identity)],
) -> Response[dict[str, str]]:
    """Revoke both access and refresh credentials for this device."""
    await auth.logout(database, identity)
    return Response(data={})
