# Shrihari_engineering_portfolio

Vite + React + TypeScript portfolio (`frontend/`) and FastAPI + PostgreSQL + S3-compatible storage backend (`backend/`) with a private resume-management dashboard.

```
frontend/   Vite app: public site + lazy-loaded /admin area     backend/   FastAPI, SQLAlchemy 2, Alembic, tests
docs/UI_GUIDE.md   every section, card, button, dropdown, slider and how to change it
```

## 1. Run it locally (about 5 minutes, no Docker needed)

Requirements: **Node 20.19+** (22 recommended), **Python 3.11+**.

```bash
# --- Terminal 1: backend ---
cd backend
python3 -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example .env                                  # defaults work as-is: SQLite + local file storage
alembic upgrade head                                     # creates the tables
python -m app.cli create-admin --email you@example.com   # prompts for a password (12+ chars)
uvicorn app.main:app --reload --port 8000                # API docs: http://localhost:8000/api/docs

# --- Terminal 2: frontend ---
cd frontend
npm install
npm run dev                                              # http://localhost:5173
```

The Vite dev server proxies `/api` to port 8000, so cookies are same-origin and nothing else needs configuring.

### See it work
1. Open http://localhost:5173. The **Resumes** section says a public resume will be available soon (no fake buttons).
2. Open http://localhost:5173/admin and sign in. (Logged out, every `/admin/*` page redirects to login and every admin API returns 401.)
3. **Upload** a PDF: choose a category, version, then **Save draft** or **Publish**.
4. Reload the public site: the **Resumes** dropdown and the hero **Download resume** button appear only after publishing.
5. In **Resumes**: unpublish (public download immediately returns 404), mark default (star), edit, replace (keep previous version or overwrite), view history, archive, delete (confirmation dialog).
6. Verify access control: `curl -i localhost:8000/api/admin/resumes` returns 401; `curl -i localhost:8000/api/public/resumes/<draft-id>/download` returns 404.

### Optional: production-like local stack (PostgreSQL + MinIO)
```bash
docker compose up -d
# in backend/.env
DATABASE_URL=postgresql://portfolio:portfolio@localhost:5432/portfolio
STORAGE_BACKEND=s3
OBJECT_STORAGE_ENDPOINT=http://localhost:9000
OBJECT_STORAGE_BUCKET=resumes
OBJECT_STORAGE_ACCESS_KEY=minioadmin
OBJECT_STORAGE_SECRET_KEY=minioadmin
OBJECT_STORAGE_REGION=us-east-1
alembic upgrade head
```

> **Local and production are separate.** Files uploaded on your laptop live in your local storage/database only. They never appear on the deployed site; upload again through the deployed `/admin`.

## 2. Tests and builds
```bash
cd backend  && pytest -q                    # 20 tests: auth, CSRF, validation, publish rules, replace, cleanup, CORS, migration
cd frontend && npm test                     # 12 tests: render + interaction of the real components
cd frontend && npm run build                # type-check + production build into dist/
```

## 3. Deploy

### Object storage (Cloudflare R2 shown; S3 works the same)
1. Create a **private** bucket (e.g. `resumes`). Do not enable public access.
2. Create an API token with read/write on that bucket. Note the endpoint `https://<account>.r2.cloudflarestorage.com`, access key and secret.

### Railway (backend)
1. New project, **Deploy from GitHub repo**, root directory `backend` (a `Dockerfile` and `railway.json` are included). Add the **PostgreSQL** plugin.
2. Variables:

| Variable | Value |
|---|---|
| `APP_ENV` | `production` |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (`postgres://` is converted automatically) |
| `SESSION_SECRET` | output of `python -c "import secrets;print(secrets.token_urlsafe(48))"` |
| `FRONTEND_ORIGIN` | `https://your-site.vercel.app` (comma-separate extra origins) |
| `COOKIE_SAMESITE` | `lax` (with the Vercel proxy below) |
| `STORAGE_BACKEND` | `s3` |
| `OBJECT_STORAGE_ENDPOINT / BUCKET / REGION / ACCESS_KEY / SECRET_KEY` | from your provider (`REGION=auto` for R2) |
| `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD` | one-time bootstrap (see below) |

3. Migrations run automatically on every start (`alembic upgrade head` in the container command; idempotent).
4. The app **refuses to start in production** with a weak `SESSION_SECRET`, SQLite, or local-disk storage, so files can never silently land on an ephemeral disk.

**Creating the first admin.** Set `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD` (12+ chars) for the first deploy. The admin is created only when no admin exists. Then **delete `INITIAL_ADMIN_PASSWORD`** from Railway. Alternative: `railway run python -m app.cli create-admin --email you@example.com` (interactive prompt, nothing in env).

