from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from .database import engine, SessionLocal, Base
from .models import User, Task, Notification, WorkspaceSetting, Feedback
from .schemas import UserCreate, UserLogin, TaskCreate, TaskUpdate, ProfileUpdate, PasswordUpdate
from fastapi.middleware.cors import CORSMiddleware
from .auth import (
    hash_password,
    verify_password,
    create_access_token,
    verify_token
)
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
from sqlalchemy import text
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

db_mig.close()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:5176"
    ],
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


security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    payload = verify_token(token)

    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    email = payload.get("sub")

    user = db.query(User).filter(
        User.email == email
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return user


@app.get("/")
def home():
    return {"message": "TeamPulse Backend Running"}


@app.post("/signup")
def signup(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

    new_user = User(
        name=user.name,
        email=user.email,
        password=hash_password(user.password),
        role=user.role
    )

    db.add(new_user)
    db.commit()

    return {"message": "User created successfully"}


@app.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if not db_user:
        raise HTTPException(
            status_code=400,
            detail="Invalid credentials"
        )

    if not verify_password(
        user.password,
        db_user.password
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid credentials"
        )

    if db_user.status == "suspended":
        raise HTTPException(
            status_code=403,
            detail="Your account has been suspended. Please contact your administrator."
        )

    db_user.last_login = datetime.utcnow()
    db.commit()

    token = create_access_token({
        "sub": db_user.email,
        "role": db_user.role,
        "name": db_user.name
    })

    return {
        "message": "Login successful",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": db_user.id,
            "name": db_user.name,
            "email": db_user.email,
            "role": db_user.role,
            "avatar": db_user.avatar,
            "job_title": db_user.job_title,
            "department": db_user.department,
            "phone": db_user.phone,
            "location": db_user.location,
            "bio": db_user.bio,
            "status": db_user.status or "active",
            "subscription_plan": db_user.subscription_plan or "Free",
            "subscription_status": db_user.subscription_status or "active",
            "billing_cycle": db_user.billing_cycle or "monthly",
            "renewal_date": db_user.renewal_date.isoformat() if db_user.renewal_date else None,
            "created_at": db_user.created_at.isoformat() if db_user.created_at else None,
            "last_login": db_user.last_login.isoformat() if db_user.last_login else None
        }
    }


@app.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
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
        "status": current_user.status or "active",
        "subscription_plan": current_user.subscription_plan or "Free",
        "subscription_status": current_user.subscription_status or "active",
        "billing_cycle": current_user.billing_cycle or "monthly",
        "renewal_date": current_user.renewal_date.isoformat() if current_user.renewal_date else None,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        "last_login": current_user.last_login.isoformat() if current_user.last_login else None
    }


@app.get("/users")
def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    users = db.query(User).all()

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
        existing = db.query(User).filter(
            User.email == profile_data.email,
            User.id != current_user.id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already taken")
        current_user.email = profile_data.email
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
    if not verify_password(pwd_data.current_password, current_user.password):
        raise HTTPException(status_code=400, detail="Invalid current password")
    
    current_user.password = hash_password(pwd_data.new_password)
    db.commit()

    # Also log an Account Update notification for the user
    pwd_note = Notification(
        message="Account password changed successfully",
        user_id=current_user.id,
        is_read="false",
        category="System Alert"
    )
    db.add(pwd_note)
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

    if task_update.title is not None:
        task.title = task_update.title
    if task_update.description is not None:
        task.description = task_update.description
    if task_update.assigned_to is not None:
        assigned_user = db.query(User).filter(User.id == task_update.assigned_to).first()
        if not assigned_user:
            raise HTTPException(
                status_code=400,
                detail="Assigned user not found"
            )
        task.assigned_to = task_update.assigned_to
    if task_update.priority is not None:
        task.priority = task_update.priority
    if task_update.due_date is not None:
        task.due_date = task_update.due_date
    if task_update.estimated_duration is not None:
        task.estimated_duration = task_update.estimated_duration
    if task_update.status is not None:
        task.status = task_update.status
        if task_update.status == "completed":
            task.completed_at = datetime.utcnow()
        else:
            task.completed_at = None

    db.commit()

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
    task = db.query(Task).filter(
        Task.id == task_id
    ).first()

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

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
    user.password = hash_password(new_pwd)
    db.commit()
    return {"message": "Password reset successfully"}


@app.post("/users/invite")
def invite_user(invite_payload: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can invite users")
    email = invite_payload.get("email")
    name = invite_payload.get("name", "Invited User")
    role = invite_payload.get("role", "member")
    department = invite_payload.get("department", "Engineering")
    
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    invited_user = User(
        name=name,
        email=email,
        role=role,
        department=department,
        password=hash_password("TeamPulse123!"),
        status="invited"
    )
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