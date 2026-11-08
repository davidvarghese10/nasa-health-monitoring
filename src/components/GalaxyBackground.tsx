/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';

export const GalaxyBackground: React.FC = () => {
  // Generate deterministic stars
  const stars = useMemo(() => {
    const list = [];
    for (let i = 0; i < 90; i++) {
      const top = (i * 17.3 + (i % 7) * 11) % 100;
      const left = (i * 29.7 + (i % 11) * 7) % 100;
      const size = (i % 5 === 0) ? 2.5 : (i % 3 === 0) ? 1.8 : 1.2;
      const duration = 2.5 + (i % 5) * 1.2;
      const delay = (i % 8) * 0.7;
      const opacity = 0.4 + (i % 4) * 0.18;
      const isCyan = i % 6 === 0;
      const isAmber = i % 13 === 0;
      list.push({ id: i, top, left, size, duration, delay, opacity, isCyan, isAmber });
    }
    return list;
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#030509]">
      {/* Deep Space Cosmic Nebulas */}
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-indigo-900/18 via-purple-900/10 to-transparent blur-3xl" />
      <div className="absolute top-1/3 -left-40 w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-cyan-950/25 via-blue-950/15 to-transparent blur-3xl" />
      <div className="absolute -bottom-40 right-1/4 w-[700px] h-[700px] rounded-full bg-gradient-to-tl from-cyan-900/12 via-indigo-950/10 to-transparent blur-3xl" />

      {/* Planet 1: Ringed Gas Giant (Top Right) */}
      <div className="absolute top-8 right-12 md:right-24 w-36 h-36 md:w-48 md:h-48 opacity-75">
        {/* Planetary Ring */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] md:w-[280px] h-[48px] md:h-[60px] rounded-[50%] border-t-2 border-b border-cyan-400/30 opacity-70 rotate-[-22deg] pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent 5%, rgba(6,182,212,0.15) 30%, rgba(147,197,253,0.25) 50%, rgba(6,182,212,0.15) 70%, transparent 95%)',
            boxShadow: '0 0 20px rgba(6,182,212,0.15)',
          }}
        />
        {/* Planet Sphere */}
        <div
          className="relative w-full h-full rounded-full shadow-2xl"
          style={{
            background: 'radial-gradient(circle at 35% 35%, #1e293b 0%, #0f172a 45%, #050811 85%)',
            boxShadow: 'inset -12px -12px 25px rgba(0,0,0,0.8), inset 6px 6px 15px rgba(6,182,212,0.3), 0 0 35px rgba(6,182,212,0.18)',
          }}
        >
          {/* Atmosphere Crescent Glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-transparent to-cyan-400/25" />
        </div>
      </div>

      {/* Planet 2: Distant Terrestrial Moon (Mid Left) */}
      <div
        className="absolute top-[42%] left-6 md:left-16 w-14 h-14 md:w-16 md:h-16 rounded-full opacity-65"
        style={{
          background: 'radial-gradient(circle at 30% 30%, #475569 0%, #1e293b 60%, #090d16 95%)',
          boxShadow: 'inset -4px -4px 10px rgba(0,0,0,0.9), inset 2px 2px 5px rgba(226,232,240,0.4), 0 0 16px rgba(148,163,184,0.15)',
        }}
      >
        {/* Subtle Crater Texture */}
        <div className="absolute top-2 left-3 w-2.5 h-2.5 rounded-full bg-black/20" />
        <div className="absolute bottom-3 right-3 w-3 h-3 rounded-full bg-black/30" />
      </div>

      {/* Planet 3: Distant Golden Exoplanet (Bottom Right) */}
      <div
        className="absolute bottom-16 right-8 md:right-28 w-9 h-9 rounded-full opacity-60"
        style={{
          background: 'radial-gradient(circle at 35% 35%, #f59e0b 0%, #78350f 65%, #0a0603 100%)',
          boxShadow: 'inset -2px -2px 6px rgba(0,0,0,0.8), inset 1px 1px 4px rgba(253,230,138,0.5), 0 0 12px rgba(245,158,11,0.2)',
        }}
      />

      {/* Star Field */}
      {stars.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            backgroundColor: s.isCyan ? '#38bdf8' : s.isAmber ? '#fde68a' : '#ffffff',
            opacity: s.opacity,
            animation: `twinkle ${s.duration}s ease-in-out infinite alternate`,
            animationDelay: `${s.delay}s`,
            boxShadow: s.size > 2 ? '0 0 6px rgba(255,255,255,0.8)' : 'none',
          }}
        />
      ))}

      {/* Shooting Stars (Animated CSS Meteors) */}
      <div className="shooting-star-track track-1" />
      <div className="shooting-star-track track-2" />
      <div className="shooting-star-track track-3" />
    </div>
  );
};
