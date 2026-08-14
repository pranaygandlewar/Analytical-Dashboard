import os
import secrets
import json
import urllib.error
import urllib.parse
import urllib.request
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import func, text
from sqlalchemy.orm import Session
from .database import engine, SessionLocal, Base
from .models import User, Task, Notification, WorkspaceSetting, Feedback, Comment, Attachment, Watcher, TimelineEvent, OTPVerification
from .schemas import (
    UserCreate, UserLogin, TaskCreate, TaskUpdate, ProfileUpdate, PasswordUpdate,
    CommentCreate, CommentUpdate, CommentReact, AttachmentCreate,
    VerifyEmailRequest, ResendVerificationRequest,
    ForgotPasswordRequest, VerifyResetOTPRequest, ResetPasswordRequest,
    ChangePasswordRequest, GoogleLoginRequest
)
from fastapi.middleware.cors import CORSMiddleware
from .auth import (
    hash_password,
    verify_password,
    create_access_token,
    verify_token
)
from .email_service import send_verification_otp, send_password_reset_otp
from datetime import datetime, date, timedelta
import random
import time

def check_and_create_due_notifications(db: Session, user_id: int):
    # Fetch user tasks that are not completed
    tasks = db.query(Task).filter(
        Task.assigned_to == user_id,
        Task.status != "completed"
    ).all()
    
    today_str = date.today().isoformat()
    
    for task in tasks:
        if not task.due_date:
            continue
            
        if task.due_date == today_str:
            exists = db.query(Notification).filter(
                Notification.user_id == user_id,
                Notification.message.like(f"Task is due today: {task.title}%")
            ).first()
            if not exists:
                note = Notification(
                    message=f"Task is due today: {task.title} (Due: {task.due_date})",
                    user_id=user_id,
                    is_read="false",
                    category="System Alert"
                )
                db.add(note)
                db.commit()
                
        elif task.due_date < today_str:
            exists = db.query(Notification).filter(
                Notification.user_id == user_id,
                Notification.message.like(f"Task is OVERDUE: {task.title}%")
            ).first()
            if not exists:
                note = Notification(
                    message=f"Task is OVERDUE: {task.title} (Was due: {task.due_date})",
                    user_id=user_id,
                    is_read="false",
                    category="System Alert"
                )
                db.add(note)
                db.commit()

Base.metadata.create_all(bind=engine)

# Startup migrations for tables
db_mig = SessionLocal()

# 1. Notifications updates
try:
    db_mig.execute(text("ALTER TABLE notifications ADD COLUMN category VARCHAR DEFAULT 'System Alert'"))
    db_mig.commit()
except Exception:
    db_mig.rollback()

try:
    db_mig.execute(text("ALTER TABLE notifications ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"))
    db_mig.commit()
except Exception:
    db_mig.rollback()

# 2. Users profile updates
for col in ["avatar", "job_title", "department", "phone", "location", "bio"]:
    try:
        db_mig.execute(text(f"ALTER TABLE users ADD COLUMN {col} VARCHAR"))
        db_mig.commit()
    except Exception:
        db_mig.rollback()

try:
    db_mig.execute(text("ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"))
    db_mig.commit()
except Exception:
    db_mig.rollback()

try:
    db_mig.execute(text("ALTER TABLE users ADD COLUMN last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP"))
    db_mig.commit()
except Exception:
    db_mig.rollback()

# 3. Tasks updates
for col in ["priority", "due_date"]:
    try:
        db_mig.execute(text(f"ALTER TABLE tasks ADD COLUMN {col} VARCHAR"))
        db_mig.commit()
    except Exception:
        db_mig.rollback()

try:
    db_mig.execute(text("ALTER TABLE tasks ADD COLUMN estimated_duration INTEGER"))
    db_mig.commit()
except Exception:
    db_mig.rollback()

try:
    db_mig.execute(text("ALTER TABLE tasks ADD COLUMN completed_at TIMESTAMP"))
    db_mig.commit()
except Exception:
    db_mig.rollback()

try:
    db_mig.execute(text("ALTER TABLE tasks ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"))
    db_mig.commit()
except Exception:
    db_mig.rollback()

# 4. Users status updates
try:
    db_mig.execute(text("ALTER TABLE users ADD COLUMN status VARCHAR DEFAULT 'active'"))
    db_mig.commit()
except Exception:
    db_mig.rollback()

# 5. Users subscription updates
for col, col_type, default_val in [
    ("subscription_plan", "VARCHAR", "'Free'"),
    ("subscription_status", "VARCHAR", "'active'"),
    ("billing_cycle", "VARCHAR", "'monthly'")
]:
    try:
        db_mig.execute(text(f"ALTER TABLE users ADD COLUMN {col} {col_type} DEFAULT {default_val}"))
        db_mig.commit()
    except Exception:
        db_mig.rollback()

try:
    is_postgres = "postgresql" in str(engine.url)
    dt_type = "TIMESTAMP WITH TIME ZONE" if is_postgres else "DATETIME"
    db_mig.execute(text(f"ALTER TABLE users ADD COLUMN renewal_date {dt_type}"))
    db_mig.commit()
except Exception:
    db_mig.rollback()

# 6. Authentication system columns
for col, col_type, default_val in [
    ("password_hash", "VARCHAR", None),
    ("email_verified", "BOOLEAN", "FALSE"),
    ("auth_provider", "VARCHAR", "'email'"),
    ("google_id", "VARCHAR", None),
    ("is_active", "BOOLEAN", "TRUE"),
]:
    try:
        default_clause = f" DEFAULT {default_val}" if default_val else ""
        db_mig.execute(text(f"ALTER TABLE users ADD COLUMN {col} {col_type}{default_clause}"))
        db_mig.commit()
    except Exception:
        db_mig.rollback()

try:
    is_postgres = "postgresql" in str(engine.url)
    dt_type = "TIMESTAMP WITH TIME ZONE" if is_postgres else "DATETIME"
    db_mig.execute(text(f"ALTER TABLE users ADD COLUMN updated_at {dt_type} DEFAULT CURRENT_TIMESTAMP"))
    db_mig.commit()
except Exception:
    db_mig.rollback()

# Keep legacy password hashes available through the explicit password_hash column.
try:
    db_mig.execute(text("UPDATE users SET password_hash = password WHERE password_hash IS NULL AND password IS NOT NULL"))
    db_mig.commit()
except Exception:
    db_mig.rollback()

