import React from 'react';
import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export function Logo({ className, size = 40, showText = false }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div 
        style={{ width: size, height: size }}
        className="relative flex items-center justify-center"
      >
        {/* Background Shield/Rounded Square */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl shadow-lg transform rotate-3" />
        <div className="absolute inset-0 bg-[#050505] rounded-2xl m-[2px] flex items-center justify-center overflow-hidden">
          {/* Scan Line Animation */}
          <div className="absolute w-full h-[2px] bg-emerald-400/50 top-1/2 -translate-y-1/2 animate-pulse" />
          
          {/* Stylized Crescent & Scan Mark */}
          <svg 
            width={size * 0.6} 
            height={size * 0.6} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="text-emerald-400 relative z-10"
          >
            <path d="M12 3a9 9 0 1 0 9 9" />
            <path d="M18 6l-6 6" />
            <path d="M12 18l6-6" />
          </svg>
        </div>
        
        {/* Outer Glow */}
        <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full scale-150 opacity-50" />
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="text-xl font-bold font-display tracking-tighter leading-none">
            Deen<span className="text-emerald-400">Snap</span>
          </span>
          <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/20">
            Halal Intelligence
          </span>
        </div>
      )}
    </div>
  );
}
