from auth import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from fastapi import Depends, FastAPI, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from models import LoginRequest, User, UserRole

app = FastAPI(title="RoomFix API")

security = HTTPBearer()


# Temporary users database
users_db = {
    "admin@roomfix.com": {
        "name": "Admin User",
        "role": "admin",
        "password": hash_password("admin123"),
    },
    "manager@roomfix.com": {
        "name": "Manager User",
        "role": "manager",
        "password": hash_password("manager123"),
    },
    "resident@roomfix.com": {
        "name": "Resident User",
        "role": "resident",
        "password": hash_password("resident123"),
    },
}


# Health check
@app.get("/api/health")
def health():
    return {"status": "ok"}


# Rooms API
@app.get("/api/rooms")
def get_rooms():
    return [
        {
            "id": 1,
            "room_number": "101",
            "status": "available",
        },
        {
            "id": 2,
            "room_number": "102",
            "status": "occupied",
        },
    ]


# Users API
@app.get("/api/users")
def get_users():
    return [
        User(
            id=1,
            name="Admin User",
            email="admin@roomfix.com",
            role=UserRole.admin,
        ),
        User(
            id=2,
            name="Manager User",
            email="manager@roomfix.com",
            role=UserRole.manager,
        ),
        User(
            id=3,
            name="Resident User",
            email="resident@roomfix.com",
            role=UserRole.resident,
        ),
    ]


# Login API
@app.post("/api/login")
def login(data: LoginRequest):
    user = users_db.get(data.email)

    if not user or not verify_password(
        data.password,
        user["password"],
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    token = create_access_token(
        {
            "sub": data.email,
            "role": user["role"],
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user["role"],
        "name": user["name"],
    }


# Read logged-in user's token
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),  # noqa: B008
):
    try:
        return decode_access_token(credentials.credentials)
    except Exception:  # noqa: BLE001
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
        )


# Any logged-in user can access
@app.get("/api/profile")
def profile(payload: dict = Depends(get_current_user)):  # noqa: B008
    return {
        "email": payload.get("sub"),
        "role": payload.get("role"),
    }


# Admin only
@app.get("/api/admin")
def admin_only(payload: dict = Depends(get_current_user)):  # noqa: B008
    if payload.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required",
        )

    return {
        "message": "Welcome Admin",
        "permission": "full_access",
    }


# Admin or Manager
@app.get("/api/management")
def management_access(payload: dict = Depends(get_current_user)):  # noqa: B008
    if payload.get("role") not in ["admin", "manager"]:
        raise HTTPException(
            status_code=403,
            detail="Manager or Admin access required",
        )

    return {
        "message": "Management access granted",
        "role": payload.get("role"),
    }


# Resident area
@app.get("/api/resident")
def resident_access(payload: dict = Depends(get_current_user)):  # noqa: B008
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