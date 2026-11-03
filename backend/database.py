import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "roomfix.db"

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

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

        conn.commit()
    finally:
        conn.close()


def seed_db():
    from backend.auth import hash_password

    conn = get_connection()
    try:
        users = [
            ("Admin User", "admin@roomfix.com", "admin123", "admin"),
            ("Manager User", "manager@roomfix.com", "manager123", "manager"),
            ("Resident User", "resident@roomfix.com", "resident123", "resident"),
        ]

        for name, email, password, role in users:
            existing = conn.execute(
                "SELECT id FROM users WHERE email = ?", (email,)
            ).fetchone()

            if existing is None:
                conn.execute(
                    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
                    (name, email, hash_password(password), role)
                )

        rooms = [("101", "available"), ("102", "occupied")]

        for room_number, status in rooms:
            conn.execute(
                "INSERT OR IGNORE INTO rooms (room_number, status) VALUES (?, ?)",
                (room_number, status)
            )

        conn.commit()
    finally:
        conn.close()        