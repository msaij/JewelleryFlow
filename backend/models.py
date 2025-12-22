
from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)
    name = Column(String)
    role = Column(String)
    assignedStage = Column(String, nullable=True)

class Job(Base):
    __tablename__ = "jobs"
    id = Column(String, primary_key=True, index=True)
    designImageUrl = Column(String)
    currentStage = Column(String)
    priority = Column(String)
    createdAt = Column(String)
    history = relationship("JobLog", back_populates="job", cascade="all, delete-orphan")

class JobLog(Base):
    __tablename__ = "job_logs"
    id = Column(String, primary_key=True, index=True)
    jobId = Column(String, ForeignKey("jobs.id"))
    stageName = Column(String)
    workerName = Column(String)
    proofPhotoUrl = Column(String)
    timestamp = Column(String)
    job = relationship("Job", back_populates="history")

class DailyLog(Base):
    __tablename__ = "daily_logs"
    id = Column(String, primary_key=True, index=True)
    workerName = Column(String)
    type = Column(String)
    photoUrl = Column(String)
    timestamp = Column(String)
