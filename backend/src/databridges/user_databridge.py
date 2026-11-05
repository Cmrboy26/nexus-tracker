import uuid
import database
from models.user_model import User

def parse_user(user_row):
    return User(
        id=user_row[0],
        auth0_id=user_row[1],
        email=user_row[2],
        display_name=user_row[3],
        birthday=user_row[4]
    )

def get_user_by_auth0_id(auth0_id: str) -> User | None:
    row = database.fetch_one(
        "SELECT id, auth0_id, email, display_name, birthday FROM users WHERE auth0_id = ?",
        (auth0_id,)
    )
    if row is None:
        return None
    return parse_user(row)

def get_user_by_id(user_id: str) -> User | None:
    row = database.fetch_one(
        "SELECT id, auth0_id, email, display_name, birthday FROM users WHERE id = ?",
        (user_id,)
    )
    if row is None:
        return None
    return parse_user(row)

def update_user(user_id: str, display_name: str | None, birthday: str | None) -> User | None:
    database.execute_query(
        "UPDATE users SET display_name = ?, birthday = ? WHERE id = ?",
        (display_name, birthday, user_id)
    )
    return get_user_by_id(user_id)

def create_user(auth0_id: str, email: str | None = None, display_name: str | None = None, birthday: str | None = None) -> User:
    try:
        user_id = str(uuid.uuid4())
        database.execute_query(
            "INSERT INTO users (id, auth0_id, email, display_name, birthday) VALUES (?, ?, ?, ?, ?)",
            (user_id, auth0_id, email, display_name, birthday)
        )
        return get_user_by_id(user_id)
    except Exception as e:
        raise ValueError(f"Failed to create user: {e}")