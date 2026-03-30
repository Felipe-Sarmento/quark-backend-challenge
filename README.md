# Quark: Lead Enrichment & AI Classification System

A production-ready NestJS backend for managing commercial leads with intelligent data enrichment (via mock API) and AI-powered classification (via Ollama). Built with TypeScript, PostgreSQL, RabbitMQ, and Docker.

---

## 📋 Overview

**Quark** provides a complete workflow for:
- **Lead Management** — Create, update, list, and delete leads with structured validation
- **Company Data Enrichment** — Fetch real-time company data via integration with mock enrichment API (simulating Receita Federal)
- **AI Lead Classification** — Score and classify leads automatically using Ollama LLMs with B2B prospecting logic
- **Asynchronous Processing** — Decouple requests from processing using RabbitMQ message queues
- **Complete History & Audit Trail** — Track all enrichments and classifications with metadata, timestamps, and error logs
- **CSV Export** — Stream large datasets efficiently using cursor-based pagination

**Key Features:**
- ✅ Full CRUD for leads + enrichment/classification endpoints
- ✅ Async processing with automatic retry + dead-letter queues
- ✅ Idempotent re-processing (safe to retry without duplicates)
- ✅ State machine for lead lifecycle (PENDING → ENRICHING → ENRICHED → CLASSIFYING → CLASSIFIED / FAILED)
- ✅ Comprehensive test coverage (unit + E2E)
- ✅ Production-ready error handling & validation
- ✅ One-command setup via Docker Compose

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (REST)                             │
└────────────┬────────────────────────────────────────────────────┘
             │
┌────────────▼──────────────────────────────────────────────────┐
│                    NestJS Backend (Apps)                       │
│  ┌────────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  lead-api      │  │  enrichment  │  │ classification   │  │
│  │  :3000         │  │   worker     │  │    worker        │  │
│  └────────────────┘  └──────────────┘  └──────────────────┘  │
│  • Lead CRUD      • Mock API calls  • Ollama calls        │
│  • Job triggers   • Retry + DLQ     • Result parsing     │
└────────────┬───────────────┬──────────────────┬─────────────┘
             │               │                  │
┌────────────▼───────────────▼──────────────────▼─────────────────┐
│                   RabbitMQ (Message Queues)                      │
│  enrichment-queue  |  classification-queue  |  dead-letter-queues│
└────────────┬───────────────┬──────────────────┬─────────────────┘
             │               │                  │
┌────────────▼───────────────▼──────────────────▼─────────────────┐
│                   Microservices (Docker)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐       │
│  │  PostgreSQL  │  │    Ollama    │  │   Mock API       │       │
│  │   :5433      │  │   :11435     │  │   :3001          │       │
│  │              │  │ tinyllama    │  │ (Receita Federal │       │
│  │  Leads       │  │ (637 MB)     │  │  simulator)      │       │
│  │  Enrichments │  └──────────────┘  └──────────────────┘       │
│  │  Classif.    │                                               │
│  └──────────────┘                                               │
└─────────────────────────────────────────────────────────────────┘
```

### Modules (pnpm Workspaces)

- **`@quark/shared`** — Configuration, Prisma ORM, RabbitMQ setup, base exceptions
- **`@quark/lead`** — Lead CRUD, service layer, HTTP controller, queue producers
- **`@quark/enrichment`** — Enrichment service, mock-api HTTP client, queue consumer + retry logic
- **`@quark/classification`** — Classification service, Ollama client, queue consumer + prompt engineering
- **`@quark/mock-api`** — Mock enrichment API (simulates third-party service)

### Apps (Runnable Processes)

- **`app/lead-api`** — HTTP REST server exposing Lead CRUD + endpoints
- **`app/enrichment`** — RabbitMQ worker processing enrichment jobs
- **`app/classification`** — RabbitMQ worker processing classification jobs
- **`app/mock-api`** — HTTP server for mock company enrichment API

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 20.0.0 (tested with 22.x)
- **pnpm** ≥ 9.0.0 (package manager)
- **Docker** & **Docker Compose** (latest)
- **Git**

Check your versions:
```bash
node --version   # v22.x.x
pnpm --version   # 9.x.x
docker --version
```

### Installation (5 minutes)

1. **Clone the repository:**
   ```bash
   git clone git@github.com:Felipe-Sarmento/quark-backend-challenge.git
   cd quark-backend-challenge
   ```

2. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

   Environment variables are pre-configured for local development:
   - PostgreSQL: `quark:quark@localhost:5433/quark_db`
   - RabbitMQ: `amqp://quark:quark@localhost:5673`
   - Ollama: `http://localhost:11435` (tinyllama model)
   - Mock API: `http://localhost:3001`
   - Lead API: `http://localhost:3000`

3. **Start Docker services:**
   ```bash
   docker compose up
   ```

   This pulls and starts:
   - PostgreSQL 17 (with migrations auto-applied)
   - RabbitMQ 4 with management UI (http://localhost:15673)
   - Ollama + tinyllama model (⏱️ first run downloads ~637 MB)
   - All four NestJS apps (lead-api, enrichment, classification, mock-api)

   **⏳ Wait for health checks to pass** (monitor with `docker compose logs -f`). Ollama model download takes 2–5 minutes depending on internet speed.

   ✅ When ready, you'll see:
   ```
   lead-api                  | [Nest] ... Server running on http://0.0.0.0:3000
   enrichment-worker         | [Nest] Started NestApplication microservice
   classification-worker     | [Nest] Started NestApplication microservice
   mock-api                  | [Nest] Server running on http://0.0.0.0:3001
   ```

4. **Verify the API is running:**
   ```bash
   curl http://localhost:3000/leads
   # Should return: []
   ```

---

## 📡 Available Endpoints

### Lead Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/leads` | Create a new lead |
| `GET` | `/leads` | List leads (with filters & pagination) |
| `GET` | `/leads/:id` | Retrieve a specific lead |
| `PATCH` | `/leads/:id` | Update a lead (partial) |
| `DELETE` | `/leads/:id` | Delete a lead |

### Enrichment

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/leads/:id/enrichment` | Request company data enrichment (async) |
| `GET` | `/leads/:id/enrichments` | List enrichment history for a lead |

### Classification

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/leads/:id/classification` | Request AI classification (async) |
| `GET` | `/leads/:id/classifications` | List classification history for a lead |

### Export

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/leads/export` | Export all leads (CSV format, cursor-paginated) |

### Example Requests

**Create a lead:**
```bash
curl -X POST http://localhost:3000/leads \
  -H 'Content-Type: application/json' \
  -d '{
    "fullName": "Ana Silva",
    "email": "ana.silva@example.com",
    "phone": "+5511999991111",
    "companyName": "Tech Innovations LTDA",
    "companyCnpj": "11222333000181",
    "companyWebsite": "https://techinnovations.com",
    "estimatedValue": 50000.00,
    "source": "WEBSITE",
    "notes": "High-value B2B prospect"
  }'
```

**Request enrichment:**
```bash
curl -X POST http://localhost:3000/leads/{leadId}/enrichment \
  -H 'Content-Type: application/json'
```

**Check enrichment history:**
```bash
curl http://localhost:3000/leads/{leadId}/enrichments
```

**Request classification:**
```bash
curl -X POST http://localhost:3000/leads/{leadId}/classification \
  -H 'Content-Type: application/json'
```

**Export leads to CSV:**
```bash
curl http://localhost:3000/leads/export > leads.csv
```

---

## 🧪 Testing

### Unit Tests (No Docker Required)

Run all unit tests:
```bash
pnpm install  # Install dependencies
pnpm test     # Run unit tests
```

Watch mode (re-run on file changes):
```bash
pnpm test:watch
```

With coverage report:
```bash
pnpm test:cov
```

### E2E Tests (Requires PostgreSQL)

Before running E2E tests, ensure PostgreSQL is running:
```bash
docker compose up -d quark-database rabbitmq  # Start only DB + RabbitMQ
```

Then run E2E tests:
```bash
pnpm test:e2e
```

**What E2E tests cover:**
- ✅ Full lead CRUD workflow
- ✅ Enrichment job queue trigger + consumer
- ✅ Classification job queue trigger + consumer
- ✅ CSV export streaming
- ✅ Error handling & recovery
- ✅ Idempotency (re-processing without duplicates)

**Cleanup after E2E:**
```bash
docker compose down  # Stop all services
```

---

## 📊 Data Model

### Lead

Represents a commercial prospect.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | UUID | ✅ | Primary key (auto-generated) |
| `fullName` | string | ✅ | 3–100 characters |
| `email` | string | ✅ | Unique, valid email format |
| `phone` | string | ✅ | E.164 format (e.g., `+5511999991111`) |
| `companyName` | string | ✅ | 2–150 characters |
| `companyCnpj` | string | ✅ | Unique, 14 digits, valid CNPJ checksum |
| `companyWebsite` | string | ❌ | Valid URL when provided |
| `estimatedValue` | decimal | ❌ | Positive, up to 2 decimal places |
| `source` | enum | ✅ | WEBSITE, REFERRAL, PAID_ADS, ORGANIC, OTHER |
| `notes` | string | ❌ | Max 500 characters |
| `status` | enum | ✅ | PENDING, ENRICHING, ENRICHED, CLASSIFYING, CLASSIFIED, FAILED |
| `createdAt` | timestamp | ✅ | Auto-set on creation |
| `updatedAt` | timestamp | ✅ | Auto-updated on modification |
| `enrichments[]` | relation | — | Historical enrichment records |
| `classifications[]` | relation | — | Historical classification records |

**Status Transitions:**
```
PENDING → ENRICHING → ENRICHED → CLASSIFYING → CLASSIFIED
   ↓          ↓           ↑          ↓             ↑
   └─────────→ FAILED ←───┴──────────┴─────────────┘
