from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator
import re


def validate_password(value: str):
    if len(value) < 8:
        raise ValueError("Password must be at least 8 characters long")
    if not re.search(r"[A-Z]", value):
        raise ValueError("Password must contain at least one uppercase letter")
    if not re.search(r"[a-z]", value):
        raise ValueError("Password must contain at least one lowercase letter")
    if not re.search(r"[0-9]", value):
        raise ValueError("Password must contain at least one digit")
    return value


def validate_otp(value: str):
    if not re.fullmatch(r"\d{6}", value.strip()):
        raise ValueError("Verification code must be 6 digits")
    return value.strip()


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    confirm_password: str
    role: str = "member"

    @field_validator("name")
    @classmethod
    def validate_name(cls, v):
        if len(v.strip()) < 2:
            raise ValueError("Full name must be at least 2 characters")
        return v.strip()

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v):
        return str(v).strip().lower()

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v):
        return validate_password(v)

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v, info):
        password = info.data.get("password")
        if password and v != password:
            raise ValueError("Passwords do not match")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v):
        return str(v).strip().lower()


class VerifyEmailRequest(BaseModel):
    email: EmailStr
    otp: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v):
        return str(v).strip().lower()

    @field_validator("otp")
    @classmethod
    def validate_code(cls, v):
        return validate_otp(v)


class ResendVerificationRequest(BaseModel):
    email: EmailStr

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v):
        return str(v).strip().lower()


class ForgotPasswordRequest(BaseModel):
    email: EmailStr

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v):
        return str(v).strip().lower()


class VerifyResetOTPRequest(BaseModel):
    email: EmailStr
    otp: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v):
        return str(v).strip().lower()

    @field_validator("otp")
    @classmethod
    def validate_code(cls, v):
        return validate_otp(v)


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    reset_token: str
    new_password: str
    confirm_password: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v):
        return str(v).strip().lower()

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, v):
        return validate_password(v)

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v, info):
        new_password = info.data.get("new_password")
        if new_password and v != new_password:
            raise ValueError("Passwords do not match")
        return v


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, v):
        return validate_password(v)

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v, info):
        new_password = info.data.get("new_password")
        if new_password and v != new_password:
            raise ValueError("Passwords do not match")
        return v


class GoogleLoginRequest(BaseModel):
    credential: str


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
    confirm_password: Optional[str] = None

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, v):
        return validate_password(v)

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v, info):
        new_password = info.data.get("new_password")
        if v is not None and new_password and v != new_password:
            raise ValueError("Passwords do not match")
        return v


class CommentCreate(BaseModel):
    content: str
    parent_id: Optional[int] = None


class CommentUpdate(BaseModel):
    content: str


class CommentReact(BaseModel):
    emoji: str


class AttachmentCreate(BaseModel):
    filename: str
    file_size: int
    file_type: str
    file_data: str # Base64 encoded
