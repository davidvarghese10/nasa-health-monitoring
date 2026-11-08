/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface NasaDocument {
  id: string;
  code: string;
  title: string;
  publicationYear: number;
  organization: string;
  category: 'Cardiovascular' | 'Sleep & Circadian' | 'Radiation' | 'Standards & Limits' | 'Neurovestibular';
  summary: string;
  keyFindings: string[];
  clinicalRelevance: string;
  standardLimits: Record<string, { min: number; max: number; unit: string; caveat?: string }>;
}

export const NASA_SCIENTIFIC_LIBRARY: NasaDocument[] = [
  {
    id: "nasa-hrp-cardio",
    code: "NASA-HRP-EV-CARDIO-2023",
    title: "NASA Human Research Program Evidence Book: Risk of Cardiovascular Alterations in Microgravity",
    publicationYear: 2023,
    organization: "NASA Johnson Space Center / Human Research Program",
    category: "Cardiovascular",
    summary: "Comprehensive synthesis of cardiovascular adaptations occurring in low-Earth orbit and lunar transit, including cephalad fluid redistribution (~1.5 to 2.0 L shift toward the upper body), baroreceptor reflex resetting, resting stroke volume alterations, and post-flight orthostatic intolerance.",
    keyFindings: [
      "Immediate headward shift of venous volume occurs upon entry into microgravity, increasing central venous pressure acutely followed by compensatory diuresis and reduced plasma volume by 10-15%.",
      "Resting heart rate in flight remains within 55-90 bpm; transient tachycardia above 105 bpm during non-exercise periods suggests autonomic stress, elevated cabin CO2, or dehydration.",
      "Blood pressure typically exhibits lower diastolic pressure and altered pulse pressure due to decreased systemic vascular resistance in microgravity.",
      "Aerobic exercise countermeasure compliance (T2 treadmill, CEVIS cycle ergometer, ARED resistive exercise) is critical to preserving cardiac left ventricular mass."
    ],
    clinicalRelevance: "Differentiates physiological microgravity adaptation (cephalad fluid shift, mild nocturnal bradycardia) from true cardiovascular pathology requiring clinical intervention.",
    standardLimits: {
      restingHeartRate: { min: 50, max: 95, unit: "bpm", caveat: "In-flight resting baseline typically shifts 5-10 bpm higher during early adaptation (flight days 1-14)." },
      systolicBP: { min: 95, max: 135, unit: "mmHg", caveat: "Slight downward drift observed after plasma volume equilibration." },
      diastolicBP: { min: 60, max: 88, unit: "mmHg" }
    }
  },
  {
    id: "nasa-std-3001",
    code: "NASA-STD-3001-VOL-1B",
    title: "NASA Space Flight Human-System Standard: Volume 1, Crew Health",
    publicationYear: 2024,
    organization: "NASA Office of the Chief Health and Medical Officer",
    category: "Standards & Limits",
    summary: "Mandatory standard establishing physiological, medical, environmental, and behavioral health requirements for crewmembers on all NASA human spaceflight missions.",
    keyFindings: [
      "Peripheral oxygen saturation (SpO2) must remain ≥ 95% at nominal cabin pressures (101.3 kPa / 14.7 psi). Values below 92% represent an acute hypoxia threshold requiring immediate atmosphere verification.",
      "Core body temperature in astronauts exhibits a persistent elevation of ~0.8°C ('space fever') during resting and exercise conditions due to impaired convective and evaporative heat dissipation in microgravity.",
      "Respiratory rates must remain within 12-20 breaths per minute. Tachypnea (> 22 br/min) combined with elevated cabin ppCO2 indicates hypercapnic respiratory drive.",
      "Daily active monitoring must be combined with weekly clinical reviews by designated Flight Surgeons."
    ],
    clinicalRelevance: "Serves as the primary operational criteria for alert thresholds and flight surgeon intervention protocols.",
    standardLimits: {
      bloodOxygen: { min: 94, max: 100, unit: "%", caveat: "SpO2 < 93% requires secondary cross-validation; SpO2 < 90% triggers automated cabin air re-scrub." },
      coreTemp: { min: 36.4, max: 37.8, unit: "°C", caveat: "Resting baseline elevated ~0.8°C higher in microgravity compared to terrestrial norms." },
      respiratoryRate: { min: 11, max: 20, unit: "breaths/min" },
      cabinCo2: { min: 0.0, max: 0.4, unit: "kPa", caveat: "Cabin ppCO2 exceeding 0.4 kPa correlates with crew headaches and sleep disruption." }
    }
  },
  {
    id: "nasa-circadian-sleep",
    code: "NASA-SP-2020-0193",
    title: "Circadian Desynchronization and Sleep Architecture Degradation in Spaceflight",
    publicationYear: 2022,
    organization: "NASA Ames Research Center / Behavioral Health & Performance",
    category: "Sleep & Circadian",
    summary: "Investigation into the disruption of human circadian biology caused by orbital flight (16 sunrises/sunsets every 24 hours), ambient acoustics, and microgravity sleep posture.",
    keyFindings: [
      "Astronauts average 6.0 to 6.4 hours of sleep per night, significantly below the operational requirement of 8.0 hours.",
      "Rapid eye movement (REM) and slow-wave (deep Stage 3/4) sleep are disproportionately compressed, contributing to cumulative cognitive fatigue.",
      "Sleep quality scores below 65% for three consecutive mission sols correlate with a 34% increase in procedural error frequency.",
      "Dynamic lighting schedules (460 nm blue-enriched light for waking, melatonin-sparing red-shifted light for sleep preparation) mitigate phase shifts."
    ],
    clinicalRelevance: "Provides evidence-based baselines for diagnosing sleep fragmentation, cumulative sleep deficit, and scheduling cognitive rest periods.",
    standardLimits: {
      sleepDuration: { min: 6.5, max: 9.0, unit: "hours/night", caveat: "Operational threshold: < 6.0 hrs for >2 consecutive days triggers advisory." },
      deepSleepRatio: { min: 15, max: 28, unit: "% of total sleep" },
      remSleepRatio: { min: 18, max: 26, unit: "% of total sleep" }
    }
  },
  {
    id: "nasa-radiation-dosimetry",
    code: "NASA-TP-2015-218570",
    title: "Space Radiation Bio-Dosimetry and Risk Assessment for Exploration Missions",
    publicationYear: 2021,
    organization: "NASA Space Radiation Analysis Group (SRAG)",
    category: "Radiation",
    summary: "Radiation safety standards, galactic cosmic ray (GCR) exposure models, solar particle event (SPE) mitigation, and active dosimeter thresholds in low-Earth orbit and cislunar space.",
    keyFindings: [
      "Nominal LEO background dose rate ranges from 200 to 500 µSv/day depending on solar cycle modulation and South Atlantic Anomaly (SAA) transit passes.",
      "Short-term operational limit for 30-day missions is 250 mSv (blood-forming organs), with daily advisory alert set at > 1,200 µSv/day to detect anomalous SPE precursors.",
      "Bio-dosimetry must track both active silicon pixel detectors (Crew Personal Active Dosimeter - CPAD) and passive thermoluminescent detectors (TLDs).",
      "Synergistic effects of microgravity immune dysregulation and chronic low-dose ion radiation require vigilant white-blood-cell and temperature trend tracking."
    ],
    clinicalRelevance: "Establishes exposure limits and automatic alert triggers for crew radiation defense.",
    standardLimits: {
      dailyRadiationRate: { min: 150, max: 800, unit: "µSv/day", caveat: "> 1,000 µSv/day triggers Solar Particle Event advisory." }
    }
  },
  {
    id: "nasa-sans-fluid-shifts",
    code: "NASA-TM-2022-00104",
    title: "Spaceflight-Associated Neuro-ocular Syndrome (SANS) & Cephalad Venous Engorgement",
    publicationYear: 2022,
    organization: "NASA Johnson Space Center / Space Medicine Operations",
    category: "Neurovestibular",
    summary: "Investigation into optic disc edema, globe flattening, choroidal folds, and hyperopic refractive shifts associated with long-duration microgravity headward fluid translocation.",
    keyFindings: [
      "Loss of gravitational hydrostatic gradient results in sustained elevation of internal jugular venous pressure and cephalad interstitial fluid accumulation.",
      "Systolic/diastolic arterial pressures measured in the brachial artery show altered compliance, with elevated central venous pressure persisting for duration of mission.",
      "Early indicators include subtle changes in ocular perfusion pressure, facial edema, and increased resting heart rate variability during quiet wakefulness.",
      "Lower Body Negative Pressure (LBNP) protocols are under active evaluation as a countermeasure to draw fluids back to caudal compartments."
    ],
    clinicalRelevance: "Crucial for explaining to astronauts why upper body blood pressure readings and cephalic fluid measurements behave differently in orbit without indicating terrestrial hypertension.",
    standardLimits: {
      systolicBP: { min: 90, max: 135, unit: "mmHg" },
      diastolicBP: { min: 60, max: 85, unit: "mmHg" }
    }
  }
];

