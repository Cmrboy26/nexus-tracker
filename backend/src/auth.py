import os
from fastapi_plugin.fast_api_client import Auth0FastAPI, Request, Request
from fastapi import Depends
from typing import Annotated
from pydantic import BaseModel

auth0 = Auth0FastAPI(
    domain=os.environ.get("AUTH0_DOMAIN"),
    audience=os.environ.get("AUTH0_AUDIENCE")
)

require_user = auth0.require_auth()

class User(BaseModel):
    """
    An authenticated user.
    """
    id: str
    email: str | None = None

    
async def optional_claims(request: Request) -> dict | None:
    if "authorization" not in request.headers:
        return None
    return await require_user(request)

def get_optional_user(
    claims: Annotated[dict | None, Depends(optional_claims)],
) -> User | None:
    if claims is None:
        return None
    return get_user(claims)

def get_user(claims: Annotated[dict, Depends(require_user)]) -> User:
    if "sub" not in claims:
        raise ValueError("Missing required claim 'sub'")
    return User(
        id=claims.get("sub"),
        email=claims.get("email")
    )

RequiredAppUser = Annotated[User, Depends(get_user)]
OptionalAppUser = Annotated[User | None, Depends(get_optional_user)]
