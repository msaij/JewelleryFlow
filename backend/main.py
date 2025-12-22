
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import exc
import models
import database
from typing import List, Optional
import os
import shutil
import json
import uuid

app = FastAPI()

# Mount static files for uploads
UPLOADS_DIR = "backend/static/uploads"
os.makedirs(UPLOADS_DIR, exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup Event: Migration
@app.on_event("startup")
def startup_event():
    # Initialize DB
    database.init_db()
    
    # Check for legacy db.json (if it somehow got put back by stash)
    LEGACY_DB_PATH = "server/db.json" # Relative to root if we run from root? No, we run from backend usually.
    # Adjust paths if needed, but we typically run uvicorn from root or backend dir. 
    # Let's assume standard structure.
    
    # Pydantic Schemas (Input/Output)
from pydantic import BaseModel

class UserCreate(BaseModel):
    id: str
    username: str
    password: str
    name: str
    role: str
    assignedStage: Optional[str] = None

class JobCreate(BaseModel):
    id: str
    designImageUrl: str
    currentStage: str
    priority: str
    createdAt: str
    history: List[dict] = []

class DailyLogCreate(BaseModel):
    id: str
    workerName: str
    type: str
    photoUrl: str
    timestamp: str

# API Endpoints

@app.get("/api/users")
def get_users(db: Session = Depends(database.get_db)):
    return db.query(models.User).all()

@app.post("/api/users")
def create_user(user: UserCreate, db: Session = Depends(database.get_db)):
    db_user = models.User(**user.dict())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.put("/api/users/{user_id}")
def update_user(user_id: str, user: UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    for key, value in user.dict().items():
        setattr(db_user, key, value)
    
    db.commit()
    return db_user

@app.delete("/api/users/{user_id}")
def delete_user(user_id: str, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        db.delete(db_user)
        db.commit()
    return {"success": True}

@app.get("/api/jobs")
def get_jobs(db: Session = Depends(database.get_db)):
    jobs = db.query(models.Job).all()
    return jobs 

@app.post("/api/jobs")
def create_job(job: JobCreate, db: Session = Depends(database.get_db)):
    db_job = models.Job(
        id=job.id,
        designImageUrl=job.designImageUrl,
        currentStage=job.currentStage,
        priority=job.priority,
        createdAt=job.createdAt
    )
    db.add(db_job)
    db.commit()
    return job

@app.put("/api/jobs/{job_id}")
def update_job(job_id: str, job_data: dict, db: Session = Depends(database.get_db)):
    db_job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Update simple fields
    db_job.currentStage = job_data.get("currentStage", db_job.currentStage)
    
    # Update History if provided
    incoming_history = job_data.get("history", [])
    existing_ids = {h.id for h in db_job.history}
    
    for h in incoming_history:
        if h["id"] not in existing_ids:
            db_log = models.JobLog(
                id=h["id"],
                jobId=job_id,
                stageName=h["stageName"],
                workerName=h["workerName"],
                proofPhotoUrl=h["proofPhotoUrl"],
                timestamp=h["timestamp"]
            )
            db.add(db_log)
    
    db.commit()
    return db_job

@app.get("/api/logs")
def get_logs(db: Session = Depends(database.get_db)):
    return db.query(models.DailyLog).all()

@app.post("/api/logs")
def create_log(log: DailyLogCreate, db: Session = Depends(database.get_db)):
    db_log = models.DailyLog(**log.dict())
    db.add(db_log)
    db.commit()
    return db_log

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    filename = f"{uuid.uuid4()}_{file.filename}"
    filepath = os.path.join(UPLOADS_DIR, filename)
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"url": f"/api/uploads/{filename}"}

@app.post("/api/init")
def init_data(data: dict, db: Session = Depends(database.get_db)):
    # This endpoint is called by frontend to seed data if empty
    # Check if we have users
    if not db.query(models.User).first():
        if "users" in data:
            for u in data["users"]:
                db_user = models.User(
                    id=u["id"],
                    username=u["username"],
                    password=u["password"],
                    name=u["name"],
                    role=u["role"],
                    assignedStage=u.get("assignedStage")
                )
                db.add(db_user)
            db.commit()
    return {"message": "Initialized"}
