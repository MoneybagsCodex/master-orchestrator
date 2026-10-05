> **Setup and running (both repos):** see `agent-orchestrator/SETUP.md`.

# Cockpit Orchestrator

Voice-first orchestration dashboard for multi-agent AI systems.

## Setup

```bash
# Install dependencies
npm install

# Start the cockpit (port 4000)
npm run dev
```

The cockpit connects to the orchestrator backend on `http://localhost:3003`.

## Starting the Full System

### Terminal 1: Start the Orchestrator API
```bash
cd ~/projects/agent-orchestrator
npm run server
```

### Terminal 2: Start the Cockpit UI
```bash
cd ~/projects/cockpit-orchestrator
npm run dev
```

### Terminal 3: Open in browser
```
http://localhost:4000
```

## Usage

1. Enter a mission command (e.g., "Deploy v2.1.0 to production")
2. The cockpit sends it to the orchestrator
3. Real-time dashboard shows:
   - Agent status and assignments
   - Phase execution progress
   - Risk level tracking
   - Live execution log

## Architecture

- **Cockpit UI**: React-based dashboard with real-time polling
- **Orchestrator Backend**: Executes workflows with agent routing and state management
- **API Bridge**: Express server connects UI to orchestrator


---

Developed by Joshua Minton. Copyright © 2026 Joshua Minton. Property of Joshua Minton; all rights reserved.
