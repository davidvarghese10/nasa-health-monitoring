/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnomalyAlert, AnomalySeverity, AnomalyType, Astronaut, PhysiologicalRecord } from '../types';
import { IsolationForest } from './isolation_forest';

// Vector representation for Isolation Forest:
// [heartRate, bloodOxygen, systolicBP, diastolicBP, coreTemp, respiratoryRate, sleepDuration, radiationDosimeterRate]
export function recordToVector(r: PhysiologicalRecord): number[] {
  return [
    r.heartRate,
    r.bloodOxygen,
    r.systolicBP,
    r.diastolicBP,
    r.coreTemp,
    r.respiratoryRate,
    r.sleepDuration,
    r.radiationDosimeterRate,
  ];
}

export class AnomalyEngine {
  private iForest: IsolationForest;
  private isTrained: boolean = false;

  constructor() {
    this.iForest = new IsolationForest(80, 128);
  }

  trainModel(historicalRecords: PhysiologicalRecord[]) {
    if (historicalRecords.length < 10) return;
    const vectors = historicalRecords.map(recordToVector);
    this.iForest.fit(vectors);
    this.isTrained = true;
  }

  /**
   * Evaluate a single record against both machine learning (Isolation Forest)
   * and clinical spaceflight limits (NASA STD-3001).
   */
  evaluateRecord(
    record: PhysiologicalRecord,
    astronaut: Astronaut,
    recentHistory: PhysiologicalRecord[] = []
  ): AnomalyAlert[] {
    const alerts: AnomalyAlert[] = [];
    const vector = recordToVector(record);

    // 1. Unsupervised Machine Learning: Isolation Forest Score
    let mlAnomalyScore = 0.5;
    if (this.isTrained) {
      mlAnomalyScore = this.iForest.score(vector);
    } else if (recentHistory.length >= 10) {
      this.trainModel(recentHistory);
      mlAnomalyScore = this.iForest.score(vector);
    }

    // 2. Rolling Z-Score & Statistical Anomaly Check
    if (recentHistory.length >= 7) {
      const hrValues = recentHistory.map(r => r.heartRate);
      const avgHR = hrValues.reduce((a, b) => a + b, 0) / hrValues.length;
      const stdHR = Math.sqrt(hrValues.reduce((sq, n) => sq + Math.pow(n - avgHR, 2), 0) / hrValues.length) || 1;
      const zScoreHR = Math.abs((record.heartRate - avgHR) / stdHR);

      if (zScoreHR >= 3.0 && record.physicalActivityMet < 1.5) {
        alerts.push({
          id: `alert-stat-${record.astronautId}-${Date.now()}-hr`,
          astronautId: record.astronautId,
          astronautName: astronaut.name,
          indicator: "Resting Heart Rate",
          observedValue: record.heartRate,
          referenceBaseline: `${astronaut.baseline.restingHeartRate} bpm (Rolling Mean: ${avgHR.toFixed(1)} bpm)`,
          unit: "bpm",
          timestamp: record.timestamp,
          severity: record.heartRate > 115 ? "CRITICAL" : "MODERATE",
          type: "STATISTICAL_OUTLIER",
          anomalyScore: Math.min(0.95, 0.65 + zScoreHR * 0.08),
          reason: `Statistically significant deviation (Z-score: ${zScoreHR.toFixed(2)}σ) from astronaut's personal microgravity resting baseline during low metabolic activity.`,
          physiologicalMechanism: "Cardiovascular autonomic imbalance or compensatory response to reduced circulating plasma volume and cephalic fluid redistribution.",
          suggestedAction: "Conduct 12-lead ECG tele-auscultation, assess cabin fluid intake protocol, and cross-reference with CEVIS aerobic countermeasure compliance.",
          nasaStandardRef: "NASA-HRP-EV-CARDIO-2023 §3.2",
          isAcknowledged: false,
        });
      }
    }

    // 3. Clinical Rule-Based Checks (NASA-STD-3001 Space Flight Human-System Standard)
    // A. Hypoxemia / Peripheral Oxygen Desaturation
    if (record.bloodOxygen < 93) {
      const severity: AnomalySeverity = record.bloodOxygen < 90 ? "CRITICAL" : "MODERATE";
      alerts.push({
        id: `alert-spo2-${record.astronautId}-${Date.now()}`,
        astronautId: record.astronautId,
        astronautName: astronaut.name,
        indicator: "Blood Oxygen Saturation (SpO2)",
        observedValue: record.bloodOxygen,
        referenceBaseline: `≥ 95.0 % (Personal: ${astronaut.baseline.bloodOxygen} %)`,
        unit: "%",
        timestamp: record.timestamp,
        severity,
        type: "CLINICAL_RISK",
        anomalyScore: severity === "CRITICAL" ? 0.94 : 0.78,
        reason: `Peripheral oxygen saturation dropped below mandatory spaceflight safety limit (93.0%).`,
        physiologicalMechanism: "Potential ventilation-perfusion mismatch in microgravity, hypobaric hypoxia, or localized cabin atmosphere stratification with elevated localized carbon dioxide.",
        suggestedAction: "Verify cabin Environmental Control and Life Support System (ECLSS) ppO2/ppCO2 sensors immediately. Have crewmember reposition pulse oximeter probe and administer supplemental O2 if uncorrected within 5 minutes.",
        nasaStandardRef: "NASA-STD-3001-VOL-1B §4.3.1",
        isAcknowledged: false,
      });
    }

    // B. Core Body Temperature ('Space Fever' / Hyperthermia)
    if (record.coreTemp > 38.2 || record.coreTemp < 35.8) {
      const severity: AnomalySeverity = record.coreTemp > 38.6 ? "CRITICAL" : "MODERATE";
      alerts.push({
        id: `alert-temp-${record.astronautId}-${Date.now()}`,
        astronautId: record.astronautId,
        astronautName: astronaut.name,
        indicator: "Core Body Temperature",
        observedValue: Number(record.coreTemp.toFixed(2)),
        referenceBaseline: `36.5 - 37.8 °C (Personal: ${astronaut.baseline.coreTemp} °C)`,
        unit: "°C",
        timestamp: record.timestamp,
        severity,
        type: "CLINICAL_RISK",
        anomalyScore: severity === "CRITICAL" ? 0.91 : 0.73,
        reason: record.coreTemp > 38.2 ? `Resting core temperature exceeds microgravity thermoregulatory threshold.` : `Sub-nominal core temperature detected.`,
        physiologicalMechanism: "Microgravity eliminates convective sweat dissipation. Persistent core temperature elevation above 38.2°C indicates systemic inflammatory response, infection, or failed evaporative cooling post-exercise.",
        suggestedAction: "Monitor double-sensor heat flux readings, verify cabin ventilation airflow velocity (> 15 ft/min), and initiate thermal cooling garment protocol if symptomatically febrile.",
        nasaStandardRef: "NASA-STD-3001-VOL-1B §4.5",
        isAcknowledged: false,
      });
    }

    // C. Blood Pressure (Hypertensive / Hypotensive orthostatic drift)
    if (record.systolicBP >= 142 || record.systolicBP <= 90 || record.diastolicBP >= 92) {
      alerts.push({
        id: `alert-bp-${record.astronautId}-${Date.now()}`,
        astronautId: record.astronautId,
        astronautName: astronaut.name,
        indicator: "Arterial Blood Pressure",
        observedValue: `${record.systolicBP}/${record.diastolicBP}`,
        referenceBaseline: `100-130 / 65-85 mmHg (Personal: ${astronaut.baseline.systolicBP}/${astronaut.baseline.diastolicBP})`,
        unit: "mmHg",
        timestamp: record.timestamp,
        severity: (record.systolicBP > 150 || record.systolicBP < 85) ? "CRITICAL" : "MODERATE",
        type: "CLINICAL_RISK",
        anomalyScore: 0.75,
        reason: `Arterial blood pressure outside nominal microgravity adaptation envelope.`,
        physiologicalMechanism: "Cephalad venous congestion elevates upper-body arterial compliance strain, or post-diuresis hypovolemia induces orthostatic hypotension.",
        suggestedAction: "Conduct bilateral oscillometric check. Evaluate crewmember for Spaceflight-Associated Neuro-ocular Syndrome (SANS) signs or optic disc swelling.",
        nasaStandardRef: "NASA-TM-2022-00104 §2.1",
        isAcknowledged: false,
      });
    }

    // D. Radiation Dosimeter Rate Anomaly
    if (record.radiationDosimeterRate >= 950) {
      const severity: AnomalySeverity = record.radiationDosimeterRate >= 1400 ? "CRITICAL" : "MODERATE";
      alerts.push({
        id: `alert-rad-${record.astronautId}-${Date.now()}`,
        astronautId: record.astronautId,
        astronautName: astronaut.name,
        indicator: "Active Radiation Dosimetry",
        observedValue: Math.round(record.radiationDosimeterRate),
        referenceBaseline: `250 - 600 µSv/day (Baseline: ${astronaut.baseline.dailyRadiationRate} µSv/day)`,
        unit: "µSv/day",
        timestamp: record.timestamp,
        severity,
        type: "CLINICAL_RISK",
        anomalyScore: severity === "CRITICAL" ? 0.98 : 0.82,
        reason: `Dosimeter rate sharply elevated (${record.radiationDosimeterRate} µSv/day). Possible Solar Particle Event (SPE) precursor or enhanced South Atlantic Anomaly (SAA) geomagnetic storm pass.`,
        physiologicalMechanism: "Ionizing radiation creates cellular oxidative DNA double-strand breaks and acute hematopoietic depression if cumulative threshold is exceeded.",
        suggestedAction: "Direct crew to heavily shielded storm shelter module (Crew Quarters water-wall quadrant). Monitor real-time GOES/SWPC solar proton flux data.",
        nasaStandardRef: "NASA-TP-2015-218570 & NCRP-132",
        isAcknowledged: false,
      });
    }

    // E. Severe Sleep Deprivation / Circadian Fragmentation
    if (record.sleepDuration > 0 && record.sleepDuration < 4.8) {
      alerts.push({
        id: `alert-sleep-${record.astronautId}-${Date.now()}`,
        astronautId: record.astronautId,
        astronautName: astronaut.name,
        indicator: "Sleep Architecture & Duration",
        observedValue: Number(record.sleepDuration.toFixed(1)),
        referenceBaseline: `6.5 - 8.5 hrs (Personal: ${astronaut.baseline.sleepDuration} hrs)`,
        unit: "hrs",
        timestamp: record.timestamp,
        severity: "LOW",
        type: "STATISTICAL_OUTLIER",
        anomalyScore: 0.64,
        reason: `Total recorded sleep duration (< 4.8 hrs) falls critically below operational cognitive performance reserve.`,
        physiologicalMechanism: "Orbital circadian desynchronization, microgravity sleep tether discomfort, or ambient acoustic noise (> 60 dBA) disrupting slow-wave sleep cycles.",
        suggestedAction: "Adjust dynamic cabin lighting to 460nm circadian phase advance; review mission schedule to defer complex EVA or robotic arm operations until 8h recovery cycle is completed.",
        nasaStandardRef: "NASA-SP-2020-0193 §5.1",
        isAcknowledged: false,
      });
    }

    // 4. Multivariate Machine Learning Isolation Forest Alert (when ML flags pattern but no single threshold breached)
    if (mlAnomalyScore >= 0.68 && alerts.length === 0) {
      alerts.push({
        id: `alert-iforest-${record.astronautId}-${Date.now()}`,
        astronautId: record.astronautId,
        astronautName: astronaut.name,
        indicator: "Multivariate Physiological Drift",
        observedValue: `Score ${mlAnomalyScore.toFixed(3)}`,
        referenceBaseline: "Nominal iForest Score < 0.550",
        unit: "ML Score",
        timestamp: record.timestamp,
        severity: mlAnomalyScore >= 0.78 ? "MODERATE" : "LOW",
        type: "MULTIVARIATE_DRIFT",
        anomalyScore: Number(mlAnomalyScore.toFixed(3)),
        reason: `Unsupervised Isolation Forest algorithm detected anomalous multi-dimensional covariance pattern across cardiovascular, thermal, and respiratory telemetry despite individual parameters staying within nominal boundaries.`,
        physiologicalMechanism: "Subtle simultaneous shifts in respiratory rate, core temperature, and diastolic blood pressure indicating onset of physical fatigue or early subclinical autonomic compensation.",
        suggestedAction: "Increase telemetry polling frequency from 10s to 1s. Monitor next scheduled sleep cycle and resting metabolic rate.",
        nasaStandardRef: "NASA-HRP Exploration Medical System (ExMS) ML Architecture",
        isAcknowledged: false,
      });
    }

    return alerts;
  }
}
