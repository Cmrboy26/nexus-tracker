# Nexus Tracker Backend

## Tests

From the backend directory, install the development dependencies and run pytest:

```bash
python -m pip install -r requirements-dev.txt
python -m pytest
```

The API tests use FastAPI's in-process test client. Authenticated requests use
test dependency overrides, so they do not require Auth0, Docker, or a database.