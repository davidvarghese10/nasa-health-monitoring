/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Database,
  Download,
  Edit2,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Sparkles,
  UploadCloud,
  User,
  UserCheck,
  UserPlus,
  X
} from 'lucide-react';
import { api } from '../services/api';
import {
  SAMPLE_CSV_CONTENT,
  SAMPLE_JSON_CONTENT,
  SAMPLE_NEW_ASTRONAUT_CSV,
  SAMPLE_PDF_BASE64_TEXT
} from '../services/sample_files';
import { Astronaut, UploadExtractionResult } from '../types';
import { LiquidGlassCard } from '../components/LiquidGlassCard';

interface DataUploadProps {
  astronauts: Astronaut[];
  onUploadSuccess: () => void;
}

export const DataUpload: React.FC<DataUploadProps> = ({
  astronauts,
  onUploadSuccess,
}) => {
  // Target astronaut selection mode: 'AUTO_DETECT' | 'NEW_ASTRONAUT' | existing astronautId
  const [targetMode, setTargetMode] = useState<string>('AUTO_DETECT');
  
  // Custom astronaut metadata state for new or detected astronauts
  const [customAstro, setCustomAstro] = useState<{
    id: string;
    code: string;
    name: string;
    role: string;
    callsign: string;
    age: number;
    sex: 'Female' | 'Male';
  }>({
    id: `ASTRO-0${astronauts.length + 1}`,
    code: `CREW-ASTRO-0${astronauts.length + 1}`,
    name: `Astronaut ASTRO-0${astronauts.length + 1}`,
    role: 'Flight Systems & Payload Operations Specialist',
    callsign: 'Starlight',
    age: 38,
    sex: 'Female',
  });

  const [uploadResult, setUploadResult] = useState<UploadExtractionResult | null>(null);
  const [history, setHistory] = useState<UploadExtractionResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [committing, setCommitting] = useState<boolean>(false);
  const [commitMessage, setCommitMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history on initial mount
  React.useEffect(() => {
    api.getUploadHistory().then(setHistory).catch(console.error);
  }, []);

  const handleFileUpload = async (file: File) => {
    try {
      setLoading(true);
      setErrorMessage(null);
      setCommitMessage(null);

      const effectiveTargetId = targetMode === 'NEW_ASTRONAUT' ? customAstro.id : targetMode;
      const res = await api.uploadDataset(file, effectiveTargetId);
      setUploadResult(res);

      // If the file contained detected astronaut metadata, sync it to customAstro state
      if (res.detectedAstronaut) {
        setCustomAstro(prev => ({
          id: res.detectedAstronaut?.id || prev.id,
          code: res.detectedAstronaut?.code || prev.code,
          name: res.detectedAstronaut?.name || prev.name,
          role: res.detectedAstronaut?.role || prev.role,
          callsign: res.detectedAstronaut?.callsign || prev.callsign,
          age: res.detectedAstronaut?.age || prev.age,
          sex: res.detectedAstronaut?.sex || prev.sex,
        }));
      }

      const updatedHistory = await api.getUploadHistory();
      setHistory(updatedHistory);
    } catch (err: any) {
      setErrorMessage(err.message || 'File upload and parsing failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!uploadResult) return;
    try {
      setCommitting(true);
      setErrorMessage(null);

      // Determine astronaut profile override
      let astronautOverride: Partial<Astronaut> | undefined;
      const targetId = uploadResult.detectedAstronaut?.id || uploadResult.astronautId;
      const isExisting = astronauts.some(a => a.id === targetId || a.id === targetMode);

      if (!isExisting || targetMode === 'NEW_ASTRONAUT' || uploadResult.detectedAstronaut) {
        astronautOverride = {
          id: customAstro.id || targetId,
          code: customAstro.code,
          name: customAstro.name,
          role: customAstro.role,
          callsign: customAstro.callsign,
          age: customAstro.age,
          sex: customAstro.sex,
        };
      }

      const res = await api.commitUpload(uploadResult.fileId, astronautOverride);
      if (res.success) {
        setCommitMessage(
          `Successfully committed ${res.committedCount} verified records into astronaut dossier: ${res.astronaut.name} (${res.astronaut.code}).`
        );
        uploadResult.status = 'COMMITTED';
        onUploadSuccess();
        const updatedHistory = await api.getUploadHistory();
        setHistory(updatedHistory);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to commit records to database');
    } finally {
      setCommitting(false);
    }
  };

  // 1-Click Sample File Loaders
  const handleLoadSample = async (type: 'csv' | 'new_astro_csv' | 'json' | 'pdf') => {
    let file: File;
    if (type === 'csv') {
      const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv' });
      file = new File([blob], 'NASA_LSDA_Expedition74_Telemetry.csv', { type: 'text/csv' });
    } else if (type === 'new_astro_csv') {
      const blob = new Blob([SAMPLE_NEW_ASTRONAUT_CSV], { type: 'text/csv' });
      file = new File([blob], 'Telemetry_Upload_Dr_Samantha_Reed_ASTRO04.csv', { type: 'text/csv' });
    } else if (type === 'json') {
      const blob = new Blob([SAMPLE_JSON_CONTENT], { type: 'application/json' });
      file = new File([blob], 'NASA_HRP_BioStream_Exp74.json', { type: 'application/json' });
    } else {
      const blob = new Blob([SAMPLE_PDF_BASE64_TEXT], { type: 'text/plain' });
      file = new File([blob], 'NASA_Flight_Medical_Report_FD142.txt', { type: 'text/plain' });
    }
    await handleFileUpload(file);
  };

  const isNewTarget = targetMode === 'NEW_ASTRONAUT' ||
    (targetMode === 'AUTO_DETECT' && uploadResult?.detectedAstronaut && !astronauts.some(a => a.id === uploadResult.detectedAstronaut?.id));

  return (
    <div className="space-y-6">
      {/* Header & Description */}
      <LiquidGlassCard className="p-6" accent="cyan">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase mb-1">
              <UploadCloud className="w-4 h-4" />
              <span>DYNAMIC DATA INGESTION & ASTRONAUT SUBJECT MAPPING</span>
            </div>
            <h1 className="text-xl font-bold text-white font-mono uppercase tracking-wide">
              FLIGHT TELEMETRY INGESTION & MEDICAL REPORT PROCESSING
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Upload physiological datasets (CSV, JSON, PDF). Instead of binding only to pre-coded astronaut labels, ASTRA dynamically auto-detects astronaut identifiers from file headers, or lets you define new astronaut profiles on the fly!
            </p>
          </div>

          {/* Dynamic Astronaut Assignment Mode */}
          <div className="flex flex-col gap-1.5 min-w-[280px]">
            <label className="text-[11px] font-mono text-slate-400 uppercase flex items-center justify-between">
              <span>TARGET ASTRONAUT BINDING:</span>
              {isNewTarget && (
                <span className="text-cyan-400 font-semibold">[NEW SUBJECT DETECTED]</span>
              )}
            </label>
            <select
              value={targetMode}
              onChange={e => setTargetMode(e.target.value)}
              className="px-3 py-2 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="AUTO_DETECT">⚡ Auto-Detect Astronaut from Uploaded Dataset</option>
              <option value="NEW_ASTRONAUT">+ Create New Astronaut Profile from Upload</option>
              <optgroup label="Existing Astronaut Crewmembers">
                {astronauts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.code})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>

        {/* Dynamic Astronaut Label & Metadata Customizer Card */}
        {(targetMode === 'NEW_ASTRONAUT' || (uploadResult?.detectedAstronaut && targetMode === 'AUTO_DETECT')) && (
          <div className="mt-5 p-4 rounded-lg bg-cyan-950/20 border border-cyan-800/40 space-y-3">
            <div className="flex items-center justify-between border-b border-cyan-800/40 pb-2">
              <div className="flex items-center gap-2 text-cyan-300 font-mono text-xs font-semibold">
                <UserPlus className="w-4 h-4" />
                <span>DYNAMIC ASTRONAUT PROFILE DEFINITION</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {uploadResult?.detectedAstronaut ? 'PRE-FILLED FROM DETECTED FILE METADATA' : 'USER-CONFIGURED SUBJECT'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div>
                <label className="text-slate-400 block mb-1">ASTRONAUT ID / CODE</label>
                <input
                  type="text"
                  value={customAstro.id}
                  onChange={e => setCustomAstro({ ...customAstro, id: e.target.value.toUpperCase() })}
                  placeholder="e.g. ASTRO-04"
                  className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">FULL NAME & RANK</label>
                <input
                  type="text"
                  value={customAstro.name}
                  onChange={e => setCustomAstro({ ...customAstro, name: e.target.value })}
                  placeholder="e.g. Dr. Samantha Reed"
                  className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">MISSION ROLE / ASSIGNMENT</label>
                <input
                  type="text"
                  value={customAstro.role}
                  onChange={e => setCustomAstro({ ...customAstro, role: e.target.value })}
                  placeholder="e.g. Flight Specialist"
                  className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">CALLSIGN & DEMOGRAPHICS</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customAstro.callsign}
                    onChange={e => setCustomAstro({ ...customAstro, callsign: e.target.value })}
                    placeholder="Callsign"
                    className="w-1/2 px-2 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                  <input
                    type="number"
                    value={customAstro.age}
                    onChange={e => setCustomAstro({ ...customAstro, age: parseInt(e.target.value, 10) || 38 })}
                    placeholder="Age"
                    className="w-1/2 px-2 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 1-Click Sample File Testing Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-400">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>INSTANT TEST SUITE (TRY DYNAMIC UPLOAD SAMPLES):</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleLoadSample('new_astro_csv')}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-700/60 font-semibold transition-colors"
              title="Uploads dataset for brand new astronaut Dr. Samantha Reed (ASTRO-04)"
            >
              <UserPlus className="w-3.5 h-3.5 text-cyan-400" />
              <span>Load New Astronaut CSV (Dr. Samantha Reed)</span>
            </button>

            <button
              onClick={() => handleLoadSample('csv')}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
              <span>Standard CSV</span>
            </button>

            <button
              onClick={() => handleLoadSample('json')}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-blue-300 border border-slate-700 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>Sample JSON</span>
            </button>

            <button
              onClick={() => handleLoadSample('pdf')}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Clinical Medical PDF</span>
            </button>
          </div>
        </div>
      </LiquidGlassCard>

      {/* Upload Drag & Drop Zone */}
      <LiquidGlassCard
        onClick={() => fileInputRef.current?.click()}
        interactive={true}
        accent="cyan"
        className="group relative !border-dashed border-cyan-500/30 hover:border-cyan-400 p-8 text-center cursor-pointer"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.json,.pdf,.txt"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
          }}
        />

        <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 group-hover:border-cyan-500/50 flex items-center justify-center mx-auto mb-3 transition-colors">
          <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-cyan-400 transition-colors" />
        </div>

        <h3 className="text-sm font-semibold text-white font-mono">
          DROP FLIGHT TELEMETRY FILE OR CLICK TO BROWSE
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Supports CSV (tabular vitals with astronaut headers), JSON (NASA-LSDA format), and PDF / TXT (Flight Medical Reports)
        </p>

        {loading && (
          <div className="mt-4 flex items-center justify-center gap-2 text-xs font-mono text-cyan-400">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Parsing file schema, detecting astronaut labels, and executing physiological validation...</span>
          </div>
        )}
      </LiquidGlassCard>

      {errorMessage && (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {commitMessage && (
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{commitMessage}</span>
        </div>
      )}

      {/* Extracted Information Preview & Verification Table */}
      {uploadResult && (
        <LiquidGlassCard className="p-6 space-y-5" accent="cyan">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white font-mono uppercase">
                  EXTRACTED DATASET FOR USER VERIFICATION
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                  uploadResult.status === 'COMMITTED'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  {uploadResult.status}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-1 font-mono flex flex-wrap items-center gap-2">
                <span>Source: {uploadResult.fileName} ({(uploadResult.fileSize / 1024).toFixed(1)} KB)</span>
                <span>·</span>
                <span className="text-cyan-400">
                  Target Subject: <strong>{customAstro.name} ({customAstro.id})</strong>
                </span>
                <span>·</span>
                <span>{uploadResult.records.length} records parsed</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {uploadResult.status !== 'COMMITTED' && (
                <button
                  disabled={committing || uploadResult.records.length === 0}
                  onClick={handleCommit}
                  className="flex items-center gap-2 px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-semibold shadow-lg shadow-cyan-900/30 transition-all disabled:opacity-50"
                >
                  {committing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Ingesting into Active Crew Matrix...</span>
                    </>
                  ) : (
                    <>
                      <Database className="w-3.5 h-3.5" />
                      <span>Verify & Commit to Astronaut Dossier</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Table of Extracted Records */}
          <div className="overflow-x-auto rounded border border-slate-800">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">TIMESTAMP (UTC)</th>
                  <th className="py-2.5 px-3">HR (BPM)</th>
                  <th className="py-2.5 px-3">SPO2 (%)</th>
                  <th className="py-2.5 px-3">BP (MMHG)</th>
                  <th className="py-2.5 px-3">TEMP (°C)</th>
                  <th className="py-2.5 px-3">RESP (BR/MIN)</th>
                  <th className="py-2.5 px-3">RADIATION</th>
                  <th className="py-2.5 px-3">VALIDATION</th>
                  <th className="py-2.5 px-3">NOTES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {uploadResult.records.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-900/40">
                    <td className="py-2 px-3 text-slate-300">
                      {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-200">{r.heartRate}</td>
                    <td className={`py-2 px-3 font-semibold ${r.bloodOxygen < 93 ? 'text-amber-400 font-bold' : 'text-cyan-400'}`}>
                      {r.bloodOxygen}%
                    </td>
                    <td className="py-2 px-3 text-slate-300">{r.systolicBP}/{r.diastolicBP}</td>
                    <td className="py-2 px-3 text-slate-300">{r.coreTemp}</td>
                    <td className="py-2 px-3 text-slate-300">{r.respiratoryRate}</td>
                    <td className="py-2 px-3 text-slate-300">{Math.round(r.radiationDosimeterRate)} µSv/d</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        r.validationStatus === 'VALID'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : r.validationStatus === 'WARNING'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}>
                        {r.validationStatus}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-400 text-[11px] max-w-xs truncate">
                      {r.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </LiquidGlassCard>
      )}

      {/* Processing History Log */}
      <LiquidGlassCard className="p-6" accent="none">
        <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wide mb-3">
          TELEMETRY INGESTION AUDIT TRAIL
        </h3>
        {history.length === 0 ? (
          <p className="text-xs text-slate-500 font-mono py-4 text-center">
            No external files ingested during current session.
          </p>
        ) : (
          <div className="space-y-2">
            {history.map(item => (
              <div
                key={item.fileId}
                className="flex items-center justify-between p-3 rounded bg-slate-900/60 border border-slate-800 text-xs font-mono"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-slate-300">
                    {item.fileType === 'csv' ? <FileSpreadsheet className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-200">{item.fileName}</div>
                    <div className="text-[11px] text-slate-400">
                      Subject: {astronauts.find(a => a.id === item.astronautId)?.name || item.astronautId} · Ingested {new Date(item.uploadedAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-slate-400">
                    {item.extractedRecordsCount} records extracted
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] ${
                    item.status === 'COMMITTED'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </LiquidGlassCard>
    </div>
  );
};
