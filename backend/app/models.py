from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(String)
    avatar = Column(String, nullable=True)
    job_title = Column(String, nullable=True)
    department = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    location = Column(String, nullable=True)
    bio = Column(String, nullable=True)
    status = Column(String, default="active")
    subscription_plan = Column(String, default="Free")
    subscription_status = Column(String, default="active")
    billing_cycle = Column(String, default="monthly")
    renewal_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=func.now())
    last_login = Column(DateTime(timezone=True), default=func.now())


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(String)
    status = Column(String, default="pending")
    assigned_to = Column(Integer, ForeignKey("users.id"))
    priority = Column(String, default="Medium")
    due_date = Column(String, nullable=True)
    estimated_duration = Column(Integer, nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=func.now())


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    message = Column(String)
    user_id = Column(Integer, ForeignKey("users.id"))
    is_read = Column(String, default="false")
    category = Column(String, default="System Alert")
    created_at = Column(DateTime(timezone=True), default=func.now())


class WorkspaceSetting(Base):
    __tablename__ = "workspace_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True)
    value = Column(String)


class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    category = Column(String)
    rating = Column(Integer, nullable=True)
    content = Column(String)
    created_at = Column(DateTime(timezone=True), default=func.now())


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    plan = Column(String)
    amount = Column(Integer)  # in Rupees
    status = Column(String)  # "success", "failed", "pending"
    payment_method = Column(String)  # "UPI", "Card"
    created_at = Column(DateTime(timezone=True), default=func.now())


class Comment(Base):
    __tablename__ = "task_comments"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    content = Column(String)
    parent_id = Column(Integer, nullable=True)
    reactions = Column(String, default="{}") # JSON-serialized emoji reactions
    is_edited = Column(String, default="false")
    created_at = Column(DateTime(timezone=True), default=func.now())


class Attachment(Base):
    __tablename__ = "task_attachments"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    filename = Column(String)
    file_size = Column(Integer) # in bytes
    file_type = Column(String)
    file_data = Column(String) # Base64 encoded file contents
    created_at = Column(DateTime(timezone=True), default=func.now())


class Watcher(Base):
    __tablename__ = "task_watchers"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    user_id = Column(Integer, ForeignKey("users.id"))


class TimelineEvent(Base):
    __tablename__ = "task_timeline_events"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    event_type = Column(String) # "created", "assigned", "priority", "due_date", "status", "comment", "attachment", "completed"
    details = Column(String)
    created_at = Column(DateTime(timezone=True), default=func.now())