import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("CRITICAL: DATABASE_URL environment variable is missing. Startup aborted.", file=sys.stderr)
    sys.exit("DATABASE_URL environment variable is missing.")

# Convert legacy Heroku/Render schema "postgres://" to modern "postgresql://" if present
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        pass
    print("Successfully connected to database!")
except Exception as e:
    print(f"CRITICAL: Failed to connect to database: {e}", file=sys.stderr)
    sys.exit(f"Database connection check failed: {e}")

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()