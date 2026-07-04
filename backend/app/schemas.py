from typing import Optional
from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TaskCreate(BaseModel):
    title: str
    description: str
    assigned_to: int
    priority: Optional[str] = "Medium"
    due_date: Optional[str] = None
    estimated_duration: Optional[int] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assigned_to: Optional[int] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[str] = None
    estimated_duration: Optional[int] = None


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    avatar: Optional[str] = None


class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str