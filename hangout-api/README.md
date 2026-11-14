# Hangout — backend (MVP)

Java 21 · Spring Boot 3.5 · PostgreSQL 16 · Liquibase · JWT · springdoc-openapi · Docker.
Implements the REST contract in "Hangout App: SRS (MVP)" section 7, which the React app in `../hangout-web` calls.

## Run with Docker (recommended)

```bash
docker compose up --build
```

- API: http://localhost:8080/api/v1 · Swagger UI: http://localhost:8080/swagger-ui.html · health: http://localhost:8080/health
- Postgres on `localhost:5433` (`hangout` / `hangout`), schema and demo data applied by Liquibase on first start.
- Uploaded photos live in the `hangout-uploads` volume and are served at `/uploads/{name}`.

Then point the web app at it: in `hangout-web/.env.development` set `VITE_USE_MOCKS=false` (the API URL is already `http://localhost:8080/api/v1`).
The project-root `docker-compose.yml` runs the database, the API and a production build of the web app together.

## Run locally (no Docker for the API)

Needs JDK 21+ and a Postgres. The compose file's `db` service works: `docker compose up db`.

```bash
./mvnw spring-boot:run        # or: mvn spring-boot:run
```

Configuration is in `src/main/resources/application.yml`; every secret is an env var (`DB_URL`, `DB_USER`, `DB_PASSWORD`,
`JWT_SECRET`, `PUBLIC_URL`, `FRONTEND_URL`, `CORS_ORIGINS`, `DEMO_UPGRADE`, `GOOGLE_CLIENT_ID`, `GOOGLE_PLACES_API_KEY`, `STRIPE_SECRET_KEY`).

## Demo data (Liquibase)

`src/main/resources/db/changelog/`:

| Changeset | Contents |
| --- | --- |
| `001-schema.sql` | SRS section 6 tables |
| `002-seed-places.sql` | 62 fictional places in the demo city (East Village, New York) + 20 stay-in ideas, with mood scores (SRS 5.2) |
| `003-seed-users-moments.sql` | 8 demo people, friendships and 26 Moments |

Every seed account's password is `password123`. The main demo account is **demo@hangout.test** (username `zhandaulet`), friends with
Madina, Daiyrbek and Alikhan; Dana has sent a request; one from Aigerim is pending. The 12 venues the web app has photos for
(`hangout-web/public/demo`) are seeded with those photo paths; the rest have no photo.

## What is and isn't wired to real services

| Area | Status |
| --- | --- |
| Places / travel time | Seed mode (FR-DATA-3) + fallback travel formula (FR-DATA-4). `hangout.google.enabled=false`; `RoutesClient` is the hook for Google Routes. |
| Geocoding a typed address | Not available without Google: a typed address resolves to the user's home location (demo city center); the label is kept. |
| Weather (FR-RESULT-13) | Not implemented; `rainChancePct` is always null. |
| Stripe (FR-PAY-2) | `POST /billing/checkout` returns 502 until a key and the Checkout call are added. `POST /billing/demo-upgrade` (FR-PAY-3) works behind `DEMO_UPGRADE=true`. |
| Google sign-in (FR-AUTH-6) | Works when `GOOGLE_CLIENT_ID` is set (token verified with Google's tokeninfo endpoint). |
| Rate limiting (NFR-SEC-4) | Not implemented. |
| Photo storage | Local disk / Docker volume, EXIF stripped by re-encoding (JPEG/PNG). Swap `UploadService` for S3 later. |

## Layout

```
com.hangout.api
├── auth      register / login / Google, JWT
├── user      users, /me, profiles, search, block
├── friend    requests, accept/decline, remove, block
├── place     cached places, mood scores, opening hours, autocomplete, place page
├── engine    the plan engine (SRS 5): filters, score, shapes, timeline, cost, reasons
├── search    POST /searches, shuffle, swap, save, saved plans
├── session   invite links, private inputs, blending (5.6), votes, close, .ics
├── moment    Moments, feed, map pins, uploads, reports, tags
├── billing   Plus: checkout stub, webhook, demo upgrade
└── config    security, CORS, OpenAPI, properties
```

Tests: `mvn test` runs engine unit tests for scoring, shapes, cost (SRS 5.3–5.7).
