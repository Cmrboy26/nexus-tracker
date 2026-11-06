import json
import sqlite3
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

import database
from models.tracking_model import Drink, TrackingLog, TrackingSuggestions


def test_suggestions_match_response_model(client, tracking_db, monkeypatch):
    from routers import tracking

    monkeypatch.setattr(tracking, "DEFAULT_MOOD_LABELS", ["Preset One", "Preset Two"])
    response = client.get("/tracking/suggestions")

    assert response.status_code == 200
    suggestions = TrackingSuggestions.model_validate(response.json())
    assert set(suggestions.mood) == {"Preset One", "Preset Two"}
    assert suggestions.meals.model_dump() == {"am": [], "mid": [], "pm": []}
    assert suggestions.drinks == []


def test_suggestions_use_ranked_user_history(client, app, tracking_db, monkeypatch):
    from auth import get_user
    from models.user_model import User
    from routers import tracking

    monkeypatch.setattr(tracking, "DEFAULT_MOOD_LABELS", ["Calm", "Tired", "Baseline"])

    def create(date, entry_type, payload):
        response = client.post(f"/day/{date}/{entry_type}", json=payload)
        assert response.status_code == 201
        return response.json()["id"]

    create("2026-11-03", "mood", {"ratings": {}, "labels": ["Calm", "calm", "Tired"], "time": "2026-11-03T08:00:00Z"})
    create("2026-11-05", "mood", {"ratings": {}, "labels": ["CALM"], "time": "2026-11-05T08:00:00Z"})
    create("2026-11-02", "meal", {"name": "Eggs", "period": "am"})
    create("2026-11-04", "meal", {"name": "Toast", "period": "am"})
    create("2026-11-03", "meal", {"name": " eggs ", "period": "am"})
    meal_id = create("2026-11-05", "meal", {"name": "Soup", "period": "pm"})
    create("2026-11-03", "drink", {"drink": {"name": "Coffee", "volume": 1, "unit": "cups"}, "time": "2026-11-03T08:00:00Z"})
    create("2026-11-05", "drink", {"drink": {"name": "Tea"}, "time": "2026-11-05T08:00:00Z"})
    create("2026-11-04", "drink", {"drink": {"name": "coffee", "volume": 12, "unit": "oz", "caffeineMg": 120}, "time": "2026-11-04T09:00:00Z"})

    suggestions = client.get("/tracking/suggestions").json()
    assert suggestions["mood"] == ["CALM", "Tired", "Baseline"]
    assert suggestions["meals"] == {"am": ["eggs", "Toast"], "mid": [], "pm": ["Soup"]}
    assert [drink["name"] for drink in suggestions["drinks"]] == ["coffee", "Tea"]
    assert suggestions["drinks"][0] == {"name": "coffee", "volume": 12, "unit": "oz", "caffeineMg": 120}

    other_user = User(id="00000000-0000-0000-0000-000000000002", auth0_id="other-user")
    database.execute_query("INSERT INTO users (id, auth0_id) VALUES (?, ?)", (str(other_user.id), other_user.auth0_id))
    app.dependency_overrides[get_user] = lambda: other_user
    assert client.get("/tracking/suggestions").json() == {
        "mood": ["Calm", "Tired", "Baseline"],
        "meals": {"am": [], "mid": [], "pm": []},
        "drinks": [],
    }

    app.dependency_overrides[get_user] = lambda: User(id="00000000-0000-0000-0000-000000000001", auth0_id="test-user")
    assert client.delete(f"/tracking/entries/{meal_id}").status_code == 204
    assert client.get("/tracking/suggestions").json()["meals"]["pm"] == []


def test_mood_presets_add_weight_to_matching_history(client, tracking_db, monkeypatch):
    from routers import tracking

    monkeypatch.setattr(tracking, "DEFAULT_MOOD_LABELS", ["Calm", "Neutral"])
    entry = {"ratings": {}, "labels": ["Curious", " calm ", "CALM"], "time": "2026-11-05T08:00:00Z"}
    response = client.post("/day/2026-11-05/mood", json=entry)
    assert response.status_code == 201

    moods = client.get("/tracking/suggestions").json()["mood"]
    assert moods.index("CALM") < moods.index("Curious")
    assert sum(label.casefold() == "calm" for label in moods) == 1

    assert client.delete(f"/tracking/entries/{response.json()['id']}").status_code == 204
    moods = client.get("/tracking/suggestions").json()["mood"]
    assert set(moods) == {"Calm", "Neutral"}


