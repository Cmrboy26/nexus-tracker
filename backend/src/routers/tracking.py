from fastapi import APIRouter, HTTPException, Response
from auth import auth0, RequiredAppUser, OptionalAppUser, require_user
from fastapi import Depends, Request, Response
from typing import Annotated
from databridges import user_databridge
from pydantic import BaseModel
from models.tracking_model import MealSuggestions
from datetime import datetime, timedelta
from models.tracking_model import MoodEntry, MealEntry, DrinkEntry, Drink, TrackingSuggestions, TrackingLog

router = APIRouter()
router.dependencies = [Depends(auth0.require_auth())]

@router.get("/tracking/suggestions", response_model=TrackingSuggestions)
async def get_tracking_suggestions(user: RequiredAppUser, response: Response):
    if user is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    # Return some dummy suggestions for now
    return TrackingSuggestions(
        mood=["Anxious", "Hopeful", "Calm", "Frustrated", "Excited", "Overwhelmed", "Content", "Tired"],
        meals=MealSuggestions(
            am=["Eggs", "Sausage", "Toast", "Bacon"],
            mid=[],
            pm=["Fried Rice", "Cookies"]
        ),
        drinks=[
            Drink(name="Water", caffeineMg=0, volume=1, unit="cups"),
            Drink(name="Coffee", caffeineMg=95, volume=1, unit="cups"),
            Drink(name="Tea", caffeineMg=47, volume=1, unit="cups"),
            Drink(name="Soda", caffeineMg=40, volume=12, unit="oz"),
            Drink(name="Energy drink", caffeineMg=80, volume=8.4, unit="oz")
        ]
    )

@router.get("/day/{date}", response_model=TrackingLog)
async def get_day_events(user: RequiredAppUser, date: str):
    if user is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    # Compile report for the specified date
    return TrackingLog(
        date=datetime.strptime(date, "%Y-%m-%d"),
        mood=[
            MoodEntry(
                ratings={"happiness": 5.0},
                labels=["happy"],
                time=datetime.now()
            )
        ],
        meals=[],
        drinks=[]
    )
