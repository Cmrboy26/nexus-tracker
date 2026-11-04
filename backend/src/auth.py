import os
from fastapi_plugin.fast_api_client import Auth0FastAPI, Request
from fastapi import Depends
from typing import Annotated

from databridges import user_databridge
from user_model import User

auth0 = Auth0FastAPI(
    domain=os.environ.get("AUTH0_DOMAIN"),
    audience=os.environ.get("AUTH0_AUDIENCE")
)

require_user = auth0.require_auth()

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
    return user_databridge.get_user_by_auth0_id(claims.get("sub"))

RequiredAppUser = Annotated[User, Depends(get_user)]
OptionalAppUser = Annotated[User | None, Depends(get_optional_user)]
