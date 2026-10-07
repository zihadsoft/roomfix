from enum import Enum

from pydantic import BaseModel


class UserRole(str, Enum):
    admin = "admin"
    manager = "manager"
    resident = "resident"


class User(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole


class LoginRequest(BaseModel):
    email: str
    password: str
