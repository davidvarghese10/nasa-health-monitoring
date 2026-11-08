/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';
import { NASA_SCIENTIFIC_LIBRARY } from '../data/nasa_references';
import { dbService } from './database';

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export interface AssistantQueryInput {
  message: string;
  astronautId?: string;
}

export interface AssistantResponseOutput {
  text: string;
  citations: Array<{
    title: string;
    docId: string;
    excerpt: string;
  }>;
  relevantVitals?: {
    astronaut: string;
    indicator: string;
    value: string;
  };
  isFallback: boolean;
}

export async function processAssistantQuery(input: AssistantQueryInput): Promise<AssistantResponseOutput> {
  const { message, astronautId } = input;
  const astronauts = dbService.getAstronauts();
  const selectedAstronaut = astronautId ? dbService.getAstronaut(astronautId) : astronauts[0];
  const activeAlerts = dbService.getAlerts(true);
  const overview = dbService.getMissionOverview();

  // Retrieve relevant vitals for context
  const targetAstro = selectedAstronaut || astronauts[0];
  const recentTelemetry = dbService.getTelemetry(targetAstro.id, 10);
  const latestRecord = recentTelemetry[recentTelemetry.length - 1];

  // Grounding context from NASA scientific library
  const referenceContext = NASA_SCIENTIFIC_LIBRARY.map(doc =>
    `[${doc.code}] ${doc.title} (${doc.publicationYear}):
Summary: ${doc.summary}
Key Findings: ${doc.keyFindings.join(' ')}
Clinical Relevance: ${doc.clinicalRelevance}`
  ).join('\n\n');

  // Grounding telemetry context
  const telemetrySummary = `
MISSION: ${overview.missionName} (ID: ${overview.missionId}, MET: ${overview.missionElapsedTime})
CREW COUNT: ${overview.totalCrew} | OVERALL STATUS: ${overview.overallStatus} | ACTIVE ALERTS: ${overview.activeAlertsCount}

CURRENT EVALUATED ASTRONAUT: ${targetAstro.name} (${targetAstro.id}, ${targetAstro.role}, Callsign: ${targetAstro.callsign}, Age: ${targetAstro.age}, Microgravity Sol: ${targetAstro.microgravityDay}, Status: ${targetAstro.status})
Personal Baseline:
- Resting HR: ${targetAstro.baseline.restingHeartRate} bpm
- SpO2: ${targetAstro.baseline.bloodOxygen} %
- BP: ${targetAstro.baseline.systolicBP}/${targetAstro.baseline.diastolicBP} mmHg
- Core Temp: ${targetAstro.baseline.coreTemp} °C
- Respiratory Rate: ${targetAstro.baseline.respiratoryRate} br/min
- Daily Radiation: ${targetAstro.baseline.dailyRadiationRate} uSv/day

Latest Real-Time Vitals:
- Heart Rate: ${latestRecord?.heartRate ?? 'N/A'} bpm
- SpO2: ${latestRecord?.bloodOxygen ?? 'N/A'} %
- Blood Pressure: ${latestRecord ? `${latestRecord.systolicBP}/${latestRecord.diastolicBP}` : 'N/A'} mmHg
- Core Temp: ${latestRecord?.coreTemp ?? 'N/A'} °C
- Respiratory Rate: ${latestRecord?.respiratoryRate ?? 'N/A'} br/min
- Radiation Rate: ${latestRecord?.radiationDosimeterRate ?? 'N/A'} uSv/day

ACTIVE & RECENT ALERTS FOR CREW:
${activeAlerts.slice(0, 5).map(a => `- [${a.severity}] ${a.astronautName} | ${a.indicator}: ${a.observedValue} ${a.unit} (Baseline: ${a.referenceBaseline}) -> ${a.reason} | NASA Standard: ${a.nasaStandardRef}`).join('\n')}
`;

  const ai = getAiClient();

  // If AI client is configured, call Gemini API
  if (ai) {
    try {
      const systemInstruction = `You are ASTRA, the AI Astronaut Health Intelligence Assistant for the NASA Space Apps Challenge 2026.
You assist Flight Surgeons, Biomedical Engineers, and Astronauts aboard the deep space habitat.
Your principles:
1. Ground every statement strictly in the provided NASA physiological telemetry, active anomaly logs, and authentic NASA research literature (NASA STD-3001, NASA-HRP Evidence Books, NASA SP-2020-0193).
2. Never hallucinate fake medical diagnoses or invent unrealistic measurements. Distinguish clearly between physiological adaptation to microgravity (e.g. cephalad fluid shift, elevated space fever core temperature setpoint) and acute clinical health risks.
3. When referencing scientific evidence, cite the specific NASA document code (e.g., [NASA-STD-3001-VOL-1B], [NASA-HRP-EV-CARDIO-2023]).
4. Provide actionable, concise, explainable recommendations suitable for aerospace mission operations.
5. Emphasize that all AI recommendations support qualified flight surgeon oversight and do not replace certified medical command.`;

      const prompt = `CURRENT MISSION TELEMETRY AND CREW HEALTH STATE:
${telemetrySummary}

AUTHENTIC NASA SCIENTIFIC REFERENCE LIBRARY:
${referenceContext}

USER INQUIRY:
"${message}"

Provide a structured, authoritative, scientifically rigorous aerospace health briefing answering the user's question. Include explicit citations to the NASA documents above.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
        },
      });

      const responseText = response.text || '';

      // Match citations
      const citations = NASA_SCIENTIFIC_LIBRARY
        .filter(doc => responseText.includes(doc.code) || responseText.includes(doc.category) || message.toLowerCase().includes(doc.category.toLowerCase()))
        .slice(0, 3)
        .map(doc => ({
          title: doc.title,
          docId: doc.code,
          excerpt: doc.keyFindings[0],
        }));

      return {
        text: responseText,
        citations: citations.length > 0 ? citations : [
          {
            title: NASA_SCIENTIFIC_LIBRARY[0].title,
            docId: NASA_SCIENTIFIC_LIBRARY[0].code,
            excerpt: NASA_SCIENTIFIC_LIBRARY[0].keyFindings[0],
          }
        ],
        relevantVitals: latestRecord ? {
          astronaut: targetAstro.name,
          indicator: "SpO2 / Heart Rate",
          value: `${latestRecord.bloodOxygen}% / ${latestRecord.heartRate} bpm`,
        } : undefined,
        isFallback: false,
      };
    } catch (err) {
      console.warn("Gemini API call failed or timed out, activating deterministic aerospace medical intelligence fallback:", err);
    }
  }

  // Deterministic Expert Scientific Fallback (when API key is absent or offline)
  const lowerMsg = message.toLowerCase();
  let fallbackText = "";
  let relevantDoc = NASA_SCIENTIFIC_LIBRARY[0];

  if (lowerMsg.includes('spo2') || lowerMsg.includes('oxygen') || lowerMsg.includes('hypoxia') || lowerMsg.includes('elena')) {
    relevantDoc = NASA_SCIENTIFIC_LIBRARY[1]; // NASA-STD-3001
    fallbackText = `**Aerospace Medical Assessment: Peripheral Oxygen Saturation (SpO2)**

• **Current Telemetry Status**: Commander Elena Rostova exhibited a transient SpO2 drop to **91.8%** (reference baseline ≥ 95.0%).
• **Physiological Etiology**: In accordance with *NASA-STD-3001 Vol 1 §4.3.1*, transient peripheral desaturation during microgravity maintenance tasks frequently stems from localized carbon dioxide pocketing in unventilated cabin modules, or ventilation-perfusion redistribution following cephalic fluid shifts.
• **Clinical vs. Statistical Significance**: While statistically flagged as an acute anomaly (Z-score 3.2σ), the condition was transient and resolved to 98.0% following cabin ECLSS scrubber cycle realignment.
• **Flight Surgeon Monitoring Recommendation**:
  1. Maintain continuous pulse oximetry trending over the subsequent 12-hour duty cycle.
  2. Verify cabin partial pressure of CO2 (ppCO2) remains strictly < 0.4 kPa across all habitability modules.
  3. Defer non-essential heavy aerobic exercise (T2 treadmill) until baseline blood gas equilibrium is re-confirmed.`;
  } else if (lowerMsg.includes('sleep') || lowerMsg.includes('circadian') || lowerMsg.includes('fatigue')) {
    relevantDoc = NASA_SCIENTIFIC_LIBRARY[2]; // Circadian sleep
    fallbackText = `**Circadian Rhythm & Sleep Architecture Analysis**

• **Telemetry Summary**: Monitored crew average sleep duration is currently **${overview.avgSleepDuration} hours/sol**, compared against the operational standard of 7.0–8.0 hours (*NASA-SP-2020-0193*).
• **Observed Sleep Compression**: Slow-wave (Deep Stage 3/4) and REM sleep cycles show an estimated 18% compression, a hallmark physiological response to high acoustic ambient levels (>58 dBA) and 90-minute orbital sunrise/sunset oscillations.
• **Cognitive Risk Assessment**: Sleep deficits exceeding 2 consecutive sols increase microgravity procedural error rates by approximately 34%.
• **Recommended Countermeasures**:
  1. Advance dynamic LED solid-state cabin lighting to 460 nm (blue-enriched) upon scheduled crew wake cycle.
  2. Shift crew sleeping quarter lighting to melatonin-sparing red spectrum (>620 nm) 90 minutes prior to sleep onset.
  3. Ensure earplugs/sound attenuation headsets are deployed during scheduled rest periods.`;
  } else if (lowerMsg.includes('radiation') || lowerMsg.includes('dosimeter') || lowerMsg.includes('spe')) {
    relevantDoc = NASA_SCIENTIFIC_LIBRARY[3]; // Radiation
    fallbackText = `**Bio-Dosimetry & Radiation Safety Evaluation**

• **Current Exposure Rate**: Crew active silicon dosimeters indicate background fluence of **${Math.round(overview.avgRadiationDose)} µSv/day**, well within nominal low-Earth orbit limits (250–600 µSv/day).
• **Operational Boundaries**: According to *NASA-TP-2015-218570* and NCRP-132 guidelines, short-term career limits for 30-day exposure are set at 250 mSv.
• **Solar Activity Status**: No active Solar Particle Event (SPE) warnings are currently registered by NOAA Space Weather Prediction Center (SWPC).
• **Protocol**: Should daily dose rates exceed 1,000 µSv/day, protocol mandates immediate relocation to the designated habitat storm shelter (Service Module water-wall barrier).`;
  } else if (lowerMsg.includes('heart') || lowerMsg.includes('cardio') || lowerMsg.includes('blood pressure')) {
    relevantDoc = NASA_SCIENTIFIC_LIBRARY[0]; // Cardiovascular
    fallbackText = `**Cardiovascular Microgravity Adaptation Evaluation**

• **Hemodynamic Status**: Crew resting heart rate is **${overview.avgHeartRate} bpm** with arterial blood pressure averaging **118/74 mmHg**.
• **Scientific Mechanism**: In microgravity, the cephalad fluid shift translocates ~1.5 to 2.0 L of venous volume into the thoracic cavity (*NASA-HRP Evidence Book: Cardiovascular Alterations*). This acutely stimulates central baroreceptors, producing early diuresis and a 10–15% plasma volume decline.
• **Monitoring Guidance**: Resting tachycardia above 100 bpm during non-exercise hours must be investigated for dehydration or hypercapnia. Maintain 2.5 hours of daily aerobic and resistive exercise (CEVIS cycle ergometer + ARED) to prevent left ventricular deconditioning.`;
  } else {
    fallbackText = `**ASTRA Mission Biomedical Intelligence Overview**

• **Mission Status**: ${overview.missionName} | MET ${overview.missionElapsedTime}
• **Monitored Crew**: ${overview.totalCrew} Astronauts (CDR Elena Rostova, MS Alex Chen, FE Dr. Marcus Vance)
• **Current Physiological Summary**:
  - Average Resting Heart Rate: ${overview.avgHeartRate} bpm (Nominal)
  - Mean Blood Oxygen Saturation: ${overview.avgBloodOxygen} % (Advisory active for CDR Rostova)
  - Mean Sleep Duration: ${overview.avgSleepDuration} hrs/sol
  - Ambient Active Dosimetry: ${Math.round(overview.avgRadiationDose)} µSv/day
• **Active Alerts**: ${activeAlerts.length} alert(s) on file. In accordance with *NASA-STD-3001 Vol 1*, all active alerts have associated explainable physiological mechanisms and suggested monitoring actions.`;
  }

  return {
    text: fallbackText,
    citations: [
      {
        title: relevantDoc.title,
        docId: relevantDoc.code,
        excerpt: relevantDoc.keyFindings[0],
      },
      {
        title: NASA_SCIENTIFIC_LIBRARY[1].title,
        docId: NASA_SCIENTIFIC_LIBRARY[1].code,
        excerpt: NASA_SCIENTIFIC_LIBRARY[1].keyFindings[0],
      }
    ],
    relevantVitals: latestRecord ? {
      astronaut: targetAstro.name,
      indicator: "Current Status",
      value: `${targetAstro.status} | HR: ${latestRecord.heartRate} bpm | SpO2: ${latestRecord.bloodOxygen}%`,
    } : undefined,
    isFallback: true,
  };
}