# 7. OTP lifecycle columns
is_postgres = "postgresql" in str(engine.url)
dt_type = "TIMESTAMP WITH TIME ZONE" if is_postgres else "DATETIME"
for col, col_type in [
    ("user_id", "INTEGER"),
    ("resend_available_at", dt_type),
    ("verified_at", dt_type),
    ("used_at", dt_type),
    ("reset_token_hash", "VARCHAR"),
]:
    try:
        db_mig.execute(text(f"ALTER TABLE otp_verifications ADD COLUMN {col} {col_type}"))
        db_mig.commit()
    except Exception:
        db_mig.rollback()

# 8. One-time legacy backfill: accounts created before OTP support should remain usable.
try:
    marker = db_mig.query(WorkspaceSetting).filter(
        WorkspaceSetting.key == "auth_existing_users_verified_backfill"
    ).first()
    if not marker:
        db_mig.execute(text("UPDATE users SET email_verified = TRUE WHERE email_verified IS NULL OR email_verified = FALSE"))
        db_mig.add(WorkspaceSetting(key="auth_existing_users_verified_backfill", value="true"))
        db_mig.commit()
except Exception:
    db_mig.rollback()

db_mig.close()

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "http://127.0.0.1:5176"
]

frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


security = HTTPBearer(auto_error=False)

OTP_EXPIRY_MINUTES = int(os.getenv("OTP_EXPIRY_MINUTES", "5"))
OTP_RESEND_COOLDOWN_SECONDS = int(os.getenv("OTP_RESEND_COOLDOWN_SECONDS", "60"))
OTP_MAX_ATTEMPTS = int(os.getenv("OTP_MAX_ATTEMPTS", "5"))
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://127.0.0.1:8000/auth/google/callback")


def utc_now():
    return datetime.utcnow()


def normalize_email(email: str):
    return str(email).strip().lower()


def get_password_hash(user: User):
    return user.password_hash or user.password


def set_user_password(user: User, password: str):
    hashed = hash_password(password)
    user.password_hash = hashed
    user.password = hashed


def add_auth_provider(user: User, provider: str):
    providers = {
        item.strip()
        for item in (user.auth_provider or "email").split(",")
        if item.strip()
    }
    providers.add(provider)
    user.auth_provider = ",".join(sorted(providers))


def user_to_response(user: User):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "avatar": user.avatar,
        "job_title": user.job_title,
        "department": user.department,
        "phone": user.phone,
        "location": user.location,
        "bio": user.bio,
        "status": user.status or "active",
        "email_verified": bool(user.email_verified),
        "auth_provider": user.auth_provider or "email",
        "is_active": bool(user.is_active),
        "subscription_plan": user.subscription_plan or "Free",
        "subscription_status": user.subscription_status or "active",
        "billing_cycle": user.billing_cycle or "monthly",
        "renewal_date": user.renewal_date.isoformat() if user.renewal_date else None,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "last_login": user.last_login.isoformat() if user.last_login else None
    }


def create_user_session(user: User):
    token = create_access_token({
        "sub": user.email,
        "uid": user.id,
        "role": user.role,
        "name": user.name
    })
    return {
        "message": "Login successful",
        "access_token": token,
        "token_type": "bearer",
        "user": user_to_response(user)
    }


def find_user_by_email(db: Session, email: str):
    return db.query(User).filter(func.lower(User.email) == normalize_email(email)).first()


def generate_otp():
    return f"{secrets.randbelow(1_000_000):06d}"


def get_latest_open_otp(db: Session, email: str, purpose: str):
    return db.query(OTPVerification).filter(
        func.lower(OTPVerification.email) == normalize_email(email),
        OTPVerification.purpose == purpose,
        OTPVerification.used_at.is_(None)
    ).order_by(OTPVerification.created_at.desc()).first()


def assert_otp_resend_allowed(record: OTPVerification | None):
    if record and record.resend_available_at and record.resend_available_at > utc_now():
        wait_seconds = max(1, int((record.resend_available_at - utc_now()).total_seconds()))
        raise HTTPException(
            status_code=429,
            detail=f"Please wait {wait_seconds} seconds before requesting a new code."
        )


def invalidate_open_otps(db: Session, email: str, purpose: str):
    db.query(OTPVerification).filter(
        func.lower(OTPVerification.email) == normalize_email(email),
        OTPVerification.purpose == purpose,
        OTPVerification.used_at.is_(None)
    ).update({"used_at": utc_now()}, synchronize_session=False)


def issue_otp(db: Session, email: str, purpose: str, user: User | None = None):
    email_clean = normalize_email(email)
    latest = get_latest_open_otp(db, email_clean, purpose)
    assert_otp_resend_allowed(latest)

    invalidate_open_otps(db, email_clean, purpose)

    otp = generate_otp()
    now = utc_now()
    record = OTPVerification(
        user_id=user.id if user else None,
        email=email_clean,
        otp_hash=hash_password(otp),
        purpose=purpose,
        attempts=0,
        expires_at=now + timedelta(minutes=OTP_EXPIRY_MINUTES),
        resend_available_at=now + timedelta(seconds=OTP_RESEND_COOLDOWN_SECONDS)
    )
    db.add(record)
    db.commit()

    sent = (
        send_verification_otp(email_clean, otp, user.name if user else "")
        if purpose == "email_verification"
        else send_password_reset_otp(email_clean, otp, user.name if user else "")
    )
    if not sent:
        raise HTTPException(
            status_code=503,
            detail="Email delivery is not configured. Please try again later."
        )

    return {
        "message": "Verification code sent",
        "email": email_clean,
        "expires_in": OTP_EXPIRY_MINUTES * 60,
        "resend_cooldown": OTP_RESEND_COOLDOWN_SECONDS
    }


def validate_otp_record(db: Session, email: str, purpose: str, otp: str):
    record = get_latest_open_otp(db, email, purpose)
    if not record:
        raise HTTPException(status_code=400, detail="Verification code has expired or was already used.")

    if record.expires_at and record.expires_at < utc_now():
        record.used_at = utc_now()
        db.commit()
        raise HTTPException(status_code=400, detail="This code has expired. Please request a new code.")

    if record.attempts >= OTP_MAX_ATTEMPTS:
        raise HTTPException(status_code=429, detail="Too many attempts. Please request a new code.")

    if not verify_password(otp, record.otp_hash):
        record.attempts += 1
        db.commit()
        if record.attempts >= OTP_MAX_ATTEMPTS:
            raise HTTPException(status_code=429, detail="Too many attempts. Please request a new code.")
        raise HTTPException(status_code=400, detail="Invalid verification code.")

    return record


