# Admin Panel — Project Context

## Stack
- Backend: FastAPI + PostgreSQL + PostGIS, raw SQL (psycopg2), no ORM
- Admin frontend: React (separate project, to be built)
- Deployment: Docker on VPS; backend at configurable base URL

## Base URLs
- Dev: `http://localhost:8000`
- Prod: VPS URL (set in React env var, e.g. `VITE_API_URL`)

---

## Auth

**Mechanism:** JWT Bearer token (HS256, 8h expiry)

**Login:**
```
POST /admin/auth/login
Content-Type: application/x-www-form-urlencoded

username=admin&password=xxx
```
Response:
```json
{ "access_token": "<jwt>", "token_type": "bearer" }
```

**All protected endpoints require:**
```
Authorization: Bearer <token>
```

**Token storage in React:** `localStorage` or memory. On 401, redirect to login.

---

## Implemented endpoints

### GET /admin/places
Returns all places ordered by name.

Response — array of:
```json
{
  "id": 1,
  "name": "string",
  "category": "gastronomia" | "hoteles" | "lugares",
  "address": "string | null",
  "phone": "string | null",
  "website": "string | null",
  "rating": 4.5,
  "total_ratings": 120,
  "opening_hours": { ... } | null,
  "photos": ["https://...", "/static/photos/..."],
  "lat": -25.2867,
  "lng": -57.647,
  "created_at": "2025-01-01T00:00:00"
}
```

---

## Pending endpoints (not yet implemented — build these next)

| Method | Path | Body / Notes |
|--------|------|--------------|
| GET | `/admin/places/{id}` | Single place, same shape as list item |
| POST | `/admin/places` | See Place fields below |
| PUT | `/admin/places/{id}` | Partial or full update of place fields |
| DELETE | `/admin/places/{id}` | — |
| POST | `/admin/places/{id}/photos` | `multipart/form-data`, field `file` |
| DELETE | `/admin/places/{id}/photos` | Body: `{ "url": "..." }` |
| PUT | `/admin/events/{id}` | Edit existing event |

---

## Data model: Place

```
id            integer, PK, serial
name          text, required
category      text, required — enum: gastronomia | hoteles | lugares
address       text, nullable
phone         text, nullable
website       text, nullable
rating        decimal(2,1), nullable
total_ratings integer, nullable
opening_hours jsonb, nullable — free-form object (from Google Places schema)
photos        jsonb — array of URL strings, default []
location      GEOGRAPHY(POINT,4326) — stored as PostGIS; returned as lat/lng floats
created_at    timestamp
```

**Category semantics:**
- `gastronomia` — restaurants, cafes, bars, bakeries, fast food, nightclubs
- `hoteles` — hotels, motels, resorts
- `lugares` — attractions, museums, galleries, parks, monuments, churches, zoos, cultural centers

**Photos array:** mix of external URLs (Google/OSM origin) and local paths (`/static/photos/filename`). React should resolve local paths as `${API_BASE_URL}/static/photos/filename`.

---

## Data model: Event (existing public API, partial admin support)

```
id          integer, PK
name        text, required
description text, nullable
photo       text, nullable — single URL string
date        date, required
start_time  time, required
end_time    time, nullable
address     text, nullable
lat/lng     float, nullable
```

Existing endpoints (auth via `X-API-Key` header, NOT JWT — ignore for admin panel until migrated):
- `GET /events` — public
- `GET /events/{id}` — public
- `POST /events` — API key
- `DELETE /events/{id}` — API key

---

## CORS

Backend allows origins configured via `ADMIN_ORIGIN` env var on the server.
Set `VITE_API_URL` in the React project `.env` to the backend base URL.
React dev server default is `http://localhost:5173` (already configured in backend `.env`).

---

## Error shapes

```json
{ "detail": "Credenciales incorrectas" }   // 401
{ "detail": "Token inválido o expirado" }  // 401
{ "detail": "Lugar no encontrado" }        // 404
```

---

## Implementation order (suggested)

1. Login page → store token → redirect to dashboard
2. Places list table (`GET /admin/places`)
3. Place detail / edit form (`GET` + `PUT /admin/places/{id}`)
4. Photo management (`POST` + `DELETE /admin/places/{id}/photos`)
5. Create place (`POST /admin/places`)
6. Delete place
7. Events management (after backend migrates events auth to JWT)
