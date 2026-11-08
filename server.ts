/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { NASA_PHYSIOLOGICAL_BENCHMARKS, NASA_SCIENTIFIC_LIBRARY } from './src/data/nasa_references';
import { processAssistantQuery } from './src/services/ai_assistant';
import { CURRENT_USER, dbService } from './src/services/database';
import { SAMPLE_CSV_CONTENT, SAMPLE_JSON_CONTENT, SAMPLE_PDF_BASE64_TEXT } from './src/services/sample_files';
import { processUploadedFile } from './src/services/upload_parser';
import { MissionRole, UserProfile } from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Multer memory storage for uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
});

let activeUser: UserProfile = { ...CURRENT_USER };

// --- REST API Endpoints ---

// 1. Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 2. User & Roles
app.get('/api/user/me', (req: Request, res: Response) => {
  res.json(activeUser);
});

app.post('/api/user/switch-role', (req: Request, res: Response) => {
  const { role, name, callsign } = req.body as { role: MissionRole; name?: string; callsign?: string };
  if (!role) {
    return res.status(400).json({ error: 'Role is required' });
  }
  activeUser = {
    id: activeUser.id,
    name: name || (role === 'Flight Surgeon' ? 'Dr. Sarah Vance, MD, MPH' : role === 'Mission Director' ? 'Gene Kranz II' : role === 'Crew Astronaut' ? 'CDR Elena Rostova' : 'Dr. Maya Lin, PhD'),
    role,
    callsign: callsign || (role === 'Flight Surgeon' ? 'Houston-Surgeon' : role === 'Mission Director' ? 'Flight-Director' : role === 'Crew Astronaut' ? 'Valkyrie' : 'Bio-Ops'),
  };
  res.json(activeUser);
});

// 3. Mission Overview
app.get('/api/mission', (req: Request, res: Response) => {
  const overview = dbService.getMissionOverview();
  res.json(overview);
});

// 4. Astronauts
app.get('/api/astronauts', (req: Request, res: Response) => {
  const astronauts = dbService.getAstronauts();
  res.json(astronauts);
});

app.get('/api/astronauts/:id', (req: Request, res: Response) => {
  const astronaut = dbService.getAstronaut(req.params.id);
  if (!astronaut) {
    return res.status(404).json({ error: 'Astronaut not found' });
  }
  res.json(astronaut);
});

app.post('/api/astronauts', (req: Request, res: Response) => {
  const astronaut = dbService.registerOrUpdateAstronaut(req.body);
  res.status(201).json(astronaut);
});

app.put('/api/astronauts/:id', (req: Request, res: Response) => {
  const astronaut = dbService.registerOrUpdateAstronaut({ ...req.body, id: req.params.id });
  res.json(astronaut);
});

// 5. Telemetry
app.get('/api/telemetry/:astronautId', (req: Request, res: Response) => {
  const { astronautId } = req.params;
  const range = (req.query.range as string) || '7d';
  const limitParam = parseInt(req.query.limit as string, 10);
  const limit = isNaN(limitParam) ? 360 : limitParam;

  let records = dbService.getTelemetry(astronautId, limit);

  // Filter based on range
  const now = new Date().getTime();
  let cutoffMs = now - 7 * 24 * 60 * 60 * 1000; // default 7d
  if (range === '24h') {
    cutoffMs = now - 24 * 60 * 60 * 1000;
  } else if (range === '30d') {
    cutoffMs = now - 30 * 24 * 60 * 60 * 1000;
  }

  records = records.filter(r => new Date(r.timestamp).getTime() >= cutoffMs);
  res.json(records);
});

// 6. Alerts & Acknowledgments
app.get('/api/alerts', (req: Request, res: Response) => {
  const includeResolved = req.query.includeResolved !== 'false';
  const alerts = dbService.getAlerts(includeResolved);
  res.json(alerts);
});

app.post('/api/alerts/:id/acknowledge', (req: Request, res: Response) => {
  const { notes } = req.body as { notes?: string };
  const updated = dbService.acknowledgeAlert(req.params.id, activeUser, notes);
  if (!updated) {
    return res.status(404).json({ error: 'Alert not found' });
  }
  res.json(updated);
});