def test_drink_suggestion_uses_latest_instant_across_timezones(client, tracking_db):
    entries = [
        {"drink": {"name": "Coffee", "volume": 10}, "time": "2026-11-05T08:30:00-05:00"},
        {"drink": {"name": "Coffee", "volume": 15}, "time": "2026-11-05T08:15:00-06:00"},
    ]
    for entry in entries:
        assert client.post("/day/2026-11-05/drink", json=entry).status_code == 201

    assert client.get("/tracking/suggestions").json()["drinks"][0]["volume"] == 15


@pytest.fixture
def tracking_db(monkeypatch, tmp_path):
    migrations = Path(__file__).resolve().parents[1] / "migrations"
    monkeypatch.setattr(database, "database", str(tmp_path / "database.db"))
    monkeypatch.setattr(database, "migrations_path", str(migrations))
    database.initialize_database()
    database.execute_query(
        "INSERT INTO users (id, auth0_id) VALUES (?, ?)",
        ("00000000-0000-0000-0000-000000000001", "test-user"),
    )


def test_daily_log_matches_requested_date(client, tracking_db):
    response = client.get("/day/2026-11-05")

    assert response.status_code == 200
    log = TrackingLog.model_validate(response.json())
    assert log.date.isoformat() == "2026-11-05T00:00:00"
    assert log.mood == []
    assert log.meals == []
    assert log.drinks == []


def test_create_read_and_delete_entries(client, tracking_db):
    mood = {"ratings": {"happiness": 5}, "labels": ["happy"], "time": "2026-11-05T08:30:00-06:00"}
    meal = {"name": "Eggs", "period": "am"}
    drink = {"drink": {"name": "Coffee", "caffeineMg": 95, "volume": 1, "unit": "cups"}, "time": "2026-11-05T09:00:00-06:00"}
    mood_response = client.post("/day/2026-11-05/mood", json=mood)
    assert mood_response.status_code == 201
    meal_response = client.post("/day/2026-11-05/meal", json=meal)
    assert meal_response.status_code == 201
    drink_response = client.post("/day/2026-11-05/drink", json=drink)
    assert drink_response.status_code == 201
    mood_id = mood_response.json()["id"]
    meal_id = meal_response.json()["id"]
    drink_id = drink_response.json()["id"]

    log = client.get("/day/2026-11-05").json()
    assert log["mood"] == [{**mood, "id": mood_id}]
    assert log["meals"] == [{**meal, "id": meal_id}]
    assert log["drinks"] == [{**drink, "id": drink_id}]
    assert client.get("/day/2026-11-06").json()["meals"] == []
    assert client.delete(f"/tracking/meals/{meal_id}").status_code == 404
    for entry_id in (mood_id, meal_id, drink_id):
        assert client.delete(f"/tracking/entries/{entry_id}").status_code == 204
        assert client.delete(f"/tracking/entries/{entry_id}").status_code == 404
    deleted_log = client.get("/day/2026-11-05").json()
    assert deleted_log["mood"] == []
    assert deleted_log["meals"] == []
    assert deleted_log["drinks"] == []


