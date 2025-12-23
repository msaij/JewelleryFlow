
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import uuid
import shutil
import os
import datetime
from dotenv import load_dotenv

# Firebase Imports
import firebase_admin
from firebase_admin import credentials, storage, firestore

# Load environment variables
load_dotenv()

app = FastAPI()

# CORS Configuration
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------------
# Firebase Initialization
# -------------------------------------------------------------------
cred_path = os.getenv("FIREBASE_CREDENTIALS")
cred_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
bucket_name = os.getenv("STORAGE_BUCKET")
database_name = os.getenv("FIRESTORE_DB_NAME", "jewellery-flow-db") # Default for safety

if not firebase_admin._apps:
    if cred_json:
        import json
        cred_dict = json.loads(cred_json)
        cred = credentials.Certificate(cred_dict)
    elif cred_path and os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
    else:
        print("Warning: No Firebase credentials found! Please set FIREBASE_CREDENTIALS or FIREBASE_CREDENTIALS_JSON.")
        cred = None

    if cred:
        firebase_admin.initialize_app(cred, {
            'storageBucket': bucket_name
        })

# Firestore Client
# Note: google-cloud-firestore usually auto-detects project from creds
# But we need to specify database
if database_name:
    db = firestore.client(database_id=database_name)
else:
    # Raise error or default?
    # Without database_id, it might default to (default).
    db = firestore.client()

# -------------------------------------------------------------------
# Pydantic Models (API Schemas)
# -------------------------------------------------------------------
class UserBase(BaseModel):
    username: Optional[str] = None
    name: str
    role: str
    assignedStage: Optional[str] = None

class UserCreate(UserBase):
    id: Optional[str] = None
    password: Optional[str] = None
    pin: Optional[str] = None

class User(UserBase):
    id: str
    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    username: str
    password: str

class PinLoginRequest(BaseModel):
    pin: str

class JobLogBase(BaseModel):
    stageName: str
    workerName: str
    proofPhotoUrl: Optional[str] = None
    timestamp: str

class JobLogCreate(JobLogBase):
    pass

class JobLog(JobLogBase):
    id: str
    jobId: str
    class Config:
        from_attributes = True

class JobBase(BaseModel):
    priority: str
    currentStage: str = "Start"
    designImageUrl: Optional[str] = None

class JobCreate(JobBase):
    pass

class Job(JobBase):
    id: str
    createdAt: str
    history: List[JobLog] = []
    class Config:
        from_attributes = True

class DailyLogBase(BaseModel):
    workerName: str
    type: str # 'Start', 'End', 'StartWork', 'CompleteWork'
    photoUrl: Optional[str] = None

class DailyLogCreate(DailyLogBase):
    pass

class DailyLog(DailyLogBase):
    id: str
    timestamp: str
    class Config:
        from_attributes = True


# -------------------------------------------------------------------
# Helper Functions
# -------------------------------------------------------------------
def get_timestamp():
    return datetime.datetime.now().isoformat()

# -------------------------------------------------------------------
# API Endpoints
# -------------------------------------------------------------------

@app.get("/")
def read_root():
    return {"message": "Jewelry Flow API (Firestore Edition) is running"}

# --- USERS ---

@app.get("/api/users", response_model=List[User])
def get_users():
    users_ref = db.collection('users')
    docs = users_ref.stream()
    users = []
    for doc in docs:
        users.append(User(**doc.to_dict()))
    return users

@app.post("/api/users", response_model=User)
def create_user(user: UserCreate):
    # Use provided ID if exists (rare for create), otherwise let Firestore generate Auto ID
    if user.id:
        new_ref = db.collection('users').document(user.id)
    else:
        new_ref = db.collection('users').document() # Auto ID
    
    new_id = new_ref.id
    
    user_data = user.dict()
    user_data['id'] = new_id
    
    # Store in Firestore
    new_ref.set(user_data)
    
    return User(**user_data)

@app.put("/api/users/{user_id}", response_model=User)
def update_user(user_id: str, user: UserCreate):
    user_ref = db.collection('users').document(user_id)
    doc = user_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="User not found")
        
    update_data = user.dict(exclude_unset=True)
    # Ensure ID doesn't change
    update_data['id'] = user_id
    
    user_ref.set(update_data, merge=True)
    
    # Return full object
    return User(**{**doc.to_dict(), **update_data})

@app.delete("/api/users/{user_id}")
def delete_user(user_id: str):
    user_ref = db.collection('users').document(user_id)
    doc = user_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="User not found")
        
    user_ref.delete()
    return {"status": "success", "message": f"User {user_id} deleted"}

@app.post("/api/auth/login")
def login(creds: LoginRequest):
    # Try finding by username
    users_ref = db.collection('users')
    query = users_ref.where('username', '==', creds.username).limit(1)
    docs = query.get()
    
    if not docs:
         raise HTTPException(status_code=400, detail="User not found")
    
    user_data = docs[0].to_dict()
    # In a real app, hash password check. using plain text for demo compatibility
    if user_data.get('password') != creds.password and user_data.get('pin') != creds.password: # Allow pin as password for legacy
         raise HTTPException(status_code=400, detail="Incorrect password")
         
    return User(**user_data)

