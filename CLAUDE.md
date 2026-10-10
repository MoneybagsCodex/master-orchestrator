# CLAUDE.md — Master-Orchestrator Operating Guidelines

## Core Principles

- **Isolation > Convenience** — Keep dashboard and backend cleanly separated
- **Reversible > Clever** — Prefer simple state management over complex optimization
- **Explicit > Implicit** — Clear WebSocket messages and API contracts
- **Boring > Trendy** — Proven patterns over experimental frameworks

## Communication Patterns

### Dashboard → Orchestrator Protocol
- **Transport:** WebSocket (ws://localhost:3003/ws)
- **Format:** JSON messages with explicit action types
- **Delivery:** Fire-and-forget for non-critical updates, request-response for approvals
- **Backoff:** Auto-reconnect with exponential backoff on disconnect

### Cross-Agent Coordination

**Master-Orchestrator ↔ Agent-Orchestrator**
- Master polls agent state via `/status` endpoint every 2 seconds (or via agent-orchestrator WebSocket)
- Master sends approvals/denials to agents via SendMessage
- Never hold state that belongs on an agent (agents are source of truth for their own work)
- Dashboard reflects agent state; master doesn't duplicate it

**Master-Orchestrator ↔ Dashboard UI**
- Dashboard reads state from `/status` and `/agents` REST endpoints
- Dashboard sends user approvals to `/approve` endpoint
- Real-time updates via WebSocket `agent-update` events
- UI state is ephemeral (reset on refresh); backend is authoritative

### Response Style
- **Concise:** One sentence per update. State change, not process.
- **Plain Language:** No buzzwords. If it broke, say so.
- **Status-Driven:** Dashboard shows "IDLE", "WORKING", "BLOCKED" — not step numbers.
- **Decision Transparent:** When uncertain about approval, show the prompt and operation to user.

## Windows/Mac Compatibility (CRITICAL)

### Path Handling
- **Config paths:** Always use forward slashes `/` in JSON config (Node.js normalizes both platforms)
- **User home:** Use `process.env.HOME` (Mac/Linux) or `process.env.USERPROFILE` (Windows)
- **Temp directory:** Use `os.tmpdir()` instead of hardcoding `/tmp` or `%TEMP%`

Example:
```typescript
import os from 'os';
import path from 'path';

const stateDir = path.join(os.homedir(), '.claude', 'orchestrator-sessions');
// ✅ Works on both: /Users/josh/.claude/orchestrator-sessions (Mac) or C:\Users\josh\.claude\orchestrator-sessions (Windows)
```

### WebSocket & IPC
- **Unix sockets (Mac/Linux):** `uds:/tmp/cc-socks/default.sock` — only works on Unix
- **TCP fallback (Windows):** Use `localhost:3003` instead when `process.platform === 'win32'`
- **Detection:** Check `process.platform` at startup, then set base URL:
  ```typescript
  const baseUrl = process.platform === 'win32' ? 'http://localhost:3003' : 'uds:/tmp/cc-socks/default.sock';
  ```
- **SSH/RemoteDevice:** If connecting from cloud, always use TCP (no Unix sockets available)

### File System Paths
- Never hardcode absolute paths (e.g., `/Users/josh/...`)
- Use `path.join()` and `path.resolve()` for all path construction
- Config file: Always relative to home directory or explicit `$HOME` expansion
- Logs: Use `os.homedir()` or process.env for base directory

### Process Environment
- `process.env.PATH` is pre-separated correctly for the OS (use as-is)
- When building PATH manually, use `path.delimiter`:
  ```typescript
  const newPath = [binDir, process.env.PATH].join(path.delimiter);
  // ✅ `:` on Mac/Linux, `;` on Windows
  ```
- `process.platform` values: 'darwin' (Mac), 'win32' (Windows), 'linux' (Linux)

### Subprocess Execution
- **Always use npm scripts** (`npm run`) instead of hardcoding `node`
- **Shell:** Use `{ shell: true }` on Windows, prefer bash on Mac/Linux
- **Binaries in bin/:** Use `.sh` shebang (`#!/usr/bin/env bash`) + fallback to `.ps1` for Windows
- **Example:**
  ```typescript
  const script = process.platform === 'win32' ? 'bin/orch-send.ps1' : 'bin/orch-send';
  // Execute with appropriate runner
  ```

## Git Workflow (MANDATORY)

**Auto-commit and auto-push EVERY change:**

1. After Edit/Write/Bash modifying files → immediately commit + push
2. Commit format: Short summary (70 chars), optional detail body
3. Include attribution: `Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>`
4. Never skip hooks, never force push to main
5. Stage specific files only (`git add <files>`), never `git add -A` without review

**Example:**
```bash
git add public/index.html src/dashboard.ts
git commit -m "Upgrade dashboard with kanban-style agent panel

- Add 4-column layout (IDLE, WORKING, BLOCKED, DONE)
- Implement drag-drop with HTML5 Drag API
- Add smooth 150-300ms transition animations

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
git push
```

## Token Discipline

- **Target:** ~1k tokens per turn (dashboard work often involves visual iteration)
- **Avoid:** Re-reading whole files, sequential tool calls, verbose explanations
- **Batch:** Independent tool calls in same turn
- **Compact:** When context >150k, summarize and fresh turn

**Budget for dashboard work:**
- Design/visual work: Can exceed 1k per visual iteration
- Implementation: Keep to 1k unless major refactor
- Testing/iteration: Can be quick loops <500 tokens each

## Code Standards

### Frontend (TypeScript/React)
- TypeScript strict mode, no `any` except where absolutely necessary
- Component tests for interactive elements (kanban drag-drop, panels)
- CSS: Use CSS Grid for kanban layout (not flexbox for this complex arrangement)
- State: React hooks, no Redux (too heavy for single dashboard)

### Backend (Express + Node.js)
- All endpoints return JSON with explicit status codes
- Logging: Use `console.log` with `[tag]` prefixes (same as agent-orchestrator)
- Error handling: Graceful 500s, never expose stack traces to client
- WebSocket: Implement message queue + backoff for reconnects

### Testing
- Unit tests for business logic (approval decisions)
- Integration tests for WebSocket communication
- Manual browser testing before marking feature complete
- No feature is "done" until both backend AND frontend are tested

## Logging Standards

### Frontend Logs
- `[dashboard-init]` — Dashboard startup and connection
- `[agent-update]` — Agent state changes received
- `[approval-send]` — User sent approval/denial
- `[ws-*]` — WebSocket connection events

### Backend Logs
- `[agent-state]` — Agent status changes
- `[approval]` — Approval decisions (auto or user)
- `[ws-message]` — WebSocket message received/sent
- `[error-*]` — Error categorization and recovery

Example:
```
[agent-update] agent-123: IDLE → WORKING
[approval-send] auto: git-commit (agent-456)
[ws-message] 1234 bytes sent to dashboard
```

## API Contract

### REST Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/status` | Agent orchestrator overall status |
| GET | `/agents` | List all active agents with state |
| GET | `/metrics` | Auto-approval metrics (from agent-orchestrator) |
| POST | `/approve` | Send approval/denial for blocked operation |
| POST | `/settings` | Update orchestrator configuration |
| GET | `/ws` | WebSocket upgrade endpoint |

### WebSocket Messages

**Dashboard → Server:**
```json
{
  "action": "approve",
  "agentId": "abc123",
  "decision": "yes|no|review",
  "reason": "optional explanation"
}
```

**Server → Dashboard:**
```json
{
  "type": "agent-update|approval-result|system-alert",
  "agentId": "abc123",
  "state": "IDLE|WORKING|BLOCKED|DONE",
  "timestamp": 1696771234000
}
```

## Dashboard Layout Rules

### Kanban Board
- **Column 1: IDLE** — Agents not running (gray background)
- **Column 2: WORKING** — Agents executing (blue background)
- **Column 3: BLOCKED** — Agents waiting for user approval (orange background)
- **Column 4: DONE** — Completed agents (green background)

### Agent Card
- **Header:** Agent name + status indicator
- **Body:** Current operation + timestamp
- **Footer:** Action buttons (approve/deny if blocked, inspect if working)
- **Drag:** Card draggable between columns (visual only, doesn't change backend state)

### Responsive
- Desktop: 4 columns side-by-side
- Tablet: 2×2 grid of columns
- Mobile: 1 column per row, carousel between columns
- No horizontal scroll on any device

## Decision Log

When making architectural choices:
1. State the options and tradeoff
2. Record the decision with reasoning
3. Store in `docs/DECISIONS.md`

Example:
```markdown
## Dashboard Layout: Kanban vs Timeline

**Options:**
- Timeline (vertical list of operations over time)
- Kanban (4-column state-based layout)

**Trade-off:**
Timeline shows history; Kanban shows current state. For a live orchestrator, current state is more important.

**Decision:** Kanban layout.
Reasoning: Operators need to see what's blocked RIGHT NOW, not scroll through history.
```

## Pre-Release Checklist

Before deploying:
- [ ] Both backend + frontend tested in browser (not just unit tests)
- [ ] TypeScript compilation: zero errors
- [ ] All tests passing (unit + integration)
- [ ] Windows/Mac compatibility verified (or documented as single-platform)
- [ ] WebSocket reconnection works (pull network in DevTools)
- [ ] Responsive layout tested on phone/tablet
- [ ] Git history clean (all changes committed and pushed)
- [ ] Documentation updated (DECISIONS.md, API contract)
- [ ] Performance acceptable (dashboard loads <1s, updates <200ms)

## Cross-Project Integration

### With agent-orchestrator
- Read agent state from `/status` endpoint (no direct function calls)
- Send approvals via SendMessage to agent (not REST)
- Never cache agent state locally (re-fetch every poll)
- Assume agent-orchestrator may be on different machine (use TCP, not Unix socket)

### With master-agent
- No direct integration (legacy system)
- If needed, communicate via agent-orchestrator as intermediary

## Related Files

- `/CLAUDE.md` — This file (global operating guidelines)
- `docs/ARCHITECTURE.md` — Dashboard system design
- `docs/API_CONTRACT.md` — Endpoint specifications
- `src/server.ts` — Express backend entry point
- `public/index.html` — Dashboard UI
- `orchestrator.config.json` — Shared configuration

## Quick Reference

| Task | Command |
|------|---------|
| Start server | `npm run server` |
| Open dashboard | `open http://localhost:3003` |
| Run tests | `npm run test` |
| Type-check | `npx tsc --noEmit` |
| Commit + push | `git add <files> && git commit -m "..." && git push` |

---

**Last Updated:** 2026-10-08  
**Version:** 1.0  
**Platform:** macOS / Windows / Linux (platform-aware path handling required)
