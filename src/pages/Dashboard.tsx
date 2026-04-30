import React from 'react';
import { Layers, Frame, Wind } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-500">Welcome to your structural calculation workspace.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to="/steel" className="block group">
          <div className="p-6 border border-gray-200 rounded-lg bg-white hover:border-gray-300 hover:shadow-sm transition-all h-full">
            <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center text-gray-600 mb-4 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
              <Frame size={24} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Steel Design</h2>
            <p className="text-gray-500 text-sm">AISC 360 compliant calculations for steel members. Analyze beams, columns, and tension members.</p>
          </div>
        </Link>

        <Link to="/concrete" className="block group">
          <div className="p-6 border border-gray-200 rounded-lg bg-white hover:border-gray-300 hover:shadow-sm transition-all h-full">
            <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center text-gray-600 mb-4 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
              <Layers size={24} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Concrete Design</h2>
            <p className="text-gray-500 text-sm">ACI 318 compliant calculations for reinforced concrete. Design rectangular beams and slabs.</p>
          </div>
        </Link>

        <Link to="/loads" className="block group">
          <div className="p-6 border border-gray-200 rounded-lg bg-white hover:border-gray-300 hover:shadow-sm transition-all h-full">
            <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center text-gray-600 mb-4 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
              <Wind size={24} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">ASCE Loads</h2>
            <p className="text-gray-500 text-sm">ASCE 7 environmental load calculations. Compute flat roof snow loads and wind pressures.</p>
          </div>
        </Link>
      </div>
      
      <div className="mt-12 p-6 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Recent Calculations</h3>
        <p className="text-sm text-gray-500 italic">No recent calculations found. Start a new design above.</p>
      </div>
    </div>
  );
};
