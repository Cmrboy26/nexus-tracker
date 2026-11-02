import database
import api
import os

database.initialize_database()
api = api.create_api()