/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Award,
  Calendar,
  Clock,
  Heart,
  Radio,
  Shield,
  Thermometer,
  User,
  Wind
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { AnomalyAlert, Astronaut, PhysiologicalRecord } from '../types';

interface AstronautProfilesProps {
  astronauts: Astronaut[];
  selectedId: string;
  onSelect: (id: string) => void;
  telemetry: Record<string, PhysiologicalRecord[]>;
  alerts: AnomalyAlert[];
  onAcknowledgeAlert: (alertId: string) => void;
}

export const AstronautProfiles: React.FC<AstronautProfilesProps> = ({
  astronauts,
  selectedId,
  onSelect,
  telemetry,
  alerts,
  onAcknowledgeAlert,
}) => {
  const [trendMetric, setTrendMetric] = useState<'heartRate' | 'bloodOxygen' | 'systolicBP' | 'coreTemp'>('heartRate');
  const astronaut = astronauts.find(a => a.id === selectedId) || astronauts[0];
  const astroTelemetry = telemetry[astronaut?.id] || [];
  const latestRecord = astroTelemetry[astroTelemetry.length - 1];
  const astroAlerts = alerts.filter(a => a.astronautId === astronaut?.id);

  // Format telemetry for trend chart
  const recentTrendData = astroTelemetry.slice(-30).map(r => {
    const d = new Date(r.timestamp);
    return {
      time: `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00`,
      heartRate: r.heartRate,
      bloodOxygen: r.bloodOxygen,
      systolicBP: r.systolicBP,
      coreTemp: r.coreTemp,
    };
  });

  const metricColors = {
    heartRate: '#06b6d4',
    bloodOxygen: '#3b82f6',
    systolicBP: '#ec4899',
    coreTemp: '#f59e0b',
  };

  return (
    <div className="space-y-6">
      {/* Astronaut Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#0b0f19] border border-slate-800 rounded-lg">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-200 font-mono uppercase">
            CREW DOSSIER SELECTION:
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {astronauts.map(a => (
            <button
              key={a.id}
              onClick={() => onSelect(a.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono transition-all ${
                selectedId === a.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>{a.code}</span>
              <span className="hidden sm:inline">({a.name})</span>
              <span className={`w-1.5 h-1.5 rounded-full ${
                a.status === 'CRITICAL' ? 'bg-rose-400' : a.status === 'ADVISORY' ? 'bg-amber-400' : 'bg-emerald-400'
              }`} />
            </button>
          ))}
        </div>
      </div>

      {/* Main Profile Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Demographic & Biometric Overview */}
        <div className="bg-[#0b0f19] border border-slate-800 rounded-lg p-6 space-y-6">
          <div className="flex items-start gap-4">
            <img
              src={astronaut.avatarUrl}
              alt={astronaut.name}
              className="w-20 h-20 rounded-lg object-cover border border-slate-700 shadow-md shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-cyan-400 font-bold">{astronaut.code}</span>
                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                  astronaut.status === 'CRITICAL'
                    ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                    : astronaut.status === 'ADVISORY'
                    ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {astronaut.status}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-0.5 truncate">{astronaut.name}</h2>
              <div className="text-xs font-mono text-slate-400">Callsign: "{astronaut.callsign}"</div>
              <p className="text-xs text-slate-300 mt-1">{astronaut.role}</p>
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-400 p-2.5 rounded bg-slate-900/60 border border-slate-800">
            SIMULATED ASTRONAUT PROFILE — NASA SPACE APPS DEMONSTRATION
          </div>

          {/* Demographics & Spaceflight Metrics */}
          <div className="space-y-2 border-t border-b border-slate-800/80 py-4 text-xs font-mono">
            <div className="flex justify-between text-slate-400">
              <span>MISSION:</span>
              <span className="text-slate-200 text-right">{astronaut.mission}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>BIOLOGICAL AGE / SEX:</span>
              <span className="text-slate-200">{astronaut.age} YRS · {astronaut.sex}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>ORBITAL FLIGHT DAY:</span>
              <span className="text-cyan-400">SOL {astronaut.microgravityDay}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>CUMULATIVE SPACE DAYS:</span>
              <span className="text-slate-200">{astronaut.spaceflightDays} DAYS</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>EXTRAVEHICULAR EVA:</span>
              <span className="text-slate-200">{astronaut.evaHours} HOURS</span>
            </div>
          </div>

          {/* Personal Baselines vs Current Vitals */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 font-mono uppercase mb-3">
              ESTABLISHED PERSONAL BASELINES
            </h4>
            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex justify-between items-center p-2 rounded bg-slate-900/60 border border-slate-800/60">
                <span className="text-slate-400">Resting Heart Rate</span>
                <span className="text-slate-200 font-semibold">{astronaut.baseline.restingHeartRate} bpm</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-slate-900/60 border border-slate-800/60">
                <span className="text-slate-400">Blood Oxygen (SpO2)</span>
                <span className="text-cyan-400 font-semibold">{astronaut.baseline.bloodOxygen} %</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-slate-900/60 border border-slate-800/60">
                <span className="text-slate-400">Blood Pressure (Sys/Dia)</span>
                <span className="text-slate-200 font-semibold">{astronaut.baseline.systolicBP}/{astronaut.baseline.diastolicBP} mmHg</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-slate-900/60 border border-slate-800/60">
                <span className="text-slate-400">Core Body Temperature</span>
                <span className="text-amber-400 font-semibold">{astronaut.baseline.coreTemp} °C</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-slate-900/60 border border-slate-800/60">
                <span className="text-slate-400">Target Daily Sleep</span>
                <span className="text-slate-200 font-semibold">{astronaut.baseline.sleepDuration} hrs</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-slate-900/60 border border-slate-800/60">
                <span className="text-slate-400">Nominal Daily Radiation</span>
                <span className="text-slate-200 font-semibold">{astronaut.baseline.dailyRadiationRate} µSv/d</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 font-mono uppercase mb-1.5">
              FLIGHT SURGEON BIOMEDICAL NOTES
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed bg-slate-900/40 p-3 rounded border border-slate-800">
              {astronaut.notes}
            </p>
          </div>
        </div>

        {/* Right Column (2 Cols): Real-time Telemetry Dashboard & Historical Trends */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Physiological Telemetry Grid */}
          <div className="bg-[#0b0f19] border border-slate-800 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wide">
                CURRENT PHYSIOLOGICAL TELEMETRY
              </h3>
              <span className="text-xs font-mono text-slate-500">
                LAST PACKET: {latestRecord ? new Date(latestRecord.timestamp).toLocaleTimeString() : 'SYNCHRONIZING'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded bg-slate-900/70 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>HEART RATE</span>
                  <Heart className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="text-xl font-bold font-mono text-white">
                  {latestRecord?.heartRate || astronaut.baseline.restingHeartRate}
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-0.5">BPM (1 Hz Sensor)</div>
              </div>

              <div className="p-3 rounded bg-slate-900/70 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>OXYGEN (SPO2)</span>
                  <Wind className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div className={`text-xl font-bold font-mono ${
                  (latestRecord?.bloodOxygen || 98) < 93 ? 'text-amber-400' : 'text-cyan-400'
                }`}>
                  {latestRecord?.bloodOxygen || astronaut.baseline.bloodOxygen}%
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-0.5">Continuous PPG</div>
              </div>

              <div className="p-3 rounded bg-slate-900/70 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>BLOOD PRESSURE</span>
                  <Activity className="w-3.5 h-3.5 text-pink-400" />
                </div>
                <div className="text-xl font-bold font-mono text-white">
                  {latestRecord ? `${latestRecord.systolicBP}/${latestRecord.diastolicBP}` : `${astronaut.baseline.systolicBP}/${astronaut.baseline.diastolicBP}`}
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-0.5">MMHG (Arterial)</div>
              </div>

              <div className="p-3 rounded bg-slate-900/70 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>CORE TEMP</span>
                  <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="text-xl font-bold font-mono text-white">
                  {latestRecord?.coreTemp || astronaut.baseline.coreTemp}°C
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-0.5">Heat-Flux Sensor</div>
              </div>

              <div className="p-3 rounded bg-slate-900/70 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>RESPIRATION</span>
                  <Wind className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div className="text-xl font-bold font-mono text-white">
                  {latestRecord?.respiratoryRate || astronaut.baseline.respiratoryRate}
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-0.5">BREATHS/MIN</div>
              </div>

              <div className="p-3 rounded bg-slate-900/70 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>SLEEP (SOL)</span>
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <div className="text-xl font-bold font-mono text-white">
                  {latestRecord?.sleepDuration || astronaut.baseline.sleepDuration}h
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-0.5">ACTIGRAPHY</div>
              </div>

              <div className="p-3 rounded bg-slate-900/70 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>METABOLIC MET</span>
                  <Award className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-xl font-bold font-mono text-white">
                  {latestRecord?.physicalActivityMet || 1.2}
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-0.5">METs (Activity)</div>
              </div>

              <div className="p-3 rounded bg-slate-900/70 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>RADIATION</span>
                  <Radio className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <div className="text-xl font-bold font-mono text-white">
                  {Math.round(latestRecord?.radiationDosimeterRate || astronaut.baseline.dailyRadiationRate)}
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-0.5">µSV/DAY (CPAD)</div>
              </div>
            </div>
          </div>

          {/* Longitudinal Trend Analysis Chart */}
          <div className="bg-[#0b0f19] border border-slate-800 rounded-lg p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wide">
                  LONGITUDINAL PHYSIOLOGICAL VARIATION
                </h3>
                <p className="text-xs text-slate-400">
                  30-Point Moving Telemetry Trace vs Personal Baseline
                </p>
              </div>

              <div className="flex items-center p-0.5 rounded bg-slate-900 border border-slate-800">
                {(['heartRate', 'bloodOxygen', 'systolicBP', 'coreTemp'] as const).map(metric => (
                  <button
                    key={metric}
                    onClick={() => setTrendMetric(metric)}
                    className={`px-2.5 py-1 text-[11px] font-mono rounded transition-colors ${
                      trendMetric === metric
                        ? 'bg-slate-800 text-cyan-400 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {metric === 'heartRate' ? 'HR' : metric === 'bloodOxygen' ? 'SpO2' : metric === 'systolicBP' ? 'BP (Sys)' : 'TEMP'}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={recentTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="time"
                    stroke="#64748b"
                    tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'JetBrains Mono' }}
                    tickLine={false}
                  />
                  <YAxis
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
                  <Line
                    type="monotone"
                    dataKey={trendMetric}
                    stroke={metricColors[trendMetric]}
                    strokeWidth={2}
                    dot={{ r: 2, fill: metricColors[trendMetric] }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Alerts for this Astronaut */}
          <div className="bg-[#0b0f19] border border-slate-800 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wide">
                  RECENT ALERTS & FLIGHT ADVISORIES ({astronaut.name})
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500">
                {astroAlerts.length} LOGGED
              </span>
            </div>

            <div className="space-y-3">
              {astroAlerts.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500 font-mono">
                  No active or recent alerts recorded for this astronaut. All telemetry nominal.
                </div>
              ) : (
                astroAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className="p-3.5 rounded bg-slate-900/80 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                          alert.severity === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {alert.severity}
                        </span>
                        <span className="text-xs font-semibold text-slate-200">
                          {alert.indicator}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(alert.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-xs font-mono text-amber-300">
                      Observed: {alert.observedValue} {alert.unit}{' '}
                      <span className="text-slate-500">· Ref: {alert.referenceBaseline}</span>
                    </div>

                    <p className="text-xs text-slate-300 leading-snug">
                      {alert.reason}
                    </p>

                    <div className="text-[11px] text-slate-400 bg-slate-950 p-2 rounded border border-slate-800/80 font-mono">
                      <span className="text-cyan-400">Action:</span> {alert.suggestedAction}
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-slate-500">
                      <span>Standard: {alert.nasaStandardRef}</span>
                      {alert.isAcknowledged ? (
                        <span className="text-emerald-400">Acknowledged by {alert.acknowledgedBy}</span>
                      ) : (
                        <button
                          onClick={() => onAcknowledgeAlert(alert.id)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-sans transition-colors"
                        >
                          Acknowledge
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
