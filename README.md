# Job Tracker

Built to address two things that make job searching frustrating: no centralized place to track application status across different job boards and company portals, and no way to know when a position has been filled after applying, since most companies never send a rejection email. It also encourages a sustained job application habit with a Duolingo-style "streak" feature.

**Live demo:** https://job-tracker-omega-tan.vercel.app/

![Dashboard view](./docs/screenshot-dashboard.png)
![Sign-in screen](./docs/screenshot-signin.png)

## Features

**Application tracking**
- Add, edit, and delete applications, with company, role, location, notes, a clickable link to the original listing, and the date applied
- Track status (applied, interviewing, offer, rejected, ghosted, withdrawn) with a quick inline dropdown

**Dashboard & analytics**
- Stale rate, ghost rate, and response rate, calculated from your actual application data
- Status breakdown across all six statuses
- Applications-per-week chart
- Days since your last application
- A Duolingo-style application streak: counts consecutive days you've applied, "grayed out" (not yet broken) if today's application hasn't been logged yet

**Staleness detection**
- A manually-run link-checker script flags applications whose listing appears closed, redirected, or dead (404, redirect to a different domain, or closure-related keywords on the page)

**Auth & security**
- Authentication via Clerk, with every route scoped to the signed-in user

## Tech stack

**Frontend**
- React 19 + TypeScript, built with Vite
- Tailwind CSS 4
- Chart.js (via react-chartjs-2) for the weekly applications chart
- Clerk (`@clerk/react`) for authentication

**Backend**
- FastAPI (Python)
- SQLAlchemy 2.0 (async-style models, sync engine)
- Alembic for database migrations
- Clerk (`clerk-backend-api`) for token verification
- httpx + BeautifulSoup for the async link-checker script
- pytest for the test suite

**Infrastructure**
- Postgres (Supabase, production; Docker locally)
- Backend hosted on Render
- Frontend hosted on Vercel

Clerk handles authentication instead of a hand-rolled solution: relying on a tested, widely-used auth provider avoids the risk of accidentally exposing user data through a mistake in custom auth code. FastAPI was a natural fit for the backend given prior Python experience, and it comes with async support, Pydantic-based request validation, and automatic OpenAPI docs out of the box. The production database runs on Supabase rather than Render's own Postgres add-on, since Render's free-tier databases are deleted after 30 days of use, while Supabase's free tier persists indefinitely (it pauses after a period of inactivity rather than deleting data).

## Architecture

```mermaid
flowchart LR
    Browser["Browser"]
    Vercel["Frontend\n(React + Vite, on Vercel)"]
    Render["Backend\n(FastAPI, on Render)"]
    Supabase["Postgres\n(Supabase)"]
    Clerk["Clerk\n(Auth)"]
    Checker["link_checker.py\n(run manually, not in the request path)"]

    Browser --> Vercel
    Vercel -- "REST + Clerk bearer token" --> Render
    Vercel -. "sign-in / sign-up UI" .-> Clerk
    Render -- "verify token" --> Clerk
    Render -- "SQLAlchemy, scoped to current_user" --> Supabase
    Checker -- "reads/updates is_stale" --> Supabase
```

## Local setup

### Prerequisites
- Node.js and npm
- Python 3.13
- Docker (for local Postgres)
- A [Clerk](https://clerk.com) account (free tier is fine) for your own dev API keys

### 1. Clone and start the database

```bash
git clone https://github.com/ashleyvaia/job-tracker.git
cd job-tracker
docker compose up -d
```

### 2. Backend setup

```bash
cd backend
python -m venv venv
./venv/Scripts/activate   # Windows; use `source venv/bin/activate` on macOS/Linux
pip install -r requirements.txt
```

Create `backend/.env` (see `backend/.env.example`):

```
DATABASE_URL=postgresql+psycopg://jobtracker:jobtracker_dev_password@localhost:5433/jobtracker
CLERK_SECRET_KEY=your_clerk_secret_key
```

Run migrations, then start the server:

```bash
alembic upgrade head
uvicorn app.main:app
```

Backend runs at `http://localhost:8000`.

### 3. Frontend setup

```bash
cd frontend
npm install
```

Create `frontend/.env` (see `frontend/.env.example`):

```
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_API_URL=http://localhost:8000
```

```bash
npm run dev
```

Frontend runs at `http://localhost:5173`.

### 4. (Optional) Run the link-checker

From `backend/`, with the venv active:

```bash
python -m scripts.link_checker
```

Checks every stored application's URL and flags likely-stale listings.

## Testing

Tests run against a separate database. Create it once, then run the suite:

```bash
docker exec job_tracker-db-1 psql -U jobtracker -d jobtracker -c "CREATE DATABASE jobtracker_test;"
cd backend
python -m pytest tests/ -v
```

The suite covers auth enforcement, per-user data isolation, the streak
calculation (including edge cases), input validation, and partial-update
correctness. Tests run against a separate `jobtracker_test` Postgres
database, not your real data.

## Design decisions

Non-obvious design choices — and the reasoning and rejected alternatives
behind them — are documented in [`DECISIONS.md`](./DECISIONS.md).

## What's next

- **Status history + Sankey diagram.** A true Sankey needs a record of every status transition an application went through, not just its current status, which means a new history table and changes to both the create and update routes to log every transition. This was scoped out in favor of the status breakdown view already built, which covers similar ground ("where do things stand") without the added schema and query complexity. See `DECISIONS.md` for the full reasoning.
- **LLM-based staleness detection.** The current link-checker uses a fixed list of keywords/phrases to detect closed listings, which misses closures phrased in ways the regex doesn't anticipate. An LLM-based check could catch more of these, at the cost of added latency and cost per check.
