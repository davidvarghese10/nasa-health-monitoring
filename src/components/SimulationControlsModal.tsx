/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AlertCircle, Flame, Heart, Radio, Wind, X, Zap } from 'lucide-react';
import { Astronaut } from '../types';

interface SimulationControlsModalProps {
  isOpen: boolean;
  onClose: () => void;
  astronauts: Astronaut[];
  onInject: (astronautId: string, anomalyType: 'hypoxia' | 'tachycardia' | 'radiation' | 'fever' | 'drift') => Promise<void>;
}

export const SimulationControlsModal: React.FC<SimulationControlsModalProps> = ({
  isOpen,
  onClose,
  astronauts,
  onInject,
}) => {
  const [selectedAstro, setSelectedAstro] = useState<string>(astronauts[0]?.id || 'ASTRO-01');
  const [loading, setLoading] = useState(false);
  const [injectedSuccess, setInjectedSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const scenarios: Array<{
    type: 'hypoxia' | 'tachycardia' | 'radiation' | 'fever' | 'drift';
    title: string;
    description: string;
    icon: React.ElementType;
    badge: string;
  }> = [
    {
      type: 'hypoxia',
      title: 'Peripheral Hypoxia (SpO2 91.2%)',
      description: 'Simulates microgravity cabin ventilation pocketing or pulmonary ventilation-perfusion mismatch triggering NASA STD-3001 hypoxic limit.',
      icon: Wind,
      badge: 'NASA STD-3001 §4.3',
    },
    {
      type: 'tachycardia',
      title: 'Resting Tachycardia (124 bpm)',
      description: 'Simulates severe cardiovascular stress or post-flight orthostatic cephalic fluid deconditioning during non-exercise quiet wakefulness.',
      icon: Heart,
      badge: 'NASA-HRP CARDIO',
    },
    {
      type: 'radiation',
      title: 'Radiation Flux (1,280 µSv/day)',
      description: 'Simulates acute South Atlantic Anomaly (SAA) transit pass or Solar Particle Event (SPE) precursor requiring shelter protocol.',
      icon: Radio,
      badge: 'NCRP-132 / SRAG',
    },
    {
      type: 'fever',
      title: 'Space Fever (38.45°C Core Temp)',
      description: 'Simulates impaired convective/evaporative sweat dissipation in microgravity leading to thermoregulatory hyperthermic escalation.',
      icon: Flame,
      badge: 'THERMAL SHIFT',
    },
    {
      type: 'drift',
      title: 'Multivariate Drift (Isolation Forest)',
      description: 'Simulates subtle correlated shifts in respiration, diastolic pressure, and core temp that trigger ML iForest without breaching single bounds.',
      icon: AlertCircle,
      badge: 'iFOREST ML',
    },
  ];

  const handleInject = async (type: 'hypoxia' | 'tachycardia' | 'radiation' | 'fever' | 'drift') => {
    try {
      setLoading(true);
      await onInject(selectedAstro, type);
      setInjectedSuccess(`Successfully injected ${type} anomaly into ${astronauts.find(a => a.id === selectedAstro)?.name}'s telemetry stream.`);
      setTimeout(() => {
        setInjectedSuccess(null);
      }, 3500);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-[#0c101b] border border-slate-800 rounded-lg shadow-2xl p-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-semibold tracking-wide text-slate-100 font-mono">
              SIMULATION ANOMALY INJECTION HARNESS
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase">
            TARGET ASTRONAUT SUBJECT
          </label>
          <div className="grid grid-cols-3 gap-2">
            {astronauts.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedAstro(a.id)}
                className={`flex flex-col p-2.5 rounded text-left border transition-all ${
                  selectedAstro === a.id
                    ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="text-xs font-semibold text-slate-200">{a.name}</span>
                <span className="text-[10px] font-mono text-slate-500">{a.code}</span>
              </button>
            ))}
          </div>
        </div>

        {injectedSuccess && (
          <div className="mb-4 p-2.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {injectedSuccess}
          </div>
        )}

        <div className="space-y-2 mb-5">
          <div className="text-xs font-mono text-slate-400 uppercase mb-1">
            AVAILABLE AEROSPACE TEST SCENARIOS
          </div>
          {scenarios.map((sc) => {
            const Icon = sc.icon;
            return (
              <div
                key={sc.type}
                className="flex items-center justify-between p-3 rounded bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition-all"
              >
                <div className="flex items-start gap-3 pr-3">
                  <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-200">{sc.title}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                        {sc.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      {sc.description}
                    </p>
                  </div>
                </div>

                <button
                  disabled={loading}
                  onClick={() => handleInject(sc.type)}
                  className="px-3 py-1.5 rounded text-xs font-medium bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
                >
                  Inject
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors"
          >
            Close Harness
          </button>
        </div>
      </div>
    </div>
  );
};
