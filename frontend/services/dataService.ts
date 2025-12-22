
import { Job, User, JobLog, DailyLog, STAGES, Priority } from '../types';
import { APP_KEYS } from '../constants';

// --- API CONFIG ---
const API_BASE = '/api';

// --- INITIALIZATION & SEEDING ---

export const initializeData = async () => {
  // Calling the init endpoint to ensure DB has seed data
  // We pass the SEED_USERS just in case, but really the backend has manual migration logic or we can just send it.
  // For now, let's just hit the endpoint. The backend init logic we wrote checks if users exist.
  // We can re-use the SEED_USERS constant if we want to send it.

  // We won't redefine SEED_USERS here to keep it clean, relying on backend simply existing.
  // Actually, the backend `init_data` endpoint EXPECTS `data` dict.

  // Let's bring back SEED_USERS lightly if needed, or better, just trust the migration logic
  // we built in main.py which migrates from db.json.
  // PRO TIP: If db.json is gone, we might need seeding.
  // Let's define a minimal seed set just in case.

  const SEED_USERS: User[] = [
    // New Admins
    { id: 'admin_rajesh', name: 'Rajesh Kumar Soni', username: 'rajesh', password: 'tanisha', role: 'Admin' },
    { id: 'admin_prem', name: 'Prem Ratan Soni', username: 'prem', password: 'tanisha', role: 'Admin' },
    { id: 'admin_sid', name: 'Siddharth Soni', username: 'sid', password: 'tanisha', role: 'Admin' },

    // Hand Designing
    { id: 'hd1', name: 'Sameer Hand Designing', username: 'sameer', password: 'password', role: 'Worker', assignedStage: 'Hand Designing' },
    { id: 'hd2', name: 'Sujay Hand Designing', username: 'sujay', password: 'password', role: 'Worker', assignedStage: 'Hand Designing' },
    { id: 'hd3', name: 'Roshan Hand Designing', username: 'roshan', password: 'password', role: 'Worker', assignedStage: 'Hand Designing' },
    { id: 'hd4', name: 'Sagar Hand Designing', username: 'sagar', password: 'password', role: 'Worker', assignedStage: 'Hand Designing' },

    // CAD
    { id: 'cad1', name: 'Atanu CAD', username: 'atanu', password: 'password', role: 'Worker', assignedStage: 'CAD' },
    { id: 'cad2', name: 'Aravind CAD', username: 'aravind', password: 'password', role: 'Worker', assignedStage: 'CAD' },
    { id: 'cad3', name: 'Aftab CAD', username: 'aftab', password: 'password', role: 'Worker', assignedStage: 'CAD' },
    { id: 'cad4', name: 'Sarfaraz CAD', username: 'sarfaraz', password: 'password', role: 'Worker', assignedStage: 'CAD' },
    { id: 'cad5', name: 'Subhir CAD', username: 'subhir', password: 'password', role: 'Worker', assignedStage: 'CAD' },
    { id: 'cad6', name: 'Preetam CAD', username: 'preetam', password: 'password', role: 'Worker', assignedStage: 'CAD' },
    { id: 'cad7', name: 'Surjeet CAD', username: 'surjeet', password: 'password', role: 'Worker', assignedStage: 'CAD' },
    { id: 'cad8', name: 'Kushal CAD', username: 'kushal', password: 'password', role: 'Worker', assignedStage: 'CAD' },
    { id: 'cad9', name: 'Subha CAD', username: 'subha', password: 'password', role: 'Worker', assignedStage: 'CAD' },
    { id: 'cad10', name: 'Pushpender CAD', username: 'pushpender', password: 'password', role: 'Worker', assignedStage: 'CAD' },
    { id: 'cad11', name: 'Bapi CAD', username: 'bapi', password: 'password', role: 'Worker', assignedStage: 'CAD' },

    // Ghat (Filing)
    { id: 'gh1', name: 'Sukumar Ghat', username: 'sukumar', password: 'password', role: 'Worker', assignedStage: 'Ghat (Filing)' },
    { id: 'gh2', name: 'Vishwajith Ghat', username: 'vishwajith', password: 'password', role: 'Worker', assignedStage: 'Ghat (Filing)' },
    { id: 'gh3', name: 'Rajesh Ghat', username: 'rajesh_ghat', password: 'password', role: 'Worker', assignedStage: 'Ghat (Filing)' },
    { id: 'gh4', name: 'Amar Ghat', username: 'amar', password: 'password', role: 'Worker', assignedStage: 'Ghat (Filing)' },
    { id: 'gh5', name: 'Nirmal Ghat', username: 'nirmal', password: 'password', role: 'Worker', assignedStage: 'Ghat (Filing)' },
    { id: 'gh6', name: 'Manas Ghat', username: 'manas', password: 'password', role: 'Worker', assignedStage: 'Ghat (Filing)' },
    { id: 'gh7', name: 'Jayanth Ghat', username: 'jayanth', password: 'password', role: 'Worker', assignedStage: 'Ghat (Filing)' },

    // Polish 1
    { id: 'p1_1', name: 'Alttap Polish 1', username: 'alttap', password: 'password', role: 'Worker', assignedStage: 'Polish 1' },
    { id: 'p1_2', name: 'Tanmay Polish 1', username: 'tanmay', password: 'password', role: 'Worker', assignedStage: 'Polish 1' },

    // Polish 2
    { id: 'p2_1', name: 'Laltoo Polish 2', username: 'laltoo', password: 'password', role: 'Worker', assignedStage: 'Polish 2' },
    { id: 'p2_2', name: 'Somen Polish 2', username: 'somen', password: 'password', role: 'Worker', assignedStage: 'Polish 2' },

    // Setting (Assigned to Diamond Setting)
    { id: 'set1', name: 'Abhijit Setting', username: 'abhijit', password: 'password', role: 'Worker', assignedStage: 'Diamond Setting' },
    { id: 'set2', name: 'Amresh Setting', username: 'amresh', password: 'password', role: 'Worker', assignedStage: 'Diamond Setting' },
    { id: 'set3', name: 'Assu Setting', username: 'assu', password: 'password', role: 'Worker', assignedStage: 'Diamond Setting' },
    { id: 'set4', name: 'Avikdas Setting', username: 'avikdas', password: 'password', role: 'Worker', assignedStage: 'Diamond Setting' },
    { id: 'set5', name: 'Biwas Setting', username: 'biwas', password: 'password', role: 'Worker', assignedStage: 'Diamond Setting' },
    { id: 'set6', name: 'Shariful Setting', username: 'shariful', password: 'password', role: 'Worker', assignedStage: 'Diamond Setting' },
    { id: 'set7', name: 'Orajith Setting', username: 'orajith', password: 'password', role: 'Worker', assignedStage: 'Diamond Setting' },
    { id: 'set8', name: 'Shibu Setting', username: 'shibu', password: 'password', role: 'Worker', assignedStage: 'Diamond Setting' },
    { id: 'set9', name: 'Somnath Setting', username: 'somnath', password: 'password', role: 'Worker', assignedStage: 'Diamond Setting' },
    { id: 'set10', name: 'Subrata Setting', username: 'subrata', password: 'password', role: 'Worker', assignedStage: 'Diamond Setting' },
    { id: 'set11', name: 'Vijay Setting', username: 'vijay', password: 'password', role: 'Worker', assignedStage: 'Diamond Setting' },
    { id: 'set12', name: 'Suman Setting', username: 'suman', password: 'password', role: 'Worker', assignedStage: 'Diamond Setting' },
    { id: 'set13', name: 'Ramu Setting', username: 'ramu', password: 'password', role: 'Worker', assignedStage: 'Diamond Setting' },

    // Stringing
    { id: 'str1', name: 'Ambhu Stringing', username: 'ambhu', password: 'password', role: 'Worker', assignedStage: 'Stringing' },
    { id: 'str2', name: 'Jaipal Stringing', username: 'jaipal', password: 'password', role: 'Worker', assignedStage: 'Stringing' },
    { id: 'str3', name: 'Chandher Stringing', username: 'chandher', password: 'password', role: 'Worker', assignedStage: 'Stringing' },
    { id: 'str4', name: 'Dinesh Stringing', username: 'dinesh', password: 'password', role: 'Worker', assignedStage: 'Stringing' },
    { id: 'str5', name: 'Vishnu Stringing', username: 'vishnu', password: 'password', role: 'Worker', assignedStage: 'Stringing' },

    // Kundan Ghat
    { id: 'kg1', name: 'Sujith Kundan', username: 'sujith', password: 'password', role: 'Worker', assignedStage: 'Kundan Ghat' },
    { id: 'kg2', name: 'Jagnath Kundan', username: 'jagnath', password: 'password', role: 'Worker', assignedStage: 'Kundan Ghat' },
    { id: 'kg3', name: 'Srikanth Kundan', username: 'srikanth', password: 'password', role: 'Worker', assignedStage: 'Kundan Ghat' },
    { id: 'kg4', name: 'Harshawardhan Kundan', username: 'harshawardhan', password: 'password', role: 'Worker', assignedStage: 'Kundan Ghat' },
    { id: 'kg5', name: 'Krishna Kundan', username: 'krishna', password: 'password', role: 'Worker', assignedStage: 'Kundan Ghat' },
    { id: 'kg6', name: 'Somnath Kundan', username: 'somnath_kg', password: 'password', role: 'Worker', assignedStage: 'Kundan Ghat' },
    { id: 'kg7', name: 'Jagdish Kundan', username: 'jagdish', password: 'password', role: 'Worker', assignedStage: 'Kundan Ghat' },
    { id: 'kg8', name: 'Yadgiree Kundan', username: 'yadgiree', password: 'password', role: 'Worker', assignedStage: 'Kundan Ghat' },
  ];

  try {
    await fetch(`${API_BASE}/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ users: SEED_USERS })
    });
  } catch (e) {
    console.error("Init failed", e);
  }
};

// --- USER AUTH ---

export const authenticateUser = async (username: string, pass: string): Promise<User | null> => {
  try {
    await initializeData(); // Ensure data is present
    const users = await getUsers();
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === pass);
    return user || null;
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

export const getDailyLogs = async (): Promise<DailyLog[]> => {
  const res = await fetch(`${API_BASE}/logs`);
  if (!res.ok) return []; // Fallback
  return res.json();
};

// --- MUTATIONS ---

export const createJob = async (image: string, priority: Priority): Promise<Job> => {
  const jobs = await getJobs();
  const newId = `J-${1000 + jobs.length + 1}`;
  const newJob = {
    id: newId,
    designImageUrl: image,
    currentStage: STAGES[0],
    priority,
    createdAt: new Date().toISOString(),
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
    timestamp: new Date().toISOString()
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
    timestamp: new Date().toISOString()
  };

  await fetch(`${API_BASE}/logs`, {
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
  // Validate admin logic could be here or backend. 
  // Keeping it simple.
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