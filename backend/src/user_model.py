import uuid
from pydantic import BaseModel


class User(BaseModel):
    """
    An authenticated user.
    """
    id: uuid.UUID
    auth0_id: str
    email: str | None = None
    display_name: str | None = None
    birthday: str | None = None