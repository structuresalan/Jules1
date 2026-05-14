import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ComingSoonProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col items-center justify-center h-full min-h-64 gap-4 text-center py-20">
    <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-600">
      <Icon size={26} />
    </div>
    <div>
      <div className="text-slate-300 font-semibold text-lg">{title}</div>
      <div className="text-slate-500 text-sm mt-1 max-w-xs">{description}</div>
    </div>
    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700 border border-slate-800 rounded-full px-3 py-1">Coming soon</div>
  </div>
);
