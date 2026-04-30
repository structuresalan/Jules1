import React, { useState, useMemo } from 'react';
import { Layers, Download, CheckSquare } from 'lucide-react';
import { usePDF } from 'react-to-pdf';
import rebarData from '../data/aci/rebar.json';
import aciData from '../data/aci/code_factors.json';
import { IBC_TO_ACI_MAP } from '../data/ibc_mapping';
import { VariableInput } from '../components/VariableInput';

// Type assertion for rebar
const rebars = rebarData as Record<string, { diameter: number, area: number }>;
const rebarSizes = Object.keys(rebars);

export const ConcreteDesign: React.FC = () => {
  const { toPDF, targetRef } = usePDF({filename: 'concrete-design-report.pdf'});
  
  // Code Logic
  const [ibcYear, setIbcYear] = useState('IBC 2018');
  const [aciYear, setAciYear] = useState(IBC_TO_ACI_MAP['IBC 2018']);
  const [isOverridden, setIsOverridden] = useState(false);

  // Inputs
  const [width, setWidth] = useState(12); // inches (b)
  const [height, setHeight] = useState(24); // inches (h)
  const [cover, setCover] = useState(1.5); // inches
  const [fc, setFc] = useState(4000); // psi (f'c)
  const [fy, setFy] = useState(60000); // psi (fy)
  
  // Rebar Selection
  const [rebarSize, setRebarSize] = useState('#8');
  const [rebarQty, setRebarQty] = useState(3);
  
  // Rules of Thumb Toggle
  const [showQuickChecks, setShowQuickChecks] = useState(false);

  // Dynamically calculate area of steel (As)
  const rebarProps = useMemo(() => rebars[rebarSize], [rebarSize]);
  const as = rebarQty * rebarProps.area;
  
  // Calculate Effective Depth (d)
  // height - cover - stirrup(#4) - half main bar diam
  const d = height - cover - 0.5 - (rebarProps.diameter / 2); 
  
  // Extract historical factors
  const factors = (aciData as Record<string, typeof aciData["ACI 318-19"]>)[aciYear] || aciData["ACI 318-19"];

  // Calculation Logic (Simplified ACI 318 for singly reinforced rectangular section)
  const beta1 = fc <= 4000 ? factors.beta1_limit : Math.max(0.65, factors.beta1_limit - 0.05 * ((fc - 4000) / 1000));
  const a = (as * fy) / (0.85 * fc * width); // Depth of equivalent rectangular stress block
  const c = a / beta1; // Depth to neutral axis
  
  const strain_t = 0.003 * ((d - c) / c); // Strain in extreme tension steel
  
  // Phi factor determination (dynamically using historical values)
  let phi = factors.phi_tension_controlled;
  if (strain_t < 0.002) {
    phi = factors.phi_compression_tied; // Compression controlled (simplified tied)
  } else if (strain_t < 0.005) {
    phi = factors.phi_compression_tied + (strain_t - 0.002) * ((factors.phi_tension_controlled - factors.phi_compression_tied) / 0.003); // Transition zone
  }

  // Nominal Moment Capacity (Mn) in lb-in
  const Mn = as * fy * (d - a / 2);
  
  // Design Moment Capacity (phi*Mn) in kip-ft
  const phiMn = (phi * Mn) / 12000;

  // Minimum steel check
  const As_min = Math.max((3 * Math.sqrt(fc) * width * d) / fy, (200 * width * d) / fy);
  const isAsOk = as >= As_min;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header and Global Settings */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <Layers className="text-blue-600" />
            Concrete Beam Design
          </h1>
          <p className="mt-2 text-gray-500">Rectangular beam flexural capacity calculation.</p>
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
                  setAciYear(IBC_TO_ACI_MAP[newIbc] || "ACI 318-14");
                  setIsOverridden(false);
                }}
                className="text-sm font-medium bg-transparent focus:outline-none focus:ring-0 cursor-pointer text-gray-900"
              >
                {Object.keys(IBC_TO_ACI_MAP).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="text-[10px] text-gray-500 uppercase font-semibold">ACI 318</div>
                {isOverridden && (
                  <span className="absolute -top-1 -right-2 transform translate-x-full text-[8px] font-bold bg-amber-100 text-amber-800 px-1 rounded border border-amber-200">
                    OVERRIDE
                  </span>
                )}
              </div>
              <select 
                value={aciYear} 
                onChange={(e) => {
                  setAciYear(e.target.value);
                  setIsOverridden(e.target.value !== IBC_TO_ACI_MAP[ibcYear]);
                }}
                className="text-sm font-medium bg-transparent focus:outline-none focus:ring-0 cursor-pointer text-gray-900"
              >
                <option>ACI 318-19</option>
                <option>ACI 318-14</option>
                <option>ACI 318-11</option>
                <option>ACI 318-08</option>
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

      {showQuickChecks && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2 mb-2 text-indigo-800">
            <CheckSquare size={18} />
            <h3 className="font-semibold">Engineering Rules of Thumb (Concrete Beam)</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-indigo-900">
            <div className="bg-white/60 p-3 rounded border border-indigo-100">
              <div className="font-medium mb-1">Estimated Steel Area ($A_s$)</div>
              <p>For a given factored moment $M_u$ (kip-ft), you can roughly estimate the required steel area: <br/><code>As ≈ Mu / (4 × d)</code></p>
              <p className="mt-2 text-xs italic">Example: For Mu = 100 kip-ft and d = 20", As ≈ 100 / (4 × 20) = 1.25 in²</p>
            </div>
            <div className="bg-white/60 p-3 rounded border border-indigo-100">
              <div className="font-medium mb-1">Minimum Span-to-Depth Ratio</div>
              <p>ACI 318 Table 9.3.1.1 dictates minimum thickness $h$ for nonprestressed beams unless deflections are calculated:</p>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>Simply supported: $L/16$</li>
                <li>One end continuous: $L/18.5$</li>
                <li>Both ends continuous: $L/21$</li>
                <li>Cantilever: $L/8$</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" ref={targetRef}>
        
        {/* Input Section */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Design Parameters</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <VariableInput label="Width, b" value={width} onChange={setWidth} unit="in" />
                <VariableInput label="Height, h" value={height} onChange={setHeight} unit="in" />
              </div>

              <VariableInput label="Clear Cover" value={cover} onChange={setCover} unit="in" step="0.1" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">f'c (psi)</label>
                  <input type="number" step="100" value={fc} onChange={(e) => setFc(Number(e.target.value))} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">fy (psi)</label>
                  <input type="number" step="1000" value={fy} onChange={(e) => setFy(Number(e.target.value))} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rebar Size</label>
                  <select 
                    value={rebarSize} 
                    onChange={(e) => setRebarSize(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                  >
                    {rebarSizes.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input type="number" min="1" step="1" value={rebarQty} onChange={(e) => setRebarQty(Number(e.target.value))} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
                </div>
              </div>
              <div className="text-sm text-gray-500 text-right">
                Calculated As: <span className="font-semibold text-gray-700">{as.toFixed(2)} in²</span>
              </div>
            </div>
          </div>
        </div>

        {/* Output Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Results: {aciYear}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="text-sm text-blue-600 font-medium mb-1">Design Moment Capacity, φMn</div>
                <div className="text-3xl font-bold text-blue-900">{phiMn.toFixed(1)} <span className="text-lg font-normal">kip-ft</span></div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-600 font-medium mb-1">Strength Reduction Factor, φ</div>
                <div className="text-3xl font-bold text-gray-900">{phi.toFixed(3)}</div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-800">Detailed Calculations</h3>
              <div className="bg-gray-50 rounded-md p-4 font-mono text-sm border border-gray-200">
                <table className="w-full">
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="py-2 text-gray-600">Effective Depth (d)</td>
                      <td className="py-2 text-right font-medium">{d.toFixed(2)} in</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-2 text-gray-600">Stress Block Depth (a)</td>
                      <td className="py-2 text-right font-medium">{a.toFixed(2)} in</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-2 text-gray-600">Neutral Axis Depth (c)</td>
                      <td className="py-2 text-right font-medium">{c.toFixed(2)} in</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-2 text-gray-600">Tensile Strain (εt)</td>
                      <td className="py-2 text-right font-medium">{strain_t.toFixed(4)}</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-gray-600">Min Steel Check (As,min)</td>
                      <td className={`py-2 text-right font-medium ${isAsOk ? 'text-green-600' : 'text-red-600'}`}>
                        {As_min.toFixed(2)} in² {isAsOk ? '(OK)' : '(NG)'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
