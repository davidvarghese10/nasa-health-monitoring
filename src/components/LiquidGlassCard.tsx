/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface LiquidGlassCardProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
  accent?: 'cyan' | 'amber' | 'blue' | 'purple' | 'rose' | 'emerald' | 'none';
}

export const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({
  children,
  className = '',
  interactive = false,
  onClick,
  accent = 'none',
}) => {
  const accentBorders = {
    none: 'hover:border-cyan-400/30',
    cyan: 'border-cyan-500/25 hover:border-cyan-400/50',
    amber: 'border-amber-500/25 hover:border-amber-400/50',
    blue: 'border-blue-500/25 hover:border-blue-400/50',
    purple: 'border-purple-500/25 hover:border-purple-400/50',
    rose: 'border-rose-500/25 hover:border-rose-400/50',
    emerald: 'border-emerald-500/25 hover:border-emerald-400/50',
  };

  const accentGlow = {
    none: '',
    cyan: 'hover:shadow-[0_12px_36px_rgba(6,182,212,0.14),inset_0_1px_2px_rgba(255,255,255,0.2)]',
    amber: 'hover:shadow-[0_12px_36px_rgba(245,158,11,0.14),inset_0_1px_2px_rgba(255,255,255,0.2)]',
    blue: 'hover:shadow-[0_12px_36px_rgba(59,130,246,0.14),inset_0_1px_2px_rgba(255,255,255,0.2)]',
    purple: 'hover:shadow-[0_12px_36px_rgba(168,85,247,0.14),inset_0_1px_2px_rgba(255,255,255,0.2)]',
    rose: 'hover:shadow-[0_12px_36px_rgba(244,63,94,0.14),inset_0_1px_2px_rgba(255,255,255,0.2)]',
    emerald: 'hover:shadow-[0_12px_36px_rgba(16,185,129,0.14),inset_0_1px_2px_rgba(255,255,255,0.2)]',
  };

  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-xl overflow-hidden
        bg-slate-950/60 backdrop-blur-xl
        border border-white/10
        shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.14),0_8px_32px_0_rgba(0,0,0,0.45)]
        ${interactive ? 'cursor-pointer transition-all duration-300 ' + accentBorders[accent] + ' ' + accentGlow[accent] + ' hover:-translate-y-0.5 hover:bg-slate-900/70' : ''}
        ${className}
      `}
    >
      {/* Liquid Glass Top Refraction Sheen */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
      {/* Subtle Inner Radial Ambient Sheen */}
      <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-white/[0.03] blur-xl pointer-events-none" />

      {children}
    </div>
  );
};
