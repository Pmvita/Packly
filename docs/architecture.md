# Architecture Overview

Packly keeps packet capture, processing, persistence, and presentation inside a single Next.js codebase. This document captures the responsibilities of each layer and the interactions between them.

## Runtime components

1. **Capture Manager (`src/capture/`)**
   - Wraps the [`cap`](https://www.npmjs.com/package/cap) binding.
   - Provides helpers to enumerate interfaces, apply Berkeley Packet Filters (BPF), start/stop capture sessions, and normalise packet metadata (timestamps, addresses, protocol info).
   - Emits payloads as structured TypeScript objects via async iterators or event emitters.

2. **Session Supervisor (`src/server/capture`)**
   - Owns long-running capture processes.
   - Applies back-pressure, deduplicates flows, and forwards parsed packets to consumers (Socket.IO, persistence).
   - Maintains in-memory caches for live metrics (packet rate, top talkers).

3. **Transport Gateway (`src/server/realtime`)**
   - Exposes a Socket.IO server instance mounted through a Next.js Route Handler.
   - Broadcasts live packet updates, health status, and summarised metrics.
   - Accepts control messages (start/stop capture, filter updates) from authenticated clients.

4. **API Layer (`src/app/api/`)**
   - REST endpoints for querying historical data, interfaces, and configuration.
   - Uses Next.js App Router route handlers with `Response` streaming for large datasets.

5. **Persistence Layer (`src/db/`)**
   - Prisma schema + migrations (via `prisma migrate`).
   - Repository helpers for writing packets, flows, summaries, and event logs.
   - Scheduled jobs (Next.js route handlers or `node-cron`) for rollups, archival, and cleanup.

6. **UI Feature Modules (`src/features/`)**
   - `features/live` – Real-time stream, protocol filters, charts powered by React Query.
   - `features/insights` – Historical aggregations, drill-downs backed by Postgres queries.
   - `features/admin` – Capture controls, interface selection, health dashboards.

7. **Observability (`src/observability/`)**
   - Structured logger (pino or similar), request logging middleware.
   - Metrics exporter (Prometheus via `/api/metrics`), tracing hooks (OpenTelemetry).

## Data flow

```
┌──────────────┐     ┌────────────────┐     ┌────────────────────┐     ┌──────────────┐
│ Network NIC  │ ──► │ Capture Manager│ ──► │ Session Supervisor │ ──► │ Socket.IO    │
└──────────────┘     └────────────────┘     └────────────────────┘     └──────┬───────┘
                                                                               │
                                                                               ▼
                                                                     ┌─────────────────┐
                                                                     │ React Dashboard │
                                                                     └─────────────────┘
                                                                               │
                                                                               ▼
                                                                     ┌─────────────────┐
                                                                     │ Postgres + ORM  │
                                                                     └─────────────────┘
```

- Real-time packets travel Capture Manager → Session Supervisor → Socket.IO → React components.
- Batched inserts and scheduled jobs write packets/flows to Postgres.
- Historical API requests query Postgres and stream results back via route handlers.

## Security & permissions

- Capture requires elevated privileges (BPF access on macOS/Linux). Integrate runtime checks and user messaging for missing permissions.
- API routes will enforce authentication once auth is configured; until then, local development only.
- Sensitive env vars (database credentials) load from `.env.local` and must never be committed.

## Extension roadmap

- Add rule engine for anomaly detection and alert notifications.
- Support exporting `.pcap` files for offline analysis.
- Introduce multi-node capture (agents sending to a central Packly instance).
- Integrate OpenTelemetry tracing to follow packets through processing stages.

Keep this document updated as modules are implemented or reshaped.

