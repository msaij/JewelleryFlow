
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
import firebase_admin
from firebase_admin import credentials, storage
from dotenv import load_dotenv

# Load env variables
load_dotenv()

# Initialize Firebase
if not firebase_admin._apps:
    bucket_name = os.getenv("STORAGE_BUCKET")
    if not bucket_name:
        raise ValueError("Missing STORAGE_BUCKET environment variable")

    # Check for credentials JSON string (Better for production/deployment)
    firebase_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
    
    if firebase_json:
        # Parse the JSON string directly
        cred_dict = json.loads(firebase_json)
        cred = credentials.Certificate(cred_dict)
    else:
        # Fallback to file path (Better for local development)
        cred_path = os.getenv("FIREBASE_CREDENTIALS")
        if not cred_path:
             raise ValueError("Missing authentication. Set FIREBASE_CREDENTIALS_JSON (raw content) or FIREBASE_CREDENTIALS (file path).")
        cred = credentials.Certificate(cred_path)

    firebase_admin.initialize_app(cred, {
        'storageBucket': bucket_name
    })

app = FastAPI()

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
    # Upload to Firebase Storage
    try:
        bucket = storage.bucket()
        filename = f"uploads/{uuid.uuid4()}_{file.filename}"
        blob = bucket.blob(filename)
        
        # Determine content type
        content_type = file.content_type
        if not content_type:
             content_type = "application/octet-stream"
             
        blob.upload_from_file(file.file, content_type=content_type)
        blob.make_public()
        
        return {"url": blob.public_url}
    except Exception as e:
        print(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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