@app.post("/api/auth/pin-login")
def pin_login(creds: PinLoginRequest):
    users_ref = db.collection('users')
    query = users_ref.where('pin', '==', creds.pin).limit(1)
    docs = query.get()
    
    if not docs:
         raise HTTPException(status_code=400, detail="Invalid PIN")
    
    user_data = docs[0].to_dict()
    return User(**user_data)


# --- JOBS ---

@app.get("/api/jobs", response_model=List[Job])
def get_jobs():
    jobs_ref = db.collection('jobs')
    docs = jobs_ref.stream()
    
    jobs = []
    for doc in docs:
        job_data = doc.to_dict()
        # Fetch history subcollection or array? 
        # Plan used array in document for simplicity in migration
        # Let's check how we want to store it. For simplicity, we will store history inside the job document as a list of dicts.
        # But wait, our Pydantic model expects List[JobLog].
        
        # Ensure ID is present
        if 'id' not in job_data:
            job_data['id'] = doc.id
            
        jobs.append(Job(**job_data))
        
    return jobs

@app.post("/api/jobs", response_model=Job)
def create_job(job: JobCreate):
    new_id = str(uuid.uuid4())[:8].upper() # Human readable ID
    timestamp = get_timestamp()
    
    job_data = job.dict()
    job_data['id'] = new_id
    job_data['createdAt'] = timestamp
    job_data['history'] = [] # Init empty history
    
    db.collection('jobs').document(new_id).set(job_data)
    
    return Job(**job_data)

@app.put("/api/jobs/{job_id}")
def update_job(job_id: str, job_data: dict):
    job_ref = db.collection('jobs').document(job_id)
    job_doc = job_ref.get()
    
    if not job_doc.exists:
        raise HTTPException(status_code=404, detail="Job not found")
    
    current_data = job_doc.to_dict()
    
    # Logic to merge history if it's being sent fully, or just append helpers.
    # The frontend usually sends partial updates or full object on PUT.
    # Let's assume frontend logic:
    
    # Map simple fields
    if "currentStage" in job_data:
        current_data['currentStage'] = job_data['currentStage']
        
    # History Handling: 
    # If the frontend sends a new history item in the list, we need to save it.
    # Or frontend sends full history list.
    if "history" in job_data:
         current_data['history'] = job_data['history']

    job_ref.set(current_data, merge=True)
    return Job(**current_data)


@app.post("/api/jobs/{job_id}/log")
def add_job_log(job_id: str, log: JobLogCreate):
    job_ref = db.collection('jobs').document(job_id)
    job_doc = job_ref.get()
    
    if not job_doc.exists:
        raise HTTPException(status_code=404, detail="Job not found")
        
    job_data = job_doc.to_dict()
    
    # Create Log Item
    new_log = log.dict()
    new_log['id'] = str(uuid.uuid4())
    new_log['jobId'] = job_id
    # Ensure timestamp if not provided or override? FE sends it usually.
    if not new_log.get('timestamp'):
        new_log['timestamp'] = get_timestamp()

    # Update Job
    current_history = job_data.get('history', [])
    current_history.append(new_log)
    
    update_data = {
        'history': current_history,
        'currentStage': log.stageName
    }
    
    job_ref.update(update_data)
    
    return {"status": "ok", "log": new_log}

# --- DAILY LOGS ---

@app.get("/api/daily-logs", response_model=List[DailyLog])
def get_daily_logs():
    logs_ref = db.collection('daily_logs')
    # Order by timestamp desc
    docs = logs_ref.order_by('timestamp', direction=firestore.Query.DESCENDING).stream()
    
    logs = []
    for doc in docs:
        logs.append(DailyLog(**doc.to_dict()))
    return logs

@app.post("/api/daily-logs", response_model=DailyLog)
def create_daily_log(log: DailyLogCreate):
    new_id = str(uuid.uuid4())
    log_data = log.dict()
    log_data['id'] = new_id
    log_data['timestamp'] = get_timestamp()
    
    db.collection('daily_logs').document(new_id).set(log_data)
    
    return DailyLog(**log_data)

# --- UPLOAD ---

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        # Generate unique filename
        file_ext = os.path.splitext(file.filename)[1]
        filename = f"{uuid.uuid4()}{file_ext}"
        
        # Upload to Firebase Storage
        bucket = storage.bucket()
        blob = bucket.blob(f"uploads/{filename}")
        
        # Read file content
        content = await file.read()
        
        # Upload
        blob.upload_from_string(content, content_type=file.content_type)
        
        # Make public
        blob.make_public()
        
        return {"url": blob.public_url}
        
    except Exception as e:
        print(f"Upload Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/init")
def init_data(data: dict):
    # This endpoint is kept for compatibility but effectively disabled
    # as we use migration script now.
    return {"message": "Use migration script instead"}
