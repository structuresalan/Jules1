import React from 'react';

interface WindPlanSVGProps {
  bldgL: number; // Length (X-dimension typically)
  bldgB: number; // Width (Y-dimension typically)
}

export const WindPlanSVG: React.FC<WindPlanSVGProps> = ({ bldgL, bldgB }) => {
  const safeL = Math.max(bldgL, 10);
  const safeB = Math.max(bldgB, 10);

  // Determine drawing orientation to fit best in UI
  const drawW = safeL;
  const drawH = safeB;

  const pad = Math.max(drawW, drawH) * 0.3;
  const viewBoxW = drawW + pad * 2;
  const viewBoxH = drawH + pad * 2;

  const x0 = pad;
  const y0 = pad;

  const arrowSize = pad * 0.6;
  const strokeW = Math.max(viewBoxW, viewBoxH) * 0.005;
  const fontSize = Math.max(viewBoxW, viewBoxH) * 0.035;

  return (
    <div className="w-full flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-lg">
      <div className="text-xs text-gray-500 mb-2 font-mono uppercase tracking-wider font-bold">Plan View - Wind Cases</div>
      
      <svg 
        viewBox={`0 0 ${viewBoxW} ${viewBoxH}`} 
        className="w-full h-auto max-h-72 object-contain"
      >
        <defs>
          <marker id="windArrow" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
            <polygon points="0 0, 6 2, 0 4" fill="#0f172a" />
          </marker>
        </defs>

        {/* Building Footprint */}
        <rect 
          x={x0} 
          y={y0} 
          width={drawW} 
          height={drawH} 
          fill="#f1f5f9" 
          stroke="#475569" 
          strokeWidth={strokeW * 2} 
        />
        <text x={x0 + drawW/2} y={y0 + drawH/2} fontSize={fontSize * 1.2} fill="#94a3b8" dominantBaseline="middle" textAnchor="middle" fontWeight="bold">
          PLAN
        </text>

        {/* Dimensions */}
        <g stroke="#cbd5e1" strokeWidth={strokeW}>
          {/* L dimension (Top) */}
          <line x1={x0} y1={y0 - pad*0.3} x2={x0 + drawW} y2={y0 - pad*0.3} />
          <line x1={x0} y1={y0 - pad*0.2} x2={x0} y2={y0 - pad*0.4} />
          <line x1={x0 + drawW} y1={y0 - pad*0.2} x2={x0 + drawW} y2={y0 - pad*0.4} />
          <text x={x0 + drawW/2} y={y0 - pad*0.45} fontSize={fontSize} fill="#64748b" textAnchor="middle" stroke="none">L = {bldgL.toFixed(1)}'</text>

          {/* B dimension (Right) */}
          <line x1={x0 + drawW + pad*0.3} y1={y0} x2={x0 + drawW + pad*0.3} y2={y0 + drawH} />
          <line x1={x0 + drawW + pad*0.2} y1={y0} x2={x0 + drawW + pad*0.4} y2={y0} />
          <line x1={x0 + drawW + pad*0.2} y1={y0 + drawH} x2={x0 + drawW + pad*0.4} y2={y0 + drawH} />
          <text x={x0 + drawW + pad*0.45} y={y0 + drawH/2} fontSize={fontSize} fill="#64748b" dominantBaseline="middle" stroke="none">B = {bldgB.toFixed(1)}'</text>
        </g>

        {/* Wind Case X (Left to Right) */}
        <g transform={`translate(${x0 - arrowSize - pad*0.1}, ${y0 + drawH/2})`}>
          <line x1="0" y1="0" x2={arrowSize} y2="0" stroke="#0f172a" strokeWidth={strokeW * 1.5} markerEnd="url(#windArrow)"/>
          <text x={arrowSize/2} y={-pad*0.15} fontSize={fontSize * 0.9} fill="#0f172a" textAnchor="middle" fontWeight="bold">WIND X</text>
        </g>

        {/* Wind Case Y (Bottom to Top) */}
        <g transform={`translate(${x0 + drawW/2}, ${y0 + drawH + arrowSize + pad*0.1})`}>
          <line x1="0" y1="0" x2="0" y2={-arrowSize} stroke="#0f172a" strokeWidth={strokeW * 1.5} markerEnd="url(#windArrow)"/>
          <text x={pad*0.4} y={-arrowSize/2} fontSize={fontSize * 0.9} fill="#0f172a" dominantBaseline="middle" fontWeight="bold">WIND Y</text>
        </g>

      </svg>
    </div>
  );
};
