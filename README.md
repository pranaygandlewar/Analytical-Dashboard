# TeamPulse - Modern SaaS Analytics & Project Management Platform

TeamPulse is an enterprise-grade, modern SaaS workspace platform featuring real-time task management trackers, interactive Recharts analytics graphs, fine-grained role-based permission matrices, server health monitors, and a contextual AI Productivity Assistant.

---

## Workspace Architecture

```
analytics-dashboard/
├── backend/                  # FastAPI Application Codebase
│   ├── app/
│   │   ├── auth.py           # JWT Authentication, Hash Helpers
│   │   ├── database.py       # SQL Alchemy connection manager
│   │   ├── main.py           # API route mappings & startup DDL migrations
│   │   ├── models.py         # SQLAlchemy Data Schema Tables
│   │   └── schemas.py        # Pydantic input-output validators
│   └── requirements.txt      # Backend Python dependencies list
└── frontend/                 # React Application Codebase
    ├── public/
    ├── src/
    │   ├── components/       # Reusable modular layouts & widgets (Avatar, CustomSelect, AIAssistant, AIInsights)
    │   ├── pages/            # View managers (Dashboard, Projects, Analytics, Settings, AdminPanel, MyTasks)
    │   ├── services/         # Axios REST APIs configurations & modular aiService models
    │   ├── store/            # Zustand state trackers (authStore)
    │   ├── App.jsx           # Lazy-routed entry point wrapper
    │   ├── index.css         # Styling system overlays & webkit adjustments
    │   └── main.jsx          # DOM rendering portal
    ├── package.json          # Frontend packages dependencies
    ├── vercel.json           # Client route mapping configurations
    └── vite.config.js        # Bundler configuration file
```

---

## Tech Stack & Features

- **Frontend**: React, Vite, Recharts, Tailwind CSS, Framer Motion, Lucide Icons, Zustand State Manager.
- **Backend**: FastAPI, SQLAlchemy ORM, Uvicorn, PostgreSQL / SQLite.
- **AI Workspace Intelligence**: Chat floating panels, Natural language parsing commands, daily recommendation summaries, automated reports export modals.
- **Workspace Administration**: Dynamic user directories, suspend switches, reset passwords, bulk deletes, role changes, dynamic permissions checklist matrix.

---

## Installation & Setup Instructions

### 1. Backend Environment Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Initialize virtual python environment:
   ```bash
   python -m venv venv
   ```
3. Activate environment:
   - **Windows**: `.\venv\Scripts\activate`
   - **MacOS/Linux**: `source venv/bin/activate`
4. Install python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Configure environment variables in `.env` or system variables:
   ```env
   DATABASE_URL=postgresql://user:pass@host:port/dbname
   JWT_SECRET=super_secret_key_pass_phrase
   ```
6. Run the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload
   ```

### 2. Frontend Development Setup

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Initialize the development build compilation server:
   ```bash
   npm run dev
   ```

---

## Production Deployment Guides

### Frontend (Vercel)
The directory is optimized for Vercel imports. Ensure `vercel.json` maps incoming routes to index fallback, and configure `VITE_API_URL` pointing to backend URLs.

### Backend (Render / Railway)
1. Set the root startup script on Render/Railway pointing to backend:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
2. Ensure database URL environment variables point to Neon PostgreSQL databases.