// 7. Simulation Controls
app.get('/api/simulation/state', (req: Request, res: Response) => {
  res.json(dbService.getSimulationState());
});

app.post('/api/simulation/toggle', (req: Request, res: Response) => {
  const current = dbService.getSimulationState();
  const updated = dbService.setSimulationRunning(!current.isRunning);
  res.json(updated);
});

app.post('/api/simulation/tick', (req: Request, res: Response) => {
  dbService.tickSimulation();
  res.json({ success: true, timestamp: new Date().toISOString() });
});

app.post('/api/simulation/reset', (req: Request, res: Response) => {
  const state = dbService.resetSimulation();
  res.json({ success: true, state });
});

app.post('/api/simulation/inject', (req: Request, res: Response) => {
  const { astronautId, anomalyType } = req.body as {
    astronautId: string;
    anomalyType: 'hypoxia' | 'tachycardia' | 'radiation' | 'fever' | 'drift';
  };
  if (!astronautId || !anomalyType) {
    return res.status(400).json({ error: 'astronautId and anomalyType are required' });
  }

  const result = dbService.injectSimulationAnomaly(astronautId, anomalyType);
  if (!result) {
    return res.status(404).json({ error: 'Astronaut not found' });
  }
  res.json({ success: true, ...result });
});

// 8. Upload & Ingestion
app.post('/api/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    const astronautId = req.body.astronautId || 'ASTRO-01';

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const extraction = await processUploadedFile({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      astronautId,
    });

    dbService.addUploadedDataset(extraction);
    res.json(extraction);
  } catch (err: any) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message || 'File processing failed' });
  }
});

app.post('/api/upload/commit', (req: Request, res: Response) => {
  const { fileId, astronautOverride } = req.body as { fileId: string; astronautOverride?: any };
  if (!fileId) {
    return res.status(400).json({ error: 'fileId is required' });
  }
  const result = dbService.commitUploadedRecords(fileId, astronautOverride);
  res.json(result);
});

app.get('/api/upload/history', (req: Request, res: Response) => {
  res.json(dbService.getUploads());
});

app.get('/api/upload/sample/:type', (req: Request, res: Response) => {
  const { type } = req.params;
  if (type === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="ASTRA_Sample_Telemetry.csv"');
    return res.send(SAMPLE_CSV_CONTENT);
  } else if (type === 'json') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="ASTRA_Sample_Telemetry.json"');
    return res.send(SAMPLE_JSON_CONTENT);
  } else if (type === 'pdf') {
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename="ASTRA_Sample_Medical_Report.txt"');
    return res.send(SAMPLE_PDF_BASE64_TEXT);
  }
  res.status(400).json({ error: 'Invalid sample type' });
});

// 9. NASA Scientific Reference Library
app.get('/api/nasa/library', (req: Request, res: Response) => {
  res.json({
    documents: NASA_SCIENTIFIC_LIBRARY,
    benchmarks: NASA_PHYSIOLOGICAL_BENCHMARKS,
  });
});

// 10. AI Health Assistant (Gemini API server-side endpoint)
app.post('/api/assistant/chat', async (req: Request, res: Response) => {
  try {
    const { message, astronautId } = req.body as { message: string; astronautId?: string };
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const answer = await processAssistantQuery({ message, astronautId });
    res.json(answer);
  } catch (err: any) {
    console.error("AI Assistant error:", err);
    res.status(500).json({ error: 'Failed to process assistant query', details: err.message });
  }
});

// Automatic simulation ticker (every 10 seconds if simulation is active)
setInterval(() => {
  const sim = dbService.getSimulationState();
  if (sim.isRunning) {
    dbService.tickSimulation();
  }
}, 10000);

// --- Vite Middleware or Static Assets ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[ASTRA] Aerospace Mission Telemetry Server online at http://0.0.0.0:${port}`);
  });
}

startServer();
