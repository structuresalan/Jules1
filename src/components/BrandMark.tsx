import React from 'react';

interface BrandMarkProps {
  /** icon-only (square) or full wordmark with text */
  variant?: 'icon' | 'wordmark';
  /** px size of the icon square */
  size?: number;
  className?: string;
}

/** Concept C "Bay" — axonometric structural bay on dark backdrop */
const BayIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 120"
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: 'block', flexShrink: 0 }}
  >
    {/* dark rounded background */}
    <rect width="120" height="120" rx="20" fill="#0e1117"/>
    {/* back frame — muted blue-gray */}
    <g stroke="#6b7c9c" strokeWidth="4.5" strokeLinecap="round" fill="none">
      <line x1="40" y1="32" x2="110" y2="32"/>
      <line x1="40" y1="32" x2="40"  y2="80"/>
      <line x1="110" y1="32" x2="110" y2="80"/>
      <line x1="25" y1="44" x2="40"  y2="32"/>
      <line x1="95" y1="44" x2="110" y2="32"/>
    </g>
    {/* front frame — white */}
    <g stroke="#ffffff" strokeWidth="5.5" strokeLinecap="round" fill="none">
      <line x1="25" y1="44" x2="95" y2="44"/>
      <line x1="25" y1="44" x2="25" y2="92"/>
      <line x1="95" y1="44" x2="95" y2="92"/>
    </g>
    {/* joint squares at top corners */}
    <g fill="#ffffff">
      <rect x="21" y="40" width="8" height="8" rx="1"/>
      <rect x="91" y="40" width="8" height="8" rx="1"/>
    </g>
    <g fill="#6b7c9c">
      <rect x="36" y="28" width="8" height="8" rx="1"/>
      <rect x="106" y="28" width="8" height="8" rx="1"/>
    </g>
  </svg>
);

export const BrandMark: React.FC<BrandMarkProps> = ({
  variant = 'icon',
  size = 32,
  className,
}) => {
  if (variant === 'wordmark') {
    return (
      <div
        className={className}
        style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}
      >
        <BayIcon size={size} />
        <span
          style={{
            fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
            fontWeight: 600,
            fontSize: size * 0.56,
            letterSpacing: '-0.015em',
            color: '#eef2f9',
            lineHeight: 1,
          }}
        >
          Simplify<span style={{ color: '#9bb5e8' }}>Struct</span>
        </span>
      </div>
    );
  }

  return <BayIcon size={size} />;
};
