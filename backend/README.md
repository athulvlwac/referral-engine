# Obsidian Pulse - Backend

This is the backend for the Obsidian Pulse Referral & Fraud Command Center. It provides a RESTful API built with FastAPI, using SQLite for database storage, and SQLAlchemy as the ORM. The backend handles user authentication, referral tracking, fraud detection, and provides live metrics for the dashboard.

## Prerequisites
- Python 3.8+

## Installation and Setup

1. **Navigate to the backend directory:**
```bash
cd backend
```

2. **Create and activate a virtual environment:**
```bash
# macOS/Linux
python3 -m venv venv
source venv/bin/activate

# Windows
python -m venv venv
venv\Scripts\activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Initialize the Database & Seed Data:**
Run the seed script to create the initial tables and populate them with test data (including an admin user to access the dashboard).
```bash
python seed.py
```
*Note: The seeded Admin credentials are `admin@example.com` and `password123`.*

5. **Start the Development Server:**
```bash
uvicorn app.main:app --reload
```
The API will be available at `http://localhost:8000`.

## Architecture Details
See `architecture.md` and `spec.md` for more detailed information regarding the database schema and API endpoints.