### Vercel (frontend)
1. Import the repo, root directory `frontend`, framework Vite (`npm run build`, output `dist`).
2. Edit `frontend/vercel.json`: replace `YOUR-RAILWAY-APP.up.railway.app` with your Railway domain. This rewrites `/api/*` to Railway so the browser sees **one origin** (cookies stay first-party and are not blocked by browsers) and all other paths fall back to `index.html` for SPA routing.
3. Leave `VITE_API_BASE_URL` unset. (Only set it, e.g. `https://api.example.com/api`, if you skip the proxy; then also set Railway `COOKIE_SAMESITE=none` and expect some browsers to block third-party cookies.)

### First production run
Visit `https://your-site.vercel.app/admin`, sign in, upload and publish resumes, then check the public **Resumes** section.

## 4. Security design
- **Passwords:** Argon2id. No registration endpoint. Unknown-user logins still do a hash verification (no timing oracle). Login: 5 attempts per 15 minutes per IP (in-memory; use Redis if you ever run multiple instances).
- **Sessions:** signed cookie, `HttpOnly`, `Secure` in production, `SameSite=Lax`, 8-hour expiry. The session is bound to the password hash, so changing/rotating the password signs out every session.
- **CSRF:** every non-GET admin request needs `X-CSRF-Token` equal to the token in the signed session (returned by `/auth/me`, kept in memory only; nothing in localStorage).
- **Authorisation:** one `admin_guard` dependency on every admin endpoint. UI hiding is cosmetic.
- **Uploads:** extension + declared MIME + magic bytes (`%PDF-`; DOCX must be a valid zip containing `word/document.xml`) + size cap (`MAX_UPLOAD_SIZE_BYTES`, default 10 MB, streamed so oversize bodies are cut off). Storage keys are random UUIDs; display filenames are sanitised. Only PDFs can be published. Files are **not** malware-scanned.
- **Downloads:** streamed through the API only after checking `visibility == published` (public) or admin auth. Drafts/archived return 404. `Cache-Control: no-store`, so unpublishing takes effect immediately. The bucket is never listed or exposed; no storage keys or credentials appear in any response.
- **Credential rotation:** Settings page → Change password, or `python -m app.cli set-password --email you@example.com`. Rotate `SESSION_SECRET` to sign everyone out. Rotate storage keys in the provider and update the Railway variables.

### Failure behaviour
| Situation | Behaviour |
|---|---|
| PostgreSQL down | `/api/health/ready` returns 503; API calls fail with a generic 500; public site shows "resumes temporarily unavailable". |
| Object storage down on upload | 503, nothing saved. |
| Upload OK but DB save fails | The new object is deleted (tested); no orphan. |
| Delete | DB row removed first, then the object; if the object delete fails it is logged as an orphan and can be removed by hand. |
| Published file missing from storage | Public download returns 503 "temporarily unavailable"; metadata remains so you can re-upload. |
| Default resume archived/unpublished | The default flag is cleared; the public selector falls back to the newest published version. |
| Replace | Default is **keep previous** (new draft version in the same series). Overwrite is explicit and deletes the old object only after the DB commit succeeds. |
| Expired session | 401; the UI returns to login. (No signed URLs are used, so there are none to expire.) |

## 5. Remaining setup (things only you can do)
- Create the R2/S3 bucket and keys; set Railway and Vercel variables; edit `vercel.json` with your Railway domain.
- Create the first admin and upload/publish your resumes **in production**.
- Re-check the AttriShield demo link (my sandbox could not reach it; the four GitHub repositories returned HTTP 200).
- Add repository links for Screen Supremacy and Sleep Alert if you make them public, and RAGAS scores for CarnaticPrep when finished (edit `frontend/src/data/projects.ts`).
- Optional: add ESLint/Prettier, a malware-scanning step for uploads, and Redis-backed rate limiting.

## 6. Known limitations
- Verified here: backend pytest (incl. real Alembic migration on SQLite), frontend type-check, production build, component tests (jsdom) and a live API run through the Vite proxy. **Not verified here:** PostgreSQL and S3/R2/MinIO against live services, Vercel/Railway deployment, and visual/browser rendering. Treat the first deployment as the real integration test.
- Contact form uses `mailto:` (no email backend), and says so.

### Public role-specific resumes

Four role-specific PDF resumes are served as static files from `frontend/public/resumes/` and shown in the public **Role-specific resumes** section. Each resume card has a browser preview and a download link, so the section works without uploading files through the admin dashboard or configuring the resume API.

- Software Engineering
- Backend Engineering
- Generative AI Engineering
- AI / ML & Data Science

To replace a resume later, keep its filename the same and replace the corresponding PDF in `frontend/public/resumes/`.
