import React, { useState } from 'react';
import { Frame, Download } from 'lucide-react';
import { usePDF } from 'react-to-pdf';

export const SteelDesign: React.FC = () => {
  const { toPDF, targetRef } = usePDF({filename: 'steel-design-report.pdf'});
  
  // Inputs
  const [codeYear, setCodeYear] = useState('AISC 360-16');
  const [method, setMethod] = useState('LRFD');
  const [section, setSection] = useState('W12x50');
  
  // Section Properties (Simplified Mock Data for W12x50)
  const d = 12.2; // in
  const tw = 0.37; // in
  const bf = 8.08; // in
  const tf = 0.64; // in
  const area = 14.6; // in^2
  const zx = 64.7; // in^3
  
  // Material Properties
  const [fy, setFy] = useState(50); // ksi
  
  // Load Inputs
  const [pu, setPu] = useState(100); // kips (Factored axial load)
  const [mu, setMu] = useState(150); // kip-ft (Factored bending moment)
  const [lb, setLb] = useState(10); // ft (Unbraced length)
  
  // --- Simplified AISC Calculations ---

  // 1. Tension Capacity (Yielding)
  const phi_t = method === 'LRFD' ? 0.90 : 1.67; // Omega for ASD
  const Pn = fy * area;
  const designTension = method === 'LRFD' ? phi_t * Pn : Pn / phi_t;
  
  // 2. Flexural Capacity (Assuming Lb < Lp for simplicity, yielding controls)
  const phi_b = method === 'LRFD' ? 0.90 : 1.67;
  const Mn = fy * zx / 12; // kip-ft
  const designMoment = method === 'LRFD' ? phi_b * Mn : Mn / phi_b;
  
  // 3. Interaction Equation (H1-1a or H1-1b)
  const Pr = pu;
  const Pc = designTension; // Assuming tension for this simplified check
  const Mr = mu;
  const Mc = designMoment;
  
  const interaction = Pr / Pc >= 0.2
    ? (Pr / Pc) + (8/9) * (Mr / Mc)
    : (Pr / (2 * Pc)) + (Mr / Mc);
  
  const isOk = interaction <= 1.0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <Frame className="text-blue-600" />
            Steel Member Design
          </h1>
          <p className="mt-2 text-gray-500">Wide flange section interaction calculation.</p>
        </div>
        <button 
          onClick={() => toPDF()}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Download size={16} />
          Export PDF
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" ref={targetRef}>
        
        {/* Input Section */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Design Parameters</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Design Code</label>
                  <select 
                    value={codeYear} 
                    onChange={(e) => setCodeYear(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                  >
                    <option>AISC 360-22</option>
                    <option>AISC 360-16</option>
                    <option>AISC 360-10</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                  <select 
                    value={method} 
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                  >
                    <option>LRFD</option>
                    <option>ASD</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section Size (Mock Data)</label>
                <select 
                  value={section} 
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 bg-gray-50"
                >
                  <option>W12x50</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Yield Strength, Fy (ksi)</label>
                <input type="number" value={fy} onChange={(e) => setFy(Number(e.target.value))} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Applied Loads ({method})</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Axial Load, Pu/Pa (kips)</label>
                    <input type="number" value={pu} onChange={(e) => setPu(Number(e.target.value))} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bending Moment, Mu/Ma (kip-ft)</label>
                    <input type="number" value={mu} onChange={(e) => setMu(Number(e.target.value))} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unbraced Length, Lb (ft)</label>
                    <input type="number" value={lb} onChange={(e) => setLb(Number(e.target.value))} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Output Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Results: {codeYear} ({method})</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className={`p-4 rounded-lg border ${isOk ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} md:col-span-3`}>
                <div className={`text-sm font-medium mb-1 ${isOk ? 'text-green-800' : 'text-red-800'}`}>Interaction Ratio (H1-1)</div>
                <div className={`text-3xl font-bold flex items-center gap-4 ${isOk ? 'text-green-900' : 'text-red-900'}`}>
                  {interaction.toFixed(3)}
                  <span className={`text-lg px-3 py-1 rounded-full ${isOk ? 'bg-green-100' : 'bg-red-100'}`}>
                    {isOk ? 'PASS' : 'FAIL'}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-600 font-medium mb-1">Tension Capacity</div>
                <div className="text-xl font-bold text-gray-900">{designTension.toFixed(1)} <span className="text-sm font-normal">kips</span></div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-600 font-medium mb-1">Moment Capacity</div>
                <div className="text-xl font-bold text-gray-900">{designMoment.toFixed(1)} <span className="text-sm font-normal">kip-ft</span></div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-800">Section Properties ({section})</h3>
              <div className="bg-gray-50 rounded-md p-4 font-mono text-sm border border-gray-200 grid grid-cols-2 gap-4">
                <div>A = {area} in²</div>
                <div>d = {d} in</div>
                <div>tw = {tw} in</div>
                <div>bf = {bf} in</div>
                <div>tf = {tf} in</div>
                <div>Zx = {zx} in³</div>
              </div>
            </div>
            
            <div className="space-y-4 mt-6">
              <h3 className="text-md font-medium text-gray-800">Calculation Checks</h3>
              <div className="bg-gray-50 rounded-md p-4 font-mono text-sm border border-gray-200">
                <p>Pr / Pc = {(Pr / Pc).toFixed(3)} {Pr / Pc >= 0.2 ? '≥ 0.2 (Use H1-1a)' : '< 0.2 (Use H1-1b)'}</p>
                <p className="mt-2">
                  {Pr / Pc >= 0.2 
                    ? `Ratio = ${Pr.toFixed(1)}/${Pc.toFixed(1)} + (8/9) * (${Mr.toFixed(1)}/${Mc.toFixed(1)})`
                    : `Ratio = ${Pr.toFixed(1)}/(2*${Pc.toFixed(1)}) + (${Mr.toFixed(1)}/${Mc.toFixed(1)})`
                  }
                </p>
                <p className="mt-1 font-bold">Ratio = {interaction.toFixed(3)}</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
