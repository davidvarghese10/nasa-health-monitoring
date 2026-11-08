/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MissionRole = 'Flight Surgeon' | 'Mission Director' | 'Crew Astronaut' | 'Biomedical Analyst';

export interface UserProfile {
  id: string;
  name: string;
  role: MissionRole;
  callsign: string;
}

export type HealthStatus = 'NOMINAL' | 'ADVISORY' | 'CRITICAL' | 'EVALUATION';

export interface Astronaut {
  id: string;
  code: string;
  name: string;
  callsign: string;
  role: string;
  mission: string;
  age: number;
  sex: 'Female' | 'Male';
  evaHours: number;
  spaceflightDays: number;
  microgravityDay: number;
  status: HealthStatus;
  avatarUrl: string;
  baseline: {
    restingHeartRate: number; // bpm
    bloodOxygen: number; // %
    systolicBP: number; // mmHg
    diastolicBP: number; // mmHg
    coreTemp: number; // °C
    respiratoryRate: number; // br/min
    sleepDuration: number; // hrs
    dailyRadiationRate: number; // uSv/day
  };
  notes: string;
}

export interface PhysiologicalRecord {
  id: string;
  astronautId: string;
  timestamp: string; // ISO string
  heartRate: number; // bpm
  bloodOxygen: number; // %
  systolicBP: number; // mmHg
  diastolicBP: number; // mmHg
  coreTemp: number; // °C
  respiratoryRate: number; // br/min
  sleepDuration: number; // hrs
  sleepQuality: number; // 0 - 100%
  remSleepHours: number;
  deepSleepHours: number;
  physicalActivityMet: number; // METs
  exerciseDurationMin: number;
  radiationDosimeterRate: number; // uSv/day
  cabinCo2KPa: number; // kPa
  cabinPressureKPa: number; // kPa
  isSimulated?: boolean;
  isAnomaly?: boolean;
}

export type AnomalySeverity = 'LOW' | 'MODERATE' | 'CRITICAL';
export type AnomalyType = 'STATISTICAL_OUTLIER' | 'CLINICAL_RISK' | 'MULTIVARIATE_DRIFT' | 'SENSOR_INTERMITTENT';

export interface AnomalyAlert {
  id: string;
  astronautId: string;
  astronautName: string;
  indicator: string;
  observedValue: number | string;
  referenceBaseline: string;
  unit: string;
  timestamp: string;
  severity: AnomalySeverity;
  type: AnomalyType;
  anomalyScore: number; // 0.0 to 1.0 (Isolation Forest or ML score)
  reason: string;
  physiologicalMechanism: string;
  suggestedAction: string;
  nasaStandardRef: string;
  isAcknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  notes?: string;
}

export interface ExtractedTableColumn {
  key: string;
  label: string;
  unit: string;
}

export interface UploadExtractionResult {
  fileId: string;
  fileName: string;
  fileType: 'csv' | 'json' | 'pdf';
  fileSize: number;
  uploadedAt: string;
  astronautId: string;
  status: 'PENDING_VERIFICATION' | 'COMMITTED' | 'REJECTED';
  extractedRecordsCount: number;
  validationErrorsCount: number;
  records: Array<{
    timestamp: string;
    heartRate: number;
    bloodOxygen: number;
    systolicBP: number;
    diastolicBP: number;
    coreTemp: number;
    respiratoryRate: number;
    sleepDuration: number;
    radiationDosimeterRate: number;
    validationStatus: 'VALID' | 'OUT_OF_BOUNDS' | 'WARNING';
    notes?: string;
  }>;
  documentMetadata?: {
    documentTitle?: string;
    protocol?: string;
    sourceFacility?: string;
    extractionConfidence?: number;
  };
}

export interface SimulationState {
  isRunning: boolean;
  tickIntervalSec: number;
  activeAnomalyScenario: string | null;
  lastTickTimestamp: string;
}

export interface MissionOverviewData {
  missionId: string;
  missionName: string;
  missionElapsedTime: string; // MET
  totalCrew: number;
  overallStatus: HealthStatus;
  nominalCrewCount: number;
  advisoryCrewCount: number;
  criticalCrewCount: number;
  activeAlertsCount: number;
  totalTelemetryPoints: number;
  avgHeartRate: number;
  avgBloodOxygen: number;
  avgSleepDuration: number;
  avgRadiationDose: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: Array<{
    title: string;
    docId: string;
    url?: string;
    excerpt: string;
  }>;
  relevantVitals?: {
    astronaut: string;
    indicator: string;
    value: string;
  };
  isFallback?: boolean;
}