export const NASA_PHYSIOLOGICAL_BENCHMARKS = {
  heartRate: {
    name: "Heart Rate",
    unit: "bpm",
    earthRestingRange: [60, 80],
    microgravityRestingRange: [58, 92],
    criticalLow: 45,
    criticalHigh: 110,
    samplingFrequency: "1 Hz continuous / 10s aggregated",
    physiologicalSignificance: "Key metric for autonomic tone, cardiac work, aerobic deconditioning, and stress reaction."
  },
  bloodOxygen: {
    name: "Blood Oxygen Saturation (SpO2)",
    unit: "%",
    earthRestingRange: [96, 99],
    microgravityRestingRange: [95, 99],
    criticalLow: 91,
    criticalHigh: 100,
    samplingFrequency: "Photoplethysmography continuous",
    physiologicalSignificance: "Immediate indicator of gas exchange efficacy, cabin hypobaric hypoxia, and pulmonary ventilation-perfusion matching."
  },
  bloodPressure: {
    name: "Blood Pressure (Systolic / Diastolic)",
    unit: "mmHg",
    earthRestingRange: [110, 120, 70, 80], // sys min, sys max, dia min, dia max
    microgravityRestingRange: [100, 130, 62, 85],
    criticalSystolicHigh: 150,
    criticalSystolicLow: 85,
    samplingFrequency: "Scheduled arterial tonometry / oscillometric cuff",
    physiologicalSignificance: "Monitors cephalad fluid shift adaptation, arterial stiffness, and orthostatic tolerance trajectory."
  },
  coreTemperature: {
    name: "Core Body Temperature",
    unit: "°C",
    earthRestingRange: [36.5, 37.2],
    microgravityRestingRange: [37.0, 37.9],
    criticalLow: 35.8,
    criticalHigh: 38.6,
    samplingFrequency: "Continuous double-sensor heat-flux forehead sensor",
    physiologicalSignificance: "Reflects the 'space fever' phenomenon; microgravity impairs convective cooling, shifting core setpoint up by ~0.8°C."
  },
  respiratoryRate: {
    name: "Respiratory Rate",
    unit: "breaths/min",
    earthRestingRange: [12, 18],
    microgravityRestingRange: [12, 20],
    criticalLow: 8,
    criticalHigh: 24,
    samplingFrequency: "Transthoracic bioimpedance / acoustic airflow sensor",
    physiologicalSignificance: "Sensitive to hypercapnia (elevated cabin CO2), metabolic acid-base changes, and acute pulmonary strain."
  },
  sleepDuration: {
    name: "Sleep Duration",
    unit: "hrs/night",
    earthRestingRange: [7.0, 8.5],
    microgravityRestingRange: [6.0, 8.0],
    criticalLow: 4.5,
    criticalHigh: 10.0,
    samplingFrequency: "Daily polysomnography / actigraphy aggregate",
    physiologicalSignificance: "Predictive of cognitive throughput, motor coordination, emotional stability, and immune homeostasis."
  },
  radiationDose: {
    name: "Daily Radiation Dose Rate",
    unit: "µSv/day",
    earthRestingRange: [5, 10],
    microgravityRestingRange: [250, 600],
    criticalLow: 0,
    criticalHigh: 1200,
    samplingFrequency: "Active silicon semiconductor dosimeter, hourly integrated",
    physiologicalSignificance: "Monitors cosmic ray fluence and South Atlantic Anomaly exposure to protect against cumulative radiogenic risk."
  }
};
