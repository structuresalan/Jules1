import React from 'react';
import { Layers, Frame, Wind, FileText, Map } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const cards = [
    {
      to: '/steel',
      icon: <Frame size={24} />,
      title: 'Steel Design',
      description: 'AISC 360 compliant calculations for steel members. Analyze beams, columns, and tension members.',
    },
    {
      to: '/concrete',
      icon: <Layers size={24} />,
      title: 'Concrete Design',
      description: 'ACI 318 compliant calculations for reinforced concrete. Design rectangular beams and slabs.',
    },
    {
      to: '/loads',
      icon: <Wind size={24} />,
      title: 'Loads',
      description: 'Governing IBC and referenced ASCE 7 environmental load calculations. Compute flat roof snow loads.',
    },
    {
      to: '/documents',
      icon: <Map size={24} />,
      title: 'Visual Map & Documents',
      description: 'Save calculation outputs, upload plans or photos, place markers, measure, and export marker schedules.',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">Dashboard</h1>
        <p className="mt-2 text-slate-400">Welcome to your structural calculation workspace.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card) => (
          <Link key={card.to} to={card.to} className="block group">
            <div className="p-6 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-750 hover:-translate-y-0.5 transition-all h-full">
              <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center text-slate-300 mb-4 group-hover:bg-blue-600/20 group-hover:text-blue-400 transition-colors">
                {card.icon}
              </div>
              <h2 className="text-lg font-semibold text-slate-100 mb-2">{card.title}</h2>
              <p className="text-slate-400 text-sm">{card.description}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <FileText className="text-blue-400" size={20} />
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Recent Calculations</h3>
        </div>
        <p className="mt-3 text-sm italic text-slate-500">No recent calculations found. Start a new design above.</p>
      </div>
    </div>
  );
};
