import React, { useState, useEffect } from 'react';
import { User, Job, STAGES, Priority } from './types';
import * as db from './services/dataService';
import { LoginPage } from './components/LoginPage';
import { JobCard } from './components/JobCard';
import { PhotoUploadModal } from './components/PhotoUploadModal';
import { DailyLogModal } from './components/DailyLogModal';
import { UserManagement } from './components/UserManagement';
import { ActivityLogView } from './components/ActivityLogView';
import { DailyPhotoFeed } from './components/DailyPhotoFeed';
import { WorkLogView } from './components/WorkLogView';
import { Users, LogOut, Plus, ClipboardList, Images, Sun, Moon, Hammer, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  // 'attendance' is now the home/default view
  const [activeTab, setActiveTab] = useState<'attendance' | 'production' | 'activity' | 'staff'>('attendance');
  const [isUploading, setIsUploading] = useState(false);

  // Modal States
  const [jobToAdvance, setJobToAdvance] = useState<Job | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDailyLogOpen, setIsDailyLogOpen] = useState(false);
  const [dailyLogType, setDailyLogType] = useState<'Start' | 'End' | 'StartWork' | 'CompleteWork' | null>(null);

  const [isOnShift, setIsOnShift] = useState(false);

  // Initialize
  useEffect(() => {
    const session = db.getSession();
    if (session) {
      setUser(session);
      loadData(session);
    }
  }, []);

  const loadData = async (currentUser?: User) => {
    setJobs(await db.getJobs()); // await properly

    // Check shift status
    const actualUser = currentUser || user;
    if (actualUser && actualUser.role === 'Worker') {
      const logs = await db.getDailyLogs();
      // Filter for today and this user
      // Note: Backend timestamps are IST ISO strings.
      // Simple string match on yyyy-mm-dd might be tricky depending on how ISO string looks (+05:30)
      // But actually, we just need to find the LATEST log for this user.
      // If it is 'Start', they are on shift. If 'End', they are off.

      const userLogs = logs
        .filter(l => l.workerName === actualUser.name)
        // Sort by timestamp desc (newest first)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      if (userLogs.length > 0) {
        const lastLog = userLogs[0];
        // Check if the last log was from TODAY (to avoid detecting yesterday's start if they forgot to End)
        const logDate = new Date(lastLog.timestamp).toDateString();
        const today = new Date().toDateString(); // Local client today.

        // If last log was today AND it was 'Start' -> On Shift
        if (logDate === today && lastLog.type === 'Start') {
          setIsOnShift(true);
        } else {
          setIsOnShift(false);
        }
      } else {
        setIsOnShift(false);
      }
    }
  };

  const handleLogout = () => {
    db.clearSession();
    setUser(null);
    setIsOnShift(false);
  };

  const handleAdvanceJob = async (file: File) => {
    if (!jobToAdvance || !user) return;
    const url = await db.uploadFile(file);
    db.advanceJob(jobToAdvance.id, url, user);
    loadData();
  };

  const handleCreateJob = async (file: File) => {
    // Default to Normal priority for simplicity
    const url = await db.uploadFile(file);
    await db.createJob(url, 'Normal'); // await
    loadData();
  };

  const handleDailyLog = async (file: File, type: 'Start' | 'End' | 'StartWork' | 'CompleteWork') => {
    if (!user) return;
    setIsUploading(true);
    try {
      const url = await db.uploadFile(file);
      await db.addDailyLog(user, type, url);
      setIsDailyLogOpen(false);
      setDailyLogType(null);
      loadData(); // Reload to update shift status
    } catch (e) {
      alert("Error uploading daily log");
    } finally {
      setIsUploading(false);
    }
  };

  const openDailyLog = (type: 'Start' | 'End' | 'StartWork' | 'CompleteWork') => {
    setDailyLogType(type);
    setIsDailyLogOpen(true);
  };

  // If not logged in
  if (!user) {
    return <LoginPage onLogin={(u) => { setUser(u); loadData(u); }} />;
  }

  // --- WORKER VIEW ---
  if (user.role === 'Worker') {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col pb-20">
        <header className="bg-white shadow-sm px-6 py-5 flex justify-between items-center sticky top-0 z-10">
          <div>
            <h1 className="font-bold text-xl text-indigo-900 leading-none">{user.name}</h1>
            <p className="text-sm text-gray-500 mt-1">{user.assignedStage}</p>
          </div>
          <button onClick={handleLogout} className="p-2 bg-gray-50 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
            <LogOut size={20} />
          </button>
        </header>

        <main className="flex-1 p-4 flex flex-col justify-center max-w-lg mx-auto w-full gap-4">

          {/* STATE A: NOT STARTED */}
          {!isOnShift && (
            <button
              onClick={() => openDailyLog('Start')}
              className="bg-white group relative overflow-hidden rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center gap-6 hover:shadow-md transition-all active:scale-98 animate-in fade-in zoom-in duration-300"
            >
              <div className="bg-orange-100 text-orange-600 p-6 rounded-full group-hover:bg-orange-200 transition-colors">
                <Sun size={48} />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900">Start Day</h2>
                <p className="text-gray-500 mt-1">Check-in to begin work</p>
              </div>
            </button>
          )}

          {/* STATE B: ON SHIFT */}
          {isOnShift && (
            <>
              {/* Start New Work */}
              <button
                onClick={() => openDailyLog('StartWork')}
                className="bg-white group relative overflow-hidden rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-6 hover:shadow-md transition-all active:scale-98"
              >
                <div className="bg-indigo-100 text-indigo-600 p-4 rounded-full group-hover:bg-indigo-200 transition-colors">
                  <Hammer size={32} />
                </div>
                <div className="text-left">
                  <h2 className="text-xl font-bold text-gray-900">Start New Work</h2>
                  <p className="text-sm text-gray-500">Log new task start</p>
                </div>
              </button>

              {/* Completed Photo */}
              <button
                onClick={() => openDailyLog('CompleteWork')}
                className="bg-green-600 group relative overflow-hidden rounded-2xl shadow-lg shadow-green-200 p-8 flex flex-col items-center justify-center gap-3 text-center hover:bg-green-700 transition-all active:scale-98"
              >
                <div className="bg-white/20 text-white p-5 rounded-full backdrop-blur-sm mb-1">
                  <CheckCircle2 size={40} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Completed Photo</h2>
                  <p className="text-green-100">Upload finished work</p>
                </div>
              </button>

              {/* Divider */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-gray-100 px-3 text-gray-500 font-medium">Shift Complete?</span>
                </div>
              </div>

              {/* End Day Button */}
              <button
                onClick={() => openDailyLog('End')}
                className="bg-white group relative overflow-hidden rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-6 hover:shadow-md transition-all active:scale-98"
              >
                <div className="bg-gray-100 text-gray-600 p-4 rounded-full group-hover:bg-gray-200 transition-colors">
                  <Moon size={32} />
                </div>
                <div className="text-left">
                  <h2 className="text-xl font-bold text-gray-900">End Day</h2>
                  <p className="text-sm text-gray-500">Check-out attendance</p>
                </div>
              </button>
            </>
          )}

        </main>

        <DailyLogModal
          isOpen={isDailyLogOpen}
          initialType={dailyLogType}
          onClose={() => { setIsDailyLogOpen(false); setDailyLogType(null); }}
          onUpload={handleDailyLog}
          isUploading={isUploading}
        />
      </div>
    );
  }

  // --- ADMIN VIEW ---
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="px-4 h-16 flex items-center justify-between max-w-7xl mx-auto w-full">
          <div className="font-bold text-xl text-indigo-800 tracking-tight">JewelleryFlow</div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600 hidden sm:block">{user.name}</span>
            <button onClick={handleLogout} title="Logout" className="text-gray-400 hover:text-red-500 transition-colors">
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* Admin Tabs */}
        <div className="flex justify-center gap-2 sm:gap-6 text-sm font-medium border-t border-gray-100 bg-gray-50/50 px-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`py-3 px-2 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'attendance' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <ClipboardList size={16} /> Attendance
          </button>
          <button
            onClick={() => setActiveTab('production')}
            className={`py-3 px-2 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'production' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <Hammer size={16} /> Work Logs
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`py-3 px-2 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'activity' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <Images size={16} /> Daily Feed
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`py-3 px-2 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'staff' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <Users size={16} /> Staff
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">

        {/* ATTENDANCE VIEW (Table) */}
        {activeTab === 'attendance' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Department Attendance</h2>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium shadow-md hover:bg-indigo-700 flex items-center gap-2 text-sm"
              >
                <Plus size={18} /> New Job
              </button>
            </div>
            <ActivityLogView />
          </div>
        )}

        {/* PRODUCTION LOGS VIEW */}
        {activeTab === 'production' && (
          <WorkLogView />
        )}

        {/* DAILY ACTIVITY VIEW (Photos) */}
        {activeTab === 'activity' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Daily Production Feed</h2>
            <DailyPhotoFeed />
          </div>
        )}

        {/* STAFF MANAGEMENT */}
        {activeTab === 'staff' && <UserManagement />}
      </main>

      <PhotoUploadModal
        isOpen={isCreateOpen}
        title="Start New Job Design"
        onClose={() => setIsCreateOpen(false)}
        onConfirm={handleCreateJob}
      />
    </div>
  );
}