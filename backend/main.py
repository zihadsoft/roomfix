from contextlib import asynccontextmanager
from sqlite3 import IntegrityError
from typing import Annotated, Literal

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field

try:
    from backend.auth import (
        hash_password,
        create_access_token,
        decode_access_token,
        verify_password,
    )
    from backend.database import get_connection, init_db, seed_db
    from backend.models import LoginRequest, User, UserRole

except ModuleNotFoundError:
    from auth import (
        hash_password,
        create_access_token,
        decode_access_token,
        verify_password,
    )
    from database import get_connection, init_db, seed_db
    from models import LoginRequest, User, UserRole

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
        "http://localhost:5174",
        "http://127.0.0.1:5174",
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

        conn = get_connection()
        try:
            row = conn.execute("SELECT id, role FROM users WHERE email = ?", (payload["sub"],)).fetchone()
        finally:
            conn.close()
        if row is None:
            raise HTTPException(status_code=401, detail="User no longer exists")
        payload["user_id"] = row["id"]
        payload["role"] = row["role"]
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

# ==========================================
# MAINTENANCE REQUEST MANAGEMENT (SRS)
# ==========================================

class RegisterInput(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=8, max_length=128)


@app.post("/api/register", status_code=201)
def register(data: RegisterInput):
    email = data.email.strip().lower()
    if "@" not in email:
        raise HTTPException(status_code=422, detail="Valid email required")
    conn = get_connection()
    try:
        cur = conn.execute("INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)",
                           (data.name.strip(), email, hash_password(data.password), "resident"))
        conn.commit()
        return {"id": cur.lastrowid, "email": email, "role": "resident"}
    except IntegrityError:
        raise HTTPException(status_code=409, detail="Email already registered")
    finally:
        conn.close()


Priority = Literal["low", "medium", "high"]
RequestStatus = Literal["pending", "assigned", "in_progress", "completed", "rejected"]


class RequestCreate(BaseModel):
    title: str = Field(min_length=3, max_length=150)
    description: str = Field(min_length=5, max_length=2000)
    location: str = Field(min_length=2, max_length=200)
    priority: Priority


class AssignInput(BaseModel):
    staff_id: int = Field(gt=0)


class StatusInput(BaseModel):
    status: RequestStatus


def request_row(conn, request_id):
    row = conn.execute("SELECT * FROM maintenance_requests WHERE id=?", (request_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Request not found")
    return row


@app.post("/api/requests", status_code=201)
def create_request(data: RequestCreate, payload: CurrentUser):
    if payload["role"] != "resident":
        raise HTTPException(status_code=403, detail="Resident access required")
    conn = get_connection()
    try:
        cur = conn.execute("""INSERT INTO maintenance_requests
            (title,description,location,priority,created_by) VALUES (?,?,?,?,?)""",
            (data.title, data.description, data.location, data.priority, payload["user_id"]))
        conn.commit()
        return dict(request_row(conn, cur.lastrowid))
    finally:
        conn.close()


@app.get("/api/requests")
def list_requests(payload: CurrentUser):
    conn = get_connection()
    try:
        if payload["role"] == "admin":
            rows = conn.execute("SELECT * FROM maintenance_requests ORDER BY id DESC").fetchall()
        elif payload["role"] == "maintenance_staff":
            rows = conn.execute("SELECT * FROM maintenance_requests WHERE assigned_staff=? ORDER BY id DESC", (payload["user_id"],)).fetchall()
        elif payload["role"] == "resident":
            rows = conn.execute("SELECT * FROM maintenance_requests WHERE created_by=? ORDER BY id DESC", (payload["user_id"],)).fetchall()
        else:
            raise HTTPException(status_code=403, detail="Role not permitted")
        return [dict(row) for row in rows]
    finally:
        conn.close()


@app.get("/api/staff")
def list_staff(payload: CurrentUser):
    if payload["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin required")
    conn = get_connection()
    try:
        return [dict(x) for x in conn.execute("SELECT id,name,email FROM users WHERE role='maintenance_staff'").fetchall()]
    finally:
        conn.close()


@app.put("/api/requests/{request_id}/assign")
def assign_request(request_id: int, data: AssignInput, payload: CurrentUser):
    if payload["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin required")
    conn = get_connection()
    try:
        row = request_row(conn, request_id)
        if row["status"] in ("completed", "rejected"):
            raise HTTPException(status_code=409, detail="Cannot assign closed request")
        staff = conn.execute("SELECT id FROM users WHERE id=? AND role='maintenance_staff'", (data.staff_id,)).fetchone()
        if staff is None:
            raise HTTPException(status_code=422, detail="Valid maintenance staff required")
        conn.execute("UPDATE maintenance_requests SET assigned_staff=?, status='assigned', updated_at=CURRENT_TIMESTAMP WHERE id=?", (data.staff_id, request_id))
        conn.commit()
        return dict(request_row(conn, request_id))
    finally:
        conn.close()


@app.put("/api/requests/{request_id}/status")
def update_request_status(request_id: int, data: StatusInput, payload: CurrentUser):
    if payload["role"] != "maintenance_staff":
        raise HTTPException(status_code=403, detail="Maintenance staff required")
    conn = get_connection()
    try:
        row = request_row(conn, request_id)
        if row["assigned_staff"] != payload["user_id"]:
            raise HTTPException(status_code=403, detail="Not assigned to you")
        if row["status"] not in ("assigned", "in_progress") or data.status not in ("in_progress", "completed", "rejected"):
            raise HTTPException(status_code=409, detail="Invalid status transition")
        conn.execute("UPDATE maintenance_requests SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?", (data.status, request_id))
        conn.commit()
        return dict(request_row(conn, request_id))
    finally:
        conn.close()


class UserRoleUpdate(BaseModel):
    role: Literal["admin", "resident", "maintenance_staff"]


@app.put("/api/users/{user_id}/role")
def change_user_role(user_id: int, data: UserRoleUpdate, payload: CurrentUser):
    if payload["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin required")
    if user_id == payload["user_id"]:
        raise HTTPException(status_code=409, detail="Cannot change your own role")
    conn = get_connection()
    try:
        cur = conn.execute("UPDATE users SET role=? WHERE id=?", (data.role, user_id))
        if not cur.rowcount:
            raise HTTPException(status_code=404, detail="User not found")
        conn.commit()
        return {"id": user_id, "role": data.role}
    finally:
        conn.close()
