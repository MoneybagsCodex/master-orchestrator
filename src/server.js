import express from 'express';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 4000;
const ORCHESTRATOR_URL = 'http://localhost:3003';

app.use(express.json());
app.use(express.static(join(__dirname, '../public')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', port: PORT });
});

// Get orchestrator status
app.get('/api/orchestrator/status', async (req, res) => {
  try {
    const response = await axios.get(`${ORCHESTRATOR_URL}/status`, { timeout: 2000 });
    res.json(response.data);
  } catch (error) {
    res.status(503).json({ error: 'Orchestrator offline', connected: false });
  }
});

// Send command to orchestrator
app.post('/api/orchestrator/command', async (req, res) => {
  try {
    const { command } = req.body;
    if (!command) {
      return res.status(400).json({ error: 'Command required' });
    }

    const response = await axios.post(
      `${ORCHESTRATOR_URL}/command`,
      { command },
      { timeout: 5000 }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Orchestrator command error:', error.message);
    res.status(503).json({ error: 'Failed to send command to orchestrator' });
  }
});

// Get master agent response
app.get('/api/orchestrator/response', async (req, res) => {
  try {
    const response = await axios.get(`${ORCHESTRATOR_URL}/response`, { timeout: 10000 });
    res.json(response.data);
  } catch (error) {
    console.error('Response error:', error.message);
    res.status(503).json({ error: 'Failed to get response from orchestrator' });
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Cockpit Orchestrator running on http://localhost:${PORT}`);
  console.log(`   Connecting to orchestrator at ${ORCHESTRATOR_URL}`);
});
