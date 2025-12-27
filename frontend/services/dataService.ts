
import { Job, User, JobLog, DailyLog, STAGES, Priority, Department } from '../types';
import { APP_KEYS } from '../constants';

// --- API CONFIG ---
// For Hybrid deployment (Netlify FE + Vercel BE), we need absolute URL
const API_BASE = import.meta.env.VITE_API_URL || '/api';




export const authenticateUser = async (username: string, pass: string): Promise<User | null> => {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: pass })
    });

    if (!res.ok) {
      console.warn("Login failed");
      return null;
    }

    return await res.json();
  } catch (e) {
    console.error(e);
    return null;
  }
};

export const authenticatePin = async (pin: string): Promise<User | null> => {
  try {
    const res = await fetch(`${API_BASE}/auth/pin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin })
    });

    if (!res.ok) {
      return null;
    }
    return await res.json();
  } catch (e) {
    console.error(e);
    return null;
  }
};

export const getSession = (): User | null => {
  try {
    const stored = localStorage.getItem(APP_KEYS.SESSION);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const setSession = (user: User) => {
  localStorage.setItem(APP_KEYS.SESSION, JSON.stringify(user));
};

export const clearSession = () => {
  localStorage.removeItem(APP_KEYS.SESSION);
};

// --- DATA ACCESS ---

export const getJobs = async (): Promise<Job[]> => {
  const res = await fetch(`${API_BASE}/jobs`);
  if (!res.ok) throw new Error("Failed to fetch jobs");
  const jobs = await res.json();
  // Ensure history is array
  return jobs.map((j: any) => ({ ...j, history: j.history || [] }));
};

export const getUsers = async (): Promise<User[]> => {
  const res = await fetch(`${API_BASE}/users`);
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
};

export const getDepartments = async (): Promise<Department[]> => {
  const res = await fetch(`${API_BASE}/departments`);
  if (!res.ok) throw new Error("Failed to fetch departments");
  return res.json();
};

export const getDailyLogs = async (): Promise<DailyLog[]> => {
  const res = await fetch(`${API_BASE}/daily-logs`);
  if (!res.ok) return []; // Fallback
  return res.json();
};

// --- MUTATIONS ---

// Helper to get ISO string in IST (approximated for client)
const getISTISOString = () => {
  // We want to offset local time to IST (+05:30) so backend receives consistent data.
  const date = new Date();

  const offset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(date.getTime() + offset);
  return istDate.toISOString().replace('Z', '+05:30');
};

export const createJob = async (image: string, priority: Priority): Promise<Job> => {
  const jobs = await getJobs();
  const newId = `J-${1000 + jobs.length + 1}`;
  const newJob = {
    id: newId,
    designImageUrl: image,
    currentStage: STAGES[0],
    priority,
    createdAt: getISTISOString(),
    history: []
  };

  const res = await fetch(`${API_BASE}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newJob)
  });
  return res.json();
};

export const advanceJob = async (jobId: string, proofPhoto: string, worker: User) => {
  const jobs = await getJobs();
  const job = jobs.find(j => j.id === jobId);
  if (!job) return;

  const currentStageIdx = STAGES.indexOf(job.currentStage as any);
  if (currentStageIdx >= STAGES.length - 1) return;
  const nextStage = STAGES[currentStageIdx + 1];

  const log: JobLog = {
    id: Date.now().toString(),
    jobId: job.id,
    stageName: job.currentStage,
    workerName: worker.name,
    proofPhotoUrl: proofPhoto,
    timestamp: getISTISOString()
  };

  // Optimistic update structure to send to backend
  const updatedJob = {
    ...job,
    currentStage: nextStage,
    history: [...job.history, log]
  };

  await fetch(`${API_BASE}/jobs/${jobId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedJob)
  });
};

export const addDailyLog = async (worker: User, type: 'Start' | 'End' | 'StartWork' | 'CompleteWork', photo: string) => {
  const newLog = {
    id: Date.now().toString(),
    workerName: worker.name,
    type,
    photoUrl: photo,
    timestamp: getISTISOString()
  };

  await fetch(`${API_BASE}/daily-logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newLog)
  });
};

export const addUser = async (user: User) => {
  await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  });
};

export const updateUser = async (updatedUser: User) => {
  // Update user

  await fetch(`${API_BASE}/users/${updatedUser.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedUser)
  });
};

export const removeUser = async (id: string) => {
  await fetch(`${API_BASE}/users/${id}`, {
    method: 'DELETE'
  });
};

export const hardReset = () => {
  localStorage.clear();
  window.location.reload();
};

// --- UPLOAD ---
export const uploadFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.url;
};

// --- DEPARTMENTS ---
export const createDepartment = async (name: string): Promise<Department> => {
  const res = await fetch(`${API_BASE}/departments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  if (!res.ok) throw new Error("Failed to create department");
  return res.json();
};

export const deleteDepartment = async (id: string) => {
  await fetch(`${API_BASE}/departments/${id}`, {
    method: 'DELETE'
  });
};