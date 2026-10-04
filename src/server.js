import express from 'express';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 4000;
const ORCHESTRATOR_URL = 'http://localhost:3003';

// Note: Claude API calls should come from frontend with user's authenticated session
// Backend here is just a proxy for orchestrator communication

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

// Claude plan generation (placeholder - frontend should use Claude directly)
app.post('/api/claude/plan', async (req, res) => {
  try {
    const { command } = req.body;
    // This should be called from frontend with user's Claude session
    // For now, return a generic plan
    const plan = `I'll orchestrate this for you:\n1. Testing & validation\n2. Security & performance checks\n3. Integration testing\n4. Approval gate\n5. Deployment\n6. Monitoring\n\nStarting now...`;
    res.json({ plan });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate plan' });
  }
});

// Claude summary generation (placeholder - frontend should use Claude directly)
app.post('/api/claude/summary', async (req, res) => {
  try {
    const { missionTitle } = req.body;
    const summary = `✓ Mission complete: ${missionTitle}\n\nAll phases executed successfully. System is ready for the next step.`;
    res.json({ summary });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate summary' });
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
