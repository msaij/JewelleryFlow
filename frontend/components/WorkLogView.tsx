
import React, { useMemo, useState, useEffect } from 'react';
import { format, differenceInMinutes, isSameDay } from 'date-fns';
import { getDailyLogs, getUsers } from '../services/dataService';
import { DailyLog, User } from '../types';
import { Hammer, CheckCircle2, Clock, ArrowRight, Calendar, Filter } from 'lucide-react';
import { StageBadge } from './StageBadge';

interface WorkSession {
  id: string;
  workerName: string;
  workerStage: string;
  date: string;
  startTime: string;
  startPhoto: string;
  endTime: string | null;
  endPhoto: string | null;
  duration: string;
  status: 'Completed' | 'In Progress' | 'Abandoned';
}

export const WorkLogView: React.FC = () => {
  const [filterDate, setFilterDate] = useState<string>(format(new Date(), 'yyyy-MM-dd')); // Default to today
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [l, u] = await Promise.all([getDailyLogs(), getUsers()]);
      setDailyLogs(l);
      setUsers(u);
      setLoading(false);
    };
    fetchData();
  }, []);

  const sessions = useMemo(() => {
    // Helper to get worker details
    const getWorker = (name: string) => users.find(u => u.name === name);

    // Group by worker to pair events
    const workerGroups: Record<string, typeof dailyLogs> = {};
    dailyLogs.forEach(log => {
      if (log.type === 'StartWork' || log.type === 'CompleteWork') {
        if (!workerGroups[log.workerName]) workerGroups[log.workerName] = [];
        workerGroups[log.workerName].push(log);
      }
    });

    const results: WorkSession[] = [];

    Object.keys(workerGroups).forEach(workerName => {
      // Sort chronological
      const wLogs = workerGroups[workerName].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      const worker = getWorker(workerName);
      const stage = worker?.assignedStage || 'Unknown';

      let currentStart: typeof dailyLogs[0] | null = null;

      wLogs.forEach(log => {
        if (log.type === 'StartWork') {
          // If we were already tracking a job, the previous one was abandoned/incomplete
          if (currentStart) {
            results.push({
              id: currentStart.id,
              workerName,
              workerStage: stage,
              date: currentStart.timestamp,
              startTime: currentStart.timestamp,
              startPhoto: currentStart.photoUrl,
              endTime: null,
              endPhoto: null,
              duration: 'Abandoned',
              status: 'Abandoned'
            });
          }
          currentStart = log;
        } else if (log.type === 'CompleteWork') {
          if (currentStart) {
            // Found a valid pair
            const start = new Date(currentStart.timestamp);
            const end = new Date(log.timestamp);
            const diff = differenceInMinutes(end, start);
            const h = Math.floor(diff / 60);
            const m = diff % 60;

            results.push({
              id: currentStart.id,
              workerName,
              workerStage: stage,
              date: currentStart.timestamp,
              startTime: currentStart.timestamp,
              startPhoto: currentStart.photoUrl,
              endTime: log.timestamp,
              endPhoto: log.photoUrl,
              duration: `${h}h ${m}m`,
              status: 'Completed'
            });
            currentStart = null;
          } else {
            // Found a complete without a start (orphan)
            results.push({
              id: log.id,
              workerName,
              workerStage: stage,
              date: log.timestamp,
              startTime: log.timestamp,
              startPhoto: '',
              endTime: log.timestamp,
              endPhoto: log.photoUrl,
              duration: '--',
              status: 'Completed'
            });
          }
        }
      });

      // If still pending at the end
      if (currentStart) {
        results.push({
          id: currentStart.id,
          workerName,
          workerStage: stage,
          date: currentStart.timestamp,
          startTime: currentStart.timestamp,
          startPhoto: currentStart.photoUrl,
          endTime: null,
          endPhoto: null,
          duration: 'In Progress',
          status: 'In Progress'
        });
      }
    });

    // Sort by most recent start time
    let finalResults = results.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    // Apply Filter
    if (filterDate) {
      finalResults = finalResults.filter(s => isSameDay(new Date(s.startTime), new Date(filterDate)));
    }

    return finalResults;
  }, [filterDate, dailyLogs, users]);

  if (loading) return <div className="p-10 text-center text-gray-500">Loading work logs...</div>;

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm sticky top-16 z-20">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Task Duration Logs</h2>
          <p className="text-sm text-gray-500">Track time between 'Start Work' and 'Completed'</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Calendar className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full"
            />
          </div>
          {filterDate && (
            <button
              onClick={() => setFilterDate('')}
              className="p-2 text-gray-500 hover:text-gray-700 bg-gray-100 rounded-lg"
              title="Clear Filter"
            >
              <Filter size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Worker</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Visual Proof (Start &rarr; End)</th>
                <th className="px-6 py-4">Timing</th>
                <th className="px-6 py-4">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessions.map((session) => (
                <tr key={session.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-gray-900">{session.workerName}</span>
                      <StageBadge stage={session.workerStage} />
                      <span className="text-xs text-gray-400 mt-1">{format(new Date(session.date), 'MMM d, yyyy')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${session.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-100' :
                      session.status === 'In Progress' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                        'bg-gray-50 text-gray-500 border-gray-100'
                      }`}>
                      {session.status === 'Completed' && <CheckCircle2 size={12} />}
                      {session.status === 'In Progress' && <Hammer size={12} />}
                      {session.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-3">
                      {/* Start Photo */}
                      {session.startPhoto ? (
                        <div className="relative group">
                          <div className="w-16 h-16 rounded-lg border border-gray-200 overflow-hidden bg-gray-100">
                            <img src={session.startPhoto} className="w-full h-full object-cover" alt="Start" />
                          </div>
                          <div className="absolute -bottom-2 -right-2 bg-indigo-100 text-indigo-700 p-1 rounded-full border border-white shadow-sm">
                            <Hammer size={10} />
                          </div>
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-300">
                          <Hammer size={20} />
                        </div>
                      )}

                      <ArrowRight size={16} className="text-gray-300" />

                      {/* End Photo */}
                      {session.endPhoto ? (
                        <div className="relative group">
                          <div className="w-16 h-16 rounded-lg border border-gray-200 overflow-hidden bg-gray-100">
                            <img src={session.endPhoto} className="w-full h-full object-cover" alt="End" />
                          </div>
                          <div className="absolute -bottom-2 -right-2 bg-green-100 text-green-700 p-1 rounded-full border border-white shadow-sm">
                            <CheckCircle2 size={10} />
                          </div>
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-gray-300">
                          <Clock size={20} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 text-xs font-mono text-gray-500">
                      <div className="flex items-center gap-2">
                        <span className="w-12 text-gray-400">Start:</span>
                        <span className="text-gray-900">{format(new Date(session.startTime), 'h:mm a')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-12 text-gray-400">End:</span>
                        <span className="text-gray-900">{session.endTime ? format(new Date(session.endTime), 'h:mm a') : '...'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`text-lg font-bold font-mono ${session.status === 'Completed' ? 'text-indigo-600' : 'text-gray-400'
                      }`}>
                      {session.duration}
                    </div>
                  </td>
                </tr>
              ))}

              {sessions.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    No work logs found for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};