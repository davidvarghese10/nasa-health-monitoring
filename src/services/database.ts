/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { AnomalyAlert, Astronaut, MissionOverviewData, PhysiologicalRecord, SimulationState, UploadExtractionResult, UserProfile } from '../types';
import { AnomalyEngine } from './anomaly_engine';

const DB_FILE_PATH = path.resolve(process.cwd(), 'astra_database.json');

export const INITIAL_ASTRONAUTS: Astronaut[] = [
  {
    id: "ASTRO-01",
    code: "CDR-ROSTOVA",
    name: "Elena Rostova",
    callsign: "Valkyrie",
    role: "Commander & Lead EVA Specialist",
    mission: "Artemis VII Orbital Habitat (Expedition 74)",
    age: 41,
    sex: "Female",
    evaHours: 38.5,
    spaceflightDays: 284,
    microgravityDay: 142,
    status: "ADVISORY",
    avatarUrl: "/src/assets/images/astronaut_elena_1794153633118.jpg",
    baseline: {
      restingHeartRate: 62,
      bloodOxygen: 98.2,
      systolicBP: 118,
      diastolicBP: 74,
      coreTemp: 37.15,
      respiratoryRate: 14.2,
      sleepDuration: 7.2,
      dailyRadiationRate: 320,
    },
    notes: "Demonstrates high microgravity cardiovascular tolerance. Experienced transient nocturnal SpO2 dip on Sol 141 during ECLSS Node-2 filter replacement. Prescribed 2.5h daily CEVIS/ARED countermeasure protocol."
  },
  {
    id: "ASTRO-02",
    code: "MS-CHEN",
    name: "Alex Chen",
    callsign: "Atlas",
    role: "Mission Specialist & Flight Systems Engineer",
    mission: "Artemis VII Orbital Habitat (Expedition 74)",
    age: 37,
    sex: "Male",
    evaHours: 24.0,
    spaceflightDays: 142,
    microgravityDay: 142,
    status: "NOMINAL",
    avatarUrl: "/src/assets/images/astronaut_alex_1794153633409.jpg",
    baseline: {
      restingHeartRate: 66,
      bloodOxygen: 98.5,
      systolicBP: 116,
      diastolicBP: 72,
      coreTemp: 37.05,
      respiratoryRate: 14.0,
      sleepDuration: 6.8,
      dailyRadiationRate: 315,
    },
    notes: "First long-duration mission. Completed neurovestibular motion sickness adaptation without pharmacological antiemetics. Excellent exercise countermeasure compliance."
  },
  {
    id: "ASTRO-03",
    code: "FE-VANCE",
    name: "Dr. Marcus Vance",
    callsign: "Kepler",
    role: "Flight Engineer & Crew Medical Officer",
    mission: "Artemis VII Orbital Habitat (Expedition 74)",
    age: 44,
    sex: "Male",
    evaHours: 42.0,
    spaceflightDays: 365,
    microgravityDay: 142,
    status: "NOMINAL",
    avatarUrl: "/src/assets/images/astronaut_marcus_1794153633019.jpg",
    baseline: {
      restingHeartRate: 58,
      bloodOxygen: 98.0,
      systolicBP: 122,
      diastolicBP: 76,
      coreTemp: 37.20,
      respiratoryRate: 13.5,
      sleepDuration: 7.4,
      dailyRadiationRate: 330,
    },
    notes: "Expedition 74 Crew Medical Officer (CMO). Tracks cephalad fluid shift via ultrasound jugular vein dimension protocols. Mild circadian phase delay observed due to night-shift Earth ground link tele-operations."
  }
];

export const CURRENT_USER: UserProfile = {
  id: "USR-0842",
  name: "Dr. Sarah Vance, MD, MPH",
  role: "Flight Surgeon",
  callsign: "Houston-Surgeon",
};

export interface AstraDatabaseState {
  version: string;
  mission: MissionOverviewData;
  astronauts: Astronaut[];
  telemetry: Record<string, PhysiologicalRecord[]>; // astronautId -> records
  alerts: AnomalyAlert[];
  uploads: UploadExtractionResult[];
  simulation: SimulationState;
}

// Generate 30 days of baseline realistic telemetry with natural diurnal oscillations
function generateHistoricalTelemetry(astronaut: Astronaut): PhysiologicalRecord[] {
  const records: PhysiologicalRecord[] = [];
  const now = new Date("2026-11-08T07:50:00Z").getTime();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const intervalMs = 2 * 60 * 60 * 1000; // record every 2 hours

  for (let t = now - thirtyDaysMs; t <= now; t += intervalMs) {
    const date = new Date(t);
    const hour = date.getUTCHours();
    const isSleepHour = hour >= 22 || hour < 6;
    const isExerciseHour = hour === 10 || hour === 15;

    // Diurnal variation: lower HR/temp/BP at night, peaks during daytime
    const hrNoise = (Math.random() - 0.5) * 4;
    const bpNoise = (Math.random() - 0.5) * 4;
    const tempNoise = (Math.random() - 0.5) * 0.15;
    const spo2Noise = (Math.random() - 0.5) * 0.4;

    let heartRate = astronaut.baseline.restingHeartRate + hrNoise;
    let systolicBP = astronaut.baseline.systolicBP + bpNoise;
    let diastolicBP = astronaut.baseline.diastolicBP + (bpNoise * 0.6);
    let coreTemp = astronaut.baseline.coreTemp + tempNoise;
    let bloodOxygen = astronaut.baseline.bloodOxygen + spo2Noise;
    let respiratoryRate = astronaut.baseline.respiratoryRate + (Math.random() - 0.5) * 1.5;
    let activityMet = 1.2;
    let sleepDuration = 0;
    let sleepQuality = 0;
    let remHours = 0;
    let deepHours = 0;

    if (isSleepHour) {
      heartRate -= 8;
      systolicBP -= 8;
      diastolicBP -= 5;
      coreTemp -= 0.35;
      respiratoryRate -= 1.8;
      activityMet = 0.9;
      if (hour === 5) {
        // Daily sleep summary logged at waking
        sleepDuration = astronaut.baseline.sleepDuration + (Math.random() - 0.5) * 0.8;
        sleepQuality = Math.min(100, Math.max(60, 82 + (Math.random() - 0.5) * 18));
        remHours = sleepDuration * 0.22;
        deepHours = sleepDuration * 0.20;
      }
    } else if (isExerciseHour) {
      heartRate += 55 + Math.random() * 20;
      systolicBP += 24;
      coreTemp += 0.75;
      respiratoryRate += 9;
      bloodOxygen = Math.min(99.5, bloodOxygen - 0.8);
      activityMet = 6.8 + Math.random() * 1.5;
    }

    // Radiation fluctuates with orbital inclination and SAA passes
    const inSaaPass = Math.sin(t / (90 * 60 * 1000)) > 0.85;
    const radiationDosimeterRate = inSaaPass ? astronaut.baseline.dailyRadiationRate * 1.8 : astronaut.baseline.dailyRadiationRate + (Math.random() - 0.5) * 30;

    // Clamp to valid physical ranges
    bloodOxygen = Math.min(100, Math.max(90, bloodOxygen));

    records.push({
      id: `rec-${astronaut.id}-${t}`,
      astronautId: astronaut.id,
      timestamp: date.toISOString(),
      heartRate: Number(heartRate.toFixed(1)),
      bloodOxygen: Number(bloodOxygen.toFixed(1)),
      systolicBP: Math.round(systolicBP),
      diastolicBP: Math.round(diastolicBP),
      coreTemp: Number(coreTemp.toFixed(2)),
      respiratoryRate: Number(respiratoryRate.toFixed(1)),
      sleepDuration: Number(sleepDuration.toFixed(1)),
      sleepQuality: Math.round(sleepQuality),
      remSleepHours: Number(remHours.toFixed(1)),
      deepSleepHours: Number(deepHours.toFixed(1)),
      physicalActivityMet: Number(activityMet.toFixed(1)),
      exerciseDurationMin: isExerciseHour ? 45 : 0,
      radiationDosimeterRate: Number(radiationDosimeterRate.toFixed(1)),
      cabinCo2KPa: 0.32,
      cabinPressureKPa: 101.3,
      isSimulated: true,
      isAnomaly: false,
    });
  }

  // Intentionally inject realistic anomalies for CDR Elena Rostova (ASTRO-01) for demonstration
  if (astronaut.id === "ASTRO-01") {
    // 1. Hypoxia event 6 hours ago
    const hypoxiaIndex = records.length - 3;
    if (hypoxiaIndex >= 0) {
      records[hypoxiaIndex].bloodOxygen = 91.8;
      records[hypoxiaIndex].respiratoryRate = 19.5;
      records[hypoxiaIndex].heartRate = 88.0;
      records[hypoxiaIndex].isAnomaly = true;
    }
  }

  return records;
}

export class DatabaseService {
  private state: AstraDatabaseState;
  private anomalyEngine: AnomalyEngine;

  constructor() {
    this.anomalyEngine = new AnomalyEngine();
    this.state = this.loadDatabase();
    this.trainModels();
  }

  private initDefaultState(): AstraDatabaseState {
    const telemetry: Record<string, PhysiologicalRecord[]> = {};
    for (const a of INITIAL_ASTRONAUTS) {
      telemetry[a.id] = generateHistoricalTelemetry(a);
    }

    const mission: MissionOverviewData = {
      missionId: "ARTEMIS-VII-EXP74",
      missionName: "Artemis VII Deep Space Orbital Habitat",
      missionElapsedTime: "MET 142:18:44:12",
      totalCrew: 3,
      overallStatus: "ADVISORY",
      nominalCrewCount: 2,
      advisoryCrewCount: 1,
      criticalCrewCount: 0,
      activeAlertsCount: 1,
      totalTelemetryPoints: Object.values(telemetry).reduce((acc, cur) => acc + cur.length, 0),
      avgHeartRate: 67.4,
      avgBloodOxygen: 97.8,
      avgSleepDuration: 7.1,
      avgRadiationDose: 322,
    };

    const initialAlerts: AnomalyAlert[] = [
      {
        id: "alert-init-01",
        astronautId: "ASTRO-01",
        astronautName: "Elena Rostova",
        indicator: "Blood Oxygen Saturation (SpO2)",
        observedValue: 91.8,
        referenceBaseline: "≥ 95.0 % (Personal: 98.2 %)",
        unit: "%",
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        severity: "MODERATE",
        type: "CLINICAL_RISK",
        anomalyScore: 0.79,
        reason: "Peripheral oxygen saturation dipped below NASA STD-3001 safety envelope (93.0%) during Node-2 ECLSS maintenance cycle.",
        physiologicalMechanism: "Transient ventilation-perfusion shift or localized carbon dioxide micro-pocketing around maintenance rack.",
        suggestedAction: "Flight surgeon confirmed cabin atmosphere scrubber realignment. Pulse oximetry normalized to 98.0%. Continue continuous SpO2 monitoring for next 12 hours.",
        nasaStandardRef: "NASA-STD-3001-VOL-1B §4.3.1",
        isAcknowledged: false,
      }
    ];

    return {
      version: "1.0.0",
      mission,
      astronauts: INITIAL_ASTRONAUTS,
      telemetry,
      alerts: initialAlerts,
      uploads: [],
      simulation: {
        isRunning: true,
        tickIntervalSec: 10,
        activeAnomalyScenario: null,
        lastTickTimestamp: new Date().toISOString(),
      }
    };
  }

  private loadDatabase(): AstraDatabaseState {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.astronauts && parsed.telemetry) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn("Failed to load existing database, re-initializing:", err);
    }
    const def = this.initDefaultState();
    this.saveDatabase(def);
    return def;
  }

  private saveDatabase(state: AstraDatabaseState = this.state) {
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(state, null, 2), 'utf-8');
    } catch (err) {
      console.error("Error saving database to file:", err);
    }
  }

  private trainModels() {
    for (const a of this.state.astronauts) {
      const records = this.state.telemetry[a.id] || [];
      if (records.length >= 10) {
        this.anomalyEngine.trainModel(records);
      }
    }
  }

  // --- Read Operations ---
  getMissionOverview(): MissionOverviewData {
    const activeAlerts = this.state.alerts.filter(a => !a.isAcknowledged);
    const advisoryCount = this.state.astronauts.filter(a => a.status === 'ADVISORY').length;
    const criticalCount = this.state.astronauts.filter(a => a.status === 'CRITICAL').length;
    const nominalCount = this.state.astronauts.length - advisoryCount - criticalCount;

    return {
      ...this.state.mission,
      activeAlertsCount: activeAlerts.length,
      advisoryCrewCount: advisoryCount,
      criticalCrewCount: criticalCount,
      nominalCrewCount: nominalCount,
      overallStatus: criticalCount > 0 ? 'CRITICAL' : advisoryCount > 0 ? 'ADVISORY' : 'NOMINAL',
      totalTelemetryPoints: Object.values(this.state.telemetry).reduce((acc, cur) => acc + cur.length, 0),
    };
  }

  getAstronauts(): Astronaut[] {
    return this.state.astronauts;
  }

  getAstronaut(id: string): Astronaut | undefined {
    return this.state.astronauts.find(a => a.id === id);
  }

  getTelemetry(astronautId: string, limit: number = 200): PhysiologicalRecord[] {
    const records = this.state.telemetry[astronautId] || [];
    return records.slice(-limit);
  }

  getAlerts(includeResolved: boolean = true): AnomalyAlert[] {
    if (includeResolved) {
      return [...this.state.alerts].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    return this.state.alerts
      .filter(a => !a.isAcknowledged)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  getUploads(): UploadExtractionResult[] {
    return this.state.uploads;
  }

  getSimulationState(): SimulationState {
    return this.state.simulation;
  }

  // --- Write Operations ---
  acknowledgeAlert(alertId: string, user: UserProfile, notes?: string): AnomalyAlert | null {
    const alert = this.state.alerts.find(a => a.id === alertId);
    if (!alert) return null;

    alert.isAcknowledged = true;
    alert.acknowledgedBy = `${user.name} (${user.role})`;
    alert.acknowledgedAt = new Date().toISOString();
    if (notes) {
      alert.notes = notes;
    }

    // Check if astronaut status can be cleared back to NOMINAL
    const pendingForAstronaut = this.state.alerts.filter(a => a.astronautId === alert.astronautId && !a.isAcknowledged);
    if (pendingForAstronaut.length === 0) {
      const astronaut = this.state.astronauts.find(a => a.id === alert.astronautId);
      if (astronaut) {
        astronaut.status = "NOMINAL";
      }
    }

    this.saveDatabase();
    return alert;
  }

  addUploadedDataset(upload: UploadExtractionResult) {
    this.state.uploads.unshift(upload);
    this.saveDatabase();
  }

  commitUploadedRecords(fileId: string): { success: boolean; committedCount: number } {
    const upload = this.state.uploads.find(u => u.fileId === fileId);
    if (!upload || upload.status === 'COMMITTED') {
      return { success: false, committedCount: 0 };
    }

    const astronaut = this.getAstronaut(upload.astronautId);
    if (!astronaut) {
      return { success: false, committedCount: 0 };
    }

    const validRecords = upload.records.filter(r => r.validationStatus === 'VALID' || r.validationStatus === 'WARNING');
    const newPhysioRecords: PhysiologicalRecord[] = validRecords.map((r, idx) => ({
      id: `up-rec-${upload.astronautId}-${Date.now()}-${idx}`,
      astronautId: upload.astronautId,
      timestamp: r.timestamp,
      heartRate: r.heartRate,
      bloodOxygen: r.bloodOxygen,
      systolicBP: r.systolicBP,
      diastolicBP: r.diastolicBP,
      coreTemp: r.coreTemp,
      respiratoryRate: r.respiratoryRate,
      sleepDuration: r.sleepDuration,
      sleepQuality: 80,
      remSleepHours: r.sleepDuration * 0.22,
      deepSleepHours: r.sleepDuration * 0.20,
      physicalActivityMet: 1.5,
      exerciseDurationMin: 0,
      radiationDosimeterRate: r.radiationDosimeterRate,
      cabinCo2KPa: 0.32,
      cabinPressureKPa: 101.3,
      isSimulated: false,
      isAnomaly: false,
    }));

    if (!this.state.telemetry[upload.astronautId]) {
      this.state.telemetry[upload.astronautId] = [];
    }

    this.state.telemetry[upload.astronautId].push(...newPhysioRecords);
    // Sort chronologically
    this.state.telemetry[upload.astronautId].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Run anomaly detection on newly committed records
    for (const rec of newPhysioRecords) {
      const detected = this.anomalyEngine.evaluateRecord(rec, astronaut, this.state.telemetry[upload.astronautId]);
      if (detected.length > 0) {
        rec.isAnomaly = true;
        this.state.alerts.push(...detected);
        if (detected.some(d => d.severity === 'CRITICAL')) {
          astronaut.status = 'CRITICAL';
        } else if (astronaut.status !== 'CRITICAL') {
          astronaut.status = 'ADVISORY';
        }
      }
    }

    upload.status = 'COMMITTED';
    this.saveDatabase();
    return { success: true, committedCount: newPhysioRecords.length };
  }

  // Simulation Controls: Start, Pause, Reset, Step, Inject Anomaly
  setSimulationRunning(running: boolean) {
    this.state.simulation.isRunning = running;
    this.saveDatabase();
    return this.state.simulation;
  }

  injectSimulationAnomaly(astronautId: string, anomalyType: 'hypoxia' | 'tachycardia' | 'radiation' | 'fever' | 'drift') {
    const astronaut = this.getAstronaut(astronautId);
    if (!astronaut) return null;

    const now = new Date();
    const lastRecord = this.getTelemetry(astronautId, 1)[0] || {
      heartRate: astronaut.baseline.restingHeartRate,
      bloodOxygen: astronaut.baseline.bloodOxygen,
      systolicBP: astronaut.baseline.systolicBP,
      diastolicBP: astronaut.baseline.diastolicBP,
      coreTemp: astronaut.baseline.coreTemp,
      respiratoryRate: astronaut.baseline.respiratoryRate,
      radiationDosimeterRate: astronaut.baseline.dailyRadiationRate,
    };

    let hr = lastRecord.heartRate;
    let spo2 = lastRecord.bloodOxygen;
    let sys = lastRecord.systolicBP;
    let dia = lastRecord.diastolicBP;
    let temp = lastRecord.coreTemp;
    let resp = lastRecord.respiratoryRate;
    let rad = lastRecord.radiationDosimeterRate;

    switch (anomalyType) {
      case 'hypoxia':
        spo2 = 91.2;
        resp = 21.0;
        hr += 16;
        break;
      case 'tachycardia':
        hr = 124.0;
        sys += 18;
        break;
      case 'radiation':
        rad = 1280.0;
        break;
      case 'fever':
        temp = 38.45;
        hr += 18;
        break;
      case 'drift':
        // subtle multi-variate drift
        hr += 10;
        resp += 3;
        dia += 8;
        temp += 0.4;
        break;
    }

    const anomalousRecord: PhysiologicalRecord = {
      id: `sim-anomaly-${astronautId}-${now.getTime()}`,
      astronautId,
      timestamp: now.toISOString(),
      heartRate: Number(hr.toFixed(1)),
      bloodOxygen: Number(spo2.toFixed(1)),
      systolicBP: Math.round(sys),
      diastolicBP: Math.round(dia),
      coreTemp: Number(temp.toFixed(2)),
      respiratoryRate: Number(resp.toFixed(1)),
      sleepDuration: 0,
      sleepQuality: 0,
      remSleepHours: 0,
      deepSleepHours: 0,
      physicalActivityMet: 1.4,
      exerciseDurationMin: 0,
      radiationDosimeterRate: Number(rad.toFixed(1)),
      cabinCo2KPa: 0.38,
      cabinPressureKPa: 101.3,
      isSimulated: true,
      isAnomaly: true,
    };

    this.state.telemetry[astronautId].push(anomalousRecord);
    const alerts = this.anomalyEngine.evaluateRecord(anomalousRecord, astronaut, this.state.telemetry[astronautId]);
    this.state.alerts.unshift(...alerts);

    if (alerts.some(a => a.severity === 'CRITICAL')) {
      astronaut.status = 'CRITICAL';
    } else if (alerts.length > 0) {
      astronaut.status = 'ADVISORY';
    }

    this.state.simulation.activeAnomalyScenario = anomalyType;
    this.saveDatabase();
    return { record: anomalousRecord, alerts };
  }

  tickSimulation() {
    const now = new Date();
    this.state.simulation.lastTickTimestamp = now.toISOString();

    for (const astronaut of this.state.astronauts) {
      const records = this.state.telemetry[astronaut.id] || [];
      const last = records[records.length - 1];
      if (!last) continue;

      // Realistic random walk with mean reversion to astronaut baseline
      const hrDrift = (astronaut.baseline.restingHeartRate - last.heartRate) * 0.15 + (Math.random() - 0.5) * 2.2;
      const spo2Drift = (astronaut.baseline.bloodOxygen - last.bloodOxygen) * 0.15 + (Math.random() - 0.5) * 0.3;
      const tempDrift = (astronaut.baseline.coreTemp - last.coreTemp) * 0.15 + (Math.random() - 0.5) * 0.05;
      const respDrift = (astronaut.baseline.respiratoryRate - last.respiratoryRate) * 0.15 + (Math.random() - 0.5) * 0.8;
      const bpDrift = (astronaut.baseline.systolicBP - last.systolicBP) * 0.15 + (Math.random() - 0.5) * 1.8;
      const radDrift = (astronaut.baseline.dailyRadiationRate - last.radiationDosimeterRate) * 0.15 + (Math.random() - 0.5) * 12.0;

      const newRecord: PhysiologicalRecord = {
        id: `sim-tick-${astronaut.id}-${now.getTime()}`,
        astronautId: astronaut.id,
        timestamp: now.toISOString(),
        heartRate: Number((last.heartRate + hrDrift).toFixed(1)),
        bloodOxygen: Number(Math.min(100, Math.max(92, last.bloodOxygen + spo2Drift)).toFixed(1)),
        systolicBP: Math.round(last.systolicBP + bpDrift),
        diastolicBP: Math.round(last.diastolicBP + bpDrift * 0.55),
        coreTemp: Number((last.coreTemp + tempDrift).toFixed(2)),
        respiratoryRate: Number((last.respiratoryRate + respDrift).toFixed(1)),
        sleepDuration: 0,
        sleepQuality: 0,
        remSleepHours: 0,
        deepSleepHours: 0,
        physicalActivityMet: 1.3,
        exerciseDurationMin: 0,
        radiationDosimeterRate: Number((last.radiationDosimeterRate + radDrift).toFixed(1)),
        cabinCo2KPa: 0.32,
        cabinPressureKPa: 101.3,
        isSimulated: true,
        isAnomaly: false,
      };

      records.push(newRecord);
      if (records.length > 500) {
        records.shift(); // Keep bounded memory
      }

      // Check for anomalies
      const detected = this.anomalyEngine.evaluateRecord(newRecord, astronaut, records);
      if (detected.length > 0) {
        newRecord.isAnomaly = true;
        this.state.alerts.unshift(...detected);
        if (detected.some(d => d.severity === 'CRITICAL')) {
          astronaut.status = 'CRITICAL';
        } else if (astronaut.status !== 'CRITICAL') {
          astronaut.status = 'ADVISORY';
        }
      }
    }

    this.saveDatabase();
  }

  resetSimulation() {
    this.state = this.initDefaultState();
    this.saveDatabase();
    return this.state;
  }
}

export const dbService = new DatabaseService();
