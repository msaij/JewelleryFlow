import React from 'react';

interface StageBadgeProps {
  stage: string;
}

const STAGE_COLORS: Record<string, string> = {
  "Hand Designing": "bg-blue-100 text-blue-800",
  "CAD": "bg-indigo-100 text-indigo-800",
  "Ghat (Filing)": "bg-purple-100 text-purple-800",
  "Polish 1": "bg-pink-100 text-pink-800",
  "Diamond Setting": "bg-rose-100 text-rose-800",
  "Polish 2": "bg-orange-100 text-orange-800",
  "Stone Setting": "bg-amber-100 text-amber-800",
  "Stringing": "bg-yellow-100 text-yellow-800",
  "Kundan Ghat": "bg-emerald-100 text-emerald-800",
  "Completed": "bg-green-100 text-green-800",
};

export const StageBadge: React.FC<StageBadgeProps> = ({ stage }) => {
  const colorClass = STAGE_COLORS[stage] || "bg-gray-100 text-gray-800";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {stage}
    </span>
  );
};