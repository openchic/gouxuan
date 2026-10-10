from unittest.mock import AsyncMock

from fastapi.testclient import TestClient

from app.api import health
from app.main import app

client = TestClient(app)


def test_healthz_reports_process_alive() -> None:
    assert client.get('/healthz').json() == {'status': 'ok'}


def test_readyz_is_503_when_database_missing(monkeypatch) -> None:
    monkeypatch.setattr(
        health,
        'check_database',
        AsyncMock(side_effect=RuntimeError('missing migration')),
    )
    response = client.get('/readyz')
    assert response.status_code == 503
    assert response.json() == {'status': 'database_not_ready'}


def test_readyz_is_200_when_database_ready(monkeypatch) -> None:
    monkeypatch.setattr(health, 'check_database', AsyncMock())
    response = client.get('/readyz')
    assert response.status_code == 200
    assert response.json() == {'status': 'ready'}


def test_contract_lists_routes() -> None:
    assert '/healthz' in app.openapi()['paths']
