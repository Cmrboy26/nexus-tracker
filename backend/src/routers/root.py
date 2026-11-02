from fastapi import APIRouter
from auth import auth0, RequiredAppUser, OptionalAppUser
from fastapi import Depends

router = APIRouter()
#router.dependencies = [Depends(auth0.require_auth())]

@router.get("/")
def read_dashboard(user: OptionalAppUser):
    return {"message": "Dashboard", "user": user}

@router.get("/profile")
def read_profile(user: RequiredAppUser):
    return {"message": "Profile", "user": user}