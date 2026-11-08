/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  FileCheck,
  FileText,
  Filter,
  Printer,
  Shield,
  UserCheck
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { NASA_SCIENTIFIC_LIBRARY } from '../data/nasa_references';
import { AnomalyAlert, Astronaut, PhysiologicalRecord, UserProfile } from '../types';
import { LiquidGlassCard } from '../components/LiquidGlassCard';

interface AlertsAndReportsProps {
  astronauts: Astronaut[];
  alerts: AnomalyAlert[];
  telemetry: Record<string, PhysiologicalRecord[]>;
  currentUser: UserProfile | null;
  onAcknowledgeAlert: (alertId: string, notes?: string) => Promise<void>;
}

export const AlertsAndReports: React.FC<AlertsAndReportsProps> = ({
  astronauts,
  alerts,
  telemetry,
  currentUser,
  onAcknowledgeAlert,
}) => {
  const [activeTab, setActiveTab] = useState<'alerts' | 'report-generator'>('alerts');
  const [alertFilter, setAlertFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ALL');
  const [selectedReportAstro, setSelectedReportAstro] = useState<string>(astronauts[0]?.id || 'ASTRO-01');
  const [reportPeriod, setReportPeriod] = useState<'24h' | '7d' | '30d'>('7d');
  const [generatingPdf, setGeneratingPdf] = useState<boolean>(false);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);

  // Acknowledgment dialog state
  const [ackModalAlert, setAckModalAlert] = useState<AnomalyAlert | null>(null);
  const [ackNotes, setAckNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const filteredAlerts = alerts.filter(a => {
    if (alertFilter === 'ACTIVE') return !a.isAcknowledged;
    if (alertFilter === 'RESOLVED') return a.isAcknowledged;
    return true;
  });

  const handleAcknowledge = async () => {
    if (!ackModalAlert) return;
    try {
      setSubmitting(true);
      await onAcknowledgeAlert(ackModalAlert.id, ackNotes);
      setAckModalAlert(null);
      setAckNotes('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // PDF Generation using jsPDF
  const generatePdfReport = () => {
    setGeneratingPdf(true);
    try {
      const astronaut = astronauts.find(a => a.id === selectedReportAstro) || astronauts[0];
      const astroTelemetry = telemetry[astronaut.id] || [];
      const astroAlerts = alerts.filter(a => a.astronautId === astronaut.id);

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Background color header
      doc.setFillColor(7, 9, 14);
      doc.rect(0, 0, 210, 40, 'F');

      // Title
      doc.setTextColor(6, 182, 212); // Cyan
      doc.setFont('courier', 'bold');
      doc.setFontSize(16);
      doc.text("ASTRA — ASTRONAUT HEALTH MONITORING REPORT", 14, 16);

      doc.setFont('courier', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.text(`EXPEDITION 74 | FLIGHT MEDICINE OPERATIONS | GENERATED: ${new Date().toUTCString()}`, 14, 23);
      doc.text(`REPORT PROTOCOL: NASA-STD-3001 VOL 1 REV B | PERIOD: LAST ${reportPeriod.toUpperCase()}`, 14, 28);
      doc.text(`ISSUED BY: ${currentUser?.name || 'Flight Surgeon'} (${currentUser?.role || 'Medical Command'})`, 14, 33);

      // Section 1: Subject Information
      doc.setTextColor(15, 23, 42); // Dark slate
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text("1. ASTRONAUT SUBJECT PROFILE", 14, 48);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Name: ${astronaut.name} (${astronaut.code})`, 14, 55);
      doc.text(`Assignment: ${astronaut.role}`, 14, 60);
      doc.text(`Mission: ${astronaut.mission}`, 14, 65);
      doc.text(`Flight Time: Sol ${astronaut.microgravityDay} in microgravity (Total: ${astronaut.spaceflightDays} days)`, 14, 70);
      doc.text(`Demographics: ${astronaut.age} YRS · Biological Sex: ${astronaut.sex} · EVA Hours: ${astronaut.evaHours}h`, 14, 75);

      // Section 2: Established Personal Baseline & Current Mean Telemetry
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text("2. PHYSIOLOGICAL MEASUREMENTS SUMMARY", 14, 86);

      doc.setFont('courier', 'normal');
      doc.setFontSize(9);
      const latest = astroTelemetry[astroTelemetry.length - 1];

      doc.text("INDICATOR                  BASELINE          LATEST OBSERVED    NASA STANDARD BOUNDARY", 14, 94);
      doc.setDrawColor(203, 213, 225);
      doc.line(14, 96, 196, 96);

      doc.text(`Resting Heart Rate:        ${astronaut.baseline.restingHeartRate} bpm           ${latest?.heartRate || '--'} bpm            50 - 95 bpm`, 14, 102);
      doc.text(`Blood Oxygen (SpO2):       ${astronaut.baseline.bloodOxygen} %             ${latest?.bloodOxygen || '--'} %             >= 95.0 % (Critical <93%)`, 14, 108);
      doc.text(`Blood Pressure (Sys/Dia):  ${astronaut.baseline.systolicBP}/${astronaut.baseline.diastolicBP} mmHg     ${latest?.systolicBP || '--'}/${latest?.diastolicBP || '--'} mmHg      100-130 / 65-85 mmHg`, 14, 114);
      doc.text(`Core Body Temp:            ${astronaut.baseline.coreTemp} C          ${latest?.coreTemp || '--'} C           36.4 - 38.0 C (Space Fever)`, 14, 120);
      doc.text(`Respiration Rate:          ${astronaut.baseline.respiratoryRate} br/min       ${latest?.respiratoryRate || '--'} br/min         12 - 20 br/min`, 14, 126);
      doc.text(`Target Daily Sleep:        ${astronaut.baseline.sleepDuration} hrs           ${latest?.sleepDuration || '--'} hrs           6.0 - 8.5 hrs/night`, 14, 132);
      doc.text(`Ambient Radiation:         ${astronaut.baseline.dailyRadiationRate} uSv/d        ${Math.round(latest?.radiationDosimeterRate || 320)} uSv/d         < 1,000 uSv/d (SPE Alert)`, 14, 138);

      // Section 3: Anomaly & Alert Log
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text("3. DETECTED ANOMALIES & CLINICAL ALERTS", 14, 150);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      if (astroAlerts.length === 0) {
        doc.text("No physiological anomalies detected during the reporting interval.", 14, 158);
      } else {
        let y = 158;
        astroAlerts.slice(0, 3).forEach((a, idx) => {
          doc.setFont('helvetica', 'bold');
          doc.text(`• [${a.severity} - ${a.type}] ${a.indicator} (Observed: ${a.observedValue} ${a.unit})`, 14, y);
          doc.setFont('helvetica', 'normal');
          doc.text(`  Reason: ${a.reason}`, 14, y + 5);
          doc.text(`  Action: ${a.suggestedAction}`, 14, y + 10);
          doc.text(`  Standard Reference: ${a.nasaStandardRef} | Status: ${a.isAcknowledged ? `Acknowledged (${a.acknowledgedBy})` : 'Pending Review'}`, 14, y + 15);
          y += 22;
        });
      }

      // Section 4: Flight Surgeon Recommendations
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text("4. FLIGHT SURGEON MONITORING RECOMMENDATIONS", 14, 228);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text("1. Continue scheduled 2.5 hours of daily aerobic (CEVIS) and resistive (ARED) exercise countermeasures.", 14, 235);
      doc.text("2. Maintain continuous pulse oximetry monitoring during maintenance operations in Node-2 habitability module.", 14, 240);
      doc.text("3. Verify sleeping quarter acoustics remain strictly < 58 dBA to preserve slow-wave Stage 3/4 sleep architecture.", 14, 245);
      doc.text("4. Cross-reference personal dosimeter readings with NOAA SWPC solar flare activity forecasts.", 14, 250);

      // Section 5: References
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text("5. AUTHENTIC NASA RESEARCH REFERENCES", 14, 260);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`[1] NASA-STD-3001 Vol 1 Rev B: Space Flight Human-System Standard, Crew Health.`, 14, 265);
      doc.text(`[2] NASA-HRP Evidence Book: Risk of Cardiovascular Alterations in Microgravity (2023).`, 14, 269);
      doc.text(`[3] NASA-SP-2020-0193: Circadian Desynchronization and Sleep Architecture in LEO.`, 14, 273);

      // Footer
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text("ASTRA PLATFORM — SIMULATED DEMONSTRATION DATA FOR NASA SPACE APPS CHALLENGE 2026", 14, 285);

      doc.save(`ASTRA_Health_Report_${astronaut.code}_${reportPeriod.toUpperCase()}.pdf`);
      setReportSuccess(`Report generated and downloaded: ASTRA_Health_Report_${astronaut.code}_${reportPeriod.toUpperCase()}.pdf`);
      setTimeout(() => setReportSuccess(null), 5000);
    } catch (err: any) {
      console.error(err);
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Raw JSON telemetry download
  const handleDownloadJson = () => {
    const astronaut = astronauts.find(a => a.id === selectedReportAstro) || astronauts[0];
    const data = {
      reportType: "ASTRA Biomedical Telemetry Export",
      exportTimestamp: new Date().toISOString(),
      astronaut,
      telemetry: telemetry[astronaut.id] || [],
      alerts: alerts.filter(a => a.astronautId === astronaut.id),
      scientificReferences: NASA_SCIENTIFIC_LIBRARY,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ASTRA_Telemetry_Dataset_${astronaut.code}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <LiquidGlassCard className="p-6" accent="cyan">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase mb-1">
              <Shield className="w-4 h-4" />
              <span>FLIGHT SURGEON LOG & COMPREHENSIVE MEDICAL REPORTING</span>
            </div>
            <h1 className="text-xl font-bold text-white font-mono uppercase tracking-wide">
              ALERTS MANAGEMENT & PDF REPORT GENERATION
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Review active physiological alerts, record official flight surgeon acknowledgment notes, and compile downloadable aerospace health monitoring reports conforming to NASA STD-3001.
            </p>
          </div>

          <div className="flex items-center p-0.5 rounded bg-slate-900 border border-slate-800">
            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
                activeTab === 'alerts'
                  ? 'bg-slate-800 text-cyan-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Alerts Ledger ({alerts.length})
            </button>
            <button
              onClick={() => setActiveTab('report-generator')}
              className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
                activeTab === 'report-generator'
                  ? 'bg-slate-800 text-cyan-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Generate PDF Reports
            </button>
          </div>
        </div>
      </LiquidGlassCard>

      {/* Tab 1: Alerts Management Ledger */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <LiquidGlassCard className="p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono" accent="none">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 uppercase">FILTER ALERTS:</span>
              {(['ALL', 'ACTIVE', 'RESOLVED'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setAlertFilter(f)}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    alertFilter === f
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="text-slate-400">
              Showing {filteredAlerts.length} alert records
            </div>
          </LiquidGlassCard>

          <div className="space-y-3">
            {filteredAlerts.length === 0 ? (
              <div className="bg-[#0b0f19] border border-slate-800 rounded-lg p-12 text-center text-slate-400 font-mono text-xs">
                No alerts match the current filter.
              </div>
            ) : (
              filteredAlerts.map(alert => (
                <LiquidGlassCard
                  key={alert.id}
                  className="p-5 space-y-3"
                  accent={alert.severity === 'CRITICAL' ? 'rose' : 'amber'}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        alert.severity === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}>
                        {alert.severity}
                      </span>
                      <span className="text-sm font-semibold text-white">
                        {alert.astronautName} — {alert.indicator}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        ({alert.type})
                      </span>
                    </div>

                    <div className="text-xs font-mono text-slate-400">
                      {new Date(alert.timestamp).toLocaleString()}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                    <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">OBSERVED VALUE</span>
                      <span className="text-sm font-bold text-amber-300">{alert.observedValue} {alert.unit}</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">BASELINE RANGE</span>
                      <span className="text-slate-200">{alert.referenceBaseline}</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">NASA STANDARD</span>
                      <span className="text-cyan-400">{alert.nasaStandardRef}</span>
                    </div>
                  </div>

                  <div className="text-xs space-y-1">
                    <p className="text-slate-300 leading-snug">
                      <strong className="text-slate-200 font-mono">REASON: </strong>{alert.reason}
                    </p>
                    <p className="text-slate-400 leading-snug">
                      <strong className="text-cyan-400 font-mono">ACTION: </strong>{alert.suggestedAction}
                    </p>
                  </div>

                  {alert.notes && (
                    <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
                      <span className="text-emerald-400 font-semibold">FLIGHT SURGEON NOTE: </span>
                      {alert.notes}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-800/60 text-xs font-mono">
                    <div>
                      {alert.isAcknowledged ? (
                        <span className="text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Acknowledged by {alert.acknowledgedBy} on {new Date(alert.acknowledgedAt || '').toLocaleString()}</span>
                        </span>
                      ) : (
                        <span className="text-amber-400">Status: Active / Unacknowledged</span>
                      )}
                    </div>

                    {!alert.isAcknowledged && (
                      <button
                        onClick={() => setAckModalAlert(alert)}
                        className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-sans font-medium transition-colors"
                      >
                        Acknowledge & Add Notes
                      </button>
                    )}
                  </div>
                </LiquidGlassCard>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Report Generator */}
      {activeTab === 'report-generator' && (
        <LiquidGlassCard className="p-6 space-y-6" accent="cyan">
          <div>
            <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wide">
              AEROSPACE MEDICAL REPORT CONFIGURATION
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Generates a standardized NASA Flight Medicine Clinical Evaluation report including astronaut vitals, detected anomalies, trend summaries, and scientific literature citations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase">
                TARGET ASTRONAUT SUBJECT:
              </label>
              <select
                value={selectedReportAstro}
                onChange={e => setSelectedReportAstro(e.target.value)}
                className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {astronauts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.code}) — {a.role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase">
                SELECTED REPORTING INTERVAL:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['24h', '7d', '30d'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setReportPeriod(p)}
                    className={`py-2 text-xs font-mono rounded border transition-colors ${
                      reportPeriod === p
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-semibold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    LAST {p.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {reportSuccess && (
            <div className="p-3 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{reportSuccess}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-800">
            <button
              disabled={generatingPdf}
              onClick={generatePdfReport}
              className="flex items-center gap-2 px-5 py-2.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-semibold shadow-lg shadow-cyan-900/30 transition-all disabled:opacity-50"
            >
              <FileCheck className="w-4 h-4" />
              <span>{generatingPdf ? 'Rendering PDF Report...' : 'Generate & Download PDF Report'}</span>
            </button>

            <button
              onClick={handleDownloadJson}
              className="flex items-center gap-2 px-4 py-2.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-mono text-xs font-medium transition-colors"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Export Raw JSON Telemetry</span>
            </button>
          </div>
        </LiquidGlassCard>
      )}

      {/* Acknowledgment Modal */}
      {ackModalAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#0c101b] border border-slate-800 rounded-lg p-6 space-y-4 shadow-2xl">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-white font-mono uppercase">
                ACKNOWLEDGE FLIGHT HEALTH ALERT
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {ackModalAlert.astronautName} — {ackModalAlert.indicator}
              </p>
            </div>

            <div className="text-xs font-mono space-y-1.5 p-3 rounded bg-slate-900/60 border border-slate-800">
              <div>Observed: <strong className="text-amber-300">{ackModalAlert.observedValue} {ackModalAlert.unit}</strong></div>
              <div>Baseline: {ackModalAlert.referenceBaseline}</div>
              <div>Standard: {ackModalAlert.nasaStandardRef}</div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase">
                FLIGHT SURGEON CLINICAL NOTES & ACTIONS TAKEN:
              </label>
              <textarea
                rows={3}
                value={ackNotes}
                onChange={e => setAckNotes(e.target.value)}
                placeholder="Enter clinical assessment or countermeasure instructions..."
                className="w-full p-2.5 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setAckModalAlert(null)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
              >
                Cancel
              </button>

              <button
                disabled={submitting}
                onClick={handleAcknowledge}
                className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white font-mono"
              >
                {submitting ? 'Recording...' : 'Confirm Acknowledgment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
