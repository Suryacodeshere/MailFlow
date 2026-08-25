# MailFlow - Full Stack Email Job Scheduler

A production-grade email scheduler service that persists jobs, enforces rate limits, uses BullMQ, and syncs data to Elasticsearch.

## 🌐 Live Demo

> **⚠️ Free Tier Notice:** The backend is hosted on Render's free tier and will **spin down after 15 minutes of inactivity**. If the app seems unresponsive, please wait **30–60 seconds** for the backend to wake up, then refresh the page.

| Service | URL |
|---------|-----|
| **Frontend** | https://MailFlow-surya.vercel.app |
| **Backend API** | https://MailFlow-backend-6uoc.onrender.com |
| **BullMQ Dashboard** | https://MailFlow-backend-6uoc.onrender.com/admin/queues |

---

## Features Implemented

### Backend
- **Scheduler**: Powered entirely by BullMQ delayed jobs (no OS cron or node-cron).
- **Persistence**: Relational DB (PostgreSQL via Prisma), Redis for queues, and Elasticsearch for fast querying. Jobs are fully recovered from the DB if Redis is wiped.
- **Rate Limiting**: Custom implementation using a Redis counter key (`rate_limit:user:hour`). If limit exceeded, it safely pushes jobs to the next hour without dropping.
- **Concurrency**: Configured via `WORKER_CONCURRENCY` in `.env`, safely processing multiple jobs in parallel.
- **Throttling**: Configurable `delayBetween` to mimic provider delays.
- **Slack Alert**: Worker fires an HTTP request to the user's saved Slack webhook when the hourly limit is hit.
- **Search Engine**: Mapped DB entries to Elasticsearch `emails` index with Prisma fallback if ES is unavailable.

### Frontend
- **Login**: Real Google OAuth via NextAuth.
- **Dashboard**: Tabbed interface (Scheduled & Sent) cleanly querying the Backend API.
- **Tables**: Clean lists displaying email metadata, status badges (Sent/Failed), and timestamps.
- **Compose**: Rich modal mimicking Figma exactly.
- **CSV Upload**: Papaparse handles batch adding recipients and explicitly shows the number of addresses detected.
- **UX States**: Comprehensive loading states, empty states, and dismissible inline error toasts instead of alerts.
- **TypeScript**: Strict interfaces (`EmailJob`) used for all API responses and props.

---

## 🔑 Environment Variables

To run this project locally, you will need to set up your own environment variables. Create `.env` files in both the `backend` and `frontend` directories using the provided examples.

### Backend (`backend/.env`)

```env
# Database & Queue
DATABASE_URL="postgresql://root:password@localhost:5432/scheduler_db"
REDIS_URL="redis://localhost:6379"
ELASTICSEARCH_NODE="http://localhost:9200"

# Mailer (e.g., Ethereal for testing)
SMTP_HOST="smtp.ethereal.email"
SMTP_PORT=587
SMTP_USER="<your_ethereal_username>"
SMTP_PASS="<your_ethereal_password>"

# Worker Configuration
WORKER_CONCURRENCY=5
MAX_EMAILS_PER_HOUR_PER_SENDER=200

# Slack OAuth (Optional for alerts)
SLACK_CLIENT_ID="<your_slack_client_id>"
SLACK_CLIENT_SECRET="<your_slack_client_secret>"
SLACK_REDIRECT_URI="http://localhost:4000/api/slack/callback"
```

### Frontend (`frontend/.env.local`)

```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<generate_a_random_secret>"
NEXT_PUBLIC_BACKEND_URL="http://localhost:4000"

# Google OAuth
GOOGLE_CLIENT_ID="<your_google_client_id>"
GOOGLE_CLIENT_SECRET="<your_google_client_secret>"
```

---

## Prerequisites
- Node.js 18+
- Docker and Docker Compose (for local development only)
- Yarn or NPM

## How to Run Locally

### 1. Start Infrastructure Services
```bash
docker compose up -d
```
This spins up PostgreSQL on port 5432, Redis on 6379, and Elasticsearch on 9200.

### 2. Backend Setup
```bash
cd backend
yarn install
yarn db:push
yarn dev
```
*The BullMQ worker is embedded within the Express server and starts automatically when the backend boots.*
*BullMQ Dashboard available at `http://localhost:4000/admin/queues`*

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Access the dashboard at `http://localhost:3000`.

---

## Architecture Overview
- **Scheduling**: When an API request comes in, a Postgres record is created and a BullMQ job is enqueued with `{ delay: startTime - Date.now() }`.
- **Restart Persistence**: Because BullMQ stores the queue in Redis and the master truth is in Postgres, restarting the Node server just pauses the workers. When they come back up, they instantly pick up jobs from Redis without missing a beat or duplicating (idempotency is maintained using job IDs).
- **Rate Limiting**: Enforced entirely via distributed locks/counters in Redis to remain safe across multi-instance deployments.
- **Cloud Architecture**: Production uses managed services — Render Postgres, Upstash Redis (Serverless), Bonsai Elasticsearch, Vercel (frontend), Render Web Service (backend).

## Assumptions & Trade-offs
- **Authentication**: Email is used as the primary identifier connecting the Frontend session and Backend jobs.
- **Elasticsearch**: Falls back to Prisma/Postgres search if Elasticsearch is unavailable, ensuring the app never crashes due to ES downtime.
- **Rate Limiting**: To avoid dropping jobs, when a rate limit is exceeded, we use BullMQ's `moveToDelayed` with a calculated time offset to push the exact job to the next hour block, rather than throwing an error or looping the queue.
- **Provider Throttling**: A minimum delay between sends is enforced via a programmatic sleep based on the `delayBetween` property in the job data. The frontend lets you configure this dynamically.
