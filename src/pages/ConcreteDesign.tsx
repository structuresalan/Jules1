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
  const [activeTab, setActiveTab] = useState('Beam');

  const concreteTabs = [
    'Beam', 'One-Way Slab', 'Slab on Grade', 'Two-Way Slab', 
    'Walls', 'Columns', 'Footings', 'Piers'
  ];

  // Common Inputs
  const [width, setWidth] = useState(12); // inches (b)
  const [height, setHeight] = useState(24); // inches (h)
  const [cover, setCover] = useState(1.5); // inches
  const [fc, setFc] = useState(4000); // psi (f'c)
  const [fy, setFy] = useState(60000); // psi (fy)
  
  // Beam Rebar Selection
  const [rebarSize, setRebarSize] = useState('#8');
  const [rebarQty, setRebarQty] = useState(3);

  // One-Way Slab Inputs (12" Unit Strip)
  const [slabThickness, setSlabThickness] = useState(8); // inches
  const [slabCover, setSlabCover] = useState(0.75); // inches
  const [slabRebarSize, setSlabRebarSize] = useState('#5');
  const [slabSpacing, setSlabSpacing] = useState(12); // inches
  const [vu, setVu] = useState(4500); // lbs (Factored Shear Load)
  
  // Rules of Thumb Toggle
  const [showQuickChecks, setShowQuickChecks] = useState(false);

  // Extract historical factors
  const factors = (aciData as Record<string, typeof aciData["ACI 318-19"]>)[aciYear] || aciData["ACI 318-19"];
  const isAci19 = aciYear === "ACI 318-19";

  // --- Beam Flexure Logic ---
  const rebarProps = useMemo(() => rebars[rebarSize], [rebarSize]);
  const as = rebarQty * rebarProps.area;
  const d = height - cover - 0.5 - (rebarProps.diameter / 2); 

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


  // --- One-Way Slab Shear Logic ---
  const slabRebarProps = useMemo(() => rebars[slabRebarSize], [slabRebarSize]);
  // Effective depth for slab (no stirrups, assume main bar is directly on top of cover)
  const d_slab = slabThickness - slabCover - (slabRebarProps.diameter / 2);
  // Area of steel per 12-inch strip
  const as_slab = (12 / slabSpacing) * slabRebarProps.area;
  
  const lambda = 1.0; // Normal weight concrete

  // If using ACI 19, calculate intermediate variables
  const rho_w = isAci19 ? as_slab / (12 * d_slab) : 0;
  const lambda_s = isAci19 ? Math.min(1.0, Math.sqrt(2 / (1 + (d_slab / 10)))) : 1.0;

  const vc_slab = isAci19
    ? 8 * lambda_s * lambda * Math.pow(rho_w, 1/3) * Math.sqrt(fc) * 12 * d_slab
    : 2 * lambda * Math.sqrt(fc) * 12 * d_slab;

  const phi_v = factors.phi_shear;
  const phiVc_slab = phi_v * vc_slab;
  const isShearOk = vu <= phiVc_slab;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header and Global Settings */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <Layers className="text-blue-600" />
            Concrete Design
          </h1>
          <p className="mt-2 text-gray-500">ACI 318 compliant structural concrete analysis.</p>
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

      {/* Navigation Sub-tabs */}
      <div className="border-b border-gray-200 overflow-x-auto custom-scrollbar">
        <nav className="-mb-px flex space-x-6 min-w-max px-2">
          {concreteTabs.map((tab) => (
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

      <div ref={targetRef} className="pt-2">
        {activeTab === 'Beam' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
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
        )}

        {activeTab === 'One-Way Slab' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Input Section */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Unit Strip Parameters (12")</h2>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <VariableInput label="Thickness, h" value={slabThickness} onChange={setSlabThickness} unit="in" />
                    <VariableInput label="Clear Cover" value={slabCover} onChange={setSlabCover} unit="in" step="0.1" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <VariableInput label="f'c" value={fc} onChange={setFc} unit="psi" step="100" />
                    <VariableInput label="fy" value={fy} onChange={setFy} unit="psi" step="1000" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rebar Size</label>
                      <select 
                        value={slabRebarSize} 
                        onChange={(e) => setSlabRebarSize(e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                      >
                        {rebarSizes.map(size => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                    </div>
                    <VariableInput label="Spacing, s" value={slabSpacing} onChange={setSlabSpacing} unit="in" />
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Applied Loads</h3>
                    <VariableInput label="Factored Shear, Vu" value={vu} onChange={setVu} unit="lbs" step="100" />
                  </div>
                </div>
              </div>
            </div>

            {/* Output Section */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm h-full">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b pb-2">One-Way Shear Capacity: {aciYear}</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className={`p-4 rounded-lg border ${isShearOk ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className={`text-sm font-medium mb-1 ${isShearOk ? 'text-green-800' : 'text-red-800'}`}>Design Shear Capacity, φV<sub>c</sub></div>
                    <div className={`text-3xl font-bold flex items-center gap-4 ${isShearOk ? 'text-green-900' : 'text-red-900'}`}>
                      {phiVc_slab.toFixed(0)} <span className="text-lg font-normal">lbs</span>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex flex-col justify-center">
                    <div className="text-sm text-gray-600 font-medium mb-1">Applied Demand, V<sub>u</sub></div>
                    <div className="text-2xl font-bold text-gray-900">{vu} <span className="text-sm font-normal">lbs</span></div>
                    <div className={`text-xs font-bold mt-2 ${isShearOk ? 'text-green-600' : 'text-red-600'}`}>
                      {isShearOk ? 'V_u ≤ φV_c (PASS)' : 'V_u > φV_c (FAIL)'}
                    </div>
                  </div>
                </div>

                <div className="font-mono text-sm text-gray-800 space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4 py-1 mb-6">
                    <h3 className="font-bold text-gray-900 uppercase">12-Inch Strip Properties</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 mb-6">
                    <div>Effective depth</div>
                    <div>d = {slabThickness} - {slabCover} - ({slabRebarProps.diameter}/2) = <strong>{d_slab.toFixed(2)}"</strong></div>
                    
                    <div>Area of steel</div>
                    <div>A<sub>s</sub> = (12 / {slabSpacing}) × {slabRebarProps.area} = <strong>{as_slab.toFixed(2)} in²</strong></div>
                  </div>

                  <div className="my-4 border-t border-gray-200"></div>

                  <div className="space-y-2">
                    <div className="text-gray-500">Calculate nominal concrete shear strength, V<sub>c</sub></div>
                    
                    {isAci19 ? (
                      <>
                        <div><em>Note: ACI 318-19 introduced size effect and reinforcement ratio to V<sub>c</sub> for sections without minimum shear reinforcement (Eq. 22.5.5.1).</em></div>
                        <div className="mt-4">Reinforcement ratio (ρ<sub>w</sub>)</div>
                        <div>ρ<sub>w</sub> = A<sub>s</sub> / (b<sub>w</sub> × d) = {as_slab.toFixed(2)} / (12 × {d_slab.toFixed(2)}) = <strong>{rho_w.toFixed(5)}</strong></div>
                        
                        <div className="mt-4">Size effect factor (λ<sub>s</sub>)</div>
                        <div>λ<sub>s</sub> = min(1.0, √(2 / (1 + d/10)))</div>
                        <div>λ<sub>s</sub> = min(1.0, √(2 / (1 + {d_slab.toFixed(2)}/10))) = <strong>{lambda_s.toFixed(3)}</strong></div>

                        <div className="mt-4 border-t border-gray-100 pt-2"></div>
                        <div>V<sub>c</sub> = 8 × λ<sub>s</sub> × λ × (ρ<sub>w</sub>)<sup>1/3</sup> × √(f'<sub>c</sub>) × b<sub>w</sub> × d</div>
                        <div>V<sub>c</sub> = 8 × {lambda_s.toFixed(3)} × {lambda.toFixed(2)} × ({rho_w.toFixed(5)})<sup>1/3</sup> × √({fc}) × 12 × {d_slab.toFixed(2)}</div>
                      </>
                    ) : (
                      <>
                        <div><em>Note: Using classic pre-2019 simplified concrete shear strength equation.</em></div>
                        <div className="mt-4">V<sub>c</sub> = 2 × λ × √(f'<sub>c</sub>) × b<sub>w</sub> × d</div>
                        <div>V<sub>c</sub> = 2 × {lambda.toFixed(2)} × √({fc}) × 12 × {d_slab.toFixed(2)}</div>
                      </>
                    )}
                    
                    <div className="font-bold text-lg mt-2">V<sub>c</sub> = {vc_slab.toFixed(0)} lbs</div>
                  </div>

                  <div className="my-4 border-t border-gray-200"></div>

                  <div className="space-y-2">
                    <div className="text-gray-500">Design shear strength</div>
                    <div>φV<sub>c</sub> = {phi_v} × {vc_slab.toFixed(0)}</div>
                    <div className="font-bold text-xl text-blue-900">φV<sub>c</sub> = {phiVc_slab.toFixed(0)} lbs</div>
                  </div>

                </div>

              </div>
            </div>
          </div>
        )}

        {/* Placeholders for other tabs */}
        {activeTab !== 'Beam' && activeTab !== 'One-Way Slab' && (
          <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900">{activeTab} Design</h3>
            <p className="mt-2 text-sm text-gray-500">This ACI 318 calculation module is under construction.</p>
          </div>
        )}
      </div>
    </div>
  );
};
