import express from 'express';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT ?? 4000);
const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL ?? 'http://localhost:3003';
const BRIDGE_URL = process.env.BRIDGE_URL ?? 'http://localhost:3002';

app.use(express.json());
app.use(express.static(join(__dirname, '../public')));

// The page reads the orchestrator address from here so a non-default ORCHESTRATOR_URL works in the browser too.
app.get('/orch-url.js', (req, res) => res.type('js').send(`window.ORCH_URL = ${JSON.stringify(ORCHESTRATOR_URL)};`));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', port: PORT, orchestratorUrl: ORCHESTRATOR_URL, bridgeUrl: BRIDGE_URL });
});

// Proxy: get list of live terminals from bridge
app.get('/api/terminals', async (req, res) => {
  try {
    const response = await axios.get(`${BRIDGE_URL}/terminals`, { timeout: 2000 });
    res.json(response.data);
  } catch (error) {
    console.error('Bridge terminals error:', error.message);
    res.status(503).json({ error: 'Bridge offline' });
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
