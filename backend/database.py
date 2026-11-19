import os
import sqlite3
from pathlib import Path

# ==========================================
# DATABASE CONFIGURATION
# ==========================================

if os.getenv("DATABASE_URL"):
    raise RuntimeError("DATABASE_URL is configured, but this codebase currently supports SQLite only. Configure a PostgreSQL adapter before production deployment.")
if os.getenv("VERCEL") == "1":
    raise RuntimeError("SQLite on Vercel /tmp is ephemeral and will lose data. Configure a persistent hosted database before deployment.")
DB_PATH = Path(os.getenv("ROOMFIX_DB_PATH", str(Path(__file__).resolve().parent / "roomfix.db")))


def get_connection():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(
        str(DB_PATH),
        timeout=30
    )
    conn.row_factory = sqlite3.Row
    return conn


# ==========================================
# INITIALIZE DATABASE
# ==========================================

def init_db():
    conn = get_connection()

    try:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS rooms (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                room_number TEXT UNIQUE NOT NULL,
                status TEXT NOT NULL DEFAULT 'available'
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS maintenance_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                location TEXT NOT NULL,
                priority TEXT NOT NULL
                    CHECK(priority IN ('low','medium','high')),
                status TEXT NOT NULL DEFAULT 'pending'
                    CHECK(status IN (
                        'pending','assigned','in_progress',
                        'completed','rejected'
                    )),
                created_by INTEGER NOT NULL REFERENCES users(id),
                assigned_staff INTEGER REFERENCES users(id),
                rejection_reason TEXT,
                is_deleted INTEGER NOT NULL DEFAULT 0,
                deleted_at TEXT,
                deleted_by INTEGER REFERENCES users(id),
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS assignment_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                request_id INTEGER NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
                from_staff INTEGER REFERENCES users(id),
                to_staff INTEGER NOT NULL REFERENCES users(id),
                assigned_by INTEGER NOT NULL REFERENCES users(id),
                action TEXT NOT NULL DEFAULT 'assigned',
                note TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Safe additive migration for databases created by earlier RoomFix versions.
        columns = {row[1] for row in conn.execute("PRAGMA table_info(maintenance_requests)").fetchall()}
        for name, definition in {
            "rejection_reason": "TEXT",
            "is_deleted": "INTEGER NOT NULL DEFAULT 0",
            "deleted_at": "TEXT",
            "deleted_by": "INTEGER REFERENCES users(id)",
        }.items():
            if name not in columns:
                conn.execute(f"ALTER TABLE maintenance_requests ADD COLUMN {name} {definition}")

        conn.commit()

    finally:
        conn.close()


# ==========================================
# SEED DATABASE
# ==========================================

def seed_db():
    try:
        from backend.auth import hash_password
    except ModuleNotFoundError:
        from auth import hash_password

    conn = get_connection()

    try:
        users = [
            ("Admin User", "admin@roomfix.com", "admin123", "admin"),
            ("Manager User", "manager@roomfix.com", "manager123", "manager"),
            ("Resident User", "resident@roomfix.com", "resident123", "resident"),
            ("Maintenance Staff", "staff@roomfix.com", "staff123", "maintenance_staff"),
            ("Moderator User", "moderator@roomfix.com", "moderator123", "moderator"),
            ("Maintenance Staff 2", "staff2@roomfix.com", "staff2123", "maintenance_staff"),
        ]

        for name, email, password, role in users:
            existing = conn.execute(
                "SELECT id FROM users WHERE email = ?",
                (email,)
            ).fetchone()

            if existing is None:
                conn.execute(
                    """
                    INSERT INTO users (name, email, password, role)
                    VALUES (?, ?, ?, ?)
                    """,
                    (name, email, hash_password(password), role)
                )

        rooms = [
            ("101", "available"),
            ("102", "occupied")
        ]

        for room_number, status in rooms:
            conn.execute(
                """
                INSERT OR IGNORE INTO rooms (room_number, status)
                VALUES (?, ?)
                """,
                (room_number, status)
            )

        conn.commit()

    finally:
        conn.close()
