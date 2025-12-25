
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { format, isSameDay } from 'date-fns';
import { getDailyLogs, getJobs, getUsers } from '../services/dataService';
import { STAGES, DailyLog, Job, User } from '../types';
import { Calendar, Image as ImageIcon, Sun, Moon, Briefcase, CheckCircle, UserX, Hammer, CheckCircle2, Filter, X, ZoomIn } from 'lucide-react';
import { StageBadge } from './StageBadge';
import { SearchableSelect } from './SearchableSelect';

export const DailyPhotoFeed: React.FC = () => {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Data State
  const [allDailyLogs, setAllDailyLogs] = useState<DailyLog[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedStage, setSelectedStage] = useState<string>('All');
  const [selectedWorker, setSelectedWorker] = useState<string>('All');

  // Preview Modal
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string, subtitle: string } | null>(null);

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

  // Process and Filter Data into a grouped structure: Stage -> Workers -> Logs
  const activityData = useMemo(() => {
    const selectedDate = new Date(date + 'T00:00:00');

    // 1. Group all available workers by their assigned stage
    const workersByStage: Record<string, typeof allUsers> = {};

    // Initialize all standard stages with empty lists
    STAGES.forEach(stage => {
      workersByStage[stage] = [];
    });

    // Distribute workers into their respective stage buckets
    allUsers.forEach(user => {
      if (user.role === 'Worker' && user.assignedStage) {
        if (!workersByStage[user.assignedStage]) {
          workersByStage[user.assignedStage] = [];
        }
        workersByStage[user.assignedStage].push(user);
      }
    });

    // 2. Build the final display data structure by mapping over stages
    const result = STAGES.map(stage => {
      const stageWorkers = workersByStage[stage] || [];

      // Apply Stage Filter: Skip this stage if it doesn't match the selected filter
      if (selectedStage !== 'All' && stage !== selectedStage) return null;

      // Map each worker in this stage to their daily activity logs
      const allWorkers = stageWorkers.map(worker => {
        // Apply Worker Filter: Skip this worker if they don't match the selected filter
        if (selectedWorker !== 'All' && worker.name !== selectedWorker) return null;

        // A. Filter and Map Daily Logs (Start/End Shift, Start/Complete Job)
        const myDailyLogs = allDailyLogs
          .filter(l => l.workerName === worker.name && isSameDay(new Date(l.timestamp), selectedDate))
          .map(l => {
            let title = 'Update';
            let color = 'bg-gray-100 text-gray-800';
            let Icon = Briefcase;

            // Determine visual properties based on log type
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
              icon: Icon,
              workerName: l.workerName,
              subType: l.type
            };
          });

        // B. Filter and Map Job History Logs (Passing Jobs)
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
              icon: CheckCircle,
              workerName: h.workerName,
              subType: 'Job'
            }))
        );

        // Combine and Sort all logs chronologically
        const combinedLogs = [...myDailyLogs, ...myJobLogs].sort((a, b) =>
          new Date(a.time).getTime() - new Date(b.time).getTime()
        );

        return {
          worker,
          logs: combinedLogs
        };
      }).filter((w): w is { worker: User; logs: any[] } => w !== null);

      // If no workers remain in this stage (e.g., due to filtering), skip the stage
      if (allWorkers.length === 0) return null;

      // Return the stage group with its workers
      return {
        stage,
        workers: allWorkers
      };
    }).filter((g): g is { stage: typeof STAGES[number]; workers: { worker: User; logs: any[] }[] } => g !== null);

    return result;
  }, [date, allDailyLogs, allJobs, allUsers, selectedStage, selectedWorker]);

  // Unique Workers for Filter
  const availableWorkers = useMemo(() => {
    const workers = allUsers.filter(u => u.role === 'Worker');
    if (selectedStage === 'All') return workers;
    return workers.filter(u => u.assignedStage === selectedStage);
  }, [allUsers, selectedStage]);

  if (loading) return <div className="text-center py-20 text-gray-400">Loading feed...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20 relative">

      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between sticky top-16 z-20">
        {/* Date Picker */}
        <div
          className="flex items-center gap-3 cursor-pointer group shrink-0"
          onClick={handleCalendarClick}
        >
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-100 transition-colors">
            <Calendar size={20} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Date</label>
            <input
              ref={dateInputRef}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="font-bold text-gray-900 bg-transparent outline-none text-base cursor-pointer block w-32"
            />
          </div>
        </div>

        <div className="h-8 w-px bg-gray-200 hidden md:block"></div>

        {/* Filters */}
        <div className="flex flex-1 flex-wrap gap-3 pb-1 md:pb-0 z-10">
          {/* Stage Filter */}
          <div className="relative min-w-[140px]">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <Hammer size={14} />
            </div>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
            >
              <option value="All">All Stages</option>
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Worker Filter (Searchable) */}
          <SearchableSelect
            options={availableWorkers.map(w => ({ id: w.id, label: w.name, value: w.name }))}
            value={selectedWorker}
            onChange={setSelectedWorker}
            label="Workers"
            className="min-w-[160px]"
          />

          {/* Reset - Only show if filtered */}
          {(selectedStage !== 'All' || selectedWorker !== 'All') && (
            <button
              onClick={() => { setSelectedStage('All'); setSelectedWorker('All'); }}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Clear Filters"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="px-1 text-xs font-semibold text-gray-500 uppercase tracking-widest">
        Showing {activityData.length} Group{activityData.length !== 1 && 's'}
      </div>

      {/* Grouped Layout (Restored) */}
      {activityData.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
          <ImageIcon size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No activity matching your filters.</p>
        </div>
      ) : (
        <div className="space-y-8 -z-0 relative">
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
                            <div className="flex gap-4">
                              {logs.map((item) => (
                                <div
                                  key={item.id + item.type}
                                  className="flex-none group relative bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all cursor-zoom-in w-40"
                                  onClick={() => setPreviewImage({ url: item.photo, title: item.title, subtitle: `${item.workerName} • ${format(new Date(item.time), 'h:mm a')}` })}
                                >
                                  {/* Image */}
                                  <div className="aspect-[4/5] bg-gray-100 relative">
                                    <img
                                      src={item.photo}
                                      alt={item.title}
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

                                    {/* Zoom Icon on Hover */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <div className="bg-white/20 backdrop-blur-md p-1.5 rounded-full text-white">
                                        <ZoomIn size={16} />
                                      </div>
                                    </div>

                                    {/* Top Badge */}
                                    <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-bold ${item.color} shadow-sm uppercase tracking-wide`}>
                                      {item.subType || 'JOB'}
                                    </div>
                                  </div>

                                  {/* Minimal Caption */}
                                  <div className="p-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-[10px] text-gray-400 font-mono">{format(new Date(item.time), 'HH:mm')}</span>
                                    </div>
                                    <div className="flex items-center gap-1 mt-1 text-xs font-medium text-gray-900 truncate">
                                      <item.icon size={12} className="text-gray-400" />
                                      <span className="truncate">{item.title}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
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

      {/* Image Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh] w-full bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row" onClick={e => e.stopPropagation()}>

            {/* Image Side */}
            <div className="flex-1 bg-black flex items-center justify-center relative min-h-[50vh]">
              <img
                src={previewImage.url}
                alt="Preview"
                className="max-h-[85vh] max-w-full object-contain"
              />
            </div>

            {/* Sidebar Info (Desktop) or Bottom (Mobile) */}
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
                {/* Placeholder for comments or details in future */}
                <div className="bg-gray-50 rounded-xl p-4 text-center text-sm text-gray-400 italic">
                  No additional notes.
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