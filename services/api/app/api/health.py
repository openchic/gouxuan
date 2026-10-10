from fastapi import APIRouter
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.database import check_database

router = APIRouter()


@router.get('/healthz')
def healthz() -> dict[str, str]:
    return {'status': 'ok'}


@router.get('/readyz')
async def readyz() -> JSONResponse:
    try:
        await check_database()
    except (SQLAlchemyError, RuntimeError):
        return JSONResponse(status_code=503, content={'status': 'database_not_ready'})
    return JSONResponse(
        content={'status': 'ready'},
    )
