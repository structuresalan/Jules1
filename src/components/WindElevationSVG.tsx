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
  const padX = Math.max(safeL) * 0.4;
  const padY = Math.max(safeH) * 0.4;
  const viewBoxW = safeL + padX * 2;
  const viewBoxH = safeH + padY * 2;

  const x0 = padX;
  const y0 = padY + safeH; // Ground level (bottom of building)

  // Calculate roof peak if pitched
  const pitchRad = (roofPitch * Math.PI) / 180;
  const roofRise = (safeL / 2) * Math.tan(pitchRad);
  const yRoofEdge = padY + roofRise; 
  const yPeak = padY;

  // Helper to draw a distributed load block
  const drawDistributedLoad = (
    startX: number, startY: number, endX: number, endY: number, 
    magnitude: number, // Depth of the load block
    direction: 'right' | 'left' | 'up' | 'down', 
    color: string, 
    labelHtml: React.ReactNode,
    labelPos: 'start' | 'center' | 'end'
  ) => {
    const isVertical = startX === endX;
    const length = isVertical ? Math.abs(endY - startY) : Math.abs(endX - startX);
    const arrowCount = Math.max(3, Math.floor(length / (Math.max(safeH, safeL) * 0.15)));
    const step = length / (arrowCount - 1);
    
    // Calculate the bounding box for the shading
    let rectX = startX, rectY = startY, rectW = 0, rectH = 0;
    
    if (direction === 'right') {
      rectX = startX - magnitude; rectY = Math.min(startY, endY);
      rectW = magnitude; rectH = length;
    } else if (direction === 'left') {
      rectX = startX; rectY = Math.min(startY, endY);
      rectW = magnitude; rectH = length;
    } else if (direction === 'up') {
      rectX = Math.min(startX, endX); rectY = startY - magnitude;
      rectW = length; rectH = magnitude;
    } else if (direction === 'down') {
      rectX = Math.min(startX, endX); rectY = startY;
      rectW = length; rectH = magnitude;
    }

    // Arrows
    const arrows = [];
    for (let i = 0; i < arrowCount; i++) {
      let ax1, ay1, ax2, ay2;
      if (isVertical) {
        ay1 = Math.min(startY, endY) + i * step;
        ay2 = ay1;
        if (direction === 'right') { ax1 = startX - magnitude; ax2 = startX; }
        else { ax1 = startX + magnitude; ax2 = startX; }
      } else {
        ax1 = Math.min(startX, endX) + i * step;
        ax2 = ax1;
        if (direction === 'up') { ay1 = startY - magnitude; ay2 = startY; }
        else { ay1 = startY + magnitude; ay2 = startY; }
      }
      arrows.push(
        <line key={i} x1={ax1} y1={ay1} x2={ax2} y2={ay2} stroke={color} strokeWidth={viewBoxW * 0.005} markerEnd="url(#arrowhead)" />
      );
    }

    // Label Positioning
    const lx = isVertical 
      ? (direction === 'right' ? startX - magnitude - viewBoxW * 0.05 : startX + magnitude + viewBoxW * 0.05)
      : (labelPos === 'center' ? (startX + endX) / 2 : (labelPos === 'start' ? startX : endX));
      
    const ly = isVertical
      ? (labelPos === 'center' ? (startY + endY) / 2 : (labelPos === 'start' ? startY : endY))
      : (direction === 'up' ? startY - magnitude - viewBoxH * 0.05 : startY + magnitude + viewBoxH * 0.05);

    const textAnchor = "middle";

    return (
      <g>
        <rect x={rectX} y={rectY} width={rectW} height={rectH} fill={color} fillOpacity="0.1" stroke={color} strokeWidth="0.5" strokeDasharray="2,2" />
        <line x1={startX} y1={startY} x2={endX} y2={endY} stroke={color} strokeWidth={viewBoxW * 0.005} />
        {arrows}
        <text x={lx} y={ly} fontSize={Math.max(viewBoxW, viewBoxH) * 0.03} fill="#1e293b" dominantBaseline="middle" textAnchor={textAnchor} fontFamily="sans-serif">
          {labelHtml}
        </text>
      </g>
    );
  };

  const mag = Math.max(safeH, safeL) * 0.15; // Visual depth of load block

  return (
    <div className="w-full flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-lg">
      <div className="text-xs text-gray-500 mb-2 font-mono uppercase tracking-wider font-bold">Elevation View - Wind Pressures</div>
      
      <svg 
        viewBox={`0 0 ${viewBoxW} ${viewBoxH}`} 
        className="w-full h-auto max-h-72 object-contain"
      >
        <defs>
          <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
            <polygon points="0 0, 6 2, 0 4" fill="#3b82f6" />
          </marker>
        </defs>

        {/* Ground Line */}
        <line x1={0} y1={y0} x2={viewBoxW} y2={y0} stroke="#94a3b8" strokeWidth={viewBoxW * 0.01} strokeLinecap="round" />

        {/* Building Outline */}
        {roofPitch > 0 ? (
          <path d={`M ${x0} ${y0} L ${x0} ${yRoofEdge} L ${x0 + safeL/2} ${yPeak} L ${x0 + safeL} ${yRoofEdge} L ${x0 + safeL} ${y0} Z`} fill="#f8fafc" stroke="#475569" strokeWidth={viewBoxW * 0.005} />
        ) : (
          <rect x={x0} y={padY} width={safeL} height={safeH} fill="#f8fafc" stroke="#475569" strokeWidth={viewBoxW * 0.005} />
        )}

        {/* Distributed Loads */}
        
        {/* Windward Wall (Pushing right into left wall) */}
        {drawDistributedLoad(x0, y0, x0, padY, mag, 'right', '#3b82f6', <tspan>p<tspan dy="3" fontSize="70%">windward</tspan></tspan>, 'center')}

        {/* Leeward Wall (Pulling right out of right wall) */}
        {drawDistributedLoad(x0 + safeL, y0, x0 + safeL, padY, mag * 0.7, 'right', '#3b82f6', <tspan>p<tspan dy="3" fontSize="70%">leeward</tspan></tspan>, 'center')}

        {/* Roof (Pulling up out of roof) */}
        {drawDistributedLoad(x0, padY, x0 + safeL, padY, mag * 0.9, 'up', '#3b82f6', <tspan>p<tspan dy="3" fontSize="70%">roof</tspan></tspan>, 'center')}


        {/* Dimensions */}
        <g stroke="#cbd5e1" strokeWidth={viewBoxW * 0.003}>
          {/* Height */}
          <line x1={x0 + safeL + padX*0.6} y1={y0} x2={x0 + safeL + padX*0.6} y2={padY} />
          <line x1={x0 + safeL + padX*0.5} y1={y0} x2={x0 + safeL + padX*0.7} y2={y0} />
          <line x1={x0 + safeL + padX*0.5} y1={padY} x2={x0 + safeL + padX*0.7} y2={padY} />
          <text x={x0 + safeL + padX*0.65} y={y0 - safeH/2} fontSize={viewBoxW * 0.025} fill="#64748b" dominantBaseline="middle" stroke="none">h</text>

          {/* Length */}
          <line x1={x0} y1={y0 + padY*0.4} x2={x0 + safeL} y2={y0 + padY*0.4} />
          <line x1={x0} y1={y0 + padY*0.3} x2={x0} y2={y0 + padY*0.5} />
          <line x1={x0 + safeL} y1={y0 + padY*0.3} x2={x0 + safeL} y2={y0 + padY*0.5} />
          <text x={x0 + safeL/2} y={y0 + padY*0.55} fontSize={viewBoxW * 0.025} fill="#64748b" textAnchor="middle" stroke="none">L</text>
        </g>
        
        {/* Wind Direction Indicator */}
        <g transform={`translate(${x0 - padX*0.8}, ${y0 - safeH/2})`}>
          <line x1="0" y1="0" x2={mag*0.8} y2="0" stroke="#0f172a" strokeWidth={viewBoxW*0.008} markerEnd="url(#arrowhead)"/>
          <text x={mag*0.4} y={-viewBoxH*0.04} fontSize={viewBoxW * 0.03} fill="#0f172a" textAnchor="middle" fontWeight="bold">WIND</text>
        </g>

      </svg>
    </div>
  );
};
