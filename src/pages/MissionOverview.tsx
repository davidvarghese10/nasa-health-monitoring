/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  Heart,
  Orbit,
  Radio,
  ShieldAlert,
  Thermometer,
  Wind
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { AnomalyAlert, Astronaut, MissionOverviewData, PhysiologicalRecord } from '../types';

interface MissionOverviewProps {
  overview: MissionOverviewData | null;
  astronauts: Astronaut[];
  activeAlerts: AnomalyAlert[];
  telemetry: Record<string, PhysiologicalRecord[]>;
  onSelectAstronaut: (id: string) => void;
  onNavigateToAnomalies: () => void;
  onNavigateToAnalytics: () => void;
}

export const MissionOverview: React.FC<MissionOverviewProps> = ({
  overview,
  astronauts,
  activeAlerts,
  telemetry,
  onSelectAstronaut,
  onNavigateToAnomalies,
  onNavigateToAnalytics,
}) => {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [metricFocus, setMetricFocus] = useState<'heartRate' | 'bloodOxygen' | 'coreTemp' | 'radiationDosimeterRate'>('heartRate');

  // Format telemetry for trend chart
  const selectedAstroId = astronauts[0]?.id || 'ASTRO-01';
  const astroTelemetry = telemetry[selectedAstroId] || [];

  // Filter based on range
  const now = new Date().getTime();
  const rangeMs = timeRange === '24h' ? 24 * 3600000 : timeRange === '7d' ? 7 * 86400000 : 30 * 86400000;
  const filteredData = astroTelemetry
    .filter(r => now - new Date(r.timestamp).getTime() <= rangeMs)
    .map(r => {
      const d = new Date(r.timestamp);
      return {
        timestamp: timeRange === '24h'
          ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00`,
        heartRate: r.heartRate,
        bloodOxygen: r.bloodOxygen,
        coreTemp: r.coreTemp,
        radiationDosimeterRate: r.radiationDosimeterRate,
        systolicBP: r.systolicBP,
        diastolicBP: r.diastolicBP,
      };
    });

  const metricMeta = {
    heartRate: { label: 'Resting Heart Rate', unit: 'bpm', color: '#06b6d4', min: 45, max: 120 },
    bloodOxygen: { label: 'Blood Oxygen (SpO2)', unit: '%', color: '#3b82f6', min: 90, max: 100 },
    coreTemp: { label: 'Core Body Temperature', unit: '°C', color: '#f59e0b', min: 36.0, max: 38.8 },
    radiationDosimeterRate: { label: 'Radiation Dosimetry', unit: 'µSv/d', color: '#a855f7', min: 200, max: 800 },
  };

  const currentMeta = metricMeta[metricFocus];

  return (
    <div className="space-y-6">
      {/* Hero Banner with Cinematic Orbital Habitat */}
      <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
        <div className="absolute inset-0">
          <img
            src="/src/assets/images/astra_hero_orbital_1794153632324.jpg"
            alt="Artemis Exploration Orbital Habitat"
            className="w-full h-full object-cover opacity-35"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#07090e] via-[#07090e]/85 to-transparent" />
        </div>

        <div className="relative p-6 sm:p-8 flex flex-col justify-between min-h-[220px]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
                <Orbit className="w-3.5 h-3.5" />
                <span>EXPEDITION 74</span>
                <span className="text-slate-600">·</span>
                <span>DEEP SPACE HABITAT ORBITAL RING</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
                {overview?.missionName || 'Artemis VII Deep Space Orbital Habitat'}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2 font-mono">
                <span>ID: {overview?.missionId}</span>
                <span className="text-slate-600">/</span>
                <span className="flex items-center gap-1 text-slate-300">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  {overview?.missionElapsedTime}
                </span>
                <span className="text-slate-600">/</span>
                <span>ALTITUDE: 418.2 KM</span>
                <span className="text-slate-600">/</span>
                <span>INCLINATION: 51.64°</span>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 p-3 rounded">
              <div className="text-right">
                <div className="text-[10px] font-mono text-slate-400 uppercase">CREW STATUS</div>
                <div className={`text-base font-bold font-mono ${
                  overview?.overallStatus === 'CRITICAL'
                    ? 'text-rose-400'
                    : overview?.overallStatus === 'ADVISORY'
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}>
                  {overview?.overallStatus}
                </div>
              </div>
              <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center">
                {overview?.overallStatus === 'CRITICAL' ? (
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                ) : overview?.overallStatus === 'ADVISORY' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                ) : (
                  <Activity className="w-4 h-4 text-emerald-400" />
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/60 mt-4">
            <div className="bg-slate-900/60 backdrop-blur p-2.5 rounded border border-slate-800/80">
              <div className="text-[10px] font-mono text-slate-400 uppercase">MONITORED CREW</div>
              <div className="text-lg font-bold font-mono text-white mt-0.5">
                {overview?.totalCrew} <span className="text-xs font-normal text-slate-400">ASTRONAUTS</span>
              </div>
            </div>

            <div className="bg-slate-900/60 backdrop-blur p-2.5 rounded border border-slate-800/80">
              <div className="text-[10px] font-mono text-slate-400 uppercase">ACTIVE ALERTS</div>
              <div className={`text-lg font-bold font-mono mt-0.5 ${
                (overview?.activeAlertsCount || 0) > 0 ? 'text-amber-400' : 'text-slate-300'
              }`}>
                {overview?.activeAlertsCount}{' '}
                <span className="text-xs font-normal text-slate-400">FLAGGED</span>
              </div>
            </div>

            <div className="bg-slate-900/60 backdrop-blur p-2.5 rounded border border-slate-800/80">
              <div className="text-[10px] font-mono text-slate-400 uppercase">MEAN BLOOD OXYGEN</div>
              <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5">
                {overview?.avgBloodOxygen}%{' '}
                <span className="text-xs font-normal text-slate-400">SPO2</span>
              </div>
            </div>

            <div className="bg-slate-900/60 backdrop-blur p-2.5 rounded border border-slate-800/80">
              <div className="text-[10px] font-mono text-slate-400 uppercase">AMBIENT RADIATION</div>
              <div className="text-lg font-bold font-mono text-slate-200 mt-0.5">
                {Math.round(overview?.avgRadiationDose || 320)}{' '}
                <span className="text-xs font-normal text-slate-400">µSV/DAY</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monitored Astronauts Quick Status Strip */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-wide text-slate-200 font-mono uppercase">
              CREW HEALTH MONITORING MATRIX
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              ({overview?.nominalCrewCount} NOMINAL · {overview?.advisoryCrewCount} ADVISORY)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {astronauts.map((astro) => {
            const records = telemetry[astro.id] || [];
            const latest = records[records.length - 1];
            return (
              <div
                key={astro.id}
                onClick={() => onSelectAstronaut(astro.id)}
                className="group relative bg-[#0b0f19] hover:bg-[#0e1422] border border-slate-800 hover:border-slate-700 rounded-lg p-4 transition-all cursor-pointer"
              >
                <div className="flex items-start gap-3 mb-3">
                  <img
                    src={astro.avatarUrl}
                    alt={astro.name}
                    className="w-12 h-12 rounded object-cover border border-slate-700 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-cyan-400">{astro.code}</span>
                      <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                        astro.status === 'CRITICAL'
                          ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                          : astro.status === 'ADVISORY'
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {astro.status}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-white truncate">{astro.name}</h3>
                    <p className="text-[11px] text-slate-400 truncate">{astro.role}</p>
                  </div>
                </div>

                {/* Microgravity and Flight stats */}
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 py-1.5 border-t border-b border-slate-800/80 mb-3">
                  <span>SOL {astro.microgravityDay} IN ORBIT</span>
                  <span>EVA: {astro.evaHours}h</span>
                  <span>AGE {astro.age}</span>
                </div>

                {/* Vitals Grid */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-1.5 rounded bg-slate-900/60 border border-slate-800/60">
                    <div className="text-[9px] font-mono text-slate-500">HEART RATE</div>
                    <div className="text-xs font-mono font-semibold text-slate-200 mt-0.5">
                      {latest?.heartRate || astro.baseline.restingHeartRate}{' '}
                      <span className="text-[9px] text-slate-500">BPM</span>
                    </div>
                  </div>

                  <div className="p-1.5 rounded bg-slate-900/60 border border-slate-800/60">
                    <div className="text-[9px] font-mono text-slate-500">SPO2</div>
                    <div className={`text-xs font-mono font-semibold mt-0.5 ${
                      (latest?.bloodOxygen || 98) < 93 ? 'text-amber-400 font-bold' : 'text-slate-200'
                    }`}>
                      {latest?.bloodOxygen || astro.baseline.bloodOxygen}%
                    </div>
                  </div>

                  <div className="p-1.5 rounded bg-slate-900/60 border border-slate-800/60">
                    <div className="text-[9px] font-mono text-slate-500">BLOOD PRESS</div>
                    <div className="text-xs font-mono font-semibold text-slate-200 mt-0.5">
                      {latest ? `${latest.systolicBP}/${latest.diastolicBP}` : `${astro.baseline.systolicBP}/${astro.baseline.diastolicBP}`}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-cyan-400 font-medium group-hover:text-cyan-300">
                  <span>View Full Telemetry Dossier</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2-Column Split: Dynamic Historical Trend Chart + Active Health Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Telemetry Trends */}
        <div className="lg:col-span-2 bg-[#0b0f19] border border-slate-800 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wide">
                  PHYSIOLOGICAL TELEMETRY TRENDS
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Subject: CDR Elena Rostova (ASTRO-01) · Calibrated sensor stream
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Metric Selectors */}
                <div className="flex items-center p-0.5 rounded bg-slate-900 border border-slate-800">
                  {(['heartRate', 'bloodOxygen', 'coreTemp', 'radiationDosimeterRate'] as const).map(key => (
                    <button
                      key={key}
                      onClick={() => setMetricFocus(key)}
                      className={`px-2.5 py-1 text-[11px] font-mono rounded transition-colors whitespace-nowrap ${
                        metricFocus === key
                          ? 'bg-slate-800 text-cyan-400 font-medium'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {key === 'heartRate' ? 'HR' : key === 'bloodOxygen' ? 'SpO2' : key === 'coreTemp' ? 'TEMP' : 'RAD'}
                    </button>
                  ))}
                </div>

                {/* Range Selectors */}
                <div className="flex items-center p-0.5 rounded bg-slate-900 border border-slate-800">
                  {(['24h', '7d', '30d'] as const).map(r => (
                    <button
                      key={r}
                      onClick={() => setTimeRange(r)}
                      className={`px-2 py-1 text-[11px] font-mono rounded transition-colors ${
                        timeRange === r
                          ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {r.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Current Selected Metric Highlight */}
            <div className="flex items-baseline gap-3 mb-3">
              <span className="text-2xl font-bold font-mono text-white">
                {filteredData[filteredData.length - 1]?.[metricFocus] ?? '--'}
              </span>
              <span className="text-xs font-mono text-slate-400 uppercase">
                {currentMeta.unit} ({currentMeta.label})
              </span>
              <span className="text-xs font-mono text-slate-500 ml-auto">
                NASA STANDARD RANGE: {currentMeta.min} – {currentMeta.max} {currentMeta.unit}
              </span>
            </div>

            {/* Recharts Area Curve */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={currentMeta.color} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={currentMeta.color} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="timestamp"
                    stroke="#64748b"
                    tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'JetBrains Mono' }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[currentMeta.min, currentMeta.max]}
                    stroke="#64748b"
                    tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'JetBrains Mono' }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0c101b',
                      borderColor: '#1e293b',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontFamily: 'JetBrains Mono',
                      color: '#e2e8f0',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey={metricFocus}
                    stroke={currentMeta.color}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#metricGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Synchronized with Crew Personal Active Dosimeter & Bioimpedance telemetry</span>
            <button
              onClick={onNavigateToAnalytics}
              className="text-cyan-400 hover:text-cyan-300 font-medium font-mono flex items-center gap-1"
            >
              Open Multi-Parametric Analytics <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column (1 Col): Active Health Alerts & Recent Events */}
        <div className="bg-[#0b0f19] border border-slate-800 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wide">
                  ACTIVE HEALTH ALERTS
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500">
                {activeAlerts.length} PENDING
              </span>
            </div>

            <div className="space-y-3">
              {activeAlerts.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 font-mono">
                  No active physiological alerts. All parameters nominal.
                </div>
              ) : (
                activeAlerts.slice(0, 3).map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 rounded bg-slate-900/90 border border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        alert.severity === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {alert.severity} · {alert.type}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-slate-200">
                      {alert.astronautName} — {alert.indicator}
                    </div>

                    <div className="text-xs font-mono text-amber-300">
                      Observed: {alert.observedValue} {alert.unit}{' '}
                      <span className="text-slate-500">(Ref: {alert.referenceBaseline})</span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                      {alert.reason}
                    </p>

                    <div className="text-[10px] font-mono text-cyan-400 pt-1">
                      Ref: {alert.nasaStandardRef}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 mt-4">
            <button
              onClick={onNavigateToAnomalies}
              className="w-full py-2 px-3 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors text-center font-mono flex items-center justify-center gap-1.5"
            >
              <span>Inspect Anomaly Detection Engine</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mission Activity Timeline */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wide mb-3">
          MISSION PHYSIOLOGICAL ACTIVITY & WORKFLOW TIMELINE
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded bg-slate-900/60 border border-slate-800">
            <div className="text-[10px] font-mono text-cyan-400">MET 142:06:00:00</div>
            <div className="font-semibold text-slate-200 mt-1">Crew Wake & Actigraphy Sync</div>
            <p className="text-slate-400 text-[11px] mt-1">
              Polysomnography and sleep quality telemetry offloaded to bio-archive.
            </p>
          </div>

          <div className="p-3 rounded bg-slate-900/60 border border-slate-800">
            <div className="text-[10px] font-mono text-cyan-400">MET 142:10:00:00</div>
            <div className="font-semibold text-slate-200 mt-1">Aerobic Countermeasure (CEVIS)</div>
            <p className="text-slate-400 text-[11px] mt-1">
              CDR Rostova completed 45-min interval ergometer protocol; max HR reached 142 bpm.
            </p>
          </div>

          <div className="p-3 rounded bg-slate-900/60 border border-slate-800">
            <div className="text-[10px] font-mono text-amber-400">MET 142:14:00:00</div>
            <div className="font-semibold text-slate-200 mt-1">Node 2 ECLSS Filter Servicing</div>
            <p className="text-slate-400 text-[11px] mt-1">
              Transient SpO2 advisory detected and resolved post-scrubbing.
            </p>
          </div>

          <div className="p-3 rounded bg-slate-900/60 border border-slate-800">
            <div className="text-[10px] font-mono text-emerald-400">MET 142:18:30:00</div>
            <div className="font-semibold text-slate-200 mt-1">Flight Surgeon Tele-Conference</div>
            <p className="text-slate-400 text-[11px] mt-1">
              Weekly private medical conference (PMC) conducted with Houston medical ops.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
