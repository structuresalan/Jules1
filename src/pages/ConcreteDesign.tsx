import React, { useState, useMemo } from 'react';
import { Layers, Download } from 'lucide-react';
import { usePDF } from 'react-to-pdf';
import rebarData from '../data/aci/rebar.json';

// Type assertion for rebar
const rebars = rebarData as Record<string, { diameter: number, area: number }>;
const rebarSizes = Object.keys(rebars);

export const ConcreteDesign: React.FC = () => {
  const { toPDF, targetRef } = usePDF({filename: 'concrete-design-report.pdf'});
  
  // Inputs
  const [codeYear, setCodeYear] = useState('ACI 318-19');
  const [width, setWidth] = useState(12); // inches (b)
  const [height, setHeight] = useState(24); // inches (h)
  const [cover, setCover] = useState(1.5); // inches
  const [fc, setFc] = useState(4000); // psi (f'c)
  const [fy, setFy] = useState(60000); // psi (fy)
  
  // Rebar Selection
  const [rebarSize, setRebarSize] = useState('#8');
  const [rebarQty, setRebarQty] = useState(3);
  
  // Dynamically calculate area of steel (As)
  const rebarProps = useMemo(() => rebars[rebarSize], [rebarSize]);
  const as = rebarQty * rebarProps.area;
  
  // Calculate Effective Depth (d)
  // height - cover - stirrup(#4) - half main bar diam
  const d = height - cover - 0.5 - (rebarProps.diameter / 2); 

  // Calculation Logic (Simplified ACI 318 for singly reinforced rectangular section)
  const beta1 = fc <= 4000 ? 0.85 : Math.max(0.65, 0.85 - 0.05 * ((fc - 4000) / 1000));
  const a = (as * fy) / (0.85 * fc * width); // Depth of equivalent rectangular stress block
  const c = a / beta1; // Depth to neutral axis
  
  const strain_t = 0.003 * ((d - c) / c); // Strain in extreme tension steel
  
  // Phi factor determination
  let phi = 0.9;
  if (strain_t < 0.002) {
    phi = 0.65; // Compression controlled (simplified spiral/tied)
  } else if (strain_t < 0.005) {
    phi = 0.65 + (strain_t - 0.002) * (250 / 3); // Transition zone
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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <Layers className="text-blue-600" />
            Concrete Beam Design
          </h1>
          <p className="mt-2 text-gray-500">Rectangular beam flexural capacity calculation.</p>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Design Code</label>
                <select 
                  value={codeYear} 
                  onChange={(e) => setCodeYear(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                >
                  <option>ACI 318-19</option>
                  <option>ACI 318-14</option>
                  <option>ACI 318-11</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Width, b (in)</label>
                  <input type="number" value={width} onChange={(e) => setWidth(Number(e.target.value))} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Height, h (in)</label>
                  <input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Clear Cover (in)</label>
                <input type="number" step="0.1" value={cover} onChange={(e) => setCover(Number(e.target.value))} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
              </div>

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
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Results: {codeYear}</h2>
            
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
