/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Activity, AlertTriangle, Cpu, FileText, Play, Pause, RefreshCw, RotateCcw, Shield, UploadCloud, UserCheck, Users, Zap } from 'lucide-react';
import { MissionOverviewData, MissionRole, SimulationState, UserProfile } from '../types';

export type ActivePage =
  | 'overview'
  | 'astronauts'
  | 'analytics'
  | 'anomalies'
  | 'upload'
  | 'assistant'
  | 'alerts-reports';

interface NavigationProps {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
  mission: MissionOverviewData | null;
  currentUser: UserProfile | null;
  onSwitchRole: (role: MissionRole) => void;
  simulation: SimulationState | null;
  onToggleSim: () => void;
  onStepTick: () => void;
  onResetSim: () => void;
  onOpenAnomalyModal: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activePage,
  setActivePage,
  mission,
  currentUser,
  onSwitchRole,
  simulation,
  onToggleSim,
  onStepTick,
  onResetSim,
  onOpenAnomalyModal,
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const roles: MissionRole[] = [
    'Flight Surgeon',
    'Mission Director',
    'Crew Astronaut',
    'Biomedical Analyst',
  ];

  const navItems: Array<{ id: ActivePage; label: string; icon: React.ElementType }> = [
    { id: 'overview', label: 'Mission Overview', icon: Activity },
    { id: 'astronauts', label: 'Astronaut Profiles', icon: Users },
    { id: 'analytics', label: 'Health Analytics', icon: Cpu },
    { id: 'anomalies', label: 'Anomaly Engine', icon: AlertTriangle },
    { id: 'upload', label: 'Data Ingestion', icon: UploadCloud },
    { id: 'assistant', label: 'AI Assistant', icon: Zap },
    { id: 'alerts-reports', label: 'Alerts & Reports', icon: FileText },
  ];

  return (
    <div className="sticky top-0 z-50 w-full bg-[#07090e]/95 backdrop-blur border-b border-slate-800/80">
      {/* Simulation Notice Ribbon */}
      <div className="bg-slate-950/90 border-b border-slate-800/50 px-4 py-1 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3 text-slate-400">
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              TELEMETRY ENGINE: {simulation?.isRunning ? 'ACTIVE STREAM' : 'STREAM PAUSED'}
            </span>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="font-mono text-[11px] text-amber-300 font-medium">
              SIMULATED DATA — NOT REAL ASTRONAUT MEDICAL RECORDS
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onToggleSim}
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                simulation?.isRunning
                  ? 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30'
                  : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30'
              }`}
              title={simulation?.isRunning ? 'Pause Telemetry' : 'Resume Telemetry'}
            >
              {simulation?.isRunning ? (
                <>
                  <Pause className="w-3 h-3" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" /> Resume
                </>
              )}
            </button>

            <button
              onClick={onStepTick}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition-colors"
              title="Generate next telemetry tick"
            >
              <RefreshCw className="w-3 h-3" /> Step Tick
            </button>

            <button
              onClick={onOpenAnomalyModal}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/30 transition-colors"
              title="Inject test anomaly scenario"
            >
              <Zap className="w-3 h-3" /> Inject Anomaly
            </button>

            <button
              onClick={onResetSim}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
              title="Reset simulation to default nominal state"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* Primary Top Bar (Top Bar Contract: Zone 1 Wordmark, Zone 2 Nav Links, Zone 3 Action) */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-6">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="#overview"
            onClick={(e) => {
              e.preventDefault();
              setActivePage('overview');
            }}
            className="flex items-center gap-2 group"
          >
            <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold text-base tracking-widest font-mono">
              Δ
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-wider text-slate-100 font-mono whitespace-nowrap">
                ASTRA
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-tight hidden sm:block">
                EXPEDITION 74
              </span>
            </div>
          </a>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-slate-800/80 text-cyan-400 border border-slate-700/80 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
                {item.id === 'alerts-reports' && (mission?.activeAlertsCount || 0) > 0 && (
                  <span className="ml-0.5 text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {mission?.activeAlertsCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Mission Role Switcher & Status */}
        <div className="relative flex items-center gap-3 shrink-0">
          <div className="hidden md:flex flex-col items-end text-right">
            <span className="text-xs font-medium text-slate-200">{currentUser?.name}</span>
            <span className="text-[10px] font-mono text-cyan-400">{currentUser?.role}</span>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200 transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Role</span>
              <UserCheck className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl py-1 z-50">
                <div className="px-3 py-1.5 border-b border-slate-800 text-[11px] font-mono text-slate-400">
                  SWITCH OPERATIONAL ROLE
                </div>
                {roles.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      onSwitchRole(r);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                      currentUser?.role === r
                        ? 'bg-cyan-500/10 text-cyan-300 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{r}</span>
                    {currentUser?.role === r && (
                      <span className="text-[10px] font-mono text-cyan-400">CURRENT</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Nav Drawer Horizontal Strip */}
      <div className="lg:hidden flex items-center gap-1 px-4 py-2 overflow-x-auto border-t border-slate-800/60 bg-slate-950/80 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs whitespace-nowrap shrink-0 transition-colors ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
