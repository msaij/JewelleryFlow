
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { format, isSameDay } from 'date-fns';
import { getDailyLogs, getJobs, getUsers } from '../services/dataService';
import { STAGES, DailyLog, Job, User } from '../types';
import { Calendar, Image as ImageIcon, Sun, Moon, Briefcase, CheckCircle, UserX, Hammer, CheckCircle2 } from 'lucide-react';
import { StageBadge } from './StageBadge';

export const DailyPhotoFeed: React.FC = () => {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Data State
  const [allDailyLogs, setAllDailyLogs] = useState<DailyLog[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [logs, jobs, users] = await Promise.all([
          getDailyLogs(),
          getJobs(),
          getUsers()
        ]);
        setAllDailyLogs(logs);
        setAllJobs(jobs);
        setAllUsers(users);
      } catch (error) {
        console.error("Failed to fetch feed data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCalendarClick = () => {
    const input = dateInputRef.current;
    if (input) {
      try {
        if ('showPicker' in (input as any)) {
          (input as any).showPicker();
        } else {
          input.focus();
          input.click();
        }
      } catch (e) {
        input.focus();
      }
    }
  };

  const activityData = useMemo(() => {
    const selectedDate = new Date(date + 'T00:00:00');

    // 1. Group all workers by their assigned stage
    const workersByStage: Record<string, typeof allUsers> = {};

    // Initialize standard stages
    STAGES.forEach(stage => {
      workersByStage[stage] = [];
    });

    // Sort users into stages
    allUsers.forEach(user => {
      if (user.role === 'Worker' && user.assignedStage) {
        if (!workersByStage[user.assignedStage]) {
          workersByStage[user.assignedStage] = [];
        }
        workersByStage[user.assignedStage].push(user);
      }
    });

    // 2. Build the display data structure
    // Iterate through stages in order
    const result = STAGES.map(stage => {
      const stageWorkers = workersByStage[stage] || [];

      // Map each worker to their logs for the day
      const allWorkers = stageWorkers.map(worker => {
        // A. Daily Logs (Attendance/Updates)
        const myDailyLogs = allDailyLogs
          .filter(l => l.workerName === worker.name && isSameDay(new Date(l.timestamp), selectedDate))
          .map(l => {
            let title = 'Update';
            let color = 'bg-gray-100 text-gray-800';
            let Icon = Briefcase;

            if (l.type === 'Start') {
              title = 'Start Shift';
              color = 'bg-orange-100 text-orange-800';
              Icon = Sun;
            } else if (l.type === 'End') {
              title = 'End Shift';
              color = 'bg-gray-100 text-gray-800';
              Icon = Moon;
            } else if (l.type === 'StartWork') {
              title = 'Started Job';
              color = 'bg-indigo-100 text-indigo-800';
              Icon = Hammer;
            } else if (l.type === 'CompleteWork') {
              title = 'Completed Job';
              color = 'bg-green-100 text-green-800';
              Icon = CheckCircle2;
            }

            return {
              id: l.id,
              type: l.type,
              title,
              photo: l.photoUrl,
              time: l.timestamp,
              color,
              icon: Icon
            };
          });

        // B. Job Logs (Legacy Job Transitions if any)
        const myJobLogs = allJobs.flatMap(job =>
          job.history
            .filter(h => h.workerName === worker.name && isSameDay(new Date(h.timestamp), selectedDate))
            .map(h => ({
              id: h.id,
              type: 'Job',
              title: `Passed Job: ${job.id}`,
              photo: h.proofPhotoUrl,
              time: h.timestamp,
              color: 'bg-blue-100 text-blue-800',
              icon: CheckCircle
            }))
        );

        // Combine and Sort Chronologically
        const combinedLogs = [...myDailyLogs, ...myJobLogs].sort((a, b) =>
          new Date(a.time).getTime() - new Date(b.time).getTime()
        );

        return {
          worker,
          logs: combinedLogs
        };
      });

      // Return the stage group, keeping ALL workers regardless of logs
      return {
        stage,
        workers: allWorkers
      };
    }).filter(group => group.workers.length > 0); // Only keep stages that have assigned staff

    return result;
  }, [date, allDailyLogs, allJobs, allUsers]);

  if (loading) return <div className="text-center py-20 text-gray-400">Loading feed...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-20">
      {/* Date Picker Header */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between sticky top-16 z-20">
        <div
          className="flex items-center gap-4 cursor-pointer group"
          onClick={handleCalendarClick}
        >
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-100 transition-colors">
            <Calendar size={24} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 cursor-pointer">Activity Date</label>
            <input
              ref={dateInputRef}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="font-bold text-gray-900 bg-transparent outline-none text-lg cursor-pointer block w-full"
            />
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-gray-500">Staffed Depts</div>
          <div className="text-2xl font-bold text-indigo-900">
            {activityData.length}
          </div>
        </div>
      </div>

      {activityData.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
          <ImageIcon size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No staff configured in the system.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {activityData.map(({ stage, workers }) => {
            const totalUploads = workers.reduce((acc, w) => acc + w.logs.length, 0);

            return (
              <div key={stage} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Department Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <StageBadge stage={stage} />
                  <span className="text-xs font-medium text-gray-400">
                    {workers.length} Staff &bull; {totalUploads} Uploads
                  </span>
                </div>

                {/* List of Workers in this Department */}
                <div className="divide-y divide-gray-100">
                  {workers.map(({ worker, logs }) => (
                    <div key={worker.id} className="p-6 hover:bg-gray-50/30 transition-colors">
                      {/* Worker Info Row */}
                      <div className="flex flex-col md:flex-row md:items-start gap-6">
                        {/* Worker Badge */}
                        <div className={`flex items-center gap-3 w-48 shrink-0 pt-2 ${logs.length === 0 ? 'opacity-50 grayscale' : ''}`}>
                          <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg shadow-sm">
                            {worker.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm leading-tight">{worker.name}</h4>
                            <span className="text-xs text-gray-500">{logs.length} Uploads</span>
                          </div>
                        </div>

                        {/* Timeline / Photo Strip */}
                        {logs.length > 0 ? (
                          <div className="flex-1 overflow-x-auto pb-4 hide-scrollbar">
                            <div className="flex gap-6">
                              {logs.map((log) => {
                                const Icon = log.icon;
                                return (
                                  <div key={log.id} className="flex-none group relative w-56">
                                    {/* Thumbnail - Increased size */}
                                    <div className="aspect-square rounded-2xl overflow-hidden bg-gray-200 border border-gray-200 shadow-md mb-3 relative">
                                      <img
                                        src={log.photo}
                                        alt={log.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        loading="lazy"
                                      />
                                      <a
                                        href={log.photo}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"
                                      />
                                      {/* Mini Badge inside photo */}
                                      <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold ${log.color} shadow-sm flex items-center gap-1`}>
                                        <Icon size={12} />
                                        {log.type === 'Job' ? 'JOB' : log.type.toUpperCase()}
                                      </div>
                                    </div>

                                    {/* Caption */}
                                    <div className="px-1">
                                      <div className="flex justify-between items-center mb-1">
                                        <div className="text-xs font-bold text-gray-900 truncate flex-1 pr-2">
                                          {log.title}
                                        </div>
                                        <div className="text-xs text-gray-500 font-mono">
                                          {format(new Date(log.time), 'h:mm a')}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          // Empty State for Worker
                          <div className="flex-1 flex items-center py-4 pl-4 border-l-2 border-gray-100 border-dashed opacity-60">
                            <div className="flex items-center gap-2 text-gray-400 text-sm italic">
                              <UserX size={16} />
                              <span>No activity recorded for this date</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};