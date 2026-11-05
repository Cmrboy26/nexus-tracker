import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def app(monkeypatch):
    monkeypatch.setenv("AUTH0_DOMAIN", "example.auth0.com")
    monkeypatch.setenv("AUTH0_AUDIENCE", "https://example.test/")

    from api import create_api

    return create_api()


@pytest.fixture
def client(app):
    from auth import get_user
    from models.user_model import User
    from routers.tracking import router

    user = User(id="00000000-0000-0000-0000-000000000001", auth0_id="test-user")
    app.dependency_overrides[get_user] = lambda: user
    app.dependency_overrides[router.dependencies[0].dependency] = lambda: {"sub": "test-user"}

    with TestClient(app) as test_client:
        yield test_client