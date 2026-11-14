# Hangout App (MVP)

| Folder | What |
| --- | --- |
| `hangout-web/` | React frontend (Vite). Runs on mocks by default; set `VITE_USE_MOCKS=false` to use the API. |
| `hangout-api/` | Java 21 / Spring Boot 3 backend: REST API from SRS section 7, PostgreSQL schema + demo data via Liquibase, plan engine. |
| `Hangout App SRS (MVP).docx` | The requirements. |

## Run everything with Docker

```bash
docker compose up --build
```

| Service | URL |
| --- | --- |
| Web app | http://localhost:3000 |
| API | http://localhost:8080/api/v1 (Swagger UI: http://localhost:8080/swagger-ui.html) |
| Postgres | localhost:5433, db `hangout`, user/password `hangout` |

Sign in with the seeded demo account **demo@hangout.test / password123** (other seed accounts: madina@, daiyrbek@, alikhan@,
dana@, timur@, aigerim@, sam@hangout.test, same password). See `hangout-api/README.md` for configuration and what is stubbed.

## Live deployment (free tiers)

| Piece | Where | URL |
| --- | --- | --- |
| Web app | Vercel (root `hangout-web`, branch `mvp`, env `VITE_USE_MOCKS=false`, `VITE_API_URL`) | https://zimran-project.vercel.app |
| API | Render web service, Docker, root `hangout-api`, free instance | https://hangout-api-hfiy.onrender.com (Swagger: `/swagger-ui.html`) |
| Database | Render free Postgres `hangout-db` (expires Dec 15, 2026 unless upgraded or recreated) | internal |

Notes: the free API instance sleeps after ~15 min idle, so the first request can take up to a minute; open the API URL
before a demo. Uploaded photos live on the instance disk and are lost on redeploy. Pushing to `mvp` redeploys Vercel
automatically; Render deploys manually from its dashboard ("Manual Deploy").
