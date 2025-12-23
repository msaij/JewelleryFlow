# Jewellery Flow Tracker

This project is a full-stack application for tracking jewellery manufacturing workflows. It uses a **FastAPI** backend and a **React (Vite)** frontend, powered by **Firebase Firestore** for the database and **Firebase Storage** for media assets.

## Project Structure

- `backend/`: FastAPI application (Python).
- `frontend/`: React application (TypeScript/Vite).

## Prerequisites

- Python 3.8+
- Node.js 16+
- Firebase Project Credentials (JSON file)

## Configuration (Environment Variables)

The backend requires a `.env` file in the `backend/` directory with the following variables:

```ini
# Path to your Firebase Service Account Key JSON
FIREBASE_CREDENTIALS=/absolute/path/to/serviceAccountKey.json

# OR put the JSON content directly (useful for some deployment environments)
# FIREBASE_CREDENTIALS_JSON={...}

# Name of your Firebase Storage Bucket
STORAGE_BUCKET=your-app.appspot.com

# Name of your Firestore Database (optional, defaults to jewellery-flow-db)
FIRESTORE_DB_NAME=jewellery-flow-db
```

## Setup & Running

### 1. Backend (FastAPI)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and configure your `.env` file (see above).
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the server:
   ```bash
   uvicorn main:app --reload --port 8080
   ```

> **Note:** The server runs on **port 8080**.

### 2. Frontend (React)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173` (or the port Vite assigns).

## Features

- **User Management**: Admin interface to add/edit/remove staff.
- **Attendance**: Workers check-in/out with photos.
- **Job Tracking**: Move jobs through manufacturing stages (CAD, Polish, Setting, etc.) with proof photos.
- **Daily Feed**: A visual timeline of all shop floor activity.
- **Task Duration**: Track time spent on specific tasks.

## Troubleshooting

- **Images not loading?** Ensure `STORAGE_BUCKET` is correct and the bucket has public read rules or proper tokens.
- **Login failing?** Ensure the backend is running and connected to Firestore. The seeding script (`backend/wipe_and_seed_v2.py`) can be used to reset data if needed.
