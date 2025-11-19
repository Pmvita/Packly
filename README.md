# Packly

<div align="center">

![GitHub Repo stars](https://img.shields.io/github/stars/Pmvita/packly?style=for-the-badge&logo=github&logoColor=white)
![GitHub forks](https://img.shields.io/github/forks/Pmvita/packly?style=for-the-badge&logo=github&logoColor=white)
![GitHub issues](https://img.shields.io/github/issues/Pmvita/packly?style=for-the-badge&logo=github&logoColor=white)
![GitHub license](https://img.shields.io/github/license/Pmvita/packly?style=for-the-badge&logo=github&logoColor=white)
![Visitors](https://visitor-badge.laobi.icu/badge?page_id=Pmvita.packly&left_color=red&right_color=blue)

</div>

<div align="center">

## 🚀 Development Status

![Status](https://img.shields.io/badge/Status-Stable-green?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-1.0.0-blue?style=for-the-badge)

## 🌐 Connect With Me

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/pierre-mvita/)
[![Portfolio](https://img.shields.io/badge/Portfolio-000000?style=for-the-badge&logo=About.me&logoColor=white)](https://pierre-mvita.vercel.app/)
[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:Petermvita@hotmail.com)

## 💻 Core Framework

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)

## 💾 Database & ORM

![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)

## 🔌 Networking & Communication

![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![libpcap](https://img.shields.io/badge/libpcap-FF0000?style=for-the-badge&logo=capture&logoColor=white)

## 📊 Monitoring & Observability

![Prometheus](https://img.shields.io/badge/Prometheus-E6522C?style=for-the-badge&logo=prometheus&logoColor=white)
![Grafana](https://img.shields.io/badge/Grafana-F46800?style=for-the-badge&logo=grafana&logoColor=white)

## 🧪 Testing & Quality

![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white)

## 🐳 DevOps

![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)

</div>

Packly is a full-stack packet inspector: capture frames with libpcap, decode protocol stacks, persist flows in PostgreSQL, and visualise everything from a Next.js dashboard. Capture utilities, APIs, background jobs, and UI all live in one codebase so you can iterate quickly and still deploy with confidence.

## Highlights

- **Real-time capture pipeline** powered by `cap`, `Socket.IO`, and a resilient capture manager with mock fallback for development.
- **PostgreSQL persistence** with Prisma models for sessions, packets, flows, and background rollups that summarise recent activity.
- **Rich dashboard** built with Next.js App Router, React Query, Zustand, and Recharts for packet tables, protocol breakdowns, and live metrics.
- **Observability baked-in**: structured Pino logging, Prometheus-compatible metrics (`/api/metrics`), and scheduled summarisation jobs.
- **Quality gates**: Vitest + Testing Library suites, ESLint, and a GitHub Actions workflow that runs linting and tests on every push/PR.
- **Deployment-ready**: Dockerfile and `docker-compose.yml` for running the app alongside PostgreSQL (with packet capture capabilities enabled).

See `docs/architecture.md` for component responsibilities and data-flow diagrams.

## Screenshots

![Dashboard Overview](docs/screenshots/dashboard.png)
<!-- Add screenshots of the dashboard, packet tables, protocol breakdowns, etc. -->
<!-- Example format:
![Dashboard Overview](docs/screenshots/dashboard.png)
![Packet Table](docs/screenshots/packet-table.png)
![Protocol Breakdown](docs/screenshots/protocol-chart.png)
-->

## Prerequisites

| Requirement | Notes |
|-------------|-------|
| **Node.js 20+** | Development and CI use Node 20. |
| **npm** | Included with Node (lockfile is `package-lock.json`). |
| **libpcap** | Required by the `cap` binding.<br/>macOS: `brew install libpcap`<br/>Ubuntu/Debian: `sudo apt-get install libpcap-dev`<br/>Fedora: `sudo dnf install libpcap-devel` |
| **Packet capture privileges** | macOS: `sudo dseditgroup -o edit -a $(whoami) -t user access_bpf` then log out/in.<br/>Linux: run the app with `CAP_NET_ADMIN` or via `sudo setcap cap_net_admin=eip $(which node)`. |

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template and edit it
cp .env.example .env.local

# 3. Run migrations (requires DATABASE_URL)
npm run prisma:migrate -- --name init

# 4. Generate Prisma client + start the dev server
npm run prisma:generate
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) and use the dashboard to select a NIC, configure BPF filters, and start/stop captures. Enable **“Use mock capture”** to exercise the UI without root privileges or libpcap installed.

## Environment variables

All configuration loads from `.env.local` or the container environment. Key entries:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string. |
| `CAPTURE_INTERFACE` | Default interface when the UI first loads (e.g. `en0`, `eth0`). |
| `CAPTURE_FILTER` | Default BPF filter (`tcp`, `tcp port 80`, etc.). |
| `CAPTURE_PROMISCUOUS` | Enable promiscuous mode (default `true`). |
| `SUMMARY_ROLLUP_INTERVAL_MINUTES` | Interval for background traffic summaries. |
| `SOCKET_IO_PATH` / `NEXT_PUBLIC_SOCKET_PATH` | Socket.IO handshake path (defaults to `/api/socket`). |
| `NEXT_PUBLIC_DEFAULT_INTERFACE`, `NEXT_PUBLIC_DEFAULT_FILTER` | Client defaults for the dashboard. |

The repository also creates a placeholder `.env` file (intentionally empty) to signal that secrets belong in `.env.local`.

## Key commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js in development mode. |
| `npm run build` / `npm run start` | Production build and runtime. |
| `npm run lint` | ESLint via `next lint`. |
| `npm run test` / `npm run test:watch` | Vitest suites (Node environment by default). |
| `npm run coverage` | Generate lcov + text coverage reports. |
| `npm run prisma:migrate -- --name <msg>` | Apply migrations to the configured database. |
| `npm run prisma:generate` | Regenerate the Prisma client (`src/generated/prisma`). |

GitHub Actions (`.github/workflows/ci.yml`) runs `npm run lint` and `npm run test` on pushes and pull requests targeting `main`/`master`.

## API surface

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/capture/interfaces` | `GET` | Enumerate capture-capable network interfaces. |
| `/api/capture/status` | `GET` | Current capture manager state & metrics. |
| `/api/capture/start` | `POST` | Start a capture session (`device`, `filter`, `useMock`, etc.). |
| `/api/capture/stop` | `POST` | Stop the running capture session. |
| `/api/capture/history` | `GET` | Placeholder (501) until historical queries ship. |
| `/api/socket` | `Socket.IO` | Realtime stream (status + packets + errors). |
| `/api/metrics` | `GET` | Prometheus metrics (Pino logs note status transitions). |

Socket event names: `capture:status`, `capture:packet`, `capture:error`, plus `capture:start` / `capture:stop` client emissions for control.

## Observability & background jobs

- **Logging** uses `pino` with service metadata; messages originate from the capture manager, persistence coordinator, and summary scheduler.
- **Metrics** powered by `prom-client`: total packets, packet size histogram, and capture status gauges.
- **Summary scheduler** (`src/server/background/summary-scheduler.ts`) runs every `SUMMARY_ROLLUP_INTERVAL_MINUTES` to persist rollups via Prisma (top talkers, protocol breakdowns).

Expose `/api/metrics` to your Prometheus or use Docker compose to bind it to your monitoring stack.

## Docker & Compose

```bash
# Build the production image
docker build -t packly .

# Or run with Postgres using compose (requires root or NET_ADMIN capability)
docker compose up --build
```

`docker-compose.yml` provisions:

- `app`: Packly (port 3000) with `cap_add: NET_ADMIN` so libpcap can access the host NICs.
- `db`: PostgreSQL 16 with health checks and a persistent volume (`postgres-data`).

Provide a `.env.local` file (referenced via `env_file`) or override variables inline.

## Project structure

```
app/                 # Next.js App Router pages & API endpoints
docs/                # Architecture reference
prisma/              # Prisma schema & migrations
src/
  capture/           # cap wrappers, session manager, parsers, mocks
  db/                # Prisma client + repositories
  features/          # UI feature modules (live dashboard)
  observability/     # Logger, metrics registry
  server/            # Capture manager, persistence, background jobs
tests/               # Vitest suites
```

## 📊 GitHub Stats

<div align="center">

![GitHub Stats](https://github-readme-stats.vercel.app/api?username=Pmvita&repo=packly&show_icons=true&theme=dark&hide_border=true&bg_color=0D1117&title_color=FF0000&icon_color=FF0000)

![Top Languages](https://github-readme-stats.vercel.app/api/top-langs/?username=Pmvita&repo=packly&layout=compact&theme=dark&hide_border=true&bg_color=0D1117&title_color=FF0000)

</div>

## Roadmap snapshot

- [x] Capture utilities with fallback mock mode.
- [x] Live Socket.IO stream & REST control plane.
- [x] Prisma schema + repositories + background summaries.
- [x] Dashboard (tables, charts, rate metrics).
- [x] Metrics, logging, Prometheus-exporting endpoint.
- [x] Vitest suites + CI pipeline.
- [x] Dockerfile & Compose setup.
- [ ] Historical queries & playback UI.
- [ ] Authentication / RBAC for multi-user deployments.
- [ ] Alerting rules & webhook integrations.

Refer to `packet.plan.md` for the full implementation roadmap.