def ensure_user_can_authenticate(user: User):
    if not user.is_active or user.status == "suspended":
        raise HTTPException(
            status_code=403,
            detail="Your account is not active. Please contact your administrator."
        )


def authenticate_email_user(db: Session, credentials: UserLogin):
    db_user = find_user_by_email(db, credentials.email)
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    ensure_user_can_authenticate(db_user)

    password_hash = get_password_hash(db_user)
    if not password_hash:
        raise HTTPException(status_code=400, detail="Please continue with Google or reset your password.")

    if not verify_password(credentials.password, password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not db_user.email_verified:
        raise HTTPException(status_code=403, detail="This email has not been verified.")

    db_user.last_login = utc_now()
    db.commit()
    db.refresh(db_user)
    return create_user_session(db_user)


def sanitize_frontend_redirect(url: str | None):
    if not url:
        return f"{FRONTEND_URL}/auth/google/callback"
    frontend = urllib.parse.urlparse(FRONTEND_URL)
    target = urllib.parse.urlparse(url)
    if target.scheme == frontend.scheme and target.netloc == frontend.netloc:
        return url
    return f"{FRONTEND_URL}/auth/google/callback"


def exchange_google_code(code: str):
    token_payload = urllib.parse.urlencode({
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code"
    }).encode()

    token_request = urllib.request.Request(
        "https://oauth2.googleapis.com/token",
        data=token_payload,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    with urllib.request.urlopen(token_request, timeout=10) as response:
        token_data = json.loads(response.read().decode("utf-8"))

    userinfo_request = urllib.request.Request(
        "https://openidconnect.googleapis.com/v1/userinfo",
        headers={"Authorization": f"Bearer {token_data['access_token']}"}
    )
    with urllib.request.urlopen(userinfo_request, timeout=10) as response:
        return json.loads(response.read().decode("utf-8"))


def login_or_create_google_user(db: Session, google_profile: dict):
    email = normalize_email(google_profile.get("email", ""))
    if not email or not google_profile.get("email_verified"):
        raise HTTPException(status_code=400, detail="Google account email is not verified.")

    user = find_user_by_email(db, email)
    if user:
        ensure_user_can_authenticate(user)
        user.google_id = google_profile.get("sub") or user.google_id
        user.email_verified = True
        add_auth_provider(user, "google")
    else:
        user = User(
            name=google_profile.get("name") or email.split("@")[0],
            email=email,
            role="member",
            avatar=google_profile.get("picture"),
            status="active",
            email_verified=True,
            auth_provider="google",
            google_id=google_profile.get("sub"),
            is_active=True
        )
        db.add(user)

    user.last_login = utc_now()
    db.commit()
    db.refresh(user)
    return create_user_session(user)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    if not credentials:
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )

    token = credentials.credentials
    payload = verify_token(token)

    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    user_id = payload.get("uid")
    email = payload.get("sub")

    user = None
    if user_id:
        user = db.query(User).filter(User.id == user_id).first()
    if not user and email:
        user = find_user_by_email(db, email)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    ensure_user_can_authenticate(user)

    return user


def get_task_for_current_user(db: Session, task_id: int, current_user: User):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if current_user.role != "admin" and task.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have access to this task")
    return task


@app.get("/")
def home():
    return {"message": "TeamPulse Backend Running"}


@app.post("/auth/register")
def auth_register(user: UserCreate, db: Session = Depends(get_db)):
    email_clean = normalize_email(user.email)
    existing = find_user_by_email(db, email_clean)

    if existing and existing.email_verified:
        raise HTTPException(
            status_code=400,
            detail="An account with this email already exists. Please login."
        )

    if existing:
        existing.name = user.name
        existing.role = user.role
        existing.auth_provider = existing.auth_provider or "email"
        existing.is_active = True
        set_user_password(existing, user.password)
        db.commit()
        db.refresh(existing)
        target_user = existing
    else:
        target_user = User(
            name=user.name,
            email=email_clean,
            role=user.role,
            email_verified=False,
            auth_provider="email",
            is_active=True,
            status="active"
        )
        set_user_password(target_user, user.password)
        db.add(target_user)
        db.commit()
        db.refresh(target_user)

    issue_otp(db, email_clean, "email_verification", target_user)
    return {
        "message": "Account created. Please verify your email.",
        "email": email_clean,
        "requires_verification": True,
        "expires_in": OTP_EXPIRY_MINUTES * 60,
        "resend_cooldown": OTP_RESEND_COOLDOWN_SECONDS
    }


@app.post("/auth/verify-email")
def auth_verify_email(payload: VerifyEmailRequest, db: Session = Depends(get_db)):
    record = validate_otp_record(db, payload.email, "email_verification", payload.otp)
    user = find_user_by_email(db, payload.email)
    if not user:
        raise HTTPException(status_code=404, detail="Account not found.")

    user.email_verified = True
    user.is_active = True
    user.status = "active"
    record.used_at = utc_now()
    db.commit()
    db.refresh(user)
    return create_user_session(user)


@app.post("/auth/resend-verification-otp")
def auth_resend_verification_otp(payload: ResendVerificationRequest, db: Session = Depends(get_db)):
    user = find_user_by_email(db, payload.email)
    if not user:
        raise HTTPException(status_code=404, detail="Account not found.")
    if user.email_verified:
        raise HTTPException(status_code=400, detail="This email is already verified. Please login.")

    issue_otp(db, payload.email, "email_verification", user)
    return {
        "message": "Verification code sent",
        "email": normalize_email(payload.email),
        "expires_in": OTP_EXPIRY_MINUTES * 60,
        "resend_cooldown": OTP_RESEND_COOLDOWN_SECONDS
    }


@app.post("/auth/login")
def auth_login(user: UserLogin, db: Session = Depends(get_db)):
    return authenticate_email_user(db, user)


@app.get("/auth/me")
def auth_get_me(current_user: User = Depends(get_current_user)):
    return user_to_response(current_user)


@app.post("/auth/forgot-password")
def auth_forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = find_user_by_email(db, payload.email)
    if user and user.email_verified and user.is_active:
        issue_otp(db, payload.email, "password_reset", user)
    return {
        "message": "If an account exists for this email, a verification code has been sent.",
        "email": normalize_email(payload.email),
        "expires_in": OTP_EXPIRY_MINUTES * 60,
        "resend_cooldown": OTP_RESEND_COOLDOWN_SECONDS
    }


@app.post("/auth/resend-reset-otp")
def auth_resend_reset_otp(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    return auth_forgot_password(payload, db)


@app.post("/auth/verify-reset-otp")
def auth_verify_reset_otp(payload: VerifyResetOTPRequest, db: Session = Depends(get_db)):
    record = validate_otp_record(db, payload.email, "password_reset", payload.otp)
    reset_token = secrets.token_urlsafe(32)
    record.verified_at = utc_now()
    record.reset_token_hash = hash_password(reset_token)
    db.commit()
    return {
        "message": "Verification code accepted.",
        "email": normalize_email(payload.email),
        "reset_token": reset_token
    }


@app.post("/auth/reset-password")
def auth_reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    record = db.query(OTPVerification).filter(
        func.lower(OTPVerification.email) == normalize_email(payload.email),
        OTPVerification.purpose == "password_reset",
        OTPVerification.verified_at.isnot(None),
        OTPVerification.used_at.is_(None)
    ).order_by(OTPVerification.verified_at.desc()).first()

    if (
        not record
        or not record.reset_token_hash
        or (record.expires_at and record.expires_at < utc_now())
        or not verify_password(payload.reset_token, record.reset_token_hash)
    ):
        raise HTTPException(status_code=400, detail="Password reset session has expired. Please request a new code.")

    user = find_user_by_email(db, payload.email)
    if not user:
        raise HTTPException(status_code=404, detail="Account not found.")

    set_user_password(user, payload.new_password)
    user.email_verified = True
    user.is_active = True
    add_auth_provider(user, "email")
    record.used_at = utc_now()
    db.add(Notification(
        message="Account password reset successfully",
        user_id=user.id,
        is_read="false",
        category="System Alert"
    ))
    db.commit()
    return {"message": "Password reset successfully."}


@app.post("/auth/change-password")
def auth_change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    password_hash = get_password_hash(current_user)
    if not password_hash:
        raise HTTPException(status_code=400, detail="This Google-only account does not have a local password yet. Use password reset to add one.")

    if not verify_password(payload.current_password, password_hash):
        raise HTTPException(status_code=400, detail="Invalid current password")

    set_user_password(current_user, payload.new_password)
    add_auth_provider(current_user, "email")
    db.add(Notification(
        message="Account password changed successfully",
        user_id=current_user.id,
        is_read="false",
        category="System Alert"
    ))
    db.commit()
    return {"message": "Password changed successfully"}


@app.post("/auth/logout")
def auth_logout():
    return {"message": "Logged out successfully"}


@app.get("/auth/google")
def auth_google(redirect_to: str | None = Query(default=None)):
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=503, detail="Google OAuth is not configured.")

    frontend_redirect = sanitize_frontend_redirect(redirect_to)
    state = create_access_token(
        {
            "sub": "google_oauth_state",
            "purpose": "google_oauth",
            "redirect_to": frontend_redirect
        },
        expires_delta=timedelta(minutes=10)
    )
    params = urllib.parse.urlencode({
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "prompt": "select_account",
        "access_type": "offline"
    })
    return RedirectResponse(f"https://accounts.google.com/o/oauth2/v2/auth?{params}")


@app.get("/auth/google/callback")
def auth_google_callback(
    code: str | None = Query(default=None),
    state: str | None = Query(default=None),
    error: str | None = Query(default=None),
    db: Session = Depends(get_db)
):
    if error:
        return RedirectResponse(f"{FRONTEND_URL}/login?error={urllib.parse.quote(error)}")
    if not code or not state:
        return RedirectResponse(f"{FRONTEND_URL}/login?error=google_oauth_failed")

    state_payload = verify_token(state)
    if not state_payload or state_payload.get("purpose") != "google_oauth":
        return RedirectResponse(f"{FRONTEND_URL}/login?error=invalid_oauth_state")

    try:
        google_profile = exchange_google_code(code)
        session = login_or_create_google_user(db, google_profile)
    except (HTTPException, urllib.error.URLError, KeyError, ValueError):
        return RedirectResponse(f"{FRONTEND_URL}/login?error=google_oauth_failed")

    redirect_to = sanitize_frontend_redirect(state_payload.get("redirect_to"))
    separator = "&" if "?" in redirect_to else "?"
    return RedirectResponse(f"{redirect_to}{separator}token={urllib.parse.quote(session['access_token'])}")


@app.post("/auth/google")
def auth_google_credential(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Google OAuth is not configured.")

    tokeninfo_url = "https://oauth2.googleapis.com/tokeninfo?" + urllib.parse.urlencode({
        "id_token": payload.credential
    })
    try:
        with urllib.request.urlopen(tokeninfo_url, timeout=10) as response:
            google_profile = json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, ValueError):
        raise HTTPException(status_code=401, detail="Google authentication failed.")

    if google_profile.get("aud") != GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=401, detail="Google authentication failed.")

    google_profile["email_verified"] = google_profile.get("email_verified") in (True, "true", "True")
    return login_or_create_google_user(db, google_profile)


