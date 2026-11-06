import json
import uuid
from contextlib import closing
from datetime import date, datetime, time

import database
from models.tracking_model import DrinkEntry, LoggedDrinkEntry, LoggedMealEntry, LoggedMoodEntry, MealEntry, MoodEntry, TrackingLog


def create_entry(user_id: str, log_date: date, entry_type: str, entry: MoodEntry | MealEntry | DrinkEntry) -> str:
	entry_id = str(uuid.uuid4())
	occurred_at = entry.time.isoformat() if isinstance(entry, (MoodEntry, DrinkEntry)) else None
	data = entry.model_dump(mode="json", exclude={"time"})
	database.execute_query(
		"INSERT INTO tracking_entries (id, user_id, log_date, entry_type, occurred_at, data) VALUES (?, ?, ?, ?, ?, ?)",
		(entry_id, user_id, log_date.isoformat(), entry_type, occurred_at, json.dumps(data)),
	)
	return entry_id


def get_day(user_id: str, log_date: date) -> TrackingLog:
	rows = database.fetch_all(
		"SELECT id, entry_type, occurred_at, data FROM tracking_entries WHERE user_id = ? AND log_date = ? ORDER BY occurred_at, id",
		(user_id, log_date.isoformat()),
	)
	moods = []
	meals = []
	drinks = []
	for entry_id, entry_type, occurred_at, data in rows:
		payload = json.loads(data)
		if entry_type == "mood":
			moods.append(LoggedMoodEntry(**payload, time=occurred_at, id=entry_id))
		elif entry_type == "meal":
			meals.append(LoggedMealEntry(**payload, id=entry_id))
		elif entry_type == "drink":
			drinks.append(LoggedDrinkEntry(**payload, time=occurred_at, id=entry_id))
	return TrackingLog(date=datetime.combine(log_date, time.min), mood=moods, meals=meals, drinks=drinks)


def get_suggestion_entries(user_id: str):
	rows = database.fetch_all(
		"SELECT entry_type, data FROM tracking_entries WHERE user_id = ? AND entry_type IN ('mood', 'meal', 'drink') ORDER BY log_date DESC, julianday(occurred_at) DESC, id DESC",
		(user_id,),
	)
	return [(entry_type, json.loads(data)) for entry_type, data in rows]


def delete_entry(user_id: str, entry_id: str) -> bool:
	with closing(database.get_connection()) as conn:
		cursor = conn.execute(
			"DELETE FROM tracking_entries WHERE id = ? AND user_id = ?",
			(entry_id, user_id),
		)
		conn.commit()
		return cursor.rowcount > 0

