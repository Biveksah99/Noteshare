
"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface VerifiedBadgeProps extends React.SVGProps<SVGSVGElement> {
  // Add any specific props if needed, e.g., size
}

const VerifiedBadge = React.forwardRef<SVGSVGElement, VerifiedBadgeProps>(
  ({ className, width = 20, height = 20, ...props }, ref) => { // Increased default size to 20x20
    return (
      // Use inline-flex for better vertical alignment with text
      <span className={cn("verified-badge inline-flex items-center align-middle", className)}> {/* Use inline-flex */}
        <svg
          ref={ref}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24" // Keep viewBox standard for path data
          fill="currentColor"
          width={width} // Use props or default size
          height={height}
          className={cn("text-blue-500 flex-shrink-0", props.className)} // Add flex-shrink-0
          {...props}
        >
          {/* Twitter-style badge shape */}
          <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.5 4.88L6.34 12.47c-.19-.19-.19-.51 0-.71.19-.19.51-.19.71 0l3.74 3.73 6.86-6.86c.19-.19.51-.19.71 0 .19.19.19.51 0 .71l-7.21 7.22c-.18.19-.49.2-.7.01z"></path>

          {/* Shine element for animation */}
          <defs>
            <linearGradient id="shineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: 'rgba(255,255,255,0.5)' }} />
              <stop offset="50%" style={{ stopColor: 'rgba(255,255,255,0)' }} />
              <stop offset="100%" style={{ stopColor: 'rgba(255,255,255,0.5)' }} />
            </linearGradient>
          </defs>
          <rect
              x="-10%"
              y="-10%"
              width="120%"
              height="120%"
              fill="url(#shineGradient)"
              className="verified-badge-shine"
              rx="50%"
              ry="50%"
              style={{ transform: 'rotate(-15deg)' }}
          />
        </svg>
      </span>
    );
  }
);

VerifiedBadge.displayName = 'VerifiedBadge';

export { VerifiedBadge };

