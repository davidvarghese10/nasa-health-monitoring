/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Brain,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Filter,
  Info,
  Layers,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Zap
} from 'lucide-react';
import { AnomalyAlert, Astronaut, PhysiologicalRecord } from '../types';
import { LiquidGlassCard } from '../components/LiquidGlassCard';

interface AnomalyDetectionProps {
  astronauts: Astronaut[];
  alerts: AnomalyAlert[];
  telemetry: Record<string, PhysiologicalRecord[]>;
  onAcknowledgeAlert: (alertId: string, notes?: string) => Promise<void>;
  onOpenAnomalyModal: () => void;
}

export const AnomalyDetection: React.FC<AnomalyDetectionProps> = ({
  astronauts,
  alerts,
  telemetry,
  onAcknowledgeAlert,
  onOpenAnomalyModal,
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<'ALL' | 'CRITICAL' | 'MODERATE' | 'LOW'>('ALL');
  const [selectedType, setSelectedType] = useState<'ALL' | 'CLINICAL_RISK' | 'STATISTICAL_OUTLIER' | 'MULTIVARIATE_DRIFT'>('ALL');
  const [activeTab, setActiveTab] = useState<'alerts' | 'ml-architecture'>('alerts');
  const [selectedAlertForModal, setSelectedAlertForModal] = useState<AnomalyAlert | null>(null);
  const [ackNotes, setAckNotes] = useState<string>('');
  const [submittingAck, setSubmittingAck] = useState<boolean>(false);

  const filteredAlerts = alerts.filter(a => {
    if (selectedSeverity !== 'ALL' && a.severity !== selectedSeverity) return false;
    if (selectedType !== 'ALL' && a.type !== selectedType) return false;
    return true;
  });

  const handleConfirmAck = async () => {
    if (!selectedAlertForModal) return;
    try {
      setSubmittingAck(true);
      await onAcknowledgeAlert(selectedAlertForModal.id, ackNotes);
      setSelectedAlertForModal(null);
      setAckNotes('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingAck(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Scientific Rationale & Distinction Notice */}
      <LiquidGlassCard className="p-6" accent="cyan">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase mb-1">
              <Brain className="w-4 h-4" />
              <span>ISOLATION FOREST & TIME-SERIES PHYSIOLOGICAL ANOMALY ENGINE</span>
            </div>
            <h1 className="text-xl font-bold text-white font-mono uppercase tracking-wide">
              INTELLIGENT ANOMALY DETECTION & EXPLAINABLE MONITORING
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Synthesizes multi-variate unsupervised Isolation Forest tree path depths with rolling statistical Z-scores and clinical NASA STD-3001 spaceflight boundaries.
              Distinguishes between harmless microgravity adaptations, statistical distribution outliers, and clinical risks requiring medical action.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAnomalyModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-mono font-medium transition-colors"
            >
              <Zap className="w-4 h-4" />
              <span>Inject Test Anomaly</span>
            </button>
          </div>
        </div>

        {/* Clinical vs Statistical Differentiation Pill Callout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 pt-4 border-t border-slate-800 text-xs">
          <div className="p-3 rounded bg-blue-950/20 border border-blue-900/40">
            <div className="flex items-center gap-1.5 text-blue-400 font-mono font-semibold mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>CLINICAL RISK VS. STATISTICAL OUTLIER</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              A <strong className="text-slate-200">Statistical Outlier</strong> indicates a numeric deviation (e.g. Z-score &gt; 3.0σ) from an astronaut's personal baseline that may be physiologically benign (such as normal circadian temperature shifting). A <strong className="text-slate-200">Clinical Risk</strong> represents an acute or cumulative hazard that breaches NASA STD-3001 safety limits (e.g. SpO2 &lt; 93%, radiation spike).
            </p>
          </div>

          <div className="p-3 rounded bg-purple-950/20 border border-purple-900/40">
            <div className="flex items-center gap-1.5 text-purple-400 font-mono font-semibold mb-1">
              <Layers className="w-4 h-4" />
              <span>UNSUPERVISED ISOLATION FOREST (iFOREST)</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Constructs an ensemble of 80 random partitioning isolation trees over an 8-dimensional physiological vector. Anomalous multi-variate drift produces shorter average search path lengths, yielding an anomaly score between 0.0 (nominal) and 1.0 (anomalous).
            </p>
          </div>
        </div>
      </LiquidGlassCard>

      {/* Filter and View Tabs */}
      <LiquidGlassCard className="p-3 flex flex-wrap items-center justify-between gap-3" accent="none">
        <div className="flex items-center gap-2">
          {/* Tabs */}
          <div className="flex items-center p-0.5 rounded bg-slate-900 border border-slate-800">
            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
                activeTab === 'alerts'
                  ? 'bg-slate-800 text-cyan-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Active & Logged Alerts ({filteredAlerts.length})
            </button>
            <button
              onClick={() => setActiveTab('ml-architecture')}
              className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
                activeTab === 'ml-architecture'
                  ? 'bg-slate-800 text-cyan-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ML Model Architecture & Parameters
            </button>
          </div>
        </div>

        {/* Severity & Type Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <div className="flex items-center gap-1 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
            <span className="text-slate-500">SEVERITY:</span>
            {(['ALL', 'CRITICAL', 'MODERATE', 'LOW'] as const).map(sev => (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={`px-1.5 py-0.5 rounded ${
                  selectedSeverity === sev ? 'bg-slate-800 text-cyan-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
            <span className="text-slate-500">TYPE:</span>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value as any)}
              className="bg-transparent text-slate-300 focus:outline-none"
            >
              <option value="ALL">ALL TYPES</option>
              <option value="CLINICAL_RISK">CLINICAL RISK</option>
              <option value="STATISTICAL_OUTLIER">STATISTICAL OUTLIER</option>
              <option value="MULTIVARIATE_DRIFT">MULTIVARIATE DRIFT</option>
            </select>
          </div>
        </div>
      </LiquidGlassCard>

      {/* Tab 1: Alerts List */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <div className="bg-[#0b0f19] border border-slate-800 rounded-lg p-12 text-center text-slate-400 font-mono text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <span>No anomaly alerts match the selected criteria. All physiological parameters nominal.</span>
            </div>
          ) : (
            filteredAlerts.map(alert => (
              <LiquidGlassCard
                key={alert.id}
                className="p-5 space-y-3"
                accent={alert.severity === 'CRITICAL' ? 'rose' : alert.severity === 'MODERATE' ? 'amber' : 'blue'}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      alert.severity === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : alert.severity === 'MODERATE'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    }`}>
                      {alert.severity} SEVERITY
                    </span>

                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                      {alert.type}
                    </span>

                    <span className="text-sm font-semibold text-white">
                      {alert.astronautName} · {alert.indicator}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                    <span>ML SCORE: <strong className="text-cyan-400">{(alert.anomalyScore).toFixed(3)}</strong></span>
                    <span>·</span>
                    <span>{new Date(alert.timestamp).toLocaleString()}</span>
                  </div>
                </div>

                {/* Values & Baseline Comparison */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase">OBSERVED MEASUREMENT</span>
                    <span className="text-sm font-bold text-amber-300">
                      {alert.observedValue} {alert.unit}
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase">REFERENCE / PERSONAL BASELINE</span>
                    <span className="text-slate-200">
                      {alert.referenceBaseline}
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase">NASA OPERATIONAL STANDARD</span>
                    <span className="text-cyan-400">
                      {alert.nasaStandardRef}
                    </span>
                  </div>
                </div>

                {/* Explainable Rationale */}
                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="font-semibold text-slate-200 font-mono">REASON FOR ALERT: </span>
                    <span className="text-slate-300 leading-relaxed">{alert.reason}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-cyan-400 font-mono">PHYSIOLOGICAL MECHANISM: </span>
                    <span className="text-slate-300 leading-relaxed">{alert.physiologicalMechanism}</span>
                  </div>
                  <div className="p-3 rounded bg-slate-950 border border-slate-800/80 font-mono text-[11px]">
                    <span className="text-amber-400 font-semibold uppercase">SUGGESTED MONITORING ACTION: </span>
                    <span className="text-slate-200">{alert.suggestedAction}</span>
                  </div>
                </div>

                {/* Acknowledgment & Status Strip */}
                <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-800/60 text-xs font-mono">
                  <div>
                    {alert.isAcknowledged ? (
                      <span className="text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Acknowledged by {alert.acknowledgedBy} at {new Date(alert.acknowledgedAt || '').toLocaleTimeString()}</span>
                      </span>
                    ) : (
                      <span className="text-amber-400">Action Required: Flight Surgeon review pending</span>
                    )}
                  </div>

                  {!alert.isAcknowledged && (
                    <button
                      onClick={() => setSelectedAlertForModal(alert)}
                      className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-sans font-medium transition-colors"
                    >
                      Acknowledge & Add Flight Notes
                    </button>
                  )}
                </div>
              </LiquidGlassCard>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Machine Learning Architecture & Parameters */}
      {activeTab === 'ml-architecture' && (
        <LiquidGlassCard className="p-6 space-y-6" accent="purple">
          <div>
            <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wide">
              UNSUPERVISED ISOLATION FOREST & ML CONFIGURATION
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Implemented in accordance with NASA Exploration Medical Integrated Product Team (ExMS) standards.
              The algorithm evaluates multivariate isolation path lengths across 8 continuous physiological telemetry streams.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">ENSEMBLE TREES (t)</span>
              <span className="text-lg font-bold text-white">80 Isolation Trees</span>
            </div>
            <div className="p-3 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">SUBSAMPLE SIZE (ψ)</span>
              <span className="text-lg font-bold text-white">128 Packets</span>
            </div>
            <div className="p-3 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">MAX DEPTH (h_max)</span>
              <span className="text-lg font-bold text-cyan-400">7 Splitting Nodes</span>
            </div>
            <div className="p-3 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">ANOMALY THRESHOLD (s)</span>
              <span className="text-lg font-bold text-amber-400">s &gt; 0.620</span>
            </div>
          </div>

          <div className="border border-slate-800 rounded p-4 bg-slate-950 font-mono text-xs space-y-2">
            <div className="text-cyan-400 font-semibold uppercase">8-DIMENSIONAL FEATURE VECTOR:</div>
            <div className="text-slate-300">
              [ HeartRate, BloodOxygen_SpO2, SystolicBP, DiastolicBP, CoreTemp, RespiratoryRate, SleepDuration, RadiationRate ]
            </div>
            <div className="text-slate-500 text-[11px] pt-2 border-t border-slate-800">
              Average path length normalized by Euler-Mascheroni factor c(n) = 2(ln(n - 1) + 0.5772) - (2(n - 1)/n).
            </div>
          </div>
        </LiquidGlassCard>
      )}

      {/* Acknowledgment Modal with Operator Notes */}
      {selectedAlertForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#0c101b] border border-slate-800 rounded-lg p-6 space-y-4 shadow-2xl">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-white font-mono uppercase">
                ACKNOWLEDGE FLIGHT HEALTH ALERT
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedAlertForModal.astronautName} — {selectedAlertForModal.indicator}
              </p>
            </div>

            <div className="text-xs font-mono space-y-1.5 p-3 rounded bg-slate-900/60 border border-slate-800">
              <div>Observed: <strong className="text-amber-300">{selectedAlertForModal.observedValue} {selectedAlertForModal.unit}</strong></div>
              <div>Baseline: {selectedAlertForModal.referenceBaseline}</div>
              <div>Standard: {selectedAlertForModal.nasaStandardRef}</div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase">
                FLIGHT SURGEON / OPERATOR CLINICAL NOTES:
              </label>
              <textarea
                rows={3}
                value={ackNotes}
                onChange={e => setAckNotes(e.target.value)}
                placeholder="Document clinical assessment, countermeasure adjustment, or crew verification status..."
                className="w-full p-2.5 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedAlertForModal(null)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
              >
                Cancel
              </button>

              <button
                disabled={submittingAck}
                onClick={handleConfirmAck}
                className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white font-mono"
              >
                {submittingAck ? 'Recording...' : 'Confirm Acknowledgment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
