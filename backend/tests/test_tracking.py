import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from models.tracking_model import Drink, TrackingLog, TrackingSuggestions


def test_suggestions_match_response_model(client):
    response = client.get("/tracking/suggestions")

    assert response.status_code == 200
    suggestions = TrackingSuggestions.model_validate(response.json())
    assert "Calm" in suggestions.mood
    assert suggestions.meals.am == ["Eggs", "Sausage", "Toast", "Bacon"]
    assert any(drink.name == "Water" for drink in suggestions.drinks)


def test_daily_log_matches_requested_date(client):
    response = client.get("/day/2026-11-05")

    assert response.status_code == 200
    log = TrackingLog.model_validate(response.json())
    assert log.date.isoformat() == "2026-11-05T00:00:00"
    assert log.mood[0].ratings == {"happiness": 5.0}
    assert log.meals == []
    assert log.drinks == []


def test_tracking_requires_authentication(app):
    with TestClient(app) as client:
        response = client.get("/tracking/suggestions")

    assert response.status_code == 400
    assert response.json()["detail"]["error"] == "invalid_request"


@pytest.mark.parametrize("fields", [{"unit": "gallons"}, {"unknown": 1}])
def test_drink_rejects_invalid_fields(fields):
    with pytest.raises(ValidationError):
        Drink(name="Water", **fields)