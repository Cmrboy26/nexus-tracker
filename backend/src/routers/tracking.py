from fastapi import APIRouter, HTTPException, Response
from auth import auth0, RequiredAppUser, OptionalAppUser, require_user
from fastapi import Depends, Request, Response
from typing import Annotated
from databridges import tracking_databridge
from pydantic import BaseModel
from datetime import date as Date
from models.tracking_model import MoodEntry, LoggedMoodEntry, MealEntry, LoggedMealEntry, MealSuggestions, DrinkEntry, LoggedDrinkEntry, Drink, TrackingSuggestions, TrackingLog

router = APIRouter()
router.dependencies = [Depends(auth0.require_auth())]

DEFAULT_MOOD_LABELS = ["Anxious", "Hopeful", "Calm", "Frustrated", "Excited", "Overwhelmed", "Content", "Tired"]

@router.get("/tracking/suggestions", response_model=TrackingSuggestions)
async def get_tracking_suggestions(user: RequiredAppUser):
    if user is None:
        raise HTTPException(status_code=404, detail="Profile not found")

    moods = {}
    meals = {"am": {}, "mid": {}, "pm": {}}
    drinks = {}

    def record(suggestions, name, value):
        key = name.strip().casefold()
        if not key:
            return
        if key in suggestions:
            suggestions[key][0] += 1
        else:
            suggestions[key] = [1, value]

    def ranked(suggestions):
        return [value for count, value in sorted(suggestions.values(), key=lambda item: -item[0])]

    for entry_type, payload in tracking_databridge.get_suggestion_entries(str(user.id)):
        if entry_type == "mood":
            labels = {label.strip().casefold(): label.strip() for label in payload["labels"] if label.strip()}
            for label in labels.values():
                record(moods, label, label)
        elif entry_type == "meal":
            name = payload["name"].strip()
            record(meals[payload["period"]], name, name)
        elif entry_type == "drink":
            drink = Drink.model_validate(payload["drink"])
            drink.name = drink.name.strip()
            record(drinks, drink.name, drink)

    for label in DEFAULT_MOOD_LABELS:
        record(moods, label, label)

    return TrackingSuggestions(
        mood=ranked(moods),
        meals=MealSuggestions(**{period: ranked(items) for period, items in meals.items()}),
        drinks=ranked(drinks),
    )

@router.get("/day/{date}", response_model=TrackingLog)
async def get_day_events(user: RequiredAppUser, date: Date):
    if user is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    return tracking_databridge.get_day(str(user.id), date)


@router.post("/day/{date}/mood", response_model=LoggedMoodEntry, status_code=201)
async def create_mood(user: RequiredAppUser, date: Date, entry: MoodEntry):
    if user is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    entry_id = tracking_databridge.create_entry(str(user.id), date, "mood", entry)
    return LoggedMoodEntry(**entry.model_dump(), id=entry_id)


@router.post("/day/{date}/meal", response_model=LoggedMealEntry, status_code=201)
async def create_meal(user: RequiredAppUser, date: Date, entry: MealEntry):
    if user is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    entry_id = tracking_databridge.create_entry(str(user.id), date, "meal", entry)
    return LoggedMealEntry(**entry.model_dump(), id=entry_id)


@router.post("/day/{date}/drink", response_model=LoggedDrinkEntry, status_code=201)
async def create_drink(user: RequiredAppUser, date: Date, entry: DrinkEntry):
    if user is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    entry_id = tracking_databridge.create_entry(str(user.id), date, "drink", entry)
    return LoggedDrinkEntry(**entry.model_dump(), id=entry_id)


@router.delete("/tracking/entries/{entry_id}", status_code=204)
async def delete_entry(user: RequiredAppUser, entry_id: str):
    if user is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    if not tracking_databridge.delete_entry(str(user.id), entry_id):
        raise HTTPException(status_code=404, detail="Entry not found")
    return Response(status_code=204)
