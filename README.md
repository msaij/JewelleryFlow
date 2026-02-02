# Jewellery Flow Tracker 💎

A powerful full-stack application for managing jewellery manufacturing workflows, tracking staff attendance, and visualizing production lines.

## 🚀 Tech Stack

*   **Backend**: Python (FastAPI) + Google Cloud Run
*   **Frontend**: React (Vite) + Tailwind CSS + Vercel
*   **Database**: Firebase Firestore (NoSQL)
*   **Storage**: Firebase Storage (Automatic WebP Compression)
*   **Authentication**: JWT (JSON Web Tokens) + Bcrypt Password Hashing
*   **Security**: Environment Variable credential management

## 🔐 Authentication & Security
*   **Secure Hashing**: Passwords are hashed with **Bcrypt** before storage.
*   **Zero-Downtime Migration**: "Lazy Migration" system automatically upgrades legacy plaintext passwords to hashes upon next login.
*   **Stateless**: Uses short-lived JWTs for API access, ensuring stateless and scalable session management.

## ✨ Key Features

### 🏭 Manufacturing Workflow
*   **Job Tracking**: End-to-end tracking from "Hand Designing" to "Completed".
*   **Proof of Work**: Workers must upload photos to advance jobs or clock in/out.
*   **Strict Sequencing**: Ensures jobs follow the correct production stages.

### 👥 Dynamic Staff Management
*   **Flexible Departments**: Create and manage customizable departments (e.g., "Polish 1", "CAD Team") via the Admin UI.
*   **Smart Assignment**: Assign workers to specific departments to filter their views.
*   **Duplicate Protection**: Smart backend checks prevent duplicate department names.

### 📸 High-Performance Media
*   **Auto-Compression**: All uploaded photos (Design, Proof, Selfie) are automatically compressed to **WebP** on the client-side.
*   **Bandwidth Saving**: Reduces file sizes by ~30% with zero loss in visual quality.

### 📊 Visualization
*   **Daily Production Feed**: A real-time, chronological feed of all shop floor activity, grouped by Department.
*   **Zoomable Previews**: High-res inspection of all uploaded work.

## 🛠️ Setup & Running

### 1. Configuration (.env)
Create a `.env` in `backend/`:
```ini
FIREBASE_CREDENTIALS=/path/to/key.json
STORAGE_BUCKET=your-bucket.appspot.com
FIRESTORE_DB_NAME=(optional)
```

### 2. Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8080
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

## ☁️ Deployment

This project uses a **Hybrid Deployment** strategy:
*   **Backend**: Deployed to **Google Cloud Run** using the `Dockerfile`.
*   **Frontend**: Deployed to **Vercel** or **Netlify**.

> See the [DEPLOYMENT.md](./DEPLOYMENT.md) guide for full instructions.

## 📂 Project Structure
*   `backend/`: FastAPI Application, Models, and API Routes.
*   `frontend/`: React Components, Hooks, and Services.
*   `frontend/utils/imageUtils.ts`: Client-side compression logic.
