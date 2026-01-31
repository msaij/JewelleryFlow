
import React, { useMemo, useState, useEffect } from 'react';
import { format, differenceInMinutes, isSameDay } from 'date-fns';
import { getDailyLogs, getUsers, getDepartments } from '../services/dataService';
import { DailyLog, User, Department } from '../types';
import { Hammer, CheckCircle2, Clock, ArrowRight, Calendar, Filter, X, ZoomIn } from 'lucide-react';
import { StageBadge } from './StageBadge';
import { SearchableSelect } from './SearchableSelect';

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
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedStage, setSelectedStage] = useState<string>('All');
  const [selectedWorker, setSelectedWorker] = useState<string>('All');

  // Preview Modal State
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string, subtitle: string } | null>(null);

  // Unique Workers for Filter
  const availableWorkers = useMemo(() => {
    const workerList = users.filter(u => u.role === 'Worker');
    if (selectedStage === 'All') return workerList;
    return workerList.filter(u => {
      const dept = departments.find(d => d.id === u.departmentId);
      return dept?.name === selectedStage;
    });
  }, [users, selectedStage]);

  useEffect(() => {
    const fetchData = async () => {
      const [l, u, d] = await Promise.all([getDailyLogs(), getUsers(), getDepartments()]);
      setDailyLogs(l);
      setUsers(u);
      setDepartments(d);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Process logs into Worker Groups
  // Top Level Sort: Worker Name (A-Z)
  // Inner Sort: Task Time (Newest First)
  const groupedSessions = useMemo(() => {
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

    // Process into grouped structure
    const groups: { workerName: string; workerStage: string; sessions: WorkSession[] }[] = [];

    Object.keys(workerGroups).forEach(workerName => {
      // Sort logs chronologically
      const wLogs = workerGroups[workerName].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      const worker = getWorker(workerName);
      const stage = (() => {
        if (worker?.departmentId) {
          return departments.find(d => d.id === worker.departmentId)?.name || 'Unknown';
        }
        return 'Unknown';
      })();

      // Filters: Stage and Worker Name
      if (selectedStage !== 'All' && stage !== selectedStage) return;
      if (selectedWorker !== 'All' && workerName !== selectedWorker) return;

      const workerSessions: WorkSession[] = [];

      // Separate Starts and Completes
      const starts = wLogs.filter(l => l.type === 'StartWork');
      const completes = wLogs.filter(l => l.type === 'CompleteWork');

      // Track consumed IDs to avoid double counting
      const consumedStartIds = new Set<string>();
      const consumedCompleteIds = new Set<string>();

      // PASS 1: Explicit Links (New Feature)
      // Checks for 'relatedLogId' to explicitly pair a completion with a specific start time.
      // This supports parallel tasks (multiple starts open at once) by linking exact IDs.
      completes.forEach(comp => {
        if (comp.relatedLogId) {
          const startLog = starts.find(s => s.id === comp.relatedLogId);
          if (startLog) {
            // Found a match
            consumedStartIds.add(startLog.id);
            consumedCompleteIds.add(comp.id);

            const start = new Date(startLog.timestamp);
            const end = new Date(comp.timestamp);
            const diff = differenceInMinutes(end, start);
            const h = Math.floor(diff / 60);
            const m = diff % 60;

            workerSessions.push({
              id: startLog.id,
              workerName,
              workerStage: stage,
              date: startLog.timestamp,
              startTime: startLog.timestamp,
              startPhoto: startLog.photoUrl,
              endTime: comp.timestamp,
              endPhoto: comp.photoUrl,
              duration: `${h}h ${m}m`,
              status: 'Completed'
            });
          }
        }
      });

      // PASS 2: Legacy Chronological Pairing (Backwards Compatibility)
      // Iterate through REMAINING completes and try to find the nearest preceding REMAINING start
      const remainingCompletes = completes.filter(c => !consumedCompleteIds.has(c.id));
      const remainingStarts = starts.filter(s => !consumedStartIds.has(s.id));

      // Re-sort for chronological processing
      // We essentially simulate the old "state machine" but only on unpaired items
      let currentStart: typeof dailyLogs[0] | null = null;

      // Merge remaining items back into a timeline
      const timeline = [...remainingStarts, ...remainingCompletes].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      timeline.forEach(log => {
        if (log.type === 'StartWork') {
          if (currentStart) {
            // Abandoned previous (in legacy logic, a new start kills the old open one)
            workerSessions.push({
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
            // Completed Pair
            const start = new Date(currentStart.timestamp);
            const end = new Date(log.timestamp);
            const diff = differenceInMinutes(end, start);
            const h = Math.floor(diff / 60);
            const m = diff % 60;

            workerSessions.push({
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
            // Orphan Complete
            workerSessions.push({
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

      // Any remaining currentStart is In Progress
      if (currentStart) {
        workerSessions.push({
          id: currentStart!.id,
          workerName,
          workerStage: stage,
          date: currentStart!.timestamp,
          startTime: currentStart!.timestamp,
          startPhoto: currentStart!.photoUrl,
          endTime: null,
          endPhoto: null,
          duration: 'In Progress',
          status: 'In Progress'
        });
      }

      // Filter by Date
      const filteredSessions = filterDate
        ? workerSessions.filter(s => isSameDay(new Date(s.startTime), new Date(filterDate)))
        : workerSessions;

      if (filteredSessions.length > 0) {
        // 2. Sort sessions within the group by latest time first
        filteredSessions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

        groups.push({
          workerName,
          workerStage: stage,
          sessions: filteredSessions
        });
      }
    });

    // 3. Sort groups by Worker Name (A-Z)
    return groups.sort((a, b) => a.workerName.localeCompare(b.workerName));
  }, [filterDate, dailyLogs, users, departments, selectedStage, selectedWorker]);

  if (loading) return <div className="p-10 text-center text-gray-500">Loading work logs...</div>;

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm sticky top-16 z-20">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Task Duration Logs</h2>
          <p className="text-sm text-gray-500">Track time between 'Start Work' and 'Completed'</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto z-10">

          {/* Stage Filter */}
          {/* REFACTOR: Now uses dynamic 'departments' instead of const STAGES */}
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white min-w-[120px]"
          >
            <option value="All">All Stages</option>
            {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>

          {/* Worker Filter (Searchable) */}
          <SearchableSelect
            options={availableWorkers.map(w => ({ id: w.id, label: w.name, value: w.name }))}
            value={selectedWorker}
            onChange={setSelectedWorker}
            label="Workers"
            className="min-w-[160px]"
          />

          {/* Date Filter */}
          <div className="relative flex-none">
            <Calendar className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {(filterDate || selectedStage !== 'All' || selectedWorker !== 'All') && (
            <button
              onClick={() => { setFilterDate(''); setSelectedStage('All'); setSelectedWorker('All'); }}
              className="p-2 text-gray-500 hover:text-gray-700 bg-gray-100 rounded-lg shrink-0"
              title="Clear Filters"
            >
              <Filter size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden -z-0 relative">
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
              {groupedSessions.length > 0 ? (
                groupedSessions.map((group) => (
                  <React.Fragment key={group.workerName}>
                    {/* Worker Group Header Row */}
                    <tr className="bg-gray-50/80 border-b border-gray-100">
                      <td colSpan={5} className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shadow-sm">
                            {group.workerName.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900">{group.workerName}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">{group.sessions.length} Tasks</span>
                              <StageBadge stage={group.workerStage} />
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Worker Sessions */}
                    {group.sessions.map((session) => (
                      <tr key={session.id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-b-0">
                        <td className="px-6 py-4 pl-14"> {/* Indented to align under name */}
                          <span className="text-xs text-gray-400">{format(new Date(session.date), 'MMM d, yyyy')}</span>
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
                              <div
                                className="relative group cursor-zoom-in"
                                onClick={() => setPreviewImage({
                                  url: session.startPhoto,
                                  title: 'Start Work',
                                  subtitle: `${session.workerName} • ${format(new Date(session.startTime), 'h:mm a')}`
                                })}
                              >
                                <div className="w-16 h-16 rounded-lg border border-gray-200 overflow-hidden bg-gray-100 relative">
                                  <img src={session.startPhoto} className="w-full h-full object-cover" alt="Start" />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

                                  {/* Zoom Icon */}
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="bg-white/20 backdrop-blur-md p-1 rounded-full text-white">
                                      <ZoomIn size={12} />
                                    </div>
                                  </div>
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-indigo-100 text-indigo-700 p-1 rounded-full border border-white shadow-sm z-10">
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
                              <div
                                className="relative group cursor-zoom-in"
                                onClick={() => setPreviewImage({
                                  url: session.endPhoto!,
                                  title: 'Completed Work',
                                  subtitle: `${session.workerName} • ${session.endTime ? format(new Date(session.endTime), 'h:mm a') : ''}`
                                })}
                              >
                                <div className="w-16 h-16 rounded-lg border border-gray-200 overflow-hidden bg-gray-100 relative">
                                  <img src={session.endPhoto} className="w-full h-full object-cover" alt="End" />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

                                  {/* Zoom Icon */}
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="bg-white/20 backdrop-blur-md p-1 rounded-full text-white">
                                      <ZoomIn size={12} />
                                    </div>
                                  </div>
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-green-100 text-green-700 p-1 rounded-full border border-white shadow-sm z-10">
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
                  </React.Fragment>
                ))
              ) : (
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

      {/* Full-Screen Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh] w-full bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row" onClick={e => e.stopPropagation()}>

            {/* Image Container */}
            <div className="flex-1 bg-black flex items-center justify-center relative min-h-[50vh]">
              <img
                src={previewImage.url}
                alt="Preview"
                className="max-h-[85vh] max-w-full object-contain"
              />
            </div>

            {/* Sidebar with Details and Download */}
            <div className="w-full md:w-80 bg-white p-6 flex flex-col shrink-0 border-l border-gray-100">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{previewImage.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{previewImage.subtitle}</p>
                </div>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1">
                <div className="bg-gray-50 rounded-xl p-4 text-center text-sm text-gray-400 italic">
                  Proof of work image.
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <a
                  href={previewImage.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full text-center py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
                >
                  Download Original
                </a>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};