/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnomalyAlert, Astronaut, MissionOverviewData, MissionRole, PhysiologicalRecord, SimulationState, UploadExtractionResult, UserProfile } from '../types';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || errorBody.message || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export const api = {
  async getMissionOverview(): Promise<MissionOverviewData> {
    const res = await fetch('/api/mission');
    return handleResponse(res);
  },

  async getCurrentUser(): Promise<UserProfile> {
    const res = await fetch('/api/user/me');
    return handleResponse(res);
  },

  async switchRole(role: MissionRole, name?: string): Promise<UserProfile> {
    const res = await fetch('/api/user/switch-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, name }),
    });
    return handleResponse(res);
  },

  async getAstronauts(): Promise<Astronaut[]> {
    const res = await fetch('/api/astronauts');
    return handleResponse(res);
  },

  async getAstronaut(id: string): Promise<Astronaut> {
    const res = await fetch(`/api/astronauts/${id}`);
    return handleResponse(res);
  },

  async getTelemetry(astronautId: string, range: '24h' | '7d' | '30d' = '7d'): Promise<PhysiologicalRecord[]> {
    const res = await fetch(`/api/telemetry/${astronautId}?range=${range}`);
    return handleResponse(res);
  },

  async getAlerts(includeResolved: boolean = true): Promise<AnomalyAlert[]> {
    const res = await fetch(`/api/alerts?includeResolved=${includeResolved}`);
    return handleResponse(res);
  },

  async acknowledgeAlert(alertId: string, notes?: string): Promise<AnomalyAlert> {
    const res = await fetch(`/api/alerts/${alertId}/acknowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });
    return handleResponse(res);
  },

  async getSimulationState(): Promise<SimulationState> {
    const res = await fetch('/api/simulation/state');
    return handleResponse(res);
  },

  async toggleSimulation(): Promise<SimulationState> {
    const res = await fetch('/api/simulation/toggle', { method: 'POST' });
    return handleResponse(res);
  },

  async tickSimulation(): Promise<{ success: boolean; timestamp: string }> {
    const res = await fetch('/api/simulation/tick', { method: 'POST' });
    return handleResponse(res);
  },

  async resetSimulation(): Promise<{ success: boolean }> {
    const res = await fetch('/api/simulation/reset', { method: 'POST' });
    return handleResponse(res);
  },

  async injectAnomaly(astronautId: string, anomalyType: 'hypoxia' | 'tachycardia' | 'radiation' | 'fever' | 'drift'): Promise<any> {
    const res = await fetch('/api/simulation/inject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ astronautId, anomalyType }),
    });
    return handleResponse(res);
  },

  async uploadDataset(file: File, astronautId: string): Promise<UploadExtractionResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('astronautId', astronautId);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    return handleResponse(res);
  },

  async commitUpload(fileId: string): Promise<{ success: boolean; committedCount: number }> {
    const res = await fetch('/api/upload/commit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId }),
    });
    return handleResponse(res);
  },

  async getUploadHistory(): Promise<UploadExtractionResult[]> {
    const res = await fetch('/api/upload/history');
    return handleResponse(res);
  },

  async getNasaLibrary(): Promise<{ documents: any[]; benchmarks: any }> {
    const res = await fetch('/api/nasa/library');
    return handleResponse(res);
  },

  async sendAssistantMessage(message: string, astronautId?: string): Promise<{
    text: string;
    citations: Array<{ title: string; docId: string; excerpt: string }>;
    relevantVitals?: { astronaut: string; indicator: string; value: string };
    isFallback: boolean;
  }> {
    const res = await fetch('/api/assistant/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, astronautId }),
    });
    return handleResponse(res);
  },

  getSampleDownloadUrl(type: 'csv' | 'json' | 'pdf'): string {
    return `/api/upload/sample/${type}`;
  }
};
