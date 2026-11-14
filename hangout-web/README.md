# Hangout — frontend (MVP)

Website for the Hangout MVP, built from the SRS ("Hangout App: SRS (MVP)").
React 19 + TypeScript + Vite + Tailwind 4. Talks to the Java API (Daiyrbek) over REST.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
```

## Mock API

`VITE_USE_MOCKS=true` (default in `.env.development`) serves the API from `src/mocks` with
Mock Service Worker, so every screen works without the backend. When the Java API is live,
set `VITE_USE_MOCKS=false` and `VITE_API_URL` to its URL.

Everything in the mocks is **fictional demo data**: places, addresses (marked "demo address"),
people, and AI-generated photos made with Higgsfield (`public/demo/`; each venue photo says "AI demo
image"). Never show it in the pitch as real. Mock state is kept in localStorage; reset it with
`localStorage.removeItem('hangout.mock.db.v2')` in the browser console.

| Env var | What it does |
| --- | --- |
| `VITE_USE_MOCKS` | `true` = mock API |
| `VITE_API_URL` | Java API base URL |
| `VITE_TIME_ZONE` | Demo city time zone (all times shown in it) |
| `VITE_DEMO_UPGRADE` | `true` = "Simulate upgrade" button on the Plus page (FR-PAY-3) |
| `VITE_GOOGLE_CLIENT_ID` | Google sign-in client ID (FR-AUTH-6); empty hides the button |

## Structure

| Folder | What lives there |
| --- | --- |
| `src/app` | Router (SRS 8.2), providers, layout (top bar + phone bottom nav), auth guard, theme |
| `src/api` | `client.ts` (fetch, JWT, typed errors), `types.ts` (SRS 7), `hooks.ts` (TanStack Query) |
| `src/mocks` | MSW handlers + fixtures matching SRS 7.2 |
| `src/design` | Base components: Button, Card, Chip, Badge, Field, Input, Textarea, Toggle, Avatar, Stars, Dialog, Menu, EmptyState, Skeleton |
| `src/features/*` | Feature components (search, plans, session, moments, social, billing) |
| `src/pages` | One file per route (SRS 8.2), each loaded as its own chunk |
| `src/lib` | Config, money and time formatting, `cn` helper |

Design tokens (colors, fonts, radius) are in `src/index.css`. Change colors there only.

## Status

All SRS 8.2 pages are built and run on the mock API: landing, sign in / sign up (+ Google when
configured), search, results, plan detail, invite and vote (host + guest), feed, new / edit Moment,
profile (Moments + saved plans), friends, map, place page, Plus, settings.

Endpoints the frontend uses that are not in SRS 7.1 yet (the backend needs them):

| Endpoint | Why |
| --- | --- |
| `GET /moments/{id}` | Edit page and opening a Moment from the map, a profile or a friend badge |
| `POST /moments/{id}/tag/approve`, `/decline` | FR-MOMENT-7 tag approval |
| `POST /users/{id}/block` | FR-SOCIAL-5 block |
| `POST /auth/google` `{idToken}` | FR-AUTH-6, returns our JWT |
| `includePlaceId` in `POST /searches` | FR-MAP-3 "Plan with this place" |
| `start`, `partySize` in the search response | Map and per-person labels |
| `inputs`, `start`, `partySize` in `GET /plans/saved` items | Plan detail page and inviting from a saved plan |
| `place.outdoor`, `stop.rainChancePct` | FR-RESULT-13 rain warning |
| `402` from `POST /plans/{id}/save` for Free users | Saved plans are Plus (SRS 2.2) |
