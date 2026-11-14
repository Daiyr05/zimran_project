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
