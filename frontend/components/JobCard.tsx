import React from 'react';
import { Job } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  job: Job;
  actionLabel?: string;
  onAction?: () => void;
}

const STAGE_COLORS: Record<string, string> = {
  "Hand Designing": "bg-blue-100 text-blue-800",
  "CAD": "bg-indigo-100 text-indigo-800",
  "Ghat (Filing)": "bg-purple-100 text-purple-800",
  "Polish 1": "bg-pink-100 text-pink-800",
  "Completed": "bg-green-100 text-green-800"
};

export const JobCard: React.FC<Props> = ({ job, actionLabel, onAction }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
      <div className="relative aspect-square">
        <img src={job.designImageUrl} className="w-full h-full object-cover" alt="Design" />
        <div className="absolute top-2 right-2">
           <span className={`px-2 py-1 rounded-md text-xs font-bold shadow-sm ${
             job.priority === 'Urgent' ? 'bg-red-500 text-white' : 
             job.priority === 'High' ? 'bg-orange-500 text-white' : 'bg-gray-800/80 text-white'
           }`}>
             {job.priority}
           </span>
        </div>
        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm font-mono">
          {job.id}
        </div>
      </div>
      
      <div className="p-3 flex-1 flex flex-col gap-2">
        <div>
          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${STAGE_COLORS[job.currentStage] || 'bg-gray-100 text-gray-600'}`}>
            {job.currentStage}
          </span>
        </div>
        
        <div className="mt-auto pt-2 border-t border-gray-50">
          <p className="text-xs text-gray-400">
            In stage for {formatDistanceToNow(new Date(job.createdAt))}
          </p>
        </div>

        {onAction && (
          <button 
            onClick={onAction}
            className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-bold shadow-md shadow-green-100 active:scale-95 transition-all"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
};