from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.settings import settings

router = APIRouter()


@router.get('/healthz')
def healthz() -> dict[str, str]:
    return {'status': 'ok'}


@router.get('/readyz')
def readyz() -> JSONResponse:
    ready = settings.index_path.exists()
    return JSONResponse(
        status_code=200 if ready else 503,
        content={'status': 'ready' if ready else 'index_missing'},
    )
