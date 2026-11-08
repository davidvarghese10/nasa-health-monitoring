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
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Sparkles,
  UploadCloud,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { SAMPLE_CSV_CONTENT, SAMPLE_JSON_CONTENT, SAMPLE_PDF_BASE64_TEXT } from '../services/sample_files';
import { Astronaut, UploadExtractionResult } from '../types';

interface DataUploadProps {
  astronauts: Astronaut[];
  onUploadSuccess: () => void;
}

export const DataUpload: React.FC<DataUploadProps> = ({
  astronauts,
  onUploadSuccess,
}) => {
  const [selectedAstronaut, setSelectedAstronaut] = useState<string>(astronauts[0]?.id || 'ASTRO-01');
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
      const res = await api.uploadDataset(file, selectedAstronaut);
      setUploadResult(res);
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
      const res = await api.commitUpload(uploadResult.fileId);
      if (res.success) {
        setCommitMessage(`Successfully committed ${res.committedCount} verified records into active astronaut database.`);
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
  const handleLoadSample = async (type: 'csv' | 'json' | 'pdf') => {
    let file: File;
    if (type === 'csv') {
      const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv' });
      file = new File([blob], 'NASA_LSDA_Expedition74_Telemetry.csv', { type: 'text/csv' });
    } else if (type === 'json') {
      const blob = new Blob([SAMPLE_JSON_CONTENT], { type: 'application/json' });
      file = new File([blob], 'NASA_HRP_BioStream_Exp74.json', { type: 'application/json' });
    } else {
      const blob = new Blob([SAMPLE_PDF_BASE64_TEXT], { type: 'text/plain' });
      file = new File([blob], 'NASA_Flight_Medical_Report_FD142.txt', { type: 'text/plain' });
    }
    await handleFileUpload(file);
  };

  return (
    <div className="space-y-6">
      {/* Header & Description */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-lg p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white font-mono uppercase tracking-wide">
              FLIGHT DATA INGESTION & MEDICAL REPORT PROCESSING
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Accepts NASA bio-archive CSV telemetry, standardized JSON telemetry streams, and clinical flight evaluation PDF reports.
              All incoming packets undergo automated schema validation, range checks (NASA STD-3001), and tabular extraction preview prior to database commitment.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400 uppercase">TARGET CREW:</span>
            <select
              value={selectedAstronaut}
              onChange={e => setSelectedAstronaut(e.target.value)}
              className="px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {astronauts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 1-Click Sample File Testing Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-400">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>INSTANT TEST SUITE (1-CLICK VALIDATION SAMPLES):</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleLoadSample('csv')}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
              <span>Load Sample CSV</span>
            </button>

            <button
              onClick={() => handleLoadSample('json')}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-blue-300 border border-slate-700 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>Load Sample JSON</span>
            </button>

            <button
              onClick={() => handleLoadSample('pdf')}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Load Sample Clinical Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Upload Drag & Drop Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="group relative border-2 border-dashed border-slate-800 hover:border-cyan-500/60 rounded-lg p-8 text-center cursor-pointer bg-[#0b0f19]/60 hover:bg-[#0b0f19] transition-all"
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
          Supports CSV (tabular vitals), JSON (NASA-LSDA format), and PDF / TXT (Flight Surgeon Medical Reports)
        </p>

        {loading && (
          <div className="mt-4 flex items-center justify-center gap-2 text-xs font-mono text-cyan-400">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Parsing file schema and executing physiological range validation...</span>
          </div>
        )}
      </div>

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
        <div className="bg-[#0b0f19] border border-slate-800 rounded-lg p-6 space-y-5">
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
              <div className="text-xs text-slate-400 mt-1 font-mono">
                Source: {uploadResult.fileName} ({(uploadResult.fileSize / 1024).toFixed(1)} KB) · Protocol: {uploadResult.documentMetadata?.protocol || 'Standard'}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-400">
                {uploadResult.records.length} records parsed · {uploadResult.validationErrorsCount} bounds violations
              </span>

              {uploadResult.status !== 'COMMITTED' && (
                <button
                  disabled={committing || uploadResult.records.length === 0}
                  onClick={handleCommit}
                  className="flex items-center gap-2 px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-semibold shadow-lg shadow-cyan-900/30 transition-all disabled:opacity-50"
                >
                  {committing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving to Database...</span>
                    </>
                  ) : (
                    <>
                      <Database className="w-3.5 h-3.5" />
                      <span>Verify & Commit Records</span>
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
        </div>
      )}

      {/* Processing History Log */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-lg p-6">
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
      </div>
    </div>
  );
};
