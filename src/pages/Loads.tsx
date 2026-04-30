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

  // Inputs
  const [pg, setPg] = useState(20); // Ground snow load (psf)
  
  // Categorical Inputs
  const [riskCategory, setRiskCategory] = useState<"I"|"II"|"III"|"IV">("II");
  const [thermalCondition, setThermalCondition] = useState("All structures except as indicated below");
  const [terrain, setTerrain] = useState<ExposureCategory>("C");
  const [roofExposure, setRoofExposure] = useState<RoofExposure>("Partially Exposed");

  // Dynamically extract ASCE Factors
  const Is = snowData.importance_factor_Is[riskCategory];
  const Ct = snowData.thermal_factor_Ct[thermalCondition as keyof typeof snowData.thermal_factor_Ct];
  const Ce = snowData.exposure_factor_Ce[terrain][roofExposure];

  // Calculation: pf = 0.7 * Ce * Ct * Is * pg
  const pf_raw = 0.7 * Ce * Ct * Is * pg;
  
  // ASCE 7 Minimum Snow Load Check (pm)
  const pm = pg <= 20 ? Is * pg : Is * 20;

  // Final Design Snow Load
  const pf = Math.max(pf_raw, pm);
  const controls = pf === pm ? 'Minimum (pm) Controls' : 'Calculated (pf) Controls';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <Wind className="text-blue-600" />
            ASCE Environmental Loads
          </h1>
          <p className="mt-2 text-gray-500">Flat Roof Snow Load Calculation (pf).</p>
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
              
              {/* Governing Code Selection */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-md space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Governing Building Code (IBC)</label>
                  <select 
                    value={ibcYear} 
                    onChange={(e) => {
                      const newIbc = e.target.value;
                      setIbcYear(newIbc);
                      setAsceYear(IBC_TO_ASCE_MAP[newIbc] || "ASCE 7-16");
                      setIsOverridden(false);
                    }}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 bg-white"
                  >
                    {Object.keys(IBC_TO_ASCE_MAP).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">Reference Standard (ASCE 7)</label>
                    {isOverridden && (
                      <span className="text-[10px] font-medium bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                        User Overridden
                      </span>
                    )}
                  </div>
                  <select 
                    value={asceYear} 
                    onChange={(e) => {
                      setAsceYear(e.target.value);
                      setIsOverridden(e.target.value !== IBC_TO_ASCE_MAP[ibcYear]);
                    }}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 bg-white"
                  >
                    <option>ASCE 7-22</option>
                    <option>ASCE 7-16</option>
                    <option>ASCE 7-10</option>
                    <option>ASCE 7-05</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ground Snow Load, pg (psf)</label>
                <input type="number" value={pg} onChange={(e) => setPg(Number(e.target.value))} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Risk Category</label>
                <select 
                  value={riskCategory} 
                  onChange={(e) => setRiskCategory(e.target.value as "I"|"II"|"III"|"IV")}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 bg-gray-50"
                >
                  {Object.keys(snowData.importance_factor_Is).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thermal Condition</label>
                <select 
                  value={thermalCondition} 
                  onChange={(e) => setThermalCondition(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 bg-gray-50"
                >
                  {Object.keys(snowData.thermal_factor_Ct).map(cond => (
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
                    {Object.keys(snowData.exposure_factor_Ce).map(t => (
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
                    {Object.keys(snowData.exposure_factor_Ce["B"]).map(exp => (
                      <option key={exp} value={exp}>{exp}</option>
                    ))}
                  </select>
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
                
                <div>Importance factor (Table 1.5-2)</div>
                <div>I<sub className="text-[10px]">s</sub> = <strong>{Is.toFixed(2)}</strong></div>
                
                <div>Thermal factor (Table 7.3-2)</div>
                <div>C<sub className="text-[10px]">t</sub> = <strong>{Ct.toFixed(2)}</strong></div>
                
                <div>Exposure factor (Table 7.3-1)</div>
                <div>C<sub className="text-[10px]">e</sub> = <strong>{Ce.toFixed(2)}</strong></div>
              </div>

              <div className="my-4 border-t border-gray-200"></div>

              {/* Equation */}
              <div className="space-y-2">
                <div className="text-gray-500">Calculate flat roof snow load (Eq. 7.3-1)</div>
                <div>p<sub className="text-[10px]">f_calc</sub> = 0.7 × C<sub className="text-[10px]">e</sub> × C<sub className="text-[10px]">t</sub> × I<sub className="text-[10px]">s</sub> × p<sub className="text-[10px]">g</sub></div>
                <div>p<sub className="text-[10px]">f_calc</sub> = 0.7 × {Ce} × {Ct} × {Is} × {pg}</div>
                <div className="font-bold">p<sub className="text-[10px]">f_calc</sub> = {pf_raw.toFixed(2)} psf</div>
              </div>

              <div className="my-4 border-t border-gray-200"></div>

              {/* Minimum Check */}
              <div className="space-y-2">
                <div className="text-gray-500">Minimum allowable snow load for low-slope roofs (Sec. 7.3.4)</div>
                {pg <= 20 ? (
                  <>
                    <div>p<sub className="text-[10px]">m</sub> = I<sub className="text-[10px]">s</sub> × p<sub className="text-[10px]">g</sub> (Since p<sub className="text-[10px]">g</sub> ≤ 20 psf)</div>
                    <div>p<sub className="text-[10px]">m</sub> = {Is} × {pg} = {pm.toFixed(2)} psf</div>
                  </>
                ) : (
                  <>
                    <div>p<sub className="text-[10px]">m</sub> = I<sub className="text-[10px]">s</sub> × 20 psf (Since p<sub className="text-[10px]">g</sub> {'>'} 20 psf)</div>
                    <div>p<sub className="text-[10px]">m</sub> = {Is} × 20 = {pm.toFixed(2)} psf</div>
                  </>
                )}
              </div>

              <div className="my-4 border-t border-gray-200"></div>

              {/* Final Result */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded flex items-center justify-between">
                <div>
                  <div className="text-gray-500">Final Design Load (Max of p<sub className="text-[10px]">f_calc</sub>, p<sub className="text-[10px]">m</sub>)</div>
                  <div className="text-xs text-blue-600 mt-1 italic">{controls}</div>
                </div>
                <div className="text-2xl font-bold text-gray-900 border-b-2 border-gray-900 pb-1">
                  p<sub className="text-sm">f</sub> = {pf.toFixed(2)} psf
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
