import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:Pranay%401234@localhost:5432/teampulse_db")

try:
    engine = create_engine(DATABASE_URL, connect_args={"connect_timeout": 3} if "postgresql" in DATABASE_URL else {})
    with engine.connect() as conn:
        pass
    print("Successfully connected to PostgreSQL database!")
except Exception as e:
    print(f"Failed to connect to PostgreSQL: {e}. Falling back to SQLite...")
    DATABASE_URL = "sqlite:///./teampulse.db"
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()