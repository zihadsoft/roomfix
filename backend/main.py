from contextlib import asynccontextmanager
from sqlite3 import IntegrityError
from typing import Annotated, Literal

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field

from backend.auth import (
    create_access_token,
    decode_access_token,
    verify_password,
)
from backend.database import get_connection, init_db, seed_db
from backend.models import LoginRequest, User, UserRole

# ==========================================
# 1. DATABASE LIFESPAN
# ==========================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    seed_db()
    yield


# ==========================================
# 2. FASTAPI APPLICATION
# ==========================================

app = FastAPI(
    title="RoomFix API",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()


# ==========================================
# 3. HEALTH CHECK API
# ==========================================

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "message": "RoomFix API is running",
    }


# ==========================================
# 4. ROOMS API - SQLITE
# ==========================================

@app.get("/api/rooms")
def get_rooms():
    conn = get_connection()

    try:
        rows = conn.execute(
            """
            SELECT id, room_number, status
            FROM rooms
            ORDER BY id
            """
        ).fetchall()

        return [dict(row) for row in rows]

    finally:
        conn.close()


# ==========================================
# 5. GET CURRENT LOGGED-IN USER
# ==========================================

def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials,
        Depends(security),
    ],
):
    try:
        payload = decode_access_token(
            token=credentials.credentials
        )

        if not isinstance(payload, dict) or not payload.get("sub"):
            raise HTTPException(
                status_code=401,
                detail="Invalid token",
            )

        return payload

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
        ) from exc


CurrentUser = Annotated[
    dict,
    Depends(get_current_user),
]


# ==========================================
# 6. LOGIN API - SQLITE
# ==========================================

@app.post("/api/login")
def login(data: LoginRequest):
    conn = get_connection()

    try:
        row = conn.execute(
            """
            SELECT name, email, password, role
            FROM users
            WHERE email = ?
            """,
            (data.email,),
        ).fetchone()

        user = dict(row) if row else None

    finally:
        conn.close()

    if not user or not verify_password(
        data.password,
        hashed_password=user["password"],
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    token = create_access_token(
        data={
            "sub": user["email"],
            "role": user["role"],
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user["role"],
        "name": user["name"],
    }


# ==========================================
# 7. USERS API - ADMIN ONLY
# ==========================================

@app.get("/api/users", response_model=list[User])
def get_users(payload: CurrentUser):
    if payload.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required",
        )

    conn = get_connection()

    try:
        rows = conn.execute(
            """
            SELECT id, name, email, role
            FROM users
            ORDER BY id
            """
        ).fetchall()

        return [
            User(
                id=row["id"],
                name=row["name"],
                email=row["email"],
                role=UserRole(row["role"]),
            )
            for row in rows
        ]

    finally:
        conn.close()


# ==========================================
# 8. PROFILE API
# ==========================================

@app.get("/api/profile")
def profile(payload: CurrentUser):
    return {
        "email": payload.get("sub"),
        "role": payload.get("role"),
    }


# ==========================================
# 9. ADMIN ONLY API
# ==========================================

@app.get("/api/admin")
def admin_only(payload: CurrentUser):
    if payload.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required",
        )

    return {
        "message": "Welcome Admin",
        "permission": "full_access",
    }


# ==========================================
# 10. ADMIN OR MANAGER API
# ==========================================

@app.get("/api/management")
def management_access(payload: CurrentUser):
    if payload.get("role") not in ["admin", "manager"]:
        raise HTTPException(
            status_code=403,
            detail="Manager or Admin access required",
        )

    return {
        "message": "Management access granted",
        "role": payload.get("role"),
    }


# ==========================================
# 11. RESIDENT AREA API
# ==========================================

@app.get("/api/resident")
def resident_access(payload: CurrentUser):
    if payload.get("role") not in [
        "admin",
        "manager",
        "resident",
    ]:
        raise HTTPException(
            status_code=403,
            detail="Access denied",
        )

    return {
        "message": "Resident area access granted",
        "role": payload.get("role"),
    }


# ==========================================
# 12. ROOM CRUD OPERATIONS
# ==========================================

RoomStatus = Literal["available", "occupied"]


class RoomCreate(BaseModel):
    room_number: str = Field(min_length=1)
    status: RoomStatus = "available"


class RoomUpdate(BaseModel):
    room_number: str | None = Field(
        default=None,
        min_length=1,
    )
    status: RoomStatus | None = None


# ==========================================
# 13. MANAGEMENT PERMISSION
# ==========================================

def require_management(payload: CurrentUser):
    if payload.get("role") not in ["admin", "manager"]:
        raise HTTPException(
            status_code=403,
            detail="Admin or Manager access required",
        )

    return payload


ManagementUser = Annotated[
    dict,
    Depends(require_management),
]


# ==========================================
# 14. CREATE ROOM
# ==========================================

@app.post("/api/rooms", status_code=201)
def create_room(
    room: RoomCreate,
    payload: ManagementUser,
):
    conn = get_connection()

    try:
        cursor = conn.execute(
            """
            INSERT INTO rooms (room_number, status)
            VALUES (?, ?)
            """,
            (room.room_number, room.status),
        )

        conn.commit()

        return {
            "id": cursor.lastrowid,
            "room_number": room.room_number,
            "status": room.status,
        }

    except IntegrityError as exc:
        raise HTTPException(
            status_code=409,
            detail="Room number already exists",
        ) from exc

    finally:
        conn.close()


# ==========================================
# 15. READ SINGLE ROOM
# ==========================================

@app.get("/api/rooms/{room_id}")
def get_single_room(room_id: int):
    conn = get_connection()

    try:
        row = conn.execute(
            """
            SELECT id, room_number, status
            FROM rooms
            WHERE id = ?
            """,
            (room_id,),
        ).fetchone()

        if row is None:
            raise HTTPException(
                status_code=404,
                detail="Room not found",
            )

        return dict(row)

    finally:
        conn.close()


# ==========================================
# 16. UPDATE ROOM
# ==========================================

@app.put("/api/rooms/{room_id}")
def update_room(
    room_id: int,
    room: RoomUpdate,
    payload: ManagementUser,
):
    conn = get_connection()

    try:
        existing = conn.execute(
            """
            SELECT id, room_number, status
            FROM rooms
            WHERE id = ?
            """,
            (room_id,),
        ).fetchone()

        if existing is None:
            raise HTTPException(
                status_code=404,
                detail="Room not found",
            )

        new_number = (
            room.room_number
            if room.room_number is not None
            else existing["room_number"]
        )

        new_status = (
            room.status
            if room.status is not None
            else existing["status"]
        )

        conn.execute(
            """
            UPDATE rooms
            SET room_number = ?, status = ?
            WHERE id = ?
            """,
            (new_number, new_status, room_id),
        )

        conn.commit()

        return {
            "id": room_id,
            "room_number": new_number,
            "status": new_status,
        }

    except IntegrityError as exc:
        raise HTTPException(
            status_code=409,
            detail="Room number already exists",
        ) from exc

    finally:
        conn.close()


# ==========================================
# 17. DELETE ROOM
# ==========================================

@app.delete("/api/rooms/{room_id}")
def delete_room(
    room_id: int,
    payload: ManagementUser,
):
    conn = get_connection()

    try:
        cursor = conn.execute(
            """
            DELETE FROM rooms
            WHERE id = ?
            """,
            (room_id,),
        )

        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="Room not found",
            )

        conn.commit()

        return {
            "message": "Room deleted successfully",
            "id": room_id,
        }

    finally:
        conn.close()