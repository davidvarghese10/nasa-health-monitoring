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
  Edit2,
  Heart,
  Plus,
  Radio,
  Save,
  Shield,
  Thermometer,
  User,
  UserPlus,
  Wind,
  X
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
import { api } from '../services/api';
import { AnomalyAlert, Astronaut, PhysiologicalRecord } from '../types';
import { LiquidGlassCard } from '../components/LiquidGlassCard';

interface AstronautProfilesProps {
  astronauts: Astronaut[];
  selectedId: string;
  onSelect: (id: string) => void;
  telemetry: Record<string, PhysiologicalRecord[]>;
  alerts: AnomalyAlert[];
  onAcknowledgeAlert: (alertId: string) => void;
  onRefreshAstronauts?: () => void;
}

export const AstronautProfiles: React.FC<AstronautProfilesProps> = ({
  astronauts,
  selectedId,
  onSelect,
  telemetry,
  alerts,
  onAcknowledgeAlert,
  onRefreshAstronauts,
}) => {
  const [trendMetric, setTrendMetric] = useState<'heartRate' | 'bloodOxygen' | 'systolicBP' | 'coreTemp'>('heartRate');
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const astronaut = astronauts.find(a => a.id === selectedId) || astronauts[0];
  const astroTelemetry = telemetry[astronaut?.id] || [];
  const latestRecord = astroTelemetry[astroTelemetry.length - 1];
  const astroAlerts = alerts.filter(a => a.astronautId === astronaut?.id);

  // Form state for creating new astronaut
  const [newAstronautForm, setNewAstronautForm] = useState({
    id: `ASTRO-0${astronauts.length + 1}`,
    code: `CREW-ASTRO-0${astronauts.length + 1}`,
    name: '',
    role: 'Flight Systems Specialist',
    callsign: 'Pioneer',
    age: 38,
    sex: 'Female' as 'Female' | 'Male',
    restingHeartRate: 62,
    bloodOxygen: 98.2,
    systolicBP: 118,
    diastolicBP: 74,
    coreTemp: 37.15,
    respiratoryRate: 14.0,
    sleepDuration: 7.2,
    dailyRadiationRate: 320,
    notes: 'Ingested crewmember subject for exploration flight monitoring.',
  });

  // Form state for editing existing astronaut labels
  const [editForm, setEditForm] = useState({
    name: astronaut?.name || '',
    code: astronaut?.code || '',
    role: astronaut?.role || '',
    callsign: astronaut?.callsign || '',
    age: astronaut?.age || 40,
    sex: astronaut?.sex || 'Female',
    notes: astronaut?.notes || '',
  });

  // Keep editForm synced with selected astronaut
  React.useEffect(() => {
    if (astronaut) {
      setEditForm({
        name: astronaut.name,
        code: astronaut.code,
        role: astronaut.role,
        callsign: astronaut.callsign,
        age: astronaut.age,
        sex: astronaut.sex,
        notes: astronaut.notes,
      });
    }
  }, [astronaut?.id]);

  const handleRegisterNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAstronautForm.name.trim()) return;
    try {
      setSaving(true);
      const code = newAstronautForm.code || `CREW-${newAstronautForm.name.split(' ').pop()?.toUpperCase()}`;
      const payload: Partial<Astronaut> = {
        id: newAstronautForm.id.toUpperCase(),
        code,
        name: newAstronautForm.name,
        role: newAstronautForm.role,
        callsign: newAstronautForm.callsign,
        age: Number(newAstronautForm.age),
        sex: newAstronautForm.sex,
        status: 'NOMINAL',
        baseline: {
          restingHeartRate: Number(newAstronautForm.restingHeartRate),
          bloodOxygen: Number(newAstronautForm.bloodOxygen),
          systolicBP: Number(newAstronautForm.systolicBP),
          diastolicBP: Number(newAstronautForm.diastolicBP),
          coreTemp: Number(newAstronautForm.coreTemp),
          respiratoryRate: Number(newAstronautForm.respiratoryRate),
          sleepDuration: Number(newAstronautForm.sleepDuration),
          dailyRadiationRate: Number(newAstronautForm.dailyRadiationRate),
        },
        notes: newAstronautForm.notes,
      };

      const created = await api.createAstronaut(payload);
      setIsRegisterOpen(false);
      if (onRefreshAstronauts) onRefreshAstronauts();
      onSelect(created.id);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!astronaut) return;
    try {
      setSaving(true);
      await api.updateAstronaut(astronaut.id, editForm);
      setIsEditOpen(false);
      if (onRefreshAstronauts) onRefreshAstronauts();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

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
      {/* Astronaut Switcher Bar with Register Action */}
      <LiquidGlassCard className="p-4 flex flex-wrap items-center justify-between gap-3" accent="cyan">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-200 font-mono uppercase">
            CREW DOSSIER SELECTION ({astronauts.length} MONITORED):
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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

          <button
            onClick={() => setIsRegisterOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 transition-colors ml-1 font-semibold"
            title="Register a new astronaut profile"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Profile</span>
          </button>
        </div>
      </LiquidGlassCard>

      {/* Main Profile Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Demographic & Biometric Overview */}
        <LiquidGlassCard className="p-6 space-y-6" accent="cyan">
          <div className="flex items-start gap-4">
            <img
              src={astronaut.avatarUrl || "/src/assets/images/astronaut_alex_1794153633409.jpg"}
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

              <button
                onClick={() => setIsEditOpen(true)}
                className="mt-2 flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <Edit2 className="w-3 h-3" />
                <span>Edit Astronaut Labels</span>
              </button>
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-400 p-2.5 rounded bg-slate-900/60 border border-slate-800">
            ASTRONAUT PROFILE DOSSIER · EXPEDITION 74
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
        </LiquidGlassCard>

        {/* Right Column (2 Cols): Real-time Telemetry Dashboard & Historical Trends */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Physiological Telemetry Grid */}
          <LiquidGlassCard className="p-5" accent="blue">
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
          </LiquidGlassCard>

          {/* Longitudinal Trend Analysis Chart */}
          <LiquidGlassCard className="p-5" accent="cyan">
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
          </LiquidGlassCard>

          {/* Recent Alerts for this Astronaut */}
          <LiquidGlassCard className="p-5" accent="amber">
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
          </LiquidGlassCard>
        </div>
      </div>

      {/* Modal: Register New Astronaut Profile */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-[#0c101b] border border-slate-800 rounded-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-cyan-400 font-mono text-sm font-semibold">
                <UserPlus className="w-4 h-4" />
                <span>REGISTER NEW ASTRONAUT CREWMEMBER</span>
              </div>
              <button
                onClick={() => setIsRegisterOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterNew} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">ASTRONAUT ID</label>
                  <input
                    type="text"
                    required
                    value={newAstronautForm.id}
                    onChange={e => setNewAstronautForm({ ...newAstronautForm, id: e.target.value.toUpperCase() })}
                    placeholder="e.g. ASTRO-04"
                    className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">TACTICAL CODE</label>
                  <input
                    type="text"
                    required
                    value={newAstronautForm.code}
                    onChange={e => setNewAstronautForm({ ...newAstronautForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. CREW-REED"
                    className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">FULL NAME & PROFESSIONAL TITLE</label>
                <input
                  type="text"
                  required
                  value={newAstronautForm.name}
                  onChange={e => setNewAstronautForm({ ...newAstronautForm, name: e.target.value })}
                  placeholder="e.g. Dr. Samantha Reed, PhD"
                  className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">ROLE</label>
                  <input
                    type="text"
                    required
                    value={newAstronautForm.role}
                    onChange={e => setNewAstronautForm({ ...newAstronautForm, role: e.target.value })}
                    className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">CALLSIGN</label>
                  <input
                    type="text"
                    value={newAstronautForm.callsign}
                    onChange={e => setNewAstronautForm({ ...newAstronautForm, callsign: e.target.value })}
                    className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">AGE & SEX</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={newAstronautForm.age}
                      onChange={e => setNewAstronautForm({ ...newAstronautForm, age: parseInt(e.target.value, 10) || 38 })}
                      className="w-1/2 px-2 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                    <select
                      value={newAstronautForm.sex}
                      onChange={e => setNewAstronautForm({ ...newAstronautForm, sex: e.target.value as any })}
                      className="w-1/2 px-2 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="Female">F</option>
                      <option value="Male">M</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">RESTING HR (BPM)</label>
                  <input
                    type="number"
                    value={newAstronautForm.restingHeartRate}
                    onChange={e => setNewAstronautForm({ ...newAstronautForm, restingHeartRate: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">BASELINE SPO2 (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newAstronautForm.bloodOxygen}
                    onChange={e => setNewAstronautForm({ ...newAstronautForm, bloodOxygen: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">CORE TEMP (°C)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={newAstronautForm.coreTemp}
                    onChange={e => setNewAstronautForm({ ...newAstronautForm, coreTemp: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">BIOMEDICAL NOTES & PROTOCOL</label>
                <textarea
                  rows={2}
                  value={newAstronautForm.notes}
                  onChange={e => setNewAstronautForm({ ...newAstronautForm, notes: e.target.value })}
                  className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-sans"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Registering...' : 'Register Astronaut'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Existing Astronaut Labels */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#0c101b] border border-slate-800 rounded-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-cyan-400 font-mono text-sm font-semibold">
                <Edit2 className="w-4 h-4" />
                <span>EDIT ASTRONAUT LABELS ({astronaut.id})</span>
              </div>
              <button
                onClick={() => setIsEditOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs font-mono">
              <div>
                <label className="text-slate-400 block mb-1">ASTRONAUT FULL NAME</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">TACTICAL CODE</label>
                  <input
                    type="text"
                    required
                    value={editForm.code}
                    onChange={e => setEditForm({ ...editForm, code: e.target.value })}
                    className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">CALLSIGN</label>
                  <input
                    type="text"
                    value={editForm.callsign}
                    onChange={e => setEditForm({ ...editForm, callsign: e.target.value })}
                    className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">MISSION ROLE</label>
                  <input
                    type="text"
                    required
                    value={editForm.role}
                    onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">AGE</label>
                  <input
                    type="number"
                    value={editForm.age}
                    onChange={e => setEditForm({ ...editForm, age: parseInt(e.target.value, 10) || 40 })}
                    className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">BIOMEDICAL FLIGHT NOTES</label>
                <textarea
                  rows={3}
                  value={editForm.notes}
                  onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-sans"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : 'Update Labels'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
