from fastapi.testclient import TestClient

from app.main import app
from app.settings import settings

client = TestClient(app)


def test_healthz_reports_process_alive() -> None:
    assert client.get('/healthz').json() == {'status': 'ok'}


def test_readyz_is_503_when_index_missing(tmp_path, monkeypatch) -> None:
    monkeypatch.setattr(settings, 'index_path', tmp_path / 'absent.db')
    response = client.get('/readyz')
    assert response.status_code == 503
    assert response.json() == {'status': 'index_missing'}


def test_readyz_is_200_when_index_present(tmp_path, monkeypatch) -> None:
    index = tmp_path / 'index.db'
    index.write_bytes(b'')
    monkeypatch.setattr(settings, 'index_path', index)
    assert client.get('/readyz').status_code == 200


def test_contract_lists_routes() -> None:
    assert '/healthz' in app.openapi()['paths']
