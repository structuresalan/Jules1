import React, { useState, useMemo } from 'react';
import { Frame, Download, CheckSquare } from 'lucide-react';
import { usePDF } from 'react-to-pdf';
import wShapesData from '../data/aisc/shapes_w.json';
import aiscData from '../data/aisc/code_factors.json';
import { IBC_TO_AISC_MAP } from '../data/ibc_mapping';
import { VariableInput } from '../components/VariableInput';
import { SteelCrossSection } from '../components/SteelCrossSection';

// Type assertion for the imported JSON
const shapes = wShapesData as Record<string, { d: number, tw: number, bf: number, tf: number, A: number, Zx: number }>;
const shapeNames = Object.keys(shapes);

export const SteelDesign: React.FC = () => {
  const { toPDF, targetRef } = usePDF({filename: 'steel-design-report.pdf'});
  
  // Code Logic
  const [ibcYear, setIbcYear] = useState('IBC 2018');
  const [aiscYear, setAiscYear] = useState(IBC_TO_AISC_MAP['IBC 2018']);
  const [isOverridden, setIsOverridden] = useState(false);
  const [activeTab, setActiveTab] = useState('Beam/Column');

  const steelTabs = [
    'Beam/Column', 'Composite Beam', 'Single Angle', 
    'Base Plate', 'Anchorage'
  ];

  // Rules of Thumb Toggle
  const [showQuickChecks, setShowQuickChecks] = useState(false);

  // Inputs
  const [method, setMethod] = useState('LRFD');
  const [section, setSection] = useState(shapeNames[1]); // Default to W12x50
  
  // Dynamically load Section Properties based on dropdown selection
  const props = useMemo(() => shapes[section], [section]);
  const { d, tw, bf, tf, A: area, Zx: zx } = props;
  
  // Material Properties
  const [fy, setFy] = useState(50); // ksi
  
  // Load Inputs
  const [pu, setPu] = useState(100); // kips (Factored axial load)
  const [mu, setMu] = useState(150); // kip-ft (Factored bending moment)
  const [lb, setLb] = useState(10); // ft (Unbraced length)
  
  // Extract historical factors
  const factors = (aiscData as Record<string, typeof aiscData["AISC 360-16"]>)[aiscYear] || aiscData["AISC 360-16"];

  // --- Simplified AISC Calculations ---

  // 1. Tension Capacity (Yielding)
  const phi_t = method === 'LRFD' ? factors.phi_t : factors.omega_t;
  const Pn = fy * area;
  const designTension = method === 'LRFD' ? phi_t * Pn : Pn / phi_t;
  
  // 2. Flexural Capacity (Assuming Lb < Lp for simplicity, yielding controls)
  const phi_b = method === 'LRFD' ? factors.phi_b : factors.omega_b;
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
      
      {/* Header and Global Settings */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <Frame className="text-blue-600" />
            Steel Member Design
          </h1>
          <p className="mt-2 text-gray-500">Wide flange section interaction calculation.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-2 rounded-lg border border-gray-200 shadow-sm w-full lg:w-auto">
          {/* Top Right Code Selectors */}
          <div className="flex items-center gap-3 pr-4 border-r border-gray-200">
            <div>
              <div className="text-[10px] text-gray-500 uppercase font-semibold">IBC</div>
              <select 
                value={ibcYear} 
                onChange={(e) => {
                  const newIbc = e.target.value;
                  setIbcYear(newIbc);
                  setAiscYear(IBC_TO_AISC_MAP[newIbc] || "AISC 360-16");
                  setIsOverridden(false);
                }}
                className="text-sm font-medium bg-transparent focus:outline-none focus:ring-0 cursor-pointer text-gray-900"
              >
                {Object.keys(IBC_TO_AISC_MAP).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="text-[10px] text-gray-500 uppercase font-semibold">AISC 360</div>
                {isOverridden && (
                  <span className="absolute -top-1 -right-2 transform translate-x-full text-[8px] font-bold bg-amber-100 text-amber-800 px-1 rounded border border-amber-200">
                    OVERRIDE
                  </span>
                )}
              </div>
              <select 
                value={aiscYear} 
                onChange={(e) => {
                  setAiscYear(e.target.value);
                  setIsOverridden(e.target.value !== IBC_TO_AISC_MAP[ibcYear]);
                }}
                className="text-sm font-medium bg-transparent focus:outline-none focus:ring-0 cursor-pointer text-gray-900"
              >
                <option>AISC 360-22</option>
                <option>AISC 360-16</option>
                <option>AISC 360-10</option>
                <option>AISC 360-05</option>
              </select>
            </div>
          </div>

          <button 
            onClick={() => setShowQuickChecks(!showQuickChecks)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors text-sm font-medium shrink-0 ${showQuickChecks ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
          >
            <CheckSquare size={16} />
            Quick Checks
          </button>

          <button 
            onClick={() => toPDF()}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors text-sm font-medium shrink-0"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Navigation Sub-tabs */}
      <div className="border-b border-gray-200 overflow-x-auto custom-scrollbar">
        <nav className="-mb-px flex space-x-6 min-w-max px-2">
          {steelTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {showQuickChecks && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2 mb-2 text-indigo-800">
            <CheckSquare size={18} />
            <h3 className="font-semibold">Engineering Rules of Thumb (Steel Beam)</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-indigo-900">
            <div className="bg-white/60 p-3 rounded border border-indigo-100">
              <div className="font-medium mb-1">Estimated Beam Depth (d)</div>
              <p>To prevent excessive deflection, a common rule of thumb for estimating the required depth of a steel roof/floor beam is:</p>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>Roof Beams: $d \approx L / 24$ (where L is span in inches)</li>
                <li>Floor Beams: $d \approx L / 20$</li>
              </ul>
              <p className="mt-2 text-xs italic">Example: For a 20ft (240") floor span, d ≈ 240 / 20 = 12 inches (e.g. W12 shape).</p>
            </div>
            <div className="bg-white/60 p-3 rounded border border-indigo-100">
              <div className="font-medium mb-1">Estimated Beam Weight</div>
              <p>For a quickly estimated Moment $M_u$ (kip-ft) and choosing a nominal beam depth $d$ (inches), you can estimate the required beam weight (lbs/ft):</p>
              <p className="mt-1"><code>Weight ≈ (M_u × 10) / d</code></p>
              <p className="mt-2 text-xs italic">Example: For Mu = 150 kip-ft and depth 12", Weight ≈ (150 × 10) / 12 = 125 lbs/ft (This is a conservative estimate! W12x50 easily passes).</p>
            </div>
          </div>
        </div>
      )}

      <div ref={targetRef} className="pt-2">
        {activeTab === 'Beam/Column' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Input Section */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Design Parameters</h2>
            
            <div className="space-y-4">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section Size</label>
                <select 
                  value={section} 
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 bg-gray-50"
                >
                  {shapeNames.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Yield Strength, Fy (ksi)</label>
                <input type="number" value={fy} onChange={(e) => setFy(Number(e.target.value))} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Applied Loads ({method})</h3>
                <div className="space-y-4">
                  <VariableInput label="Axial Load, Pu/Pa" value={pu} onChange={setPu} unit="kips" />
                  <VariableInput label="Bending Moment, Mu/Ma" value={mu} onChange={setMu} unit="kip-ft" />
                  <VariableInput label="Unbraced Length, Lb" value={lb} onChange={setLb} unit="ft" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Output Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b pb-2">
              <h2 className="text-lg font-semibold text-gray-900">Results: {aiscYear} ({method})</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="md:col-span-2 space-y-6">
                <div className={`p-4 rounded-lg border ${isOk ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className={`text-sm font-medium mb-1 ${isOk ? 'text-green-800' : 'text-red-800'}`}>Interaction Ratio (H1-1)</div>
                  <div className={`text-3xl font-bold flex items-center gap-4 ${isOk ? 'text-green-900' : 'text-red-900'}`}>
                    {interaction.toFixed(3)}
                    <span className={`text-lg px-3 py-1 rounded-full ${isOk ? 'bg-green-100' : 'bg-red-100'}`}>
                      {isOk ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-sm text-gray-600 font-medium mb-1">Tension Capacity</div>
                    <div className="text-xl font-bold text-gray-900">{designTension.toFixed(1)} <span className="text-sm font-normal">kips</span></div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-sm text-gray-600 font-medium mb-1">Moment Capacity</div>
                    <div className="text-xl font-bold text-gray-900">{designMoment.toFixed(1)} <span className="text-sm font-normal">kip-ft</span></div>
                  </div>
                </div>
              </div>
              
              <div className="md:col-span-1">
                <SteelCrossSection d={d} bf={bf} tf={tf} tw={tw} />
              </div>
            </div>

            <div className="space-y-4 border-t border-gray-100 pt-4">
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
        )}

        {/* Placeholders for other tabs */}
        {activeTab !== 'Beam/Column' && (
          <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900">{activeTab} Design</h3>
            <p className="mt-2 text-sm text-gray-500">This AISC 360 calculation module is under construction.</p>
          </div>
        )}
      </div>
    </div>
  );
};
