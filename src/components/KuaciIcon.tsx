import React from 'react';

interface KuaciIconProps {
  className?: string;
}

/**
 * Dedicated Kuaci (Sunflower Seed) vector icon styled to match Lucide icon aesthetics.
 */
export const KuaciIcon: React.FC<KuaciIconProps> = ({ className = 'w-3.5 h-3.5' }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      data-testid="kuaci-icon"
    >
      {/* Teardrop sunflower seed contour */}
      <path
        d="M12 2.8C15.8 7.8 18.2 13.5 17.2 17.5C16.2 21 13.8 22 12 22C10.2 22 7.8 21 6.8 17.5C5.8 13.5 8.2 7.8 12 2.8Z"
        fill="currentColor"
        fillOpacity="0.25"
      />
      {/* Center ridge / line */}
      <path d="M12 6.5V19" strokeWidth="1.6" />
      {/* Inner striped seed accents */}
      <path d="M9.8 11.2C9.5 13.5 9.7 16.2 10.5 18" strokeWidth="1.2" strokeOpacity="0.8" />
      <path d="M14.2 11.2C14.5 13.5 14.3 16.2 13.5 18" strokeWidth="1.2" strokeOpacity="0.8" />
    </svg>
  );
};
