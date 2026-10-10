from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.api import auth, health
from app.auth import AuthError
from app.database import check_database, engine


@asynccontextmanager
async def lifespan(application: FastAPI) -> AsyncIterator[None]:
    await check_database()
    try:
        yield
    finally:
        await engine.dispose()


def create_app() -> FastAPI:
    application = FastAPI(title='钩玄服务', version='0.1.0', lifespan=lifespan)
    application.include_router(health.router)
    application.include_router(auth.router)

    @application.exception_handler(AuthError)
    async def auth_error(request: Request, error: AuthError) -> JSONResponse:
        return JSONResponse(
            status_code=error.status_code,
            content={'code': error.code, 'message': error.message, 'data': {}},
            headers={'WWW-Authenticate': 'Bearer'}
            if error.status_code == 401
            else None,
        )

    @application.exception_handler(RequestValidationError)
    async def validation_error(
        request: Request, error: RequestValidationError
    ) -> JSONResponse:
        # FastAPI's default validation details can echo passwords and refresh tokens.
        return JSONResponse(
            status_code=422,
            content={
                'code': 'INVALID_REQUEST',
                'message': '请求参数格式错误',
                'data': {},
            },
        )

    @application.exception_handler(SQLAlchemyError)
    async def database_error(request: Request, error: SQLAlchemyError) -> JSONResponse:
        return JSONResponse(
            status_code=503,
            content={
                'code': 'SERVICE_UNAVAILABLE',
                'message': '服务暂时不可用',
                'data': {},
            },
        )

    return application


app = create_app()
