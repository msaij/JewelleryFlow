# Jewellery Flow Tracker

This project is a full-stack application for tracking jewellery manufacturing workflows. It uses a FastAPI backend and a React (Vite) frontend.

## Project Structure

- `backend/`: FastAPI application.
- `frontend/`: React application (Vite).

## Prerequisites

- Python 3.8+
- Node.js 16+

## Setup & Running

### 1. Backend (FastAPI)

The backend handles the database (SQLite) and API endpoints.

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8080
```

> **Note:** The server must run on **port 8080** as the frontend is configured to proxy requests there.
> **Important:** Run the command from inside the `backend` directory so that the database path resolves correctly.

### 2. Frontend (React)

The frontend provides the user interface.

```bash
cd frontend
npm install
npm run dev
```

The application will be available at `http://localhost:3000`.

## Features

- **User Management**: Admin, Workers with specific roles (CAD, Filing, Polish, etc).
- **Job Tracking**: Track items through stages with history logs.
- **Daily Logs**: Worker check-in/out logging.
- **Image Uploads**: Upload design proofs and daily log photos.

## Verification

To verify the setup:

1. Start the backend on port 8080.
2. Visit `http://localhost:8080/docs` to see the API swagger.
3. Start the frontend and login with one of the seeded users (e.g., `rajesh`/`tanisha`).