```

### Enrichment

Records each company data enrichment attempt.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | UUID | ✅ | Primary key |
| `leadId` | UUID | ✅ | Foreign key → Lead (cascade delete) |
| `status` | enum | ✅ | PENDING, PROCESSING, SUCCESS, FAILED |
| `requestedAt` | timestamp | ✅ | When the enrichment was requested |
| `completedAt` | timestamp | ❌ | When processing finished |
| `errorMessage` | string | ❌ | Error details on failure |
| `enrichmentData` | JSON | ❌ | Company data (address, phones, emails, CNAEs, partners, etc.) |
| `createdAt` | timestamp | ✅ | Auto-set |
| `updatedAt` | timestamp | ✅ | Auto-updated |

### Classification

Records each AI classification attempt.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | UUID | ✅ | Primary key |
| `leadId` | UUID | ✅ | Foreign key → Lead (cascade delete) |
| `status` | enum | ✅ | PENDING, PROCESSING, SUCCESS, FAILED |
| `requestedAt` | timestamp | ✅ | When classification was requested |
| `completedAt` | timestamp | ❌ | When processing finished |
| `errorMessage` | string | ❌ | Error details on failure |
| `score` | integer | ❌ | 0–100 lead quality score |
| `classification` | string | ❌ | HOT, WARM, or COLD |
| `justification` | string | ❌ | Short reason for classification |
| `commercialPotential` | string | ❌ | HIGH, MEDIUM, or LOW |
| `modelUsed` | string | ❌ | Model name & version (e.g., `tinyllama:latest`) |
| `createdAt` | timestamp | ✅ | Auto-set |
| `updatedAt` | timestamp | ✅ | Auto-updated |

---

## 🎯 Technical Decisions & Trade-Offs

### 1. **Monorepo with pnpm Workspaces**
- **Decision:** Organize the codebase into reusable `modules/` (domain logic) and `app/` (runnable processes).
- **Why:** This structure allows multiple independent processes to run (a requirement of the challenge) while enforcing a clear dependency direction: apps depend on modules, never the opposite.
- **Trade-off:** Increases architectural complexity, introduces more asynchrony, and adds cognitive load when navigating the repository.

### 2. **Separate RabbitMQ Workers per Domain**
- **Decision:** Split enrichment and classification into independent microservices, each consuming its own queue.
- **Why:** This aligns with the challenge requirements and enables independent scaling, better isolation, and easier testing. Failures in one domain do not impact the other.
- **Trade-off:** More containers to manage and increased local development complexity, partially mitigated by Docker Compose.
  
### 3. **Retry + Dead-Letter Queue (DLQ) Pattern**
- **Decision:** On worker failure, retry jobs using exponential backoff (2s → 4s → 16s). After 3 failed attempts, move the message to a dead-letter queue for manual inspection.
- **Why:** The challenge explicitly requires handling failure scenarios. This approach improves resilience by giving workers a chance to recover from transient issues (e.g., temporary external service unavailability), which is especially relevant since each worker depends on external systems.
- **Trade-off:** Adds complexity to the messaging infrastructure and requires proper monitoring and operational processes in production to inspect and handle DLQ messages effectively.

### 4. **Idempotency via `idempotencyKey`**
- **Decision:** Use an `idempotencyKey` to prevent duplicate enrichments and classifications when retrying failed operations.
- **Why:** Ensures safe retries without side effects, which is critical in distributed systems where the same operation might be executed multiple times due to failures.
- **Trade-off:** Introduces additional responsibility to the producer layer (lead module) to generate and manage the idempotency key (UUID). It also increases complexity and requires extra read operations (e.g., checking existing records by key).

### 5. **Cursor-Based Streaming for CSV Export**
- **Decision:** Export leads (with enrichments and classifications) via CSV using cursor-based streaming directly in the HTTP response.
- **Why:** The challenge requires exporting potentially large datasets. Streaming avoids loading all data into memory and allows the response to be sent progressively to the client, making it more memory-efficient and scalable.
- **Trade-off:** More complex than traditional pagination and requires coordination on the client-side (e.g., handling streaming responses and headers properly). However, this trade-off is justified by the improved performance and lower memory footprint.

- **Future Improvement:**  
  A more robust approach would be to offload CSV generation to a dedicated worker. Instead of streaming, the system would:
  1. Generate the file in chunks (batch processing)
  2. Persist it in a blob storage (e.g., S3)
  3. Notify the user (e.g., via email) with a download link  

  This approach removes request/response coupling, avoids long-lived HTTP connections, and allows the same report to be reused by multiple users if needed (e.g., for recurring reports or time-series data).

### 6. **Structured Ollama Prompt for Classification**
- **Decision:** Use a structured Portuguese prompt with explicit instructions and expected JSON output format, combined with a defensive parser and fallback handling.
- **Why:** The challenge requires AI-based classification using Ollama with some level of robustness. Providing a well-structured prompt improves output consistency, and the parser with fallback ensures the system can handle model variability without breaking.
- **Trade-off:** The model may not strictly follow the expected format, especially with smaller models. Output quality and consistency depend heavily on the chosen model.


### 7. **Mock API as a Separate Service**
- **Decision:** Implement the enrichment mock as a standalone HTTP service running in Docker Compose.
- **Why:** This follows the challenge requirement of simulating an external dependency. It also isolates the integration boundary, making it easier to replace with a real API in the future and enabling proper integration testing.
- **Trade-off:** Adds an extra service/container and slight latency compared to in-process mocks, but provides a more realistic architecture and better separation of concerns.

### 8. **Module Communication via Explicit Ports (In-Process vs Network Boundaries)**
- **Decision:** Define explicit “ports” for inter-module communication. The `lead` module exposes a well-defined API (via providers), which is consumed internally by other modules (e.g., enrichment and classification) using dependency injection.
- **Why:** Since the architecture is modular and modules can be composed into different runnable apps, some level of communication between them is necessary. By exposing explicit interfaces (ports), the system maintains clear boundaries while still allowing reuse. This approach avoids tight coupling at the implementation level and keeps modules interchangeable.
- **Trade-off:** For this challenge, the chosen approach uses in-process dependencies (shared code via DI), meaning that workers include code they don’t strictly need (e.g., parts of the lead module). This increases bundle size and coupling at the codebase level.
- **Future Improvement:**  
  This design allows evolving the communication strategy without major refactoring. For stronger isolation, the internal provider could be replaced with a network-based adapter (e.g., HTTP/gRPC), where workers fetch data from the main API instead of importing the module directly.  

  This would:
  - Reduce code coupling between services  
  - Improve deployment independence  
  - Better reflect a true microservices architecture  

  The current approach was chosen to avoid premature optimization and keep the system simpler for the scope of the challenge, while still enabling this evolution path.


## 🔧 Useful Commands

### Development

```bash
# Install dependencies
pnpm install

