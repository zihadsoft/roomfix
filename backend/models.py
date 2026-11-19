from enum import Enum

from pydantic import BaseModel


class UserRole(str, Enum):
    admin = "admin"
    manager = "manager"  # legacy management role
    moderator = "moderator"
    resident = "resident"
    maintenance_staff = "maintenance_staff"


class User(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole


class LoginRequest(BaseModel):
    email: str
    password: str
