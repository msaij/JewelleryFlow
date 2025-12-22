export type Role = 'Admin' | 'Worker';

export type Priority = 'Normal' | 'High' | 'Urgent';

export interface User {
  id: string;
  username: string;
  password: string; // In a real app, this should be hashed.
  name: string;
  role: Role;
  assignedStage?: string; // Required if role is Worker
}

export interface Job {
  id: string;
  designImageUrl: string;
  currentStage: string;
  priority: Priority;
  createdAt: string; // ISO Date string
  history: JobLog[];
}

export interface JobLog {
  id: string;
  jobId: string;
  stageName: string;
  workerName: string;
  proofPhotoUrl: string;
  timestamp: string;
}

export interface DailyLog {
  id: string;
  workerName: string;
  type: 'Start' | 'End' | 'StartWork' | 'CompleteWork';
  photoUrl: string;
  timestamp: string;
}

// The Strict Order of Production
export const STAGES = [
  "Hand Designing",
  "CAD",
  "Ghat (Filing)",
  "Polish 1",
  "Diamond Setting",
  "Polish 2",
  "Stone Setting",
  "Stringing",
  "Kundan Ghat",
  "Completed"
] as const;

export type StageName = typeof STAGES[number];