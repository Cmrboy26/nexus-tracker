from fastapi import APIRouter, HTTPException, Response
from auth import auth0, RequiredAppUser, OptionalAppUser, require_user
from fastapi import Depends, Request, Response
from typing import Annotated
from databridges import user_databridge
from pydantic import BaseModel

router = APIRouter()
router.dependencies = [Depends(auth0.require_auth())]

class ProfileUpdate(BaseModel):
    display_name: str | None = None
    birthday: str | None = None

@router.post("/profile/update")
async def update_profile(user: RequiredAppUser, body: ProfileUpdate):
    if user is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    display_name = body.display_name if "display_name" in body.model_fields_set else user.display_name
    birthday = body.birthday if "birthday" in body.model_fields_set else user.birthday
    updated_user = user_databridge.update_user(str(user.id), display_name, birthday)
    if updated_user is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {"message": "Profile", "user": updated_user}

@router.post("/profile/create")
async def create_profile(claims: Annotated[dict, Depends(require_user)], user: OptionalAppUser, request: Request, response: Response):
    if (user is not None):
        response.status_code = 400
        return {"message": "User already has a profile"}
    body = await request.json()
    display_name = body.get("display_name")
    birthday = body.get("birthday")
    # Try creating a profile
    try:
        profile_created = user_databridge.create_user(claims["sub"], display_name=display_name, birthday=birthday)
        response.status_code = 201
        return {"message": "Profile Created"}
    except Exception as e:
        response.status_code = 400
        return {"message": "Failed to create profile", "error": str(e)}

