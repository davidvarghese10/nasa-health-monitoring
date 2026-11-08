/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const SAMPLE_CSV_CONTENT = `timestamp,astronaut_id,heart_rate_bpm,spo2_pct,systolic_bp_mmhg,diastolic_bp_mmhg,core_temp_c,respiratory_rate_bpm,sleep_duration_hrs,radiation_usv_day,activity_met
2026-11-08T00:00:00Z,ASTRO-01,64.2,98.1,118,74,37.12,14.2,7.4,320.5,1.1
2026-11-08T02:00:00Z,ASTRO-01,61.8,98.4,116,72,36.98,13.8,7.4,318.2,0.9
2026-11-08T04:00:00Z,ASTRO-01,59.5,98.6,114,70,36.85,13.2,7.4,312.0,0.9
2026-11-08T06:00:00Z,ASTRO-01,68.0,97.9,120,76,37.20,15.0,0.0,325.4,1.8
2026-11-08T08:00:00Z,ASTRO-01,72.4,97.5,122,78,37.35,15.5,0.0,335.1,2.4
2026-11-08T10:00:00Z,ASTRO-01,134.8,96.8,142,84,38.05,22.4,0.0,340.2,7.2
2026-11-08T12:00:00Z,ASTRO-01,74.1,97.8,124,78,37.40,16.0,0.0,330.6,2.1
2026-11-08T14:00:00Z,ASTRO-01,91.5,91.8,138,86,37.95,19.8,0.0,342.0,2.3
2026-11-08T16:00:00Z,ASTRO-01,84.2,93.2,132,82,37.65,17.5,0.0,338.4,1.9
2026-11-08T18:00:00Z,ASTRO-01,70.5,96.4,121,75,37.28,15.1,0.0,329.0,1.5
2026-11-08T20:00:00Z,ASTRO-01,66.3,97.8,119,73,37.15,14.4,0.0,322.8,1.2
2026-11-08T22:00:00Z,ASTRO-01,63.0,98.2,117,72,37.02,13.9,0.0,319.4,1.0`;

export const SAMPLE_JSON_CONTENT = JSON.stringify({
  metadata: {
    exportSource: "NASA Johnson Space Center Life Sciences Data Archive (LSDA)",
    protocolId: "HRP-EXP74-BIO-0492",
    missionId: "ARTEMIS-ORBITAL-74",
    exportTimestamp: "2026-11-08T07:30:00Z",
    crewmemberId: "ASTRO-02",
    crewName: "MS Alex Chen",
    dataCompliance: "NASA-STD-3001 Vol 1 Rev B"
  },
  telemetryStream: [
    {
      timestamp: "2026-11-07T08:00:00Z",
      heartRate: 68.5,
      bloodOxygen: 98.2,
      systolicBP: 116,
      diastolicBP: 74,
      coreTemp: 37.15,
      respiratoryRate: 14.2,
      sleepDuration: 6.8,
      radiationDosimeterRate: 310.4,
      physicalActivityMet: 1.8
    },
    {
      timestamp: "2026-11-07T14:00:00Z",
      heartRate: 104.2,
      bloodOxygen: 96.5,
      systolicBP: 128,
      diastolicBP: 80,
      coreTemp: 37.55,
      respiratoryRate: 18.0,
      sleepDuration: 0.0,
      radiationDosimeterRate: 325.0,
      physicalActivityMet: 4.5
    },
    {
      timestamp: "2026-11-07T20:00:00Z",
      heartRate: 72.0,
      bloodOxygen: 97.4,
      systolicBP: 120,
      diastolicBP: 76,
      coreTemp: 37.28,
      respiratoryRate: 15.0,
      sleepDuration: 0.0,
      radiationDosimeterRate: 318.5,
      physicalActivityMet: 1.4
    },
    {
      timestamp: "2026-11-08T04:00:00Z",
      heartRate: 58.4,
      bloodOxygen: 98.8,
      systolicBP: 112,
      diastolicBP: 70,
      coreTemp: 36.85,
      respiratoryRate: 13.0,
      sleepDuration: 5.2,
      radiationDosimeterRate: 308.2,
      physicalActivityMet: 0.8
    },
    {
      timestamp: "2026-11-08T06:00:00Z",
      heartRate: 69.1,
      bloodOxygen: 98.0,
      systolicBP: 117,
      diastolicBP: 73,
      coreTemp: 37.18,
      respiratoryRate: 14.6,
      sleepDuration: 0.0,
      radiationDosimeterRate: 315.0,
      physicalActivityMet: 1.5
    }
  ]
}, null, 2);

export const SAMPLE_PDF_BASE64_TEXT = `NASA FLIGHT MEDICINE OPERATIONS
EXPLORATION MEDICAL EVALUATION REPORT
DOCUMENT ID: NASA-MED-EXP74-WK12
SUBJECT: CDR Elena Rostova (ASTRO-01)
MISSION: Artemis VII Orbital Habitat (Expedition 74)
FLIGHT DAY: FD-142 | FLIGHT SURGEON: Dr. Sarah Vance, MD, MPH

1. CLINICAL SUMMARY
Astronaut displays satisfactory overall physiological adaptation to microgravity. Cephalic fluid shift is stabilized with nominal central venous pressures. Minor sleep architecture reduction noted on Sol 140 associated with high-intensity robotic arm berthing timeline. Aerobic fitness countermeasure (CEVIS) compliance is 98.4%.

2. PHYSIOLOGICAL MEASUREMENTS (RECORD EXTRACT)
Time: 2026-11-08T06:00:00Z | HR: 66 bpm | SpO2: 98.0% | BP: 118/74 mmHg | CoreTemp: 37.15 C | RespRate: 14.5 bpm | Radiation: 320 uSv/d
Time: 2026-11-08T08:00:00Z | HR: 72 bpm | SpO2: 97.5% | BP: 122/76 mmHg | CoreTemp: 37.30 C | RespRate: 15.2 bpm | Radiation: 335 uSv/d
Time: 2026-11-08T12:00:00Z | HR: 132 bpm | SpO2: 96.2% | BP: 140/82 mmHg | CoreTemp: 38.00 C | RespRate: 21.0 bpm | Radiation: 340 uSv/d
Time: 2026-11-08T14:00:00Z | HR: 88 bpm | SpO2: 92.4% | BP: 136/84 mmHg | CoreTemp: 37.85 C | RespRate: 19.4 bpm | Radiation: 338 uSv/d
Time: 2026-11-08T18:00:00Z | HR: 69 bpm | SpO2: 97.1% | BP: 120/75 mmHg | CoreTemp: 37.22 C | RespRate: 14.8 bpm | Radiation: 325 uSv/d

3. ASSESSMENT & RECOMMENDATIONS
- Peripheral oxygen desaturation at 14:00 (SpO2 92.4%) coincided with Node 2 ventilation duct filter maintenance. Atmosphere re-scrubbed; normal SpO2 returned by 18:00.
- Continue scheduled daily 2.5 hours countermeasure protocol (ARED + T2).
- Routine Flight Surgeon review scheduled for Sol 145.`;