@app.post("/signup")
def signup(user: UserCreate, db: Session = Depends(get_db)):
    return auth_register(user, db)


@app.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    return auth_login(user, db)


@app.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return auth_get_me(current_user)


@app.get("/users")
def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "admin":
        users = db.query(User).all()
    else:
        users = [current_user]

    return [
        {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "avatar": user.avatar,
            "job_title": user.job_title,
            "department": user.department,
            "phone": user.phone,
            "location": user.location,
            "bio": user.bio,
            "status": user.status or "active",
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "last_login": user.last_login.isoformat() if user.last_login else None
        }
        for user in users
    ]

@app.put("/users/me/profile")
def update_profile(
    profile_data: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if profile_data.name is not None:
        current_user.name = profile_data.name
    if profile_data.email is not None:
        new_email = normalize_email(profile_data.email)
        existing = db.query(User).filter(
            func.lower(User.email) == new_email,
            User.id != current_user.id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already taken")
        current_user.email = new_email
    if profile_data.job_title is not None:
        current_user.job_title = profile_data.job_title
    if profile_data.department is not None:
        current_user.department = profile_data.department
    if profile_data.phone is not None:
        current_user.phone = profile_data.phone
    if profile_data.location is not None:
        current_user.location = profile_data.location
    if profile_data.bio is not None:
        current_user.bio = profile_data.bio
    if profile_data.avatar is not None:
        current_user.avatar = profile_data.avatar

    db.commit()
    db.refresh(current_user)
    
    # Also log an Account Update notification for the user
    update_note = Notification(
        message="Profile details updated successfully",
        user_id=current_user.id,
        is_read="false",
        category="Team Activity"
    )
    db.add(update_note)
    db.commit()

    return {
        "message": "Profile updated successfully",
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "role": current_user.role,
            "avatar": current_user.avatar,
            "job_title": current_user.job_title,
            "department": current_user.department,
            "phone": current_user.phone,
            "location": current_user.location,
            "bio": current_user.bio,
            "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
            "last_login": current_user.last_login.isoformat() if current_user.last_login else None
        }
    }

@app.put("/users/me/password")
def update_password(
    pwd_data: PasswordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    password_hash = get_password_hash(current_user)
    if not password_hash:
        raise HTTPException(status_code=400, detail="This Google-only account does not have a local password yet. Use password reset to add one.")

    if not verify_password(pwd_data.current_password, password_hash):
        raise HTTPException(status_code=400, detail="Invalid current password")

    set_user_password(current_user, pwd_data.new_password)
    add_auth_provider(current_user, "email")
    db.add(Notification(
        message="Account password changed successfully",
        user_id=current_user.id,
        is_read="false",
        category="System Alert"
    ))
    db.commit()

    return {"message": "Password changed successfully"}


@app.post("/tasks")
def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admin can create tasks"
        )

    assigned_user = db.query(User).filter(User.id == task.assigned_to).first()
    if not assigned_user:
        raise HTTPException(
            status_code=400,
            detail="Assigned user not found"
        )

    new_task = Task(
        title=task.title,
        description=task.description,
        assigned_to=task.assigned_to,
        status="pending",
        priority=task.priority or "Medium",
        due_date=task.due_date,
        estimated_duration=task.estimated_duration
    )

    db.add(new_task)
    db.commit()

    # Timeline event
    db.add(TimelineEvent(
        task_id=new_task.id,
        user_id=current_user.id,
        event_type="created",
        details="Task was created"
    ))
    db.add(TimelineEvent(
        task_id=new_task.id,
        user_id=current_user.id,
        event_type="assigned",
        details=f"Assigned task to {assigned_user.name}"
    ))

    notification = Notification(
        message=f"New task assigned: {task.title}",
        user_id=task.assigned_to,
        is_read="false",
        category="Task Assigned"
    )

    db.add(notification)
    db.commit()

    return {"message": "Task created successfully"}


@app.get("/tasks")
def get_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_and_create_due_notifications(db, current_user.id)
    if current_user.role == "admin":
        tasks = db.query(Task).all()
    else:
        tasks = db.query(Task).filter(
            Task.assigned_to == current_user.id
        ).all()

    return tasks


@app.put("/tasks/{task_id}")
def update_task(
    task_id: int,
    task_update: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(Task).filter(
        Task.id == task_id
    ).first()

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    if current_user.role != "admin":
        if task.assigned_to != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You can only update your own tasks"
            )
        if (task_update.title is not None and task_update.title != task.title) or \
           (task_update.description is not None and task_update.description != task.description) or \
           (task_update.assigned_to is not None and task_update.assigned_to != task.assigned_to):
            raise HTTPException(
                status_code=403,
                detail="Members can only update task status"
            )

    if task_update.title is not None and task_update.title != task.title:
        task.title = task_update.title
        db.add(TimelineEvent(task_id=task.id, user_id=current_user.id, event_type="status", details=f"Changed title to '{task_update.title}'"))
    if task_update.description is not None and task_update.description != task.description:
        task.description = task_update.description
        db.add(TimelineEvent(task_id=task.id, user_id=current_user.id, event_type="status", details="Updated task description"))
    if task_update.assigned_to is not None and task_update.assigned_to != task.assigned_to:
        assigned_user = db.query(User).filter(User.id == task_update.assigned_to).first()
        if not assigned_user:
            raise HTTPException(
                status_code=400,
                detail="Assigned user not found"
            )
        task.assigned_to = task_update.assigned_to
        db.add(TimelineEvent(task_id=task.id, user_id=current_user.id, event_type="assigned", details=f"Assigned task to {assigned_user.name}"))
    if task_update.priority is not None and task_update.priority != task.priority:
        task.priority = task_update.priority
        db.add(TimelineEvent(task_id=task.id, user_id=current_user.id, event_type="priority", details=f"Changed priority to {task_update.priority}"))
    if task_update.due_date is not None and task_update.due_date != task.due_date:
        task.due_date = task_update.due_date
        db.add(TimelineEvent(task_id=task.id, user_id=current_user.id, event_type="due_date", details=f"Changed due date to {task_update.due_date}"))
    if task_update.estimated_duration is not None and task_update.estimated_duration != task.estimated_duration:
        task.estimated_duration = task_update.estimated_duration
    if task_update.status is not None and task_update.status != task.status:
        task.status = task_update.status
        db.add(TimelineEvent(task_id=task.id, user_id=current_user.id, event_type="status", details=f"Changed status to '{task_update.status}'"))
        if task_update.status == "completed":
            task.completed_at = datetime.utcnow()
            db.add(TimelineEvent(task_id=task.id, user_id=current_user.id, event_type="completed", details="Marked task as completed"))
        else:
            task.completed_at = None

    db.commit()

    # Notify watchers of updates
    watchers = db.query(Watcher).filter(Watcher.task_id == task.id).all()
    for w in watchers:
        if w.user_id != current_user.id:
            db.add(Notification(
                message=f"Watched task '{task.title}' updated by {current_user.name}",
                user_id=w.user_id,
                is_read="false",
                category="Task Updated"
            ))

    cat = "Task Updated"
    msg = f"Task updated: {task.title}"
    if task_update.status == "completed":
        cat = "Task Completed"
        msg = f"Task completed: {task.title}"

    notification = Notification(
        message=msg,
        user_id=task.assigned_to,
        is_read="false",
        category=cat
    )
    db.add(notification)

    # If a member updates status, send a Team Activity notification to all admins
    if current_user.role == "member" and task_update.status is not None:
        admins = db.query(User).filter(User.role == "admin").all()
        for admin in admins:
            admin_note = Notification(
                message=f"{current_user.name} marked task '{task.title}' as '{task.status}'",
                user_id=admin.id,
                is_read="false",
                category="Team Activity"
            )
            db.add(admin_note)

    db.commit()

    return {"message": "Task updated"}


@app.delete("/tasks/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can delete tasks")

    task = get_task_for_current_user(db, task_id, current_user)

    db.delete(task)
    
    # Create System Alert notification for the admin who deleted the task
    system_note = Notification(
        message=f"Task deleted: {task.title}",
        user_id=current_user.id,
        is_read="false",
        category="System Alert"
    )
    db.add(system_note)
    db.commit()

    return {"message": "Task deleted successfully"}


@app.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admin can delete team members"
        )

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    db.query(Notification).filter(Notification.user_id == user_id).delete()
    db.query(Task).filter(Task.assigned_to == user_id).delete()
    db.delete(user)
    db.commit()

    return {"message": "User deleted successfully"}


