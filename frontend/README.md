# Nexus Tracker Frontend

React Router, React, TypeScript, and Tailwind CSS.

```bash
npm install
npm run dev
```

The development server normally runs at `http://localhost:5173`.

```bash
npm run typecheck
npm run build
npm run start
```

`npm run start` serves the production build, so run `npm run build` first.

## Tests

Run the frontend tests after installing dependencies:

```bash
npm test
```

These tests run with Vitest and a simulated DOM; they do not require a running backend.

## API types

FastAPI response models define the API contract. With the backend running on port 8000,
restart it after changing an API model or route, then regenerate the frontend types:

```bash
npm run generate:api
npm run typecheck
```

The script defaults to `http://127.0.0.1:8000/openapi.json`. To use another
backend, set `OPENAPI_URL` before running it, for example in PowerShell:

```powershell
$env:OPENAPI_URL = "http://backend:8000/openapi.json"
npm run generate:api
```

The `backend` hostname is for a container on the same Compose network. Ensure the
backend is running the current code; the script cannot detect a stale server. Use
`npm run generate:api -- --check` to check the generated file without rewriting it.
When running in a container, mount the frontend directory so the output persists.

Commit the generated `app/models/api.generated.ts` file with the backend changes.
Generated types describe JSON at compile time; they do not validate responses at runtime.
