# RoomFix upgrade status

## Implemented in this upgrade patch

1. Added the `moderator` user role while retaining the legacy `manager` role for existing data.
2. Added local demo Moderator and second Maintenance Staff accounts through idempotent database seeding.
3. Added an `assignment_history` table using an additive SQLite migration.
4. Added rejection reason validation for Maintenance Staff.
5. Added Admin/Moderator request visibility and Moderator-only reassignment of rejected requests.
6. Added assignment/rejection history endpoints for Admin and Moderator review.
7. Kept request deletion, Recycle Bin, restore, and permanent deletion restricted to Admin. Added Admin Dashboard delete, Recycle Bin, restore, and permanent-delete actions.
8. Updated the frontend to display Moderator requests, staff activity, reassignment controls, rejection reasons, summary cards, and a lighter responsive visual theme.
9. Added a role-aware Admin user list and Moderator staff-only user list.

## Local demo accounts

- Admin: `admin@roomfix.com` (existing local demo password: `admin123`)
- Moderator: `moderator@roomfix.com` (local demo password: `moderator123`)
- Maintenance Staff 1: `staff@roomfix.com` (existing local demo password: `staff123`)
- Maintenance Staff 2: `staff2@roomfix.com` (local demo password: `staff2123`)
- Resident: `resident@roomfix.com` (existing local demo password: `resident123`)

These are local coursework/demo credentials only. Change them before any shared or production deployment.

## Validation

- Python backend modules compile successfully.
- API workflow tests passed in an isolated temporary SQLite database: demo logins, resident request creation, Admin assignment, staff rejection with reason, Moderator reassignment to second staff, assignment history, and Admin-only delete enforcement.
- Existing SQLite database startup migration still needs to be verified on the user's machine with a backup first.
- Frontend production build could not be run in this Linux validation environment because the uploaded `node_modules` contains Windows-specific optional binaries. Run `npm ci` and `npm run build` on the user's Windows machine.

## Remaining limitations

- JWT refresh-token rotation and server-side session revocation are not implemented.
- Fine-grained group/team permissions are not implemented.
- Alembic migrations are not implemented; the active app still uses additive SQLite startup migrations.
- PostgreSQL adapter is not implemented. Vercel production deployment remains blocked because SQLite persistence is not suitable for serverless production.