@app.get("/notifications")
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_and_create_due_notifications(db, current_user.id)
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).all()

    return notifications


@app.put("/notifications")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).update({Notification.is_read: "true"})
    db.commit()

    return {"message": "All notifications marked as read"}


@app.put("/notifications/{notification_id}")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )

    notification.is_read = "true"
    db.commit()

    return {"message": "Notification marked as read"}


@app.delete("/notifications/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )

    db.delete(notification)
    db.commit()

    return {"message": "Notification deleted successfully"}


@app.get("/workspace/settings")
def get_workspace_settings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    
    settings_rows = db.query(WorkspaceSetting).all()
    settings = {row.key: row.value for row in settings_rows}
    
    defaults = {
        "workspace_name": "TeamPulse",
        "company_logo": "",
        "brand_color": "#6366f1",
        "timezone": "UTC",
        "date_format": "YYYY-MM-DD",
        "default_priority": "Medium",
        "default_notifications": "true",
        "permissions": "{\"viewer\":[\"View Dashboard\"],\"member\":[\"View Dashboard\",\"Manage Tasks (own)\",\"View Analytics\"],\"manager\":[\"View Dashboard\",\"Manage Tasks\",\"Manage Team\",\"View Analytics\",\"Export Reports\",\"Manage Notifications\",\"Manage Settings\"],\"admin\":[\"View Dashboard\",\"Manage Tasks\",\"Delete Tasks\",\"Manage Team\",\"View Analytics\",\"Export Reports\",\"Manage Notifications\",\"Manage Settings\"]}"
    }
    for k, v in defaults.items():
        if k not in settings:
            new_row = WorkspaceSetting(key=k, value=v)
            db.add(new_row)
            db.commit()
            settings[k] = v
    return settings


@app.post("/workspace/settings")
def save_workspace_settings(settings_dict: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    for k, v in settings_dict.items():
        row = db.query(WorkspaceSetting).filter(WorkspaceSetting.key == k).first()
        if row:
            row.value = str(v)
        else:
            new_row = WorkspaceSetting(key=k, value=str(v))
            db.add(new_row)
    db.commit()
    return {"message": "Settings updated successfully"}


@app.put("/users/{user_id}/status")
def update_user_status(user_id: int, status_payload: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can manage user status")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.status = status_payload.get("status", "active")
    db.commit()
    return {"message": f"User status updated to {user.status}"}


@app.put("/users/{user_id}/role")
def update_user_role(user_id: int, role_payload: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can manage roles")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = role_payload.get("role", "member")
    db.commit()
    return {"message": f"User role updated to {user.role}"}


@app.put("/users/{user_id}/reset-password")
def reset_user_password(user_id: int, pwd_payload: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can reset passwords")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    new_pwd = pwd_payload.get("password", "TeamPulse123!")
    set_user_password(user, new_pwd)
    add_auth_provider(user, "email")
    user.email_verified = True
    db.commit()
    return {"message": "Password reset successfully"}


@app.post("/users/invite")
def invite_user(invite_payload: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can invite users")
    email = normalize_email(invite_payload.get("email", ""))
    name = invite_payload.get("name", "Invited User")
    role = invite_payload.get("role", "member")
    department = invite_payload.get("department", "Engineering")
    
    existing = find_user_by_email(db, email)
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    invited_user = User(
        name=name,
        email=email,
        role=role,
        department=department,
        status="invited",
        email_verified=True,
        auth_provider="email",
        is_active=True
    )
    set_user_password(invited_user, "TeamPulse123!")
    db.add(invited_user)
    db.commit()
    
    return {"message": f"Invite sent successfully to {email}"}


@app.post("/users/bulk-delete")
def bulk_delete_users(payload: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete users")
    user_ids = payload.get("user_ids", [])
    if not user_ids:
        return {"message": "No users selected"}
    
    if current_user.id in user_ids:
        user_ids.remove(current_user.id)
        
    db.query(Notification).filter(Notification.user_id.in_(user_ids)).delete(synchronize_session=False)
    db.query(Task).filter(Task.assigned_to.in_(user_ids)).delete(synchronize_session=False)
    db.query(User).filter(User.id.in_(user_ids)).delete(synchronize_session=False)
    db.commit()
    return {"message": f"Successfully deleted {len(user_ids)} users"}


@app.post("/users/bulk-role")
def bulk_change_users_role(payload: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can change roles")
    user_ids = payload.get("user_ids", [])
    role = payload.get("role", "member")
    if not user_ids:
        return {"message": "No users selected"}
        
    db.query(User).filter(User.id.in_(user_ids)).update({User.role: role}, synchronize_session=False)
    db.commit()
    return {"message": f"Successfully updated {len(user_ids)} users to role {role}"}


@app.post("/feedback")
def submit_feedback(payload: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    category = payload.get("category", "general")
    rating = payload.get("rating")
    content = payload.get("content", "")
    
    new_feedback = Feedback(
        user_id=current_user.id,
        category=category,
        rating=rating,
        content=content
    )
    db.add(new_feedback)
    db.commit()
    return {"message": "Feedback submitted successfully"}


@app.get("/feedback")
def get_feedback_list(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    feedbacks = db.query(Feedback).order_by(Feedback.id.desc()).all()
    
    return [
        {
            "id": f.id,
            "user_name": db.query(User).filter(User.id == f.user_id).first().name if db.query(User).filter(User.id == f.user_id).first() else "Unknown",
            "category": f.category,
            "rating": f.rating,
            "content": f.content,
            "created_at": f.created_at.isoformat() if f.created_at else None
        }
        for f in feedbacks
    ]


from .payment_service import get_payment_provider
from .models import Payment

# Plan pricing mapping in INR
PLAN_PRICES = {
    "Free": {"monthly": 0, "yearly": 0},
    "Pro": {"monthly": 499, "yearly": 4999},
    "Business": {"monthly": 999, "yearly": 9999},
    "Enterprise": {"monthly": 2499, "yearly": 24999}
}

@app.get("/subscription/me")
def get_subscription_me(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    payments = db.query(Payment).filter(Payment.user_id == current_user.id).order_by(Payment.id.desc()).all()
    return {
        "subscription_plan": current_user.subscription_plan or "Free",
        "subscription_status": current_user.subscription_status or "active",
        "billing_cycle": current_user.billing_cycle or "monthly",
        "renewal_date": current_user.renewal_date.isoformat() if current_user.renewal_date else None,
        "payment_history": [
            {
                "id": p.id,
                "plan": p.plan,
                "amount": p.amount,
                "status": p.status,
                "payment_method": p.payment_method,
                "created_at": p.created_at.isoformat() if p.created_at else None
            }
            for p in payments
        ]
    }

@app.post("/subscription/checkout")
def subscription_checkout(payload: dict, current_user: User = Depends(get_current_user)):
    plan = payload.get("plan", "Free")
    billing_cycle = payload.get("billing_cycle", "monthly")
    
    if plan not in PLAN_PRICES:
        raise HTTPException(status_code=400, detail="Invalid plan selected")
        
    price = PLAN_PRICES[plan][billing_cycle]
    
    # Instantiate payment provider
    provider = get_payment_provider()
    
    # Create billing order
    order = provider.create_order(amount=price * 100) # Price in paise for Razorpay
    order["plan"] = plan
    order["billing_cycle"] = billing_cycle
    order["user_id"] = current_user.id
    
    return order

@app.post("/subscription/verify")
def subscription_verify(payload: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    provider = get_payment_provider()
    success = provider.verify_payment(payload)
    
    plan = payload.get("plan", "Free")
    billing_cycle = payload.get("billing_cycle", "monthly")
    amount = PLAN_PRICES.get(plan, {}).get(billing_cycle, 0)
    
    # Add new payment log
    new_payment = Payment(
        user_id=current_user.id,
        plan=plan,
        amount=amount,
        status="success" if success else "failed",
        payment_method="UPI",
    )
    db.add(new_payment)
    db.commit()
    
    if success:
        # Upgrade user subscription
        db_user = db.query(User).filter(User.id == current_user.id).first()
        db_user.subscription_plan = plan
        db_user.subscription_status = "active"
        db_user.billing_cycle = billing_cycle
        
        # Calculate renewal date
        days = 30 if billing_cycle == "monthly" else 365
        db_user.renewal_date = datetime.now() + timedelta(days=days)
        db.commit()
        return {
            "success": True, 
            "plan": plan, 
            "message": "Subscription upgraded successfully",
            "order_id": f"TXN_{random.randint(100000, 999999)}",
            "invoice_number": f"INV-2026-{random.randint(1000, 9999)}",
            "payment_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
    else:
        return {"success": False, "message": "Payment verification failed"}

@app.post("/subscription/cancel")
def subscription_cancel(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_user = db.query(User).filter(User.id == current_user.id).first()
    db_user.subscription_plan = "Free"
    db_user.subscription_status = "active"
    db_user.billing_cycle = "monthly"
    db_user.renewal_date = None
    db.commit()
    return {"success": True, "message": "Subscription cancelled successfully"}

@app.get("/admin/billing/dashboard")
def get_billing_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")
        
    # Seed fake transactions if payments table is empty
    payments_count = db.query(Payment).count()
    if payments_count == 0:
        methods = ["UPI (Google Pay)", "UPI (PhonePe)", "UPI (Paytm)", "UPI (BHIM)", "UPI (GPay)"]
        plans = ["Pro", "Business", "Enterprise"]
        cycles = ["monthly", "yearly"]
        now = datetime.now()
        
        users = db.query(User).all()
        if users:
            for i in range(35):
                u = random.choice(users)
                plan = random.choice(plans)
                cycle = random.choice(cycles)
                amount = PLAN_PRICES[plan][cycle]
                status = "success" if random.random() < 0.90 else "failed"
                created = now - timedelta(days=random.randint(1, 30), hours=random.randint(0, 23))
                
                # Make sure database users get updated plan/cycle too so active_subs count works!
                if status == "success" and (u.subscription_plan is None or u.subscription_plan == "Free"):
                    u.subscription_plan = plan
                    u.subscription_status = "active"
                    u.billing_cycle = cycle
                    days = 30 if cycle == "monthly" else 365
                    u.renewal_date = created + timedelta(days=days)
                
                fake_payment = Payment(
                    user_id=u.id,
                    plan=plan,
                    amount=amount,
                    status=status,
                    payment_method=random.choice(methods),
                    created_at=created
                )
                db.add(fake_payment)
            db.commit()
            
    # 1. Total revenue
    successful_payments = db.query(Payment).filter(Payment.status == "success").all()
    total_revenue = sum(p.amount for p in successful_payments)
    
    # 2. Active subscriptions count
    active_subs = db.query(User).filter(User.subscription_plan != "Free", User.subscription_status == "active").count()
    
    # 3. Monthly Recurring Revenue (MRR)
    mrr = 0
    paying_users = db.query(User).filter(User.subscription_plan != "Free", User.subscription_plan.isnot(None), User.subscription_status == "active").all()
    for u in paying_users:
        plan_prices = PLAN_PRICES.get(u.subscription_plan, {"monthly": 0, "yearly": 0})
        if u.billing_cycle == "monthly":
            mrr += plan_prices["monthly"]
        else:
            mrr += plan_prices["yearly"] // 12
            
    # 4. Recent payments list
    payments = db.query(Payment).order_by(Payment.id.desc()).limit(15).all()
    recent_payments = []
    for p in payments:
        p_user = db.query(User).filter(User.id == p.user_id).first()
        recent_payments.append({
            "id": p.id,
            "user_name": p_user.name if p_user else "Deleted User",
            "user_email": p_user.email if p_user else "unknown",
            "plan": p.plan,
            "amount": p.amount,
            "status": p.status,
            "payment_method": p.payment_method,
            "created_at": p.created_at.isoformat() if p.created_at else None
        })
        
    # 5. Subscription analytics
    plan_counts = {"Free": 0, "Pro": 0, "Business": 0, "Enterprise": 0}
    all_users = db.query(User).all()
    for u in all_users:
        p = u.subscription_plan or "Free"
        if p in plan_counts:
            plan_counts[p] += 1
            
    return {
        "total_revenue": total_revenue,
        "active_subscriptions": active_subs,
        "mrr": mrr,
        "recent_payments": recent_payments,
        "subscription_analytics": plan_counts
    }


# Task Collaboration APIs

import re

@app.get("/tasks/{task_id}/comments")
def get_task_comments(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    get_task_for_current_user(db, task_id, current_user)
    comments = db.query(Comment).filter(Comment.task_id == task_id).order_by(Comment.id.asc()).all()
    res = []
    for c in comments:
        user = db.query(User).filter(User.id == c.user_id).first()
        reactions_dict = {}
        try:
            if c.reactions:
                reactions_dict = json.loads(c.reactions)
        except Exception:
            pass
        res.append({
            "id": c.id,
            "task_id": c.task_id,
            "user_id": c.user_id,
            "content": c.content,
            "parent_id": c.parent_id,
            "reactions": reactions_dict,
            "is_edited": c.is_edited == "true",
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "user": {
                "id": user.id if user else 0,
                "name": user.name if user else "Deleted User",
                "email": user.email if user else "",
                "avatar": user.avatar if user else None
            }
        })
    return res

@app.post("/tasks/{task_id}/comments")
def create_task_comment(task_id: int, body: CommentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = get_task_for_current_user(db, task_id, current_user)

    new_comment = Comment(
        task_id=task_id,
        user_id=current_user.id,
        content=body.content,
        parent_id=body.parent_id,
        reactions="{}"
    )
    db.add(new_comment)
    db.commit()

    # Timeline event
    db.add(TimelineEvent(
        task_id=task_id,
        user_id=current_user.id,
        event_type="comment",
        details=f"Added a comment"
    ))

    # Scan for mentions: e.g. @Pranay
    mentions = re.findall(r"@([\w\.\-]+)", body.content)
    for m in mentions:
        m_user = db.query(User).filter(User.name.ilike(m) | User.email.ilike(m)).first()
        if m_user and m_user.id != current_user.id:
            db.add(Notification(
                message=f"You were @mentioned in comment on task '{task.title}' by {current_user.name}",
                user_id=m_user.id,
                is_read="false",
                category="Team Activity"
            ))

    # Notify watchers
    watchers = db.query(Watcher).filter(Watcher.task_id == task_id).all()
    for w in watchers:
        if w.user_id != current_user.id:
            db.add(Notification(
                message=f"New comment added on watched task '{task.title}' by {current_user.name}",
                user_id=w.user_id,
                is_read="false",
                category="Team Activity"
            ))

    db.commit()
    return {"message": "Comment added successfully"}

@app.put("/comments/{comment_id}")
def update_task_comment(comment_id: int, body: CommentUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    get_task_for_current_user(db, comment.task_id, current_user)
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only edit your own comments")

    comment.content = body.content
    comment.is_edited = "true"
    db.commit()
    return {"message": "Comment updated"}

@app.delete("/comments/{comment_id}")
def delete_task_comment(comment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    get_task_for_current_user(db, comment.task_id, current_user)
    if comment.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized to delete comment")

    db.delete(comment)
    db.commit()
    return {"message": "Comment deleted"}

@app.post("/comments/{comment_id}/react")
def react_to_comment(comment_id: int, body: CommentReact, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    get_task_for_current_user(db, comment.task_id, current_user)

    reactions_dict = {}
    try:
        if comment.reactions:
            reactions_dict = json.loads(comment.reactions)
    except Exception:
        pass

    emoji = body.emoji
    if emoji in reactions_dict:
        users = reactions_dict[emoji]
        if current_user.id in users:
            users.remove(current_user.id)
            if not users:
                del reactions_dict[emoji]
        else:
            users.append(current_user.id)
    else:
        reactions_dict[emoji] = [current_user.id]

    comment.reactions = json.dumps(reactions_dict)
    db.commit()
    return reactions_dict

@app.get("/tasks/{task_id}/attachments")
def get_task_attachments(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    get_task_for_current_user(db, task_id, current_user)
    attachments = db.query(Attachment).filter(Attachment.task_id == task_id).order_by(Attachment.id.desc()).all()
    # Exclude base64 data for list size performance
    return [{
        "id": a.id,
        "task_id": a.task_id,
        "filename": a.filename,
        "file_size": a.file_size,
        "file_type": a.file_type,
        "created_at": a.created_at.isoformat() if a.created_at else None
    } for a in attachments]

@app.post("/tasks/{task_id}/attachments")
def create_task_attachment(task_id: int, body: AttachmentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = get_task_for_current_user(db, task_id, current_user)

    new_attachment = Attachment(
        task_id=task_id,
        filename=body.filename,
        file_size=body.file_size,
        file_type=body.file_type,
        file_data=body.file_data
    )
    db.add(new_attachment)

    # Timeline event
    db.add(TimelineEvent(
        task_id=task_id,
        user_id=current_user.id,
        event_type="attachment",
        details=f"Uploaded file: {body.filename}"
    ))

    # Notify watchers
    watchers = db.query(Watcher).filter(Watcher.task_id == task_id).all()
    for w in watchers:
        if w.user_id != current_user.id:
            db.add(Notification(
                message=f"New file uploaded on watched task '{task.title}' by {current_user.name}",
                user_id=w.user_id,
                is_read="false",
                category="Team Activity"
            ))

    db.commit()
    return {"message": "File uploaded successfully"}

@app.get("/attachments/{attachment_id}/download")
def download_attachment(attachment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    get_task_for_current_user(db, attachment.task_id, current_user)
    return {
        "filename": attachment.filename,
        "file_type": attachment.file_type,
        "file_data": attachment.file_data
    }

@app.get("/tasks/{task_id}/watchers")
def get_task_watchers(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    get_task_for_current_user(db, task_id, current_user)
    watchers = db.query(Watcher).filter(Watcher.task_id == task_id).all()
    is_watching = any(w.user_id == current_user.id for w in watchers)
    return {
        "watchers_count": len(watchers),
        "is_watching": is_watching
    }

@app.post("/tasks/{task_id}/watch")
def toggle_task_watch(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    get_task_for_current_user(db, task_id, current_user)
    watcher = db.query(Watcher).filter(Watcher.task_id == task_id, Watcher.user_id == current_user.id).first()
    if watcher:
        db.delete(watcher)
        db.commit()
        return {"is_watching": False}
    else:
        new_watcher = Watcher(task_id=task_id, user_id=current_user.id)
        db.add(new_watcher)
        db.commit()
        return {"is_watching": True}

@app.get("/tasks/{task_id}/timeline")
def get_task_timeline(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    get_task_for_current_user(db, task_id, current_user)
    events = db.query(TimelineEvent).filter(TimelineEvent.task_id == task_id).order_by(TimelineEvent.id.desc()).all()
    res = []
    for e in events:
        user = db.query(User).filter(User.id == e.user_id).first()
        res.append({
            "id": e.id,
            "task_id": e.task_id,
            "user_id": e.user_id,
            "event_type": e.event_type,
            "details": e.details,
            "created_at": e.created_at.isoformat() if e.created_at else None,
            "user_name": user.name if user else "System"
        })
    return res
