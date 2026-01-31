
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { format, isSameDay, differenceInMinutes, isToday } from 'date-fns';
import { getDailyLogs, getJobs, getUsers, getDepartments } from '../services/dataService';
import { DailyLog, User, Department } from '../types';
import { Calendar, Clock, AlertCircle, CheckCircle2, Timer, Moon } from 'lucide-react';
import { StageBadge } from './StageBadge';

export const ActivityLogView: React.FC = () => {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Data State
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [logs, users, depts] = await Promise.all([
        getDailyLogs(),
        getUsers(),
        getDepartments()
      ]);
      setDailyLogs(logs);
      setAllUsers(users);
      setDepartments(depts);
    };
    fetchData();
  }, []);

  const handleCalendarClick = () => {
    const input = dateInputRef.current;
    if (input) {
      try {
        // Try modern showPicker API
        if ('showPicker' in (input as any)) {
          (input as any).showPicker();
        } else {
          // Fallback
          input.focus();
          input.click();
        }
      } catch (e) {
        input.focus();
      }
    }
  };

  // Process data for the view
  const departmentData = useMemo(() => {
    // Construct local date from YYYY-MM-DD string
    const [y, m, d] = date.split('-').map(Number);
    const selectedDate = new Date(y, m - 1, d);
    const isCurrentDay = isSameDay(selectedDate, new Date());

    // Sort Departments Alphabetically
    const sortedDepts = [...departments].sort((a, b) => a.name.localeCompare(b.name));

    // Build the rich data structure
    return sortedDepts.map(dept => {
      // Find workers for this department (Hybrid Logic)
      const workers = allUsers.filter(user => {
        if (user.role !== 'Worker') return false;

        return user.departmentId === dept.id;
      });

      // Map each worker to their daily stats
      const workerStats = workers.map(worker => {
        // Find Attendance Logs
        const myDailyLogs = dailyLogs.filter(log =>
          log.workerName === worker.name &&
          isSameDay(new Date(log.timestamp), selectedDate)
        );

        // We only care about explicit Start and End events now
        const startLog = myDailyLogs.find(l => l.type === 'Start');
        const endLog = myDailyLogs.find(l => l.type === 'End');

        // Calculate timestamps
        const startTime = startLog ? new Date(startLog.timestamp) : null;
        const endTime = endLog ? new Date(endLog.timestamp) : null;

        // Calculate Duration based ONLY on Start and End
        let durationStr = '--';
        if (startTime) {
          if (endTime) {
            // Shift Completed
            const diff = differenceInMinutes(endTime, startTime);
            const h = Math.floor(diff / 60);
            const m = diff % 60;
            durationStr = `${h}h ${m}m`;
          } else if (isCurrentDay) {
            // Shift In Progress
            const diff = differenceInMinutes(new Date(), startTime);
            const h = Math.floor(diff / 60);
            const m = diff % 60;
            durationStr = `${h}h ${m}m (Active)`;
          }
        }

        return {
          user: worker,
          hasStarted: !!startLog,
          hasEnded: !!endLog,
          startTime,
          endTime,
          durationStr
        };
      });

      return {
        stage: dept.name,
        workers: workerStats
      };
    });
  }, [date, dailyLogs, allUsers, departments]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20">
      {/* Date Picker Header */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between sticky top-16 z-20">
        <div
          className="flex items-center gap-4 cursor-pointer group w-full sm:w-auto"
          onClick={handleCalendarClick}
        >
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-100 transition-colors">
            <Calendar size={24} />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 cursor-pointer">Select Date</label>
            <input
              ref={dateInputRef}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="font-bold text-gray-900 bg-transparent outline-none text-lg cursor-pointer block w-full"
            />
          </div>
        </div>
      </div>

      {/* Department Lists */}
      <div className="space-y-6">
        {departmentData.map(({ stage, workers }) => {
          if (workers.length === 0) return null;

          return (
            <div key={stage} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Department Header */}
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 flex items-center justify-between">
                <StageBadge stage={stage} />
                <span className="text-xs font-medium text-gray-500">{workers.length} Staff</span>
              </div>

              {/* Workers List Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3">Worker</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Start Time</th>
                      <th className="px-6 py-3">End Time</th>
                      <th className="px-6 py-3">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {workers.map(({ user, hasStarted, hasEnded, startTime, endTime, durationStr }) => (
                      <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {user.name}
                        </td>
                        <td className="px-6 py-4">
                          {hasStarted ? (
                            hasEnded ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                <CheckCircle2 size={12} /> Shift Ended
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                <Clock size={12} /> On Duty
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600">
                              <AlertCircle size={12} /> Absent
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-500 font-mono">
                          {startTime ? format(startTime, 'h:mm a') : '--'}
                        </td>
                        <td className="px-6 py-4 text-gray-500 font-mono">
                          {endTime ? format(endTime, 'h:mm a') : '--'}
                        </td>
                        <td className="px-6 py-4">
                          <div className={`flex items-center gap-2 font-mono font-medium ${hasStarted ? 'text-indigo-600' : 'text-gray-400'}`}>
                            <Timer size={14} />
                            {durationStr}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};