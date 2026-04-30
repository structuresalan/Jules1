import React, { useState } from 'react';
import { Wind, Download } from 'lucide-react';
import { usePDF } from 'react-to-pdf';
import snowData from '../data/asce/snow_factors.json';
import { IBC_TO_ASCE_MAP } from '../data/ibc_mapping';

type ExposureCategory = "B" | "C" | "D";
type RoofExposure = "Fully Exposed" | "Partially Exposed" | "Sheltered";

export const Loads: React.FC = () => {
  const { toPDF, targetRef } = usePDF({filename: 'asce-snow-load-report.pdf'});
  
  // Code Logic
  const [ibcYear, setIbcYear] = useState('IBC 2018');
  const [asceYear, setAsceYear] = useState(IBC_TO_ASCE_MAP['IBC 2018']);
  const [isOverridden, setIsOverridden] = useState(false);
  
  // Navigation
  const [activeTab, setActiveTab] = useState('Snow');

  // Load appropriate year data, cast back to the structure we expect.
  // The JSON structure guarantees ASCE 7-05 through 7-22 have these keys.
  const activeSnowData = (snowData as Record<string, typeof snowData["ASCE 7-16"]>)[asceYear];

  // Inputs
  const [pg, setPg] = useState(20); // Ground snow load (psf)
  const [roofPitch, setRoofPitch] = useState(0); // degrees
  
  // Categorical Inputs
  const [riskCategory, setRiskCategory] = useState<"I"|"II"|"III"|"IV">("II");
  const [thermalCondition, setThermalCondition] = useState("All structures except as indicated below");
  const [terrain, setTerrain] = useState<ExposureCategory>("C");
  const [roofExposure, setRoofExposure] = useState<RoofExposure>("Partially Exposed");
  const [surfaceCondition, setSurfaceCondition] = useState<"Slippery"|"Non-Slippery">("Non-Slippery");

  // Dynamically extract ASCE Factors based on the ACTIVE YEAR
  const isAsce22 = asceYear === 'ASCE 7-22';
  
  // In ASCE 7-22, Is is baked into the reliability-targeted ground snow load pg, so we effectively treat it as 1.0 for math, but we hide it in the UI.
  const Is = activeSnowData.importance_factor_Is[riskCategory];
  const mathIs = isAsce22 ? 1.0 : Is;
  
  const Ct = activeSnowData.thermal_factor_Ct[thermalCondition as keyof typeof activeSnowData.thermal_factor_Ct];
  const Ce = activeSnowData.exposure_factor_Ce[terrain][roofExposure];

  // Calculation: pf = 0.7 * Ce * Ct * (Is) * pg
  const pf_raw = 0.7 * Ce * Ct * mathIs * pg;
  
  // ASCE 7 Minimum Snow Load Check (pm)
  const pm = isAsce22 
    ? (pg <= 20 ? pg : 20)
    : (pg <= 20 ? Is * pg : Is * 20);

  // Final Flat Roof Snow Load
  const pf = Math.max(pf_raw, pm);
  const controls = pf === pm ? 'Minimum (pm) Controls' : 'Calculated (pf_calc) Controls';

  // Slope Factor Cs Calculation
  const ctKey = Ct <= 1.0 ? "Ct<=1.0" : "Ct>=1.1";
  const limitAngle = activeSnowData.roof_slope_factor_Cs[surfaceCondition][ctKey];
  
  const Cs = roofPitch <= limitAngle 
    ? 1.0 
    : roofPitch >= 70 
      ? 0.0 
      : 1.0 - (roofPitch - limitAngle) / (70 - limitAngle);

  // Final Sloped Roof Snow Load
  const ps = Cs * pf;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header and Global Settings */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <Wind className="text-blue-600" />
            Environmental Loads
          </h1>
          <p className="mt-2 text-gray-500">Calculate gravity and lateral environmental loads.</p>
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
                  setAsceYear(IBC_TO_ASCE_MAP[newIbc] || "ASCE 7-16");
                  setIsOverridden(false);
                }}
                className="text-sm font-medium bg-transparent focus:outline-none focus:ring-0 cursor-pointer text-gray-900"
              >
                {Object.keys(IBC_TO_ASCE_MAP).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="text-[10px] text-gray-500 uppercase font-semibold">ASCE</div>
                {isOverridden && (
                  <span className="absolute -top-1 -right-2 transform translate-x-full text-[8px] font-bold bg-amber-100 text-amber-800 px-1 rounded border border-amber-200">
                    OVERRIDE
                  </span>
                )}
              </div>
              <select 
                value={asceYear} 
                onChange={(e) => {
                  setAsceYear(e.target.value);
                  setIsOverridden(e.target.value !== IBC_TO_ASCE_MAP[ibcYear]);
                }}
                className="text-sm font-medium bg-transparent focus:outline-none focus:ring-0 cursor-pointer text-gray-900"
              >
                <option>ASCE 7-22</option>
                <option>ASCE 7-16</option>
                <option>ASCE 7-10</option>
                <option>ASCE 7-05</option>
              </select>
            </div>
          </div>

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
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['Snow', 'Wind', 'Dead', 'Live'].map((tab) => (
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
              {tab} Loads
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div ref={targetRef} className="pt-2">
        {activeTab === 'Snow' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Input Section */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Snow Parameters</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ground Snow Load, pg (psf)</label>
                    <input type="number" value={pg} onChange={(e) => setPg(Number(e.target.value))} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
                  </div>

                  {!isAsce22 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Risk Category</label>
                      <select 
                        value={riskCategory} 
                        onChange={(e) => setRiskCategory(e.target.value as "I"|"II"|"III"|"IV")}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 bg-gray-50"
                      >
                        {Object.keys(activeSnowData.importance_factor_Is).map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Thermal Condition</label>
                    <select 
                      value={thermalCondition} 
                      onChange={(e) => setThermalCondition(e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 bg-gray-50"
                    >
                      {Object.keys(activeSnowData.thermal_factor_Ct).map(cond => (
                        <option key={cond} value={cond}>{cond}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Terrain</label>
                      <select 
                        value={terrain} 
                        onChange={(e) => setTerrain(e.target.value as ExposureCategory)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 bg-gray-50"
                      >
                        {Object.keys(activeSnowData.exposure_factor_Ce).map(t => (
                          <option key={t} value={t}>Exposure {t}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Roof Exposure</label>
                      <select 
                        value={roofExposure} 
                        onChange={(e) => setRoofExposure(e.target.value as RoofExposure)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 bg-gray-50"
                      >
                        {Object.keys(activeSnowData.exposure_factor_Ce["B"]).map(exp => (
                          <option key={exp} value={exp}>{exp}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Roof Geometry</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Roof Pitch (°)</label>
                        <input type="number" value={roofPitch} onChange={(e) => setRoofPitch(Number(e.target.value))} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Surface Condition</label>
                        <select 
                          value={surfaceCondition} 
                          onChange={(e) => setSurfaceCondition(e.target.value as "Slippery"|"Non-Slippery")}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 bg-gray-50"
                        >
                          <option>Non-Slippery</option>
                          <option>Slippery</option>
                        </select>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Output Section (Tedds Style) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm h-full">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b pb-2">Calculation Output: {asceYear}</h2>
                
                {/* Calculation Block */}
                <div className="font-mono text-sm text-gray-800 space-y-4">
                  
                  <div className="border-l-4 border-blue-500 pl-4 py-1 mb-6">
                    <h3 className="font-bold text-gray-900 uppercase">Flat Roof Snow Load</h3>
                  </div>

                  {/* Factors */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 mb-6">
                    <div>Ground snow load</div>
                    <div>p<sub className="text-[10px]">g</sub> = <strong>{pg} psf</strong></div>
                    
                    {!isAsce22 && (
                      <>
                        <div>Importance factor (Table 1.5-2)</div>
                        <div>I<sub className="text-[10px]">s</sub> = <strong>{Is.toFixed(2)}</strong></div>
                      </>
                    )}
                    
                    <div>Thermal factor (Table 7.3-2)</div>
                    <div>C<sub className="text-[10px]">t</sub> = <strong>{Ct.toFixed(2)}</strong></div>
                    
                    <div>Exposure factor (Table 7.3-1)</div>
                    <div>C<sub className="text-[10px]">e</sub> = <strong>{Ce.toFixed(2)}</strong></div>
                  </div>

                  <div className="my-4 border-t border-gray-200"></div>

                  {/* Equation */}
                  <div className="space-y-2">
                    <div className="text-gray-500">Calculate flat roof snow load (Eq. 7.3-1)</div>
                    {isAsce22 ? (
                      <>
                        <div>p<sub className="text-[10px]">f_calc</sub> = 0.7 × C<sub className="text-[10px]">e</sub> × C<sub className="text-[10px]">t</sub> × p<sub className="text-[10px]">g</sub></div>
                        <div>p<sub className="text-[10px]">f_calc</sub> = 0.7 × {Ce} × {Ct} × {pg}</div>
                      </>
                    ) : (
                      <>
                        <div>p<sub className="text-[10px]">f_calc</sub> = 0.7 × C<sub className="text-[10px]">e</sub> × C<sub className="text-[10px]">t</sub> × I<sub className="text-[10px]">s</sub> × p<sub className="text-[10px]">g</sub></div>
                        <div>p<sub className="text-[10px]">f_calc</sub> = 0.7 × {Ce} × {Ct} × {Is} × {pg}</div>
                      </>
                    )}
                    <div className="font-bold">p<sub className="text-[10px]">f_calc</sub> = {pf_raw.toFixed(2)} psf</div>
                  </div>

                  <div className="my-4 border-t border-gray-200"></div>

                  {/* Minimum Check */}
                  <div className="space-y-2">
                    <div className="text-gray-500">Minimum allowable snow load for low-slope roofs (Sec. 7.3.4)</div>
                    {isAsce22 ? (
                      pg <= 20 ? (
                        <>
                          <div>p<sub className="text-[10px]">m</sub> = p<sub className="text-[10px]">g</sub> (Since p<sub className="text-[10px]">g</sub> ≤ 20 psf)</div>
                          <div>p<sub className="text-[10px]">m</sub> = {pm.toFixed(2)} psf</div>
                        </>
                      ) : (
                        <>
                          <div>p<sub className="text-[10px]">m</sub> = 20 psf (Since p<sub className="text-[10px]">g</sub> {'>'} 20 psf)</div>
                          <div>p<sub className="text-[10px]">m</sub> = {pm.toFixed(2)} psf</div>
                        </>
                      )
                    ) : (
                      pg <= 20 ? (
                        <>
                          <div>p<sub className="text-[10px]">m</sub> = I<sub className="text-[10px]">s</sub> × p<sub className="text-[10px]">g</sub> (Since p<sub className="text-[10px]">g</sub> ≤ 20 psf)</div>
                          <div>p<sub className="text-[10px]">m</sub> = {Is} × {pg} = {pm.toFixed(2)} psf</div>
                        </>
                      ) : (
                        <>
                          <div>p<sub className="text-[10px]">m</sub> = I<sub className="text-[10px]">s</sub> × 20 psf (Since p<sub className="text-[10px]">g</sub> {'>'} 20 psf)</div>
                          <div>p<sub className="text-[10px]">m</sub> = {Is} × 20 = {pm.toFixed(2)} psf</div>
                        </>
                      )
                    )}
                  </div>

                  <div className="my-4 border-t border-gray-200"></div>
                  
                  {/* Roof Slope Factor */}
                  <div className="space-y-2">
                    <div className="text-gray-500">Calculate roof slope factor (Fig. 7.4-1)</div>
                    <div>Limit angle for C<sub className="text-[10px]">t</sub> {Ct <= 1.0 ? '≤ 1.0' : '≥ 1.1'} and {surfaceCondition} surface = <strong>{limitAngle}°</strong></div>
                    {Cs === 1.0 ? (
                      <div>C<sub className="text-[10px]">s</sub> = 1.0 (Since Pitch ≤ {limitAngle}°)</div>
                    ) : Cs === 0.0 ? (
                      <div>C<sub className="text-[10px]">s</sub> = 0.0 (Since Pitch ≥ 70°)</div>
                    ) : (
                      <>
                        <div>C<sub className="text-[10px]">s</sub> = 1.0 - (Pitch - {limitAngle}) / (70 - {limitAngle})</div>
                        <div>C<sub className="text-[10px]">s</sub> = 1.0 - ({roofPitch} - {limitAngle}) / {70 - limitAngle} = <strong>{Cs.toFixed(3)}</strong></div>
                      </>
                    )}
                  </div>

                  <div className="my-4 border-t border-gray-200"></div>

                  {/* Final Result */}
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded">
                    <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-4">
                      <div>
                        <div className="text-gray-600 font-medium">Flat Roof Design Load</div>
                        <div className="text-xs text-blue-600 mt-1 italic">{controls}</div>
                      </div>
                      <div className="text-xl font-bold text-gray-700">
                        p<sub className="text-sm">f</sub> = {pf.toFixed(2)} psf
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-gray-900 font-bold">Sloped Roof Design Load</div>
                        <div className="text-xs text-gray-500 mt-1">p<sub className="text-[10px]">s</sub> = C<sub className="text-[10px]">s</sub> × p<sub className="text-[10px]">f</sub></div>
                      </div>
                      <div className="text-3xl font-bold text-gray-900 border-b-2 border-gray-900 pb-1">
                        p<sub className="text-sm">s</sub> = {ps.toFixed(2)} psf
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Placeholders for other tabs */}
        {activeTab !== 'Snow' && (
          <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900">{activeTab} Loads</h3>
            <p className="mt-2 text-sm text-gray-500">This calculation module is under construction.</p>
          </div>
        )}
      </div>
    </div>
  );
};
