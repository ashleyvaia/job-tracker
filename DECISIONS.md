# Design Decisions

A running log of non-obvious choices made in this project and why, grouped by domain.

---

## Data modeling & schema

### Enforcing `status` enumeration at the application layer as a Python `Enum` class
To do so at the database layer (the stricter approach) would address invalid status insertion that could occur via raw SQL inserts or bugs that bypass the ORM, but with the added complexity of making a `ALTER TYPE` migration should new statuses (i.e., 'ghosted') be introduced in future versions. Because the practical risk of such events are low, especially for a project of this scale, the more-flexible app-layer approach is implemented here.

### `user_id` as a "soft" foreign key, not a real relational FK
`Application.user_id` is a plain string column, not a database-enforced foreign key, since there's no local users table to reference: Clerk owns identity, not this database. A real FK would mean mirroring Clerk's users locally just to satisfy a constraint, extra complexity for data this app doesn't actually own. The correctness a FK would normally guarantee is already provided upstream: `user_id` always comes from `get_current_user`, extracted from a Clerk-verified JWT, never from client input. Same tradeoff shape as the `status` enum decision above: a FK could still catch a bug that bypasses the ORM entirely, but accepted as a low-probability risk at this scale.

### `ApplicationUpdate` as PATCH-style partial update over PUT-style full replace
Making all fields optional upon updating an application was chosen to match realistic frontend usage, i.e., when a user edits an application's status without having to resend the entire form.

### Separate `ApplicationCreate/Update/Read` schemas for API requests and responses
A distinction is made between the model of an application that is stored in the database and schemas of said application that dictate how clients can send/receive over the API. This prevents clients from potentially setting fields in the raw model that should only be calculated by server logic.

### `url` field uses Pydantic's `HttpUrl` instead of `str` to reject malformed URLs at the API boundary
Testing the link-checker revealed that application URLs without protocols (e.g. missing `https://`) were being accepted into the database with no validation. Switching the field's type to `HttpUrl` closes that gap, but results in a rich `HttpUrl` object in the route code that `psycopg` can't adapt to directly, so an explicit `str()` conversion is additionally made in `create_application`'s constructor and `update_application`'s generic `setattr` loop before being handed to the SQLAlchemy model.

### Interview rounds represented as a simple `int` over an `InterviewRound` table with FK
`interview_round` is a plain `int` column on `Application`, not a separate table with a foreign key back to it. A relational table would be the more "correct" model if interview rounds ever needed their own data (dates, interviewer names, per-round notes), but that complexity wasn't worth building before the core CRUD loop even worked. Deferred as a deliberate v2 feature.

### Cut the status-history table + Sankey diagram from the dashboard scope
A true Sankey diagram needs a record of every status transition an application went through (applied → interviewing → rejected, etc.), not just its current status, which would require a new history table plus changes to both `create_application` and `update_application` to log every transition. This was roughly as much work as the rest of the dashboard combined, so it was scoped out in favor of the status breakdown view already built, which covers similar ground without the added history data.

### Semantic parity with existing streak logic features
If a user hasn't yet logged an application today, their streak isn't broken, only "grayed out." Only after a full day has passed with no applications logged does the user's streak break.

## API design & security

### Avoid information disclosure after per-user scoped routing
In an instance where a signed-in user requests data that exists that they are not privileged to (i.e., another user's existing row in the database), a `404 Not Found` response over a more-informative `403 Forbidden` prevents data enumeration and leakage to malicious actors.

## Architecture & infrastructure

### Sync `def`, not `async def`, for `get_db`/route handlers
`get_current_user` and every route in `applications.py` and `dashboard.py` are plain `def`, not `async def`, because they call SQLAlchemy's synchronous engine (`create_engine`), whose calls are blocking and can't be `await`ed. Plain `def` routes get FastAPI's automatic thread-pool handling for free — the blocking call runs in a separate thread, not on the event loop, so other requests keep being handled concurrently. Marking these `async def` would remove that safety net: FastAPI would run the blocking call directly on the event loop, and since nothing inside is actually awaitable, it would stall the entire event loop until that one call finished, blocking every other request too.

### Standalone script, not an in-app scheduled job, for the link-checker
`link_checker.py` runs as a separate process, decoupled from the live web server, rather than as a background job inside the FastAPI app. This matches how it'll eventually run in deployment, via a platform-level cron feature, and keeps the checker's failure modes (a slow or hung request to some external job listing) from ever affecting the live API.

### Async `httpx`, not sync `requests`, for the link-checker
Checking many application URLs is I/O-bound work—the checker spends most of its time waiting on network responses, not doing CPU work—which is the actual justified case for `async`/`await` in this project, unlike the FastAPI routes above. `asyncio.gather` lets every URL check run concurrently instead of sequentially, so total runtime is closer to the slowest single request than the sum of all of them.

## Link-checker / staleness detection

### Staleness detection with keyword regex, not LLM
Chose a short list of keywords and phrases to check against to reduce false positives, though there still exists closures that the checker will miss with this approach. LLM-based detection could be implemented in future versions to close that gap.

### `days_since_applied` / `likely_stale` as Pydantic `computed_field`s, not stored columns
The URL checker (404, redirect, keyword match) can't catch a listing that's still live and unchanged but quietly old: there's no reliable, standardized way to scrape a posting's actual publish date across arbitrary sites. Sidestepped that by using `date_applied` instead: `likely_stale` is a 14-day-since-applied-with-no-status-change heuristic, deliberately more aggressive than a "safer" 30-day threshold, to nudge toward continuing to apply elsewhere rather than waiting on applications that probably went nowhere. Computed at response time, not stored, because nothing needs to filter or query by it in SQL yet, and computing it live means it's always accurate with no migration required.