@pytest.mark.parametrize("entry_type,payload", [
    ("mood", {"ratings": {"happiness": 5}, "labels": [], "time": "2026-11-05T08:30:00Z"}),
    ("meal", {"name": "Eggs", "period": "am"}),
    ("drink", {"drink": {"name": "Water"}, "time": "2026-11-05T09:00:00Z"}),
    ("exercise", None),
])
def test_entries_are_scoped_to_user(client, app, tracking_db, entry_type, payload):
    from auth import get_user
    from models.user_model import User

    if payload is None:
        database.execute_query("INSERT INTO entry_types (name) VALUES (?)", (entry_type,))
        database.execute_query(
            "INSERT INTO tracking_entries (id, user_id, log_date, entry_type, data) VALUES (?, ?, ?, ?, ?)",
            ("future-1", "00000000-0000-0000-0000-000000000001", "2026-11-05", entry_type, "{}"),
        )
        entry_id = "future-1"
    else:
        entry_id = client.post(f"/day/2026-11-05/{entry_type}", json=payload).json()["id"]
    other_user = User(id="00000000-0000-0000-0000-000000000002", auth0_id="other-user")
    database.execute_query("INSERT INTO users (id, auth0_id) VALUES (?, ?)", (str(other_user.id), other_user.auth0_id))
    app.dependency_overrides[get_user] = lambda: other_user

    log = client.get("/day/2026-11-05").json()
    assert log["mood"] == log["meals"] == log["drinks"] == []
    assert client.delete(f"/tracking/entries/{entry_id}").status_code == 404
    assert database.fetch_one("SELECT id FROM tracking_entries WHERE id = ?", (entry_id,)) == (entry_id,)

    app.dependency_overrides[get_user] = lambda: User(id="00000000-0000-0000-0000-000000000001", auth0_id="test-user")
    assert client.delete(f"/tracking/entries/{entry_id}").status_code == 204


def test_entry_validation(client, tracking_db):
    assert client.post("/day/not-a-date/meal", json={"name": "Eggs", "period": "am"}).status_code == 422
    assert client.post("/day/2026-11-05/meal", json={"name": "Eggs", "period": "night"}).status_code == 422


def test_tracking_requires_authentication(app):
    with TestClient(app) as client:
        response = client.get("/tracking/suggestions")

    assert response.status_code == 400
    assert response.json()["detail"]["error"] == "invalid_request"


def test_signed_tokens_authenticate_and_scope_tracking(app, tracking_db, monkeypatch):
    import time

    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric import rsa
    from jose import jwk, jwt

    from auth import auth0

    def private_key():
        return rsa.generate_private_key(public_exponent=65537, key_size=2048).private_bytes(
            serialization.Encoding.PEM,
            serialization.PrivateFormat.PKCS8,
            serialization.NoEncryption(),
        )

    signing_key = private_key()
    public_key = jwk.construct(signing_key, "RS256").public_key().to_dict()
    public_key["kid"] = "test-key"

    async def discover():
        return {"issuer": "https://example.auth0.com/", "jwks_uri": "https://example.auth0.com/keys"}

    async def fetch_keys(uri):
        return {"keys": [public_key]}

    monkeypatch.setattr(auth0.api_client, "_discover", discover)
    monkeypatch.setattr(auth0.api_client, "_fetch_jwks", fetch_keys)
    database.execute_query(
        "INSERT INTO users (id, auth0_id) VALUES (?, ?)",
        ("00000000-0000-0000-0000-000000000002", "other-user"),
    )

    def token(subject, *, audience="https://example.test/", issuer="https://example.auth0.com/", expires_in=300, key=signing_key):
        now = int(time.time())
        return jwt.encode(
            {"sub": subject, "iss": issuer, "aud": audience, "iat": now, "exp": now + expires_in},
            key, algorithm="RS256", headers={"kid": "test-key"},
        )

    with TestClient(app) as client:
        first_user = {"Authorization": f"Bearer {token('test-user')}"}
        second_user = {"Authorization": f"Bearer {token('other-user')}"}
        created = client.post("/day/2026-11-05/meal", headers=first_user, json={"name": "Eggs", "period": "am"})
        assert created.status_code == 201
        entry_id = created.json()["id"]
        assert client.get("/day/2026-11-05", headers=first_user).json()["meals"][0]["id"] == entry_id
        assert client.get("/day/2026-11-05", headers=second_user).json()["meals"] == []
        assert client.delete(f"/tracking/entries/{entry_id}", headers=second_user).status_code == 404

        invalid_tokens = [
            token("test-user", audience="https://wrong.test/"),
            token("test-user", issuer="https://wrong.auth0.com/"),
            token("test-user", expires_in=-1),
            token("test-user", key=private_key()),
        ]
        for invalid_token in invalid_tokens:
            response = client.get("/day/2026-11-05", headers={"Authorization": f"Bearer {invalid_token}"})
            assert response.status_code == 401


