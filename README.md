# RoomFix — Maintenance Request Management System

RoomFix is a React + TypeScript frontend with a FastAPI backend and SQLite local database.
It supports Admin, Moderator, Resident, and multiple Maintenance Staff accounts.

## Main features

- Resident registration, login, and maintenance request submission.
- Role-based request visibility.
- Admin assignment and Admin-only request deletion to the Recycle Bin.
- Admin Dashboard Recycle Bin list, restore, and permanent-delete actions.
- Maintenance Staff status updates; a rejection reason is required when rejecting.
- Moderator review of requests and staff activity.
- Moderator reassignment of rejected requests to another Maintenance Staff member.
- Assignment/rejection history.
- Multiple staff accounts and responsive dashboard UI.

## Local setup (Windows PowerShell)

### 1. Backend

From the project root:

```powershell
python -m venv backend/.venv
backend/.venv/Scripts/Activate.ps1
pip install -r backend/requirements.txt
python -m uvicorn backend.main:app --reload --port 8000
```

API documentation: http://localhost:8000/api/docs

### 2. Frontend

Open a second terminal:

```powershell
cd frontend
npm ci
npm run dev
```

Open http://localhost:5173.

The Vite development server proxies `/api` requests to `http://localhost:8000`.

## Local demo accounts

The backend seeds these accounts if their email addresses do not already exist:

| Role | Email | Local demo password |
|---|---|---|
| Admin | admin@roomfix.com | admin123 |
| Moderator | moderator@roomfix.com | moderator123 |
| Resident | resident@roomfix.com | resident123 |
| Maintenance Staff 1 | staff@roomfix.com | staff123 |
| Maintenance Staff 2 | staff2@roomfix.com | staff2123 |

These are local coursework/demo credentials only. Change passwords and configure a strong `ROOMFIX_SECRET_KEY` before any shared deployment. Do not commit real credentials or `.env` files.

## Role permissions

- **Admin:** view all active requests, assign staff, manage roles, delete requests to the Recycle Bin, restore, and permanently delete.
- **Moderator:** view active requests and staff activity; reassign rejected requests only. Cannot delete requests or manage Admin accounts.
- **Maintenance Staff:** view assigned requests and update status. Rejection requires a reason.
- **Resident:** create and view only their own requests.

## Database notes

SQLite is used for local development. Startup performs additive migrations for the Recycle Bin and assignment-history tables and seeds missing demo accounts without deleting existing users or requests. Back up `backend/roomfix.db` before replacing project files or running migrations on an important database.

## Production deployment warning

This version is **not ready for Vercel production deployment**. The active backend uses SQLite and intentionally blocks startup on Vercel or when `DATABASE_URL` is configured. A persistent PostgreSQL adapter, production database migrations, and production secrets must be implemented and configured before deploying. The local feature tests do not verify a live Vercel deployment.
