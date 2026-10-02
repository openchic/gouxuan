from fastapi import FastAPI

from app.api import health


def create_app() -> FastAPI:
    application = FastAPI(title="钩玄检索服务", version="0.1.0")
    application.include_router(health.router)
    return application


app = create_app()
