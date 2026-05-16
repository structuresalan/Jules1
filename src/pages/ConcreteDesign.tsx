import React, { useState, useMemo } from 'react';
import { Layers, Download, CheckSquare } from 'lucide-react';
import { usePDF } from 'react-to-pdf';
import rebarData from '../data/aci/rebar.json';
import aciData from '../data/aci/code_factors.json';
import { IBC_TO_ACI_MAP } from '../data/ibc_mapping';
import { VariableInput } from '../components/VariableInput';
import { ConcreteCrossSection } from '../components/ConcreteCrossSection';

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
  const [muSlab, setMuSlab] = useState(12.5); // kip-ft (Factored Moment)

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


  // --- One-Way Slab Logic ---
  const slabRebarProps = useMemo(() => rebars[slabRebarSize], [slabRebarSize]);
  // Effective depth for slab (no stirrups, assume main bar is directly on top of cover)
  const d_slab = slabThickness - slabCover - (slabRebarProps.diameter / 2);
  // Area of steel per 12-inch strip
  const as_slab = (12 / slabSpacing) * slabRebarProps.area;

  // Slab Flexure Logic
  const beta1_slab = fc <= 4000 ? factors.beta1_limit : Math.max(0.65, factors.beta1_limit - 0.05 * ((fc - 4000) / 1000));
  const a_slab = (as_slab * fy) / (0.85 * fc * 12); // Width b = 12" unit strip
  const c_slab = a_slab / beta1_slab;
  const strain_t_slab = 0.003 * ((d_slab - c_slab) / c_slab);

  let phi_f_slab = factors.phi_tension_controlled;
  if (strain_t_slab < 0.002) {
    phi_f_slab = factors.phi_compression_tied;
  } else if (strain_t_slab < 0.005) {
    phi_f_slab = factors.phi_compression_tied + (strain_t_slab - 0.002) * ((factors.phi_tension_controlled - factors.phi_compression_tied) / 0.003);
  }

  const Mn_slab = as_slab * fy * (d_slab - a_slab / 2); // lb-in
  const phiMn_slab = (phi_f_slab * Mn_slab) / 12000; // kip-ft
  const isFlexureOk = muSlab <= phiMn_slab;

  // Detailing Checks (Temperature & Shrinkage + Spacing)
  // ACI min steel for slabs: 0.0018 for Grade 60, adjusted for others
  const ts_ratio = fy >= 60000 ? Math.max(0.0014, (0.0018 * 60000) / fy) : 0.0020;
  const As_min_slab = ts_ratio * 12 * slabThickness; // gross area (h) used for T&S
  const isAsSlabOk = as_slab >= As_min_slab;

  // Max spacing
  const s_max = Math.min(3 * slabThickness, 18);
  const isSpacingOk = slabSpacing <= s_max;

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
          <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
            <Layers className="text-blue-400" />
            Concrete Design
          </h1>
          <p className="mt-2 text-slate-400">ACI 318 compliant structural concrete analysis.</p>
        </div>

        <div className="flex items-center gap-4 bg-slate-800 p-2 rounded-lg border border-slate-700 w-full lg:w-auto">
          {/* Top Right Code Selectors */}
          <div className="flex items-center gap-3 pr-4 border-r border-slate-600">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">IBC</div>
              <select
                value={ibcYear}
                onChange={(e) => {
                  const newIbc = e.target.value;
                  setIbcYear(newIbc);
                  setAciYear(IBC_TO_ACI_MAP[newIbc] || "ACI 318-14");
                  setIsOverridden(false);
                }}
                className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-slate-200 cursor-pointer focus:outline-none focus:border-blue-500"
              >
                {Object.keys(IBC_TO_ACI_MAP).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">ACI 318</div>
                {isOverridden && (
                  <span className="absolute -top-1 -right-2 transform translate-x-full text-[8px] font-bold bg-amber-900/30 text-amber-400 px-1 rounded border border-amber-700">
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
                className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-slate-200 cursor-pointer focus:outline-none focus:border-blue-500"
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
            className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors text-sm font-medium shrink-0 ${showQuickChecks ? 'bg-indigo-900/20 text-indigo-300 border border-indigo-700' : 'bg-slate-700 text-slate-300 border border-slate-600 hover:bg-slate-600'}`}
          >
            <CheckSquare size={16} />
            Quick Checks
          </button>

          <button
            onClick={() => toPDF()}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-700 rounded transition-colors text-sm font-medium shrink-0"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Navigation Sub-tabs */}
      <div className="border-b border-slate-700 overflow-x-auto custom-scrollbar">
        <nav className="-mb-px flex space-x-6 min-w-max px-2">
          {concreteTabs.map((tab) => {
            const isStub = tab !== 'Beam' && tab !== 'One-Way Slab';
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors inline-flex items-center gap-1.5
                  ${activeTab === tab
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-500'
                  }
                `}
              >
                {tab}
                {isStub && <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded">Coming Soon</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {showQuickChecks && (
        <div className="bg-indigo-900/20 border border-indigo-700 rounded-lg p-4 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2 mb-2 text-indigo-300">
            <CheckSquare size={18} />
            <h3 className="font-semibold">Engineering Rules of Thumb (Concrete Beam)</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-indigo-200">
            <div className="bg-slate-800/60 p-3 rounded border border-indigo-700/50">
              <div className="font-medium mb-1">Estimated Steel Area ($A_s$)</div>
              <p>For a given factored moment $M_u$ (kip-ft), you can roughly estimate the required steel area: <br/><code>As ≈ Mu / (4 × d)</code></p>
              <p className="mt-2 text-xs italic">Example: For Mu = 100 kip-ft and d = 20", As ≈ 100 / (4 × 20) = 1.25 in²</p>
            </div>
            <div className="bg-slate-800/60 p-3 rounded border border-indigo-700/50">
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
              <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                <h2 className="text-lg font-semibold text-slate-100 mb-4 border-b border-slate-700 pb-2">Design Parameters</h2>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <VariableInput label="Width, b" value={width} onChange={setWidth} unit="in" />
                    <VariableInput label="Height, h" value={height} onChange={setHeight} unit="in" />
                  </div>

                  <VariableInput label="Clear Cover" value={cover} onChange={setCover} unit="in" step="0.1" />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">f'c (psi)</label>
                      <input type="number" step="100" value={fc} onChange={(e) => setFc(Number(e.target.value))} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">fy (psi)</label>
                      <input type="number" step="1000" value={fy} onChange={(e) => setFy(Number(e.target.value))} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Rebar Size</label>
                      <select
                        value={rebarSize}
                        onChange={(e) => setRebarSize(e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 cursor-pointer focus:outline-none focus:border-blue-500"
                      >
                        {rebarSizes.map(size => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Quantity</label>
                      <input type="number" min="1" step="1" value={rebarQty} onChange={(e) => setRebarQty(Number(e.target.value))} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500" />
                    </div>
                  </div>
                  <div className="text-sm text-slate-500 text-right">
                    Calculated As: <span className="font-semibold text-slate-300">{as.toFixed(2)} in²</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Output Section */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-2">
                  <h2 className="text-lg font-semibold text-slate-100">Results: {aciYear}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="md:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                        <div className="text-sm text-blue-300 font-medium mb-1">Design Moment Capacity, φMn</div>
                        <div className="text-3xl font-bold text-blue-300">{phiMn.toFixed(1)} <span className="text-lg font-normal">kip-ft</span></div>
                      </div>
                      <div className="p-4 bg-slate-700 border border-slate-600 rounded-lg flex flex-col justify-center">
                        <div className="text-sm text-slate-400 font-medium mb-1">Strength Reduction Factor, φ</div>
                        <div className="text-3xl font-bold text-slate-200">{phi.toFixed(3)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-1">
                    <ConcreteCrossSection
                      width={width}
                      height={height}
                      cover={cover}
                      rebarDiameter={rebarProps.diameter}
                      rebarQty={rebarQty}
                      isSlab={false}
                    />
                  </div>
                </div>

                <div className="space-y-4 border-t border-slate-700 pt-4">
                  <h3 className="text-md font-medium text-slate-300">Detailed Calculations</h3>
                  <div className="bg-slate-900 rounded border border-slate-700 p-4 font-mono text-sm">
                    <table className="w-full">
                      <tbody>
                        <tr className="border-b border-slate-700">
                          <td className="py-2 text-slate-400">Effective Depth (d)</td>
                          <td className="py-2 text-right font-medium text-slate-200">{d.toFixed(2)} in</td>
                        </tr>
                        <tr className="border-b border-slate-700">
                          <td className="py-2 text-slate-400">Stress Block Depth (a)</td>
                          <td className="py-2 text-right font-medium text-slate-200">{a.toFixed(2)} in</td>
                        </tr>
                        <tr className="border-b border-slate-700">
                          <td className="py-2 text-slate-400">Neutral Axis Depth (c)</td>
                          <td className="py-2 text-right font-medium text-slate-200">{c.toFixed(2)} in</td>
                        </tr>
                        <tr className="border-b border-slate-700">
                          <td className="py-2 text-slate-400">Tensile Strain (εt)</td>
                          <td className="py-2 text-right font-medium text-slate-200">{strain_t.toFixed(4)}</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-slate-400">Min Steel Check (As,min)</td>
                          <td className={`py-2 text-right font-medium ${isAsOk ? 'text-green-400' : 'text-red-400'}`}>
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
              <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                <h2 className="text-lg font-semibold text-slate-100 mb-4 border-b border-slate-700 pb-2">Unit Strip Parameters (12")</h2>

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
                      <label className="block text-sm font-medium text-slate-400 mb-1">Rebar Size</label>
                      <select
                        value={slabRebarSize}
                        onChange={(e) => setSlabRebarSize(e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 cursor-pointer focus:outline-none focus:border-blue-500"
                      >
                        {rebarSizes.map(size => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                    </div>
                    <VariableInput label="Spacing, s" value={slabSpacing} onChange={setSlabSpacing} unit="in" />
                  </div>

                  <div className="pt-4 border-t border-slate-700">
                    <h3 className="text-sm font-semibold text-slate-100 mb-3">Applied Loads</h3>
                    <div className="space-y-4">
                      <VariableInput label="Factored Moment, Mu" value={muSlab} onChange={setMuSlab} unit="kip-ft" step="0.5" />
                      <VariableInput label="Factored Shear, Vu" value={vu} onChange={setVu} unit="lbs" step="100" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Output Section */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-800 p-8 rounded-lg border border-slate-700 h-full overflow-hidden">
                <div className="flex items-center justify-between mb-6 border-b border-slate-700 pb-2">
                  <h2 className="text-xl font-semibold text-slate-100">One-Way Slab Calculation: {aciYear}</h2>
                </div>

                {/* Visual Diagram */}
                <div className="mb-8">
                  <ConcreteCrossSection
                    width={12}
                    height={slabThickness}
                    cover={slabCover}
                    rebarDiameter={slabRebarProps.diameter}
                    rebarQty={12 / slabSpacing}
                    isSlab={true}
                  />
                </div>

                {/* 1. Flexural Capacity Block */}
                <div className="font-mono text-sm text-slate-300 space-y-4 mb-8">
                  <div className="border-l-4 border-blue-500 pl-4 py-1 mb-6 flex justify-between items-center bg-slate-900/50 pr-4">
                    <h3 className="font-bold text-slate-200 uppercase">Flexural Capacity</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${isFlexureOk ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
                      {isFlexureOk ? 'PASS' : 'FAIL'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 mb-4">
                    <div>Factored moment demand</div>
                    <div>M<sub className="text-[10px]">u</sub> = <strong>{muSlab} kip-ft/ft</strong></div>
                    <div>Effective depth</div>
                    <div>d = {slabThickness} - {slabCover} - ({slabRebarProps.diameter}/2) = <strong>{d_slab.toFixed(2)}"</strong></div>
                    <div>Area of steel</div>
                    <div>A<sub className="text-[10px]">s</sub> = (12/{slabSpacing}) × {slabRebarProps.area} = <strong>{as_slab.toFixed(2)} in²/ft</strong></div>
                  </div>

                  <div className="space-y-1">
                    <div>a = (A<sub className="text-[10px]">s</sub> × f<sub className="text-[10px]">y</sub>) / (0.85 × f'<sub className="text-[10px]">c</sub> × b)</div>
                    <div>a = ({as_slab.toFixed(2)} × {fy}) / (0.85 × {fc} × 12) = <strong>{a_slab.toFixed(2)}"</strong></div>
                    <div>c = a / β<sub className="text-[10px]">1</sub> = {a_slab.toFixed(2)} / {beta1_slab.toFixed(2)} = <strong>{c_slab.toFixed(2)}"</strong></div>
                    <div>ε<sub className="text-[10px]">t</sub> = 0.003 × (d - c) / c = 0.003 × ({d_slab.toFixed(2)} - {c_slab.toFixed(2)}) / {c_slab.toFixed(2)} = <strong>{strain_t_slab.toFixed(4)}</strong></div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-700 rounded mt-4">
                    <div>
                      <div className="text-slate-500">Design flexural strength</div>
                      <div>φM<sub className="text-[10px]">n</sub> = φ × A<sub className="text-[10px]">s</sub> × f<sub className="text-[10px]">y</sub> × (d - a/2) / 12000</div>
                    </div>
                    <div className="text-xl font-bold text-blue-300">
                      φM<sub className="text-[10px]">n</sub> = {phiMn_slab.toFixed(1)} kip-ft/ft
                    </div>
                  </div>
                </div>

                {/* 2. Shear Capacity Block */}
                <div className="font-mono text-sm text-slate-300 space-y-4 mb-8">
                  <div className="border-l-4 border-blue-500 pl-4 py-1 mb-6 flex justify-between items-center bg-slate-900/50 pr-4">
                    <h3 className="font-bold text-slate-200 uppercase">Shear Capacity</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${isShearOk ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
                      {isShearOk ? 'PASS' : 'FAIL'}
                    </span>
                  </div>

                  <div className="mb-4">
                    Factored shear demand: V<sub className="text-[10px]">u</sub> = <strong>{vu} lbs/ft</strong>
                  </div>

                  <div className="space-y-2">
                    <div className="text-slate-500">Calculate nominal concrete shear strength, V<sub className="text-[10px]">c</sub></div>

                    {isAci19 ? (
                      <>
                        <div className="text-xs italic text-slate-500 mb-2">Note: ACI 318-19 introduced size effect and reinforcement ratio to Vc.</div>
                        <div>ρ<sub className="text-[10px]">w</sub> = A<sub className="text-[10px]">s</sub> / (b<sub className="text-[10px]">w</sub> × d) = {as_slab.toFixed(2)} / (12 × {d_slab.toFixed(2)}) = <strong>{rho_w.toFixed(5)}</strong></div>
                        <div>λ<sub className="text-[10px]">s</sub> = min(1.0, √(2 / (1 + d/10))) = min(1.0, √(2 / (1 + {d_slab.toFixed(2)}/10))) = <strong>{lambda_s.toFixed(3)}</strong></div>
                        <div className="mt-2">V<sub className="text-[10px]">c</sub> = 8 × λ<sub className="text-[10px]">s</sub> × λ × (ρ<sub className="text-[10px]">w</sub>)<sup>1/3</sup> × √(f'<sub className="text-[10px]">c</sub>) × b<sub className="text-[10px]">w</sub> × d</div>
                        <div>V<sub className="text-[10px]">c</sub> = 8 × {lambda_s.toFixed(3)} × {lambda.toFixed(2)} × ({rho_w.toFixed(5)})<sup>1/3</sup> × √({fc}) × 12 × {d_slab.toFixed(2)}</div>
                      </>
                    ) : (
                      <>
                        <div className="text-xs italic text-slate-500 mb-2">Note: Using classic pre-2019 simplified concrete shear strength equation.</div>
                        <div>V<sub className="text-[10px]">c</sub> = 2 × λ × √(f'<sub className="text-[10px]">c</sub>) × b<sub className="text-[10px]">w</sub> × d</div>
                        <div>V<sub className="text-[10px]">c</sub> = 2 × {lambda.toFixed(2)} × √({fc}) × 12 × {d_slab.toFixed(2)}</div>
                      </>
                    )}
                    <div className="font-bold">V<sub className="text-[10px]">c</sub> = {vc_slab.toFixed(0)} lbs</div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-700 rounded mt-4">
                    <div>
                      <div className="text-slate-500">Design shear strength</div>
                      <div>φV<sub className="text-[10px]">c</sub> = {phi_v} × {vc_slab.toFixed(0)}</div>
                    </div>
                    <div className="text-xl font-bold text-blue-300">
                      φV<sub className="text-[10px]">c</sub> = {phiVc_slab.toFixed(0)} lbs/ft
                    </div>
                  </div>
                </div>

                {/* 3. Detailing Checks Block */}
                <div className="font-mono text-sm text-slate-300 space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4 py-1 mb-6 flex justify-between items-center bg-slate-900/50 pr-4">
                    <h3 className="font-bold text-slate-200 uppercase">Detailing Requirements</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${(isAsSlabOk && isSpacingOk) ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
                      {(isAsSlabOk && isSpacingOk) ? 'PASS' : 'FAIL'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                    <div>
                      <div className="text-slate-500 mb-1">Minimum Steel (T&S)</div>
                      <div>Ratio limit = <strong>{ts_ratio.toFixed(4)}</strong></div>
                      <div>A<sub className="text-[10px]">s,min</sub> = {ts_ratio.toFixed(4)} × 12 × {slabThickness}</div>
                      <div>A<sub className="text-[10px]">s,min</sub> = <strong>{As_min_slab.toFixed(3)} in²/ft</strong></div>
                      <div className={`mt-1 font-bold ${isAsSlabOk ? 'text-green-400' : 'text-red-400'}`}>
                        {isAsSlabOk ? 'A_s ≥ A_s,min (OK)' : 'A_s < A_s,min (NG)'}
                      </div>
                    </div>

                    <div>
                      <div className="text-slate-500 mb-1">Maximum Spacing</div>
                      <div>s<sub className="text-[10px]">max</sub> = min(3h, 18")</div>
                      <div>s<sub className="text-[10px]">max</sub> = min({3 * slabThickness}, 18) = <strong>{s_max}"</strong></div>
                      <div className={`mt-1 font-bold ${isSpacingOk ? 'text-green-400' : 'text-red-400'}`}>
                        {isSpacingOk ? 's ≤ s_max (OK)' : 's > s_max (NG)'}
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          </div>
        )}

        {/* Placeholders for other tabs */}
        {activeTab !== 'Beam' && activeTab !== 'One-Way Slab' && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-10 text-center">
            <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded mb-3">
              Coming Soon
            </div>
            <h3 className="text-xl font-semibold text-slate-200 mb-1.5">{activeTab} Design</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              This ACI 318 calculator isn't ready yet. Beam and One-Way Slab are fully wired up — we're working through the rest. Reach out if you need {activeTab} sooner.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
