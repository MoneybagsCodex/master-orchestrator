# master-orchestrator

The dashboard for a personal "master orchestrator": a single page where you talk to one Claude agent that supervises all your other Claude Code agents, and see what each of them is doing at a glance.

It is the front end of a pair. The brain is [agent-orchestrator](https://github.com/MoneybagsCodex/agent-orchestrator); this repo is only the UI plus a small proxy. Install and run instructions for both are in `agent-orchestrator/SETUP.md`.

## Why this exists

Running several Claude Code sessions at once turns you into a switchboard operator: tabbing between terminals to see who is stuck, who finished, and what to say next. This dashboard puts that picture on one screen and lets you steer everything from one chat.

You type (or speak) to the orchestrator in plain language. It reads the real state of your agents, relays your instructions, and reports back what each agent itself said. The page shows the same information live, so you can glance at it instead of asking.

## What you see

**Left: chat with the orchestrator**
- Voice input (browser speech recognition) as well as typing, streaming conversation with a model picker (Haiku, Sonnet, Opus), a stop button, and delivery status under each message (sent, received, working, replied).
- A card with the orchestrator's own health: idle / working / compacting, context size against its auto-compact line, token use (in, out, cache read) and spend over the last hour, and a Compact button. The "flag agents over N tokens" threshold lives here too.
- Notes and toasts for things that matter: an agent finished, a message is held for approval, the conversation was compacted.

**Right: your agents and plans**
- **Fleet bar:** how many agents are working, idle or blocked, how many need you, how many are over the context flag, plan progress.
- **Needs you:** agents blocked on a decision (permission prompts and questions), with quick answers.
- **Plans:** one plan per domain, shown as a concept list by default (steps grouped under Foundation / Dashboard / Auto-Planning style headings) with a toggle to a dependency map. Step status, blockers and decisions are called out.
- **Agent cards:** state, current activity, which plan step it is on, last reply, a headline of what it has accomplished, token use against a context threshold with a one-click compact, and a full conversation viewer.
- **Standing instructions:** rules the orchestrator keeps applying ("tell me as soon as the car agent has the numbers"), plus optional desktop alerts.
- Several colour themes (light, midnight, slate, nord, dracula, ocean, forest, sunset, orange).

## How it works

```
browser :4000 ── this repo (src/server.js, static page in public/index.html)
   │  /api/terminals  ─▶ proxied to the operator-cockpit bridge :3002
   │  everything else ─▶ the browser talks straight to agent-orchestrator :3003
   │                      (chat, /events live stream, /status polled every ~2s)
```

- `public/index.html` is a single static page in plain JavaScript with no build step. It opens a server-sent-events stream to the orchestrator for chat and turn events, and polls `/status` for the agent picture. Missed events are replayed by sequence number after a reconnect.
- `src/server.js` is a tiny Express server: it serves the page, proxies the terminal list from the bridge, and tells the page where the orchestrator lives (`/orch-url.js`).
- All logic, state and cost tracking live in agent-orchestrator. This repo cannot do anything useful on its own.

The page is local-only. The orchestrator only accepts calls from `localhost` origins, so open the dashboard via `http://localhost:4000`, not a LAN address.

## Quick start

```bash
npm ci
npm start             # http://localhost:4000
```

Start agent-orchestrator first (`npm run server` there, port 3003). Optional environment variables: `PORT` (default 4000), `ORCHESTRATOR_URL` (default `http://localhost:3003`), `BRIDGE_URL` (default `http://localhost:3002`). After editing `public/index.html`, hard-reload the browser; the page is static and cached.

Needs Node 18+. The full setup, configuration and troubleshooting guide is `SETUP.md` in the agent-orchestrator repo.

## Status

Personal tool, actively changing, tested on macOS in Chrome. No authentication, by design: single user on localhost.

---

Developed by Joshua Minton. Copyright © 2026 Joshua Minton. Property of Joshua Minton; all rights reserved.
