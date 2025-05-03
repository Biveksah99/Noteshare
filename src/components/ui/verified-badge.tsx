
"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface VerifiedBadgeProps extends React.SVGProps<SVGSVGElement> {
  // Add any specific props if needed, e.g., size
}

const VerifiedBadge = React.forwardRef<SVGSVGElement, VerifiedBadgeProps>(
  ({ className, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={cn("text-blue-500 verified-badge", className)} // Apply base color and animation class
        {...props}
      >
        {/* Background Starburst Shape */}
        <path
          fillRule="evenodd"
          d="M12.964 2.276a.75.75 0 0 0-1.928 0L8.87 3.88a.75.75 0 0 1-.584.093L4.94 3.002a.75.75 0 0 0-.91.39L2.276 6.036a.75.75 0 0 1-.39.91L.97 8.87a.75.75 0 0 0-.093.584l.97 3.346a.75.75 0 0 0 .093.584l-.97 3.346a.75.75 0 0 0 .093.584l.916 1.928a.75.75 0 0 0 .584.093l3.346-.97a.75.75 0 0 1 .584.093l1.928 1.606a.75.75 0 0 0 .964.093l2.964-1.27a.75.75 0 0 1 .584-.093l3.346.97a.75.75 0 0 0 .91-.39l1.754-2.644a.75.75 0 0 1 .39-.91l.916-1.928a.75.75 0 0 0 .093-.584l-.97-3.346a.75.75 0 0 0-.093-.584l.97-3.346a.75.75 0 0 0-.093-.584L20.998 4.94a.75.75 0 0 0-.584-.093l-3.346.97a.75.75 0 0 1-.584-.093L15.06 3.88a.75.75 0 0 0-.964-.093l-1.132-.48Z"
          clipRule="evenodd"
        />
        {/* Checkmark */}
        <path
          fill="#fff" // White checkmark
          d="M16.704 8.47a.75.75 0 0 1 .106 1.054l-5.25 6.5a.75.75 0 0 1-1.16-.006L7.196 11.53a.75.75 0 1 1 1.112-.994l2.736 3.06 4.604-5.706a.75.75 0 0 1 1.056-.114Z"
        />
        {/* Optional: Shine element for animation */}
        <defs>
          <linearGradient id="shineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: 'rgba(255,255,255,0.5)' }} />
            <stop offset="50%" style={{ stopColor: 'rgba(255,255,255,0)' }} />
            <stop offset="100%" style={{ stopColor: 'rgba(255,255,255,0.5)' }} />
          </linearGradient>
        </defs>
        <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="url(#shineGradient)"
            className="verified-badge-shine" // Apply animation class to the shine overlay
            rx="50%" // Make shine slightly rounded to match badge
            ry="50%"
        />
      </svg>
    );
  }
);

VerifiedBadge.displayName = 'VerifiedBadge';

export { VerifiedBadge };
