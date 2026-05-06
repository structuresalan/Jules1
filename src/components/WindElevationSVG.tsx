import React from 'react';

interface WindElevationSVGProps {
  h: number; // Mean Roof Height
  L: number; // Length parallel to wind
  roofPitch?: number; // degrees
}

export const WindElevationSVG: React.FC<WindElevationSVGProps> = ({ h, L, roofPitch = 0 }) => {
  const safeH = Math.max(h, 10);
  const safeL = Math.max(L, 10);

  // ViewBox bounds
  const pad = Math.max(safeH, safeL) * 0.3;
  const viewBoxW = safeL + pad * 2;
  const viewBoxH = safeH + pad * 2;

  const x0 = pad;
  const y0 = pad + safeH; // Ground level (bottom of building)

  // Calculate roof peak if pitched
  const pitchRad = (roofPitch * Math.PI) / 180;
  const roofRise = (safeL / 2) * Math.tan(pitchRad);
  const yRoofEdge = pad + roofRise; 
  const yPeak = pad;

  // Arrow drawing helper
  const drawArrow = (startX: number, startY: number, length: number, direction: 'right' | 'left' | 'up' | 'down', label: string, color: string) => {
    let x2 = startX, y2 = startY;
    let textX = startX, textY = startY;

    if (direction === 'right') {
      x2 = startX + length;
      textX = startX - pad * 0.1;
      textY = startY;
    } else if (direction === 'left') {
      x2 = startX - length;
      textX = startX + pad * 0.1;
      textY = startY;
    } else if (direction === 'up') {
      y2 = startY - length;
      textX = startX;
      textY = startY + pad * 0.1;
    } else if (direction === 'down') {
      y2 = startY + length;
      textX = startX;
      textY = startY - pad * 0.1;
    }

    return (
      <g>
        <line x1={startX} y1={startY} x2={x2} y2={y2} stroke={color} strokeWidth={pad * 0.02} markerEnd="url(#arrowhead)" />
        <text x={textX} y={textY} fontSize={pad * 0.15} fill={color} dominantBaseline="middle" textAnchor={direction === 'right' ? 'end' : direction === 'left' ? 'start' : 'middle'} fontWeight="bold">
          {label}
        </text>
      </g>
    );
  };

  return (
    <div className="w-full flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-lg">
      <div className="text-xs text-gray-500 mb-2 font-mono uppercase tracking-wider">MWFRS Pressures (Elevation)</div>
      
      <svg 
        viewBox={`0 0 ${viewBoxW} ${viewBoxH}`} 
        className="w-full h-auto max-h-64 object-contain"
      >
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
          </marker>
        </defs>

        {/* Ground Line */}
        <line x1={0} y1={y0} x2={viewBoxW} y2={y0} stroke="#94a3b8" strokeWidth={pad * 0.04} />

        {/* Building Outline */}
        {roofPitch > 0 ? (
          <path d={`M ${x0} ${y0} L ${x0} ${yRoofEdge} L ${x0 + safeL/2} ${yPeak} L ${x0 + safeL} ${yRoofEdge} L ${x0 + safeL} ${y0} Z`} fill="#f8fafc" stroke="#475569" strokeWidth={pad * 0.02} />
        ) : (
          <rect x={x0} y={pad} width={safeL} height={safeH} fill="#f8fafc" stroke="#475569" strokeWidth={pad * 0.02} />
        )}

        {/* Wind Arrows */}
        {/* Windward (Pushing In) */}
        {drawArrow(x0 - pad*0.5, y0 - safeH*0.75, pad*0.4, 'right', 'Windward', '#2563eb')}
        {drawArrow(x0 - pad*0.5, y0 - safeH*0.25, pad*0.4, 'right', 'p_ww', '#2563eb')}

        {/* Leeward (Pulling Out) */}
        {drawArrow(x0 + safeL + pad*0.1, y0 - safeH*0.5, pad*0.4, 'right', 'Leeward (p_lw)', '#3b82f6')}

        {/* Roof (Pulling Up/Suction) */}
        {drawArrow(x0 + safeL*0.25, pad - pad*0.1, pad*0.4, 'up', 'Roof Suction', '#3b82f6')}
        {drawArrow(x0 + safeL*0.75, pad - pad*0.1, pad*0.4, 'up', 'Roof Suction', '#3b82f6')}

        {/* Dimensions */}
        {/* Height */}
        <line x1={x0 + safeL + pad*0.8} y1={y0} x2={x0 + safeL + pad*0.8} y2={pad} stroke="#cbd5e1" strokeWidth={pad*0.01} />
        <line x1={x0 + safeL + pad*0.7} y1={y0} x2={x0 + safeL + pad*0.9} y2={y0} stroke="#cbd5e1" strokeWidth={pad*0.01} />
        <line x1={x0 + safeL + pad*0.7} y1={pad} x2={x0 + safeL + pad*0.9} y2={pad} stroke="#cbd5e1" strokeWidth={pad*0.01} />
        <text x={x0 + safeL + pad*0.85} y={y0 - safeH/2} fontSize={pad * 0.2} fill="#64748b" dominantBaseline="middle">h = {safeH.toFixed(1)}'</text>

        {/* Length */}
        <line x1={x0} y1={y0 + pad*0.3} x2={x0 + safeL} y2={y0 + pad*0.3} stroke="#cbd5e1" strokeWidth={pad*0.01} />
        <line x1={x0} y1={y0 + pad*0.2} x2={x0} y2={y0 + pad*0.4} stroke="#cbd5e1" strokeWidth={pad*0.01} />
        <line x1={x0 + safeL} y1={y0 + pad*0.2} x2={x0 + safeL} y2={y0 + pad*0.4} stroke="#cbd5e1" strokeWidth={pad*0.01} />
        <text x={x0 + safeL/2} y={y0 + pad*0.5} fontSize={pad * 0.2} fill="#64748b" textAnchor="middle">L = {safeL.toFixed(1)}'</text>

      </svg>
    </div>
  );
};