```

### Docker 

```bash
# Start all services
docker compose up

# Start in background
docker compose up -d

# Stop all services
docker compose down

# View logs
docker compose logs -f
docker compose logs -f lead-api
docker compose logs -f enrichment

# Stop a specific service
docker compose stop lead-api

# Restart a service
docker compose restart enrichment
```

### RabbitMQ Management UI

Access RabbitMQ admin at **http://localhost:15673** with credentials:
- **Username:** `quark`
- **Password:** `quark`

Here you can:
- View queues and their message counts
- Monitor consumers
- Inspect messages in dead-letter queues
- Purge queues (useful for testing)

---

## 🐛 Troubleshooting

### Services fail to start

**Problem:** Containers exit with errors on `docker compose up`

**Solution:**
1. Check logs: `docker compose logs -f [service-name]`
2. Ensure ports 5433, 5673, 11435, 3000, 3001 are free
3. Rebuild images: `docker compose build --no-cache && docker compose up`

### Ollama takes too long to start

**Problem:** `ollama-pull` service hangs or times out

**Solution:**
1. Ollama downloads tinyllama (~637 MB) on first run
2. Check Docker memory allocation (Docker Desktop → Preferences → Resources)
3. Manually pull: `docker exec ollama ollama pull tinyllama`

### Database migrations not applied

**Problem:** Tables don't exist; Prisma client out of sync

**Solution:**
```bash
pnpm prisma:generate       # Regenerate Prisma client
docker compose down -v     # Remove volumes
docker compose up          # Fresh start
```

### Tests fail with "Cannot find module"

**Problem:** Path aliases not resolving in tests

**Solution:**
1. Ensure `vitest.config.ts` has correct alias mappings
2. Run `pnpm prisma:generate` to sync Prisma types
3. Clear cache: `rm -rf node_modules .turbo dist`
4. Reinstall: `pnpm install`

---

## 📄 License

MIT License

---

**Built with ❤️ using NestJS, TypeScript, PostgreSQL, RabbitMQ, and Ollama.**