@pytest.mark.parametrize("fields", [{"unit": "gallons"}, {"unknown": 1}])
def test_drink_rejects_invalid_fields(fields):
    with pytest.raises(ValidationError):
        Drink(name="Water", **fields)


def test_tracking_migration_supports_current_and_future_entries(monkeypatch):
    migrations = Path(__file__).resolve().parents[1] / "migrations" / "tracked"
    monkeypatch.setattr(database, "database", ":memory:")
    with database.get_connection() as connection:
        connection.executescript((migrations / "11032026-01-Users.sql").read_text())
        connection.executescript((migrations / "11052026-01-Tracking.sql").read_text())
        connection.execute("INSERT INTO users (id, auth0_id) VALUES (?, ?)", ("user-1", "auth0-1"))
        connection.execute("INSERT INTO entry_types (name) VALUES (?)", ("exercise",))

        entries = [
            ("mood-1", "mood", "2026-11-05T08:30:00-06:00", {"ratings": {"happiness": 5}, "labels": ["happy"]}),
            ("meal-1", "meal", None, {"name": "Eggs", "period": "am"}),
            ("drink-1", "drink", "2026-11-05T09:00:00-06:00", {"drink": {"name": "Coffee", "caffeineMg": 95, "volume": 1, "unit": "cups"}}),
            ("future-1", "exercise", "2026-11-05T10:00:00-06:00", {"minutes": 30}),
        ]
        for entry_id, entry_type, occurred_at, data in entries:
            connection.execute(
                "INSERT INTO tracking_entries (id, user_id, log_date, entry_type, occurred_at, data) VALUES (?, ?, ?, ?, ?, ?)",
                (entry_id, "user-1", "2026-11-05", entry_type, occurred_at, json.dumps(data)),
            )

        rows = connection.execute(
            "SELECT id, entry_type, occurred_at, data FROM tracking_entries WHERE user_id = ? AND log_date = ? ORDER BY id",
            ("user-1", "2026-11-05"),
        ).fetchall()
        assert [(row[0], row[1], row[2], json.loads(row[3])) for row in rows] == sorted(entries)

        with pytest.raises(sqlite3.IntegrityError):
            connection.execute(
                "INSERT INTO tracking_entries (id, user_id, log_date, entry_type, data) VALUES (?, ?, ?, ?, ?)",
                ("invalid", "user-1", "2026-11-05", "mood", "not json"),
            )
        with pytest.raises(sqlite3.IntegrityError):
            connection.execute(
                "INSERT INTO tracking_entries (id, user_id, log_date, entry_type, data) VALUES (?, ?, ?, ?, ?)",
                ("array", "user-1", "2026-11-05", "mood", "[]"),
            )
        with pytest.raises(sqlite3.IntegrityError):
            connection.execute(
                "INSERT INTO tracking_entries (id, user_id, log_date, entry_type, data) VALUES (?, ?, ?, ?, ?)",
                ("orphan", "missing-user", "2026-11-05", "mood", "{}"),
            )
        with pytest.raises(sqlite3.IntegrityError):
            connection.execute(
                "INSERT INTO tracking_entries (id, user_id, log_date, entry_type, data) VALUES (?, ?, ?, ?, ?)",
                ("unknown", "user-1", "2026-11-05", "unknown", "{}"),
            )


def test_tracking_migration_is_applied_once(monkeypatch, tmp_path):
    migrations = Path(__file__).resolve().parents[1] / "migrations"
    monkeypatch.setattr(database, "database", str(tmp_path / "database.db"))
    monkeypatch.setattr(database, "migrations_path", str(migrations))
    listdir = database.listdir
    monkeypatch.setattr(database, "listdir", lambda path: list(reversed(sorted(listdir(path)))))

    database.initialize_database()
    database.initialize_database()

    with database.get_connection() as connection:
        assert connection.execute(
            "SELECT COUNT(*) FROM migrations WHERE name = ?", ("11052026-01-Tracking.sql",)
        ).fetchone()[0] == 1
        assert connection.execute("SELECT COUNT(*) FROM tracking_entries").fetchone()[0] == 0