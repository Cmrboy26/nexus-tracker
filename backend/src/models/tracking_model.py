from datetime import datetime
from typing import Dict, List, Literal, Optional, ForwardRef

from pydantic import BaseModel, ConfigDict


class Drink(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str
    caffeineMg: Optional[float] = None  # in mg
    volume: Optional[float] = None
    unit: Optional[Literal["cups", "ml", "oz"]] = None

class MealSuggestions(BaseModel):
    model_config = ConfigDict(extra="forbid")
    am: List[str]
    mid: List[str]
    pm: List[str]

class MoodEntry(BaseModel):
    model_config = ConfigDict(extra="forbid")
    ratings: Dict[str, float]
    labels: List[str]
    time: datetime

class MealEntry(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str
    period: Literal["am", "mid", "pm"]

class DrinkEntry(BaseModel):
    model_config = ConfigDict(extra="forbid")
    drink: Drink
    time: datetime

class TrackingSuggestions(BaseModel):
    model_config = ConfigDict(extra="forbid")
    mood: List[str]
    meals: MealSuggestions
    drinks: List[Drink]

class TrackingLog(BaseModel):
    model_config = ConfigDict(extra="forbid")
    date: datetime
    mood: List[MoodEntry]
    meals: List[MealEntry]
    drinks: List[DrinkEntry]