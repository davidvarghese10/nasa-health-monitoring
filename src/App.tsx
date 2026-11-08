/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { ActivePage, Navigation } from './components/Navigation';
import { SimulationControlsModal } from './components/SimulationControlsModal';
import { AiAssistant } from './pages/AiAssistant';
import { AlertsAndReports } from './pages/AlertsAndReports';
import { AnomalyDetection } from './pages/AnomalyDetection';
import { AstronautProfiles } from './pages/AstronautProfiles';
import { DataUpload } from './pages/DataUpload';
import { HealthAnalytics } from './pages/HealthAnalytics';
import { MissionOverview } from './pages/MissionOverview';
import { api } from './services/api';
import {
  AnomalyAlert,
  Astronaut,
  MissionOverviewData,
  MissionRole,
  PhysiologicalRecord,
  SimulationState,
  UserProfile
} from './types';

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('overview');
  const [selectedAstroId, setSelectedAstroId] = useState<string>('ASTRO-01');
  const [mission, setMission] = useState<MissionOverviewData | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [astronauts, setAstronauts] = useState<Astronaut[]>([]);
  const [telemetry, setTelemetry] = useState<Record<string, PhysiologicalRecord[]>>({});
  const [alerts, setAlerts] = useState<AnomalyAlert[]>([]);
  const [simulation, setSimulation] = useState<SimulationState | null>(null);
  const [isAnomalyModalOpen, setIsAnomalyModalOpen] = useState<boolean>(false);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);

  // Load all initial state
  const loadPlatformData = async () => {
    try {
      const [m, user, astros, al, sim] = await Promise.all([
        api.getMissionOverview(),
        api.getCurrentUser(),
        api.getAstronauts(),
        api.getAlerts(true),
        api.getSimulationState(),
      ]);

      setMission(m);
      setCurrentUser(user);
      setAstronauts(astros);
      setAlerts(al);
      setSimulation(sim);

      // Fetch telemetry for all astronauts
      const telMap: Record<string, PhysiologicalRecord[]> = {};
      for (const a of astros) {
        telMap[a.id] = await api.getTelemetry(a.id, '30d');
      }
      setTelemetry(telMap);
    } catch (err) {
      console.error("Failed to load platform data:", err);
    } finally {
      setLoadingInitial(false);
    }
  };

  useEffect(() => {
    loadPlatformData();

    // Polling interval to keep telemetry synchronized with simulation background ticks
    const interval = setInterval(async () => {
      try {
        const [m, al, sim] = await Promise.all([
          api.getMissionOverview(),
          api.getAlerts(true),
          api.getSimulationState(),
        ]);
        setMission(m);
        setAlerts(al);
        setSimulation(sim);

        // Fetch latest telemetry for current astronaut
        if (selectedAstroId) {
          const freshTel = await api.getTelemetry(selectedAstroId, '30d');
          setTelemetry(prev => ({ ...prev, [selectedAstroId]: freshTel }));
        }
      } catch (err) {
        // quiet polling error
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedAstroId]);

  // Simulation handlers
  const handleToggleSim = async () => {
    try {
      const updated = await api.toggleSimulation();
      setSimulation(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStepTick = async () => {
    try {
      await api.tickSimulation();
      await loadPlatformData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetSim = async () => {
    try {
      await api.resetSimulation();
      await loadPlatformData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleInjectAnomaly = async (
    astronautId: string,
    anomalyType: 'hypoxia' | 'tachycardia' | 'radiation' | 'fever' | 'drift'
  ) => {
    await api.injectAnomaly(astronautId, anomalyType);
    await loadPlatformData();
  };

  const handleSwitchRole = async (role: MissionRole) => {
    try {
      const updated = await api.switchRole(role);
      setCurrentUser(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string, notes?: string) => {
    try {
      await api.acknowledgeAlert(alertId, notes);
      const updatedAlerts = await api.getAlerts(true);
      setAlerts(updatedAlerts);
      const updatedMission = await api.getMissionOverview();
      setMission(updatedMission);
      const updatedAstros = await api.getAstronauts();
      setAstronauts(updatedAstros);
    } catch (err) {
      console.error(err);
    }
  };

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-[#07090e] flex flex-col items-center justify-center text-slate-300 font-mono space-y-4">
        <div className="w-12 h-12 rounded bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold text-xl">
          Δ
        </div>
        <div className="flex items-center gap-2 text-sm text-cyan-400">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>ASTRA PLATFORM INITIALIZING TELEMETRY PIPELINE...</span>
        </div>
        <p className="text-xs text-slate-500">
          Mounting NASA STD-3001 physiological limits & Isolation Forest ML engine
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Top Bar Navigation */}
      <Navigation
        activePage={activePage}
        setActivePage={setActivePage}
        mission={mission}
        currentUser={currentUser}
        onSwitchRole={handleSwitchRole}
        simulation={simulation}
        onToggleSim={handleToggleSim}
        onStepTick={handleStepTick}
        onResetSim={handleResetSim}
        onOpenAnomalyModal={() => setIsAnomalyModalOpen(true)}
      />

      {/* Main Viewport Container (1440px baseline presence with generous responsive padding) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activePage === 'overview' && (
          <MissionOverview
            overview={mission}
            astronauts={astronauts}
            activeAlerts={alerts.filter(a => !a.isAcknowledged)}
            telemetry={telemetry}
            onSelectAstronaut={(id) => {
              setSelectedAstroId(id);
              setActivePage('astronauts');
            }}
            onNavigateToAnomalies={() => setActivePage('anomalies')}
            onNavigateToAnalytics={() => setActivePage('analytics')}
          />
        )}

        {activePage === 'astronauts' && (
          <AstronautProfiles
            astronauts={astronauts}
            selectedId={selectedAstroId}
            onSelect={setSelectedAstroId}
            telemetry={telemetry}
            alerts={alerts}
            onAcknowledgeAlert={handleAcknowledgeAlert}
          />
        )}

        {activePage === 'analytics' && (
          <HealthAnalytics
            astronauts={astronauts}
            selectedAstroId={selectedAstroId}
            onSelectAstronaut={setSelectedAstroId}
            telemetry={telemetry}
          />
        )}

        {activePage === 'anomalies' && (
          <AnomalyDetection
            astronauts={astronauts}
            alerts={alerts}
            telemetry={telemetry}
            onAcknowledgeAlert={handleAcknowledgeAlert}
            onOpenAnomalyModal={() => setIsAnomalyModalOpen(true)}
          />
        )}

        {activePage === 'upload' && (
          <DataUpload
            astronauts={astronauts}
            onUploadSuccess={loadPlatformData}
          />
        )}

        {activePage === 'assistant' && (
          <AiAssistant
            astronauts={astronauts}
            selectedAstroId={selectedAstroId}
          />
        )}

        {activePage === 'alerts-reports' && (
          <AlertsAndReports
            astronauts={astronauts}
            alerts={alerts}
            telemetry={telemetry}
            currentUser={currentUser}
            onAcknowledgeAlert={handleAcknowledgeAlert}
          />
        )}
      </main>

      {/* Simulation Anomaly Injection Modal */}
      <SimulationControlsModal
        isOpen={isAnomalyModalOpen}
        onClose={() => setIsAnomalyModalOpen(false)}
        astronauts={astronauts}
        onInject={handleInjectAnomaly}
      />

      {/* Aerospace Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/90 py-6 text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 font-bold">ASTRA</span>
            <span>·</span>
            <span>ASTRONAUT HEALTH INTELLIGENCE & MONITORING PLATFORM</span>
            <span>·</span>
            <span>NASA SPACE APPS CHALLENGE 2026</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>GROUNDED IN NASA-STD-3001 & HRP EVIDENCE LITERATURE</span>
            <span>·</span>
            <span className="text-amber-400">SIMULATED TELEMETRY FOR DEMONSTRATION</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
