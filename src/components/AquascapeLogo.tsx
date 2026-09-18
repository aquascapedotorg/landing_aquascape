import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  animate?: boolean;
}

/**
 * Geometric origami fish mascot extracted from the official AQUASCAPE branding.
 */
export const AquascapeFishIcon: React.FC<{ size?: number; className?: string; swimming?: boolean }> = ({
  size = 40,
  className = '',
  swimming = false,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${swimming ? 'animate-fish-wag' : ''}`}
      aria-label="AQUASCAPE Fish"
    >
      <g transform="translate(4, 2)">
        {/* Tail fin (left) */}
        <polygon
          points="20,50 34,38 34,62"
          fill="#44b4c2"
          className="transition-all duration-300"
        />

        {/* Dorsal upper fin */}
        <polygon
          points="46,30 64,30 52,42 34,38"
          fill="#1f5885"
        />

        {/* Ventral lower fin */}
        <polygon
          points="46,70 64,70 52,58 34,62"
          fill="#225c8a"
        />

        {/* Central rear facet */}
        <polygon
          points="34,38 52,42 42,50 34,50"
          fill="#2b719f"
        />
        <polygon
          points="34,50 42,50 52,58 34,62"
          fill="#1b4d75"
        />

        {/* Upper mid facet */}
        <polygon
          points="52,42 66,32 64,48 50,50"
          fill="#1a4c73"
        />

        {/* Lower mid facet */}
        <polygon
          points="52,58 50,50 64,52 66,68"
          fill="#164367"
        />

        {/* Head triangle pointing right */}
        <polygon
          points="50,50 66,32 82,50 66,68"
          fill="#0c233c"
        />

        {/* Eye dot */}
        <circle
          cx="69"
          cy="50"
          r="3.5"
          fill="#ffffff"
        />
      </g>
    </svg>
  );
};

/**
 * Official AQUASCAPE diamond badge logo.
 */
export const AquascapeLogo: React.FC<LogoProps> = ({
  className = '',
  size = 40,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src="./static/aquascape%20logo.png"
        alt="AQUASCAPE Logo"
        className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(56,189,176,0.35)] transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
      />
    </div>
  );
};

/**
 * Official AQUASCAPE Banner (Transparent Dark-Theme Banner with cyan diamond fish & white AQUASCAPE wordmark)
 */
export const AquascapeBanner: React.FC<{
  className?: string;
  height?: number | string;
}> = ({ className = '', height = '1.18em' }) => {
  return (
    <span
      className={`group relative inline-flex items-center justify-center select-none align-middle cursor-pointer ${className}`}
    >
      {/* Radiant ambient glow behind banner */}
      <span
        className="absolute -inset-2 bg-[radial-gradient(ellipse_at_center,rgba(56,189,176,0.45)_0%,rgba(34,211,238,0.2)_50%,transparent_75%)] blur-md rounded-xl pointer-events-none opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"
        aria-hidden="true"
      />
      <img
        src="./static/aquascape%20banner%20dark-theme.png"
        alt="AQUASCAPE"
        className="relative z-10 w-auto max-w-[280px] sm:max-w-[340px] object-contain inline-block filter drop-shadow-[0_4px_14px_rgba(0,0,0,0.5)] drop-shadow-[0_0_16px_rgba(56,189,176,0.3)] group-hover:-translate-y-0.5 group-hover:scale-105 group-hover:drop-shadow-[0_8px_24px_rgba(0,0,0,0.65)] group-hover:drop-shadow-[0_0_28px_rgba(56,189,176,0.65)] transition-all duration-300"
        style={{ height }}
      />
    </span>
  );
};
