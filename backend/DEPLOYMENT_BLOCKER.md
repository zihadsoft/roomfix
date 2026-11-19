Vercel deployment is intentionally blocked in this intermediate upgrade.
The application currently uses sqlite3. SQLite files in Vercel's /tmp are ephemeral and do not provide persistent production data. Configure a hosted PostgreSQL database and implement a PostgreSQL adapter/migrations before deployment. The startup code now raises an explicit error rather than silently losing user requests after restarts.

Local demo accounts added by the RoomFix role/reassignment upgrade:
- Moderator: moderator@roomfix.com (local demo password: moderator123)
- Second maintenance staff: staff2@roomfix.com (local demo password: staff2123)

These seeded credentials are for local coursework/demo use only. Change them before any shared or production deployment. The project still uses SQLite and is not Vercel-production-ready until a persistent PostgreSQL adapter and migrations are implemented.
