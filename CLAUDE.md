# Repository Guidelines

## Architecture Overview

This project uses **NestJS + TypeScript** for a lead enrichment and AI classification system. The codebase follows a **two-root monorepo layout** with pnpm workspaces:

```
modules/                  # Domain modules (@quark/* packages)
├── shared/               # @quark/shared – Config, Prisma, RabbitMQ
├── lead/                 # @quark/lead – Lead entity, service, HTTP controller, queue producers
├── enrichment/           # @quark/enrichment – Enrichment service, mock-api HTTP client, queue consumer
├── extraction/           # @quark/extraction – Classification service, Ollama HTTP client, queue consumer
└── mock-api/             # @quark/mock-api – Mock enrichment API (simulates third-party service)

app/                      # Runnable NestJS applications (compose modules + expose HTTP/queue)
├── lead-api/             # HTTP REST API – Lead CRUD operations
├── enrichment/           # RabbitMQ worker – consumes enrichment queue, calls mock-api
├── extraction/           # RabbitMQ worker – consumes classification queue, calls Ollama
└── mock-api/             # HTTP API – mock company enrichment endpoint
```

Database: `prisma/schema.prisma` (PostgreSQL with Leads, Enrichments, Classifications models).

### Architecture Rules
- **`modules/`** contains domain logic: entities, services, HTTP controllers, HTTP clients, queue producers/consumers.
- **`app/`** contains bootstrap entry points — each app imports from `modules/`, composes them, and runs as a standalone process (HTTP server or RabbitMQ worker).
- **Constraint:** Apps import from modules; modules **never** import from app.
- **`modules/shared/`** is the shared infrastructure: Zod config validation, Prisma client, RabbitMQ constants/client.

---

## Modules & Applications

### Modules (`modules/`)

#### `@quark/shared` — Shared Infrastructure
- **Location:** `modules/shared/`
- **Purpose:** Cross-cutting configuration, database, and messaging
- **Exports:**
  - `AppConfigModule` + `ConfigService` — Zod-validated env vars: `DATABASE_URL`, `RABBITMQ_URL`, `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, `MOCK_API_URL`, `LEAD_API_PORT`, `MOCK_API_PORT`
  - `PrismaModule` + `PrismaService` — PostgreSQL client via Prisma ORM
  - `RabbitmqModule` — RabbitMQ client registration via `ClientsModule.registerAsync`
- **No HTTP endpoints.** No queue consumers. Pure infra.

#### `@quark/lead` — Lead Domain
- **Location:** `modules/lead/`
- **Purpose:** Lead entity, CRUD service, HTTP REST controller, queue job producers
- **Structure:**
  ```
  lead/
    lead.module.ts          # NestJS module
    core/
      entity/               # Lead, Enrichment, Classification entities (3 models)
      service/
        lead.service.ts     # CRUD operations via Prisma
    http/
      controller/           # REST endpoints: POST/GET/GET:id/PATCH:id/DELETE:id /leads
      dto/                  # CreateLeadDto, UpdateLeadDto, ListLeadsQueryDto
      response/             # Response serialization
    queue/
      producer/
        enrichment-job.queue-producer.ts          # emits ENRICHMENT_TRIGGER
        classification-job.queue-producer.ts      # emits CLASSIFICATION_TRIGGER
  ```
- **HTTP Endpoints:** `/leads` (full CRUD)
- **Queue Producers:** Triggered after lead creation to enqueue enrichment + classification jobs
- **Dependencies:** Imports from `@quark/shared` (Prisma, RabbitMQ)

#### `@quark/enrichment` — Company Data Enrichment Worker
- **Location:** `modules/enrichment/`
- **Purpose:** Consumes enrichment jobs, calls mock-api HTTP service, persists results
- **Structure:**
  ```
  enrichment/
    enrichment.module.ts            # NestJS module
    core/
      service/
        enrichment.service.ts       # Create/update enrichment records via Prisma
    http/
      client/
        mock-api.client.ts          # HTTP GET {MOCK_API_URL}/enrichment/{cnpj}
    queue/
      consumer/
        enrichment.queue-consumer.ts  # @EventPattern(ENRICHMENT_TRIGGER)
  ```
- **Queue Consumer:** `@EventPattern('enrichment-trigger')` → creates record → calls mock-api → updates success/failure
- **HTTP Client:** Calls `@quark/mock-api` (external service)
- **Dependencies:** Imports from `@quark/shared` (Prisma, RabbitMQ, HttpModule)

#### `@quark/extraction` — AI Lead Classification Worker
- **Location:** `modules/extraction/`
- **Purpose:** Consumes classification jobs, calls Ollama LLM, parses + persists results
- **Structure:**
  ```
  extraction/
    extraction.module.ts            # NestJS module
    core/
      service/
        extraction.service.ts       # Create/update classification records via Prisma
    http/
      client/
        ollama.client.ts            # HTTP POST {OLLAMA_BASE_URL}/api/generate
    queue/
      consumer/
        extraction.queue-consumer.ts  # @EventPattern(CLASSIFICATION_TRIGGER)
  ```
- **Queue Consumer:** `@EventPattern('classification-trigger')` → creates record → builds B2B prospecting prompt (Portuguese) → calls Ollama → parses JSON response (`{score, classification (HOT/WARM/COLD), justification, commercialPotential (HIGH/MEDIUM/LOW)}`) → updates record
- **Fallback:** If JSON parse fails, defaults to `{score: 50, WARM, MEDIUM}`
- **HTTP Client:** Calls local Ollama service
- **Dependencies:** Imports from `@quark/shared` (Prisma, RabbitMQ, HttpModule)

#### `@quark/mock-api` — Mock Enrichment API
- **Location:** `modules/mock-api/`
- **Purpose:** Simulates third-party company enrichment API (e.g., Receita Federal)
- **Structure:**
  ```
  mock-api/
    mock-api.module.ts              # NestJS module
    core/
      service/
        mock-api.service.ts         # Static mock data lookup
    http/
      controller/
        company.controller.ts       # GET /enrichment/:cnpj
  ```
- **HTTP Endpoint:** `GET /enrichment/{cnpj}` → returns static company data (legalName, partners, addresses, CNAEs, foundedAt, phones, emails)
- **No Queue:** Pure HTTP service
- **Dependencies:** Minimal (no Prisma, no RabbitMQ)

### Applications (`app/`)

#### `app/lead-api` — REST API Server
- **Port:** `LEAD_API_PORT` (default `3000`)
- **Purpose:** Public-facing HTTP server for Lead CRUD + job triggers
- **Root Module:** `LeadApiModule` (imports `AppConfigModule`, `PrismaModule`, `RabbitmqModule`, `LeadModule`)
- **Bootstrap:** `main.ts` — standard NestJS HTTP app with global `ValidationPipe` (whitelist, forbidNonWhitelisted, transform)
- **Endpoints:** Delegates to `/leads` controller from `@quark/lead`
- **Dependencies:** `@quark/lead`, `@quark/shared`

#### `app/enrichment` — RabbitMQ Worker
- **Transport:** RabbitMQ microservice (queue: `default-queue`)
- **Purpose:** Worker process for enrichment jobs
- **Root Module:** `EnrichmentAppModule` (imports `AppConfigModule`, `EnrichmentModule`)
- **Bootstrap:** `main.ts` — NestJS microservice via `connectMicroservice(Transport.RMQ)`
- **Consumes:** `enrichment-trigger` events
- **Dependencies:** `@quark/enrichment`, `@quark/shared`

#### `app/extraction` — RabbitMQ Worker
- **Transport:** RabbitMQ microservice (queue: `default-queue`)
- **Purpose:** Worker process for AI classification jobs
- **Root Module:** `ExtractionAppModule` (imports `AppConfigModule`, `ExtractionModule`)
- **Bootstrap:** `main.ts` — NestJS microservice via `connectMicroservice(Transport.RMQ)`
- **Consumes:** `classification-trigger` events
- **Dependencies:** `@quark/extraction`, `@quark/shared`

#### `app/mock-api` — Mock API Server
- **Port:** `MOCK_API_PORT` (default `3001`)
- **Purpose:** HTTP server simulating external enrichment API
- **Root Module:** `MockApiAppModule` (imports `AppConfigModule`, `MockApiModule`)
- **Bootstrap:** `main.ts` — standard NestJS HTTP app
- **Endpoints:** `GET /enrichment/{cnpj}` (delegates to `@quark/mock-api`)
- **Dependencies:** `@quark/mock-api`, `@quark/shared`

---

## Internal Module Structure

Each **main module** (e.g., `identity/`, `crm/`, `communication/`) follows this structure:

```
[module]/
  [module].module.ts              # NestJS module that imports sub-modules

  [sub-module-1]/
    [sub-module-1].module.ts      # NestJS module definition

    core/                         # Pure domain logic (no framework)
      entity/                     # Models (data schemas without business rules)
      exception/                  # Domain-specific exceptions (with i18n support)
      factory/                    # Entity creation factories
      interface/                  # Contracts & abstractions
      service/                    # Domain services
      usecase/                    # Use cases (optional; single-method services)

    http/                         # HTTP/REST layer (NestJS)
      controller/                 # Controllers & routes
      dto/                        # DTOs with class-validator
      response/                   # Response/serialization classes
      __test__/                   # E2E controller tests

    infra/                        # Sub-module-specific infrastructure
      *.adapter.ts                # WhatsApp API, channel-specific logic, etc

    integration/                  # Public API for this sub-module
      provider/                   # Implementations of public contracts

    persistence/                  # Data access (Prisma) - currently unused
      [entity].repository.ts      # Repository implementations

    queue/                        # Message queue (optional)
      producer/                   # Job producers
      consumer/                   # Job consumers

  [sub-module-2]/
    # Same structure as [sub-module-1]

  # Optional: shared contracts for sub-modules
  integration/
    interface/                    # Public contracts exposed by main module
```

### Layer Rules

#### Within `core/` Layers

| Layer | Rules |
|-------|-------|
| `core/entity/` | **Pure models.** Data schemas with no business logic. Example: `User`, `Lead`, `Campaign`. |
| `core/exception/` | Domain-specific exceptions only. Must support i18n (translation keys, see `@exception/` base class). |
| `core/factory/` | Entity creation logic. Stateless factories with validation. |
| `core/interface/` | Define contracts: abstract repositories, domain DTOs (`.dto.type.ts`), response types (`.response.type.ts`). |
| `core/service/` | Domain services. Complex business logic, state machines, orchestration. |
| `core/usecase/` | (Optional) Use cases with single `execute()` method. Preferred over services for single-purpose operations. |

#### Inter-Layer Rules

| Layer | Rules |
|-------|-------|
| `core/` **overall** | **Pure TypeScript.** No NestJS, Prisma, or HTTP. No external dependencies except domain types. |
| `http/` | Controllers consume core services/usecases. DTOs use `class-validator`. Responses use `@Response` decorator. |
| `persistence/` | Implements `core/interface/` repositories using Prisma. Pure data access logic. Currently not in use. |
| `infra/` | **Sub-module-specific infrastructure.** Adapters for external APIs, channel-specific logic (e.g., WhatsApp), local utilities. NOT global infra. |
| `integration/provider/` | Implements public contracts for this sub-module. Other modules call via interface, this implements it. |

#### Sub-Module Isolation

**Sub-modules within a main module are standalone.** If `account` sub-module needs something from `channel` sub-module:

```typescript
// ✅ channel/ exposes public interface
// integration/interface/channel.public-api.interface.ts
export interface ChannelPublicApi {
  getChannelById(id: string): Promise<Channel>;
}

// ✅ account/ depends on interface
// account/core/service/account.service.ts
constructor(private channelApi: ChannelPublicApi) {}

// ❌ Never do this
import { ChannelService } from '../channel/core/service/channel.service';
```

**Main module registers implementations:**

```typescript
// communication.module.ts
@Module({
  imports: [AccountModule, ChannelModule],
  providers: [
    // Implementation of ChannelPublicApi
    {
      provide: 'ChannelPublicApi',
      useExisting: ChannelService,
    },
  ],
})
export class CommunicationModule {}
```

---

## Local vs Global Infrastructure

### Global Infrastructure (`shared/module/infra/`)
Services shared across ALL modules:
- **Database:** Prisma client configuration
- **Email:** SendGrid, SMTP adapters
- **File Storage:** S3, cloud storage abstractions
- **Auth:** JWT strategies, decorators
- **Config:** Environment variables, validation
- **Redis:** Caching, sessions
- **Logging:** Observability, tracing

### Local Infrastructure (`[module]/infra/`)
Services specific to a single module:
- **WhatsApp adapter** in `communication/channel/infra/` (only used by channel sub-module)
- **Campaign dispatch strategy** in `campaign/core/` (internal domain logic)
- **Prisma Service instance** scoped to one module (if decoupled from global Prisma)
- **Custom validators** for a specific entity
- **Module-specific utilities**

**Key Rule:** If infra is used by multiple modules, move to `shared/module/infra/`. If it's only used locally, keep it in `[module]/infra/`.

---

## Sub-Module Organization

Main modules can have **sub-modules** (e.g., `communication/account`, `communication/channel`). Sub-modules follow the same internal structure and isolation rules:

### Sub-Module Structure

```
[module]/
  [sub-module-1]/
    [sub-module-1].module.ts
    core/
      entity/, exception/, factory/, interface/, service/, usecase/
    http/
      controller/, dto/, response/, __test__/
    infra/
    integration/
      interface/    # Public contracts from this sub-module
      provider/     # Implementations

  [sub-module-2]/
    # Same as [sub-module-1]

  # Main module's own public API (optional)
  integration/
    interface/      # Aggregated public API for main module
```

### Sub-Module Isolation

Sub-modules within the same main module **must not import from each other directly**. Use the **two-tier API pattern**:

```typescript
// ❌ WRONG: communication/channel/ importing from communication/account/
import { AccountService } from '../account/core/service/account.service';

// ✅ RIGHT: communication/account/ depends on channel's interface
import { ChannelPublicApi } from '../channel/integration/interface/channel.public-api.interface';
```

#### Two-Tier API Pattern (Sub-Module to Sub-Module)

**Tier 1: Sub-Module Interface** (exposes contract)
```typescript
// communication/channel/integration/interface/channel.public-api.interface.ts
export interface ChannelPublicApi {
  getChannelById(id: string): Promise<Channel>;
}

export const ChannelPublicApi = Symbol('ChannelPublicApi');
```

**Tier 2: Sub-Module Provider** (implements contract)
```typescript
// communication/channel/integration/provider/channel.public-api.provider.ts
@Injectable()
export class ChannelPublicApiProvider implements ChannelPublicApi {
  constructor(private channelService: ChannelService) {}

  async getChannelById(id: string): Promise<Channel> {
    return this.channelService.findById(id);
  }
}
```

**Registration** at main module level:
```typescript
// communication.module.ts
@Module({
  imports: [AccountModule, ChannelModule],
  providers: [
    {
      provide: ChannelPublicApi,
      useClass: ChannelPublicApiProvider,
    },
  ],
})
export class CommunicationModule {}
```

**Consumption** by another sub-module:
```typescript
// communication/account/core/service/account.service.ts
@Injectable()
export class AccountService {
  constructor(
    @Inject(ChannelPublicApi)
    private readonly channelApi: ChannelPublicApi,
  ) {}

  async getAccountChannel(accountId: string): Promise<Channel> {
    return this.channelApi.getChannelById(accountId);
  }
}
```

### Main Module's Public API (Optional)

If the main module itself needs to expose contracts:

```
[module]/
  integration/
    interface/
      [main-module].public-api.interface.ts    # Main module contracts
    provider/
      [main-module].public-api.provider.ts     # Implementations

  # or delegate to sub-modules
  # (communication doesn't expose a main-module interface; it exposes sub-module APIs)
```

---

## Module Isolation (DDD)

**Main modules must NOT import from each other directly.** Always use the **two-tier API pattern** for both:
- Cross-module communication (between different main modules)
- Sub-module communication (between sub-modules within the same main module)

### Valid Inter-Module Communication

#### 1. Synchronous via Two-Tier API Pattern (Dependency Inversion)

**Tier 1: Main Module Interface** (defines contract for cross-module use)
```typescript
// src/shared/module/integration/interface/crm-integration.interface.ts
export interface CrmApi {
  findLeadById(id: string): Promise<Lead>;
  listLeadsByWorkspace(workspaceId: string): Promise<Lead[]>;
}

export const CrmApi = Symbol('CrmApi');
```

**Tier 2: Main Module Facade** (delegates to sub-modules or services)
```typescript
// src/module/crm/integration/provider/crm.public-api.provider.ts
@Injectable()
export class CrmPublicApiProvider implements CrmApi {
  constructor(private leadService: LeadService) {}

  async findLeadById(id: string): Promise<Lead> {
    return this.leadService.findById(id);
  }

  async listLeadsByWorkspace(workspaceId: string): Promise<Lead[]> {
    return this.leadService.listByWorkspace(workspaceId);
  }
}
```

**Registration** at main module:
```typescript
// src/module/crm/crm.module.ts
@Module({
  imports: [LeadModule, TagModule],
  providers: [
    {
      provide: CrmApi,
      useClass: CrmPublicApiProvider,
    },
  ],
  exports: [CrmApi],
})
export class CrmModule {}
```

**Consumption** by other module:
```typescript
// src/module/campaign/core/service/campaign.service.ts
@Injectable()
export class CampaignService {
  constructor(
    @Inject(CrmApi)
    private readonly crmApi: CrmApi,
  ) {}

  async createCampaignForLead(leadId: string): Promise<Campaign> {
    const lead = await this.crmApi.findLeadById(leadId);
    // Create campaign...
  }
}
```

**File Structure for Cross-Module API:**
- Interface: `shared/module/integration/interface/[module]-integration.interface.ts`
- Provider: `[module]/integration/provider/[module].public-api.provider.ts`
- Registration: `[module]/[module].module.ts` (export CrmApi)

#### 2. Asynchronous via Domain Events/Queues

```typescript
// ✅ Decoupled event publishing
// campaign/ publishes event when campaign finishes
import { CAMPAIGN_FINISHED_EVENT } from '@shared/module/domain-events/events.const';

this.eventDispatcher.publish(CAMPAIGN_FINISHED_EVENT, { campaignId });

// conversation/ (or any module) can subscribe to this event
```

### Invalid Patterns

```typescript
// ❌ Direct import from another module's core
import { CrmService } from '@root/module/crm/core/service/crm.service';
import { Lead } from '@root/module/crm/core/entity/lead';

// ❌ Importing implementation provider directly
import { CrmPublicApiProvider } from '@root/module/crm/integration/provider/crm.public-api.provider';

// ❌ Cross-module service access
import { ChatStatusService } from '@root/module/conversation/chat/core/service/chat-status.service';
// (instead, use ChatStatusConversationApi interface)
```

---

## Two-Tier API Pattern (Complete Reference)

The **two-tier API pattern** ensures loose coupling between modules and sub-modules. All cross-boundary communication must flow through these two layers:

### Pattern Overview

```
Layer 1: Interface (Contract)
  ↓
Layer 2: Provider (Implementation)
  ↓
Registration & Dependency Injection
```

### Use Cases & Examples

#### 1. **Sub-Module to Sub-Module** (within main module)

**Example:** `conversation/chat` needs to access `conversation/message`

**Layer 1 - Sub-Module Interface:**
```typescript
// conversation/message/integration/interface/message-integration.interface.ts
export interface MessageConversationApi {
  getMessageCountByChat(chatId: string): Promise<number>;
}

export const MessageConversationApi = Symbol('MessageConversationApi');
```

**Layer 2 - Sub-Module Provider:**
```typescript
// conversation/message/integration/provider/message.public-api.provider.ts
@Injectable()
export class MessageConversationProviderApi implements MessageConversationApi {
  constructor(
    @Inject(IMessageRepository)
    private readonly messageRepository: IMessageRepository,
  ) {}

  async getMessageCountByChat(chatId: string): Promise<number> {
    return this.messageRepository.countByChat(chatId);
  }
}
```

**Registration in Sub-Module:**
```typescript
// conversation/message/message.module.ts
@Module({
  providers: [
    MessageConversationProviderApi,
    {
      provide: MessageConversationApi,
      useClass: MessageConversationProviderApi,
    },
  ],
  exports: [MessageConversationApi],
})
export class MessageModule {}
```

**Consumption by Other Sub-Module:**
```typescript
// conversation/chat/core/service/chat.service.ts
@Injectable()
export class ChatService {
  constructor(
    @Inject(MessageConversationApi)
    private readonly messageApi: MessageConversationApi,
  ) {}

  async getChatSummary(chatId: string) {
    const messageCount = await this.messageApi.getMessageCountByChat(chatId);
    return { chatId, messageCount };
  }
}
```

**Registration at Main Module Level:**
```typescript
// conversation/conversation.module.ts
@Module({
  imports: [ChatModule, MessageModule],
  // MessageConversationApi is exported from MessageModule
  // ChatModule imports it via standard NestJS imports
})
export class ConversationModule {}
```

---

#### 2. **Sub-Module to Main-Module Facade** (cross-module access)

**Example:** `communication/account` needs ChatStatus from `conversation/chat`

**Layer 1 - Sub-Module Interface:**
```typescript
// conversation/chat/integration/interface/chat-status-integration.interface.ts
export interface ChatStatusConversationApi {
  findChatStatusIdByPositionOrThrow(
    workspaceId: string,
    position: IChatStatusPosition,
  ): Promise<string>;
}

export const ChatStatusConversationApi = Symbol('ChatStatusConversationApi');
```

**Layer 2 - Sub-Module Provider:**
```typescript
// conversation/chat/integration/provider/chat-status.public-api.provider.ts
@Injectable()
export class ChatStatusConversationProviderApi implements ChatStatusConversationApi {
  constructor(
    @Inject(IChatStatusRepository)
    private readonly chatStatusRepository: IChatStatusRepository,
  ) {}

  async findChatStatusIdByPositionOrThrow(
    workspaceId: string,
    position: IChatStatusPosition,
  ): Promise<string> {
    const chatStatus = await this.chatStatusRepository.findByPosition(
      workspaceId,
      position,
    );

    if (!chatStatus) {
      throw new NotFoundChatStatusException();
    }

    return chatStatus.id;
  }
}
```

**Tier 1.5 - Main Module Cross-Module Interface:**
```typescript
// src/shared/module/integration/interface/conversation-integration.interface.ts
export interface ConversationApi {
  findChatStatusIdByPositionOrThrow(
    workspaceId: string,
    position: IChatStatusPosition,
  ): Promise<string>;
}

export const ConversationApi = Symbol('ConversationApi');
```

**Tier 2.5 - Main Module Facade:**
```typescript
// conversation/integration/provider/conversation.public-api.provider.ts
@Injectable()
export class ConversationPublicApiProvider implements ConversationApi {
  constructor(
    @Inject(ChatStatusConversationApi)
    private readonly chatStatusApi: ChatStatusConversationApi,
  ) {}

  async findChatStatusIdByPositionOrThrow(
    workspaceId: string,
    position: IChatStatusPosition,
  ): Promise<string> {
    return this.chatStatusApi.findChatStatusIdByPositionOrThrow(
      workspaceId,
      position,
    );
  }
}
```

**Registration at Sub-Module:**
```typescript
// conversation/chat/chat.module.ts
@Module({
  providers: [
    ChatStatusConversationProviderApi,
    {
      provide: ChatStatusConversationApi,
      useClass: ChatStatusConversationProviderApi,
    },
  ],
  exports: [ChatStatusConversationApi],
})
export class ChatModule {}
```

**Registration at Main Module:**
```typescript
// conversation/conversation.module.ts
@Module({
  imports: [ChatModule, MessageModule, CommunicationModule],
  providers: [
    ConversationPublicApiProvider,
    {
      provide: ConversationApi,
      useClass: ConversationPublicApiProvider,
    },
  ],
  exports: [ConversationApi],
})
export class ConversationModule {}
```

**Consumption by Other Module:**
```typescript
// communication/account/infra/handlers/chats-set/chats-set.handler.event.evolution.ts
@Injectable()
export class ChatsSetHandlerEventEvolution {
  constructor(
    @Inject(ConversationApi)
    private readonly conversationApi: ConversationApi,
  ) {}

  async handle(event: ChatsSetWebhook): Promise<void> {
    const chatStatusId =
      await this.conversationApi.findChatStatusIdByPositionOrThrow(
        workspace.id,
        ChatStatusPositionEnum.INITIAL,
      );
    // Use chatStatusId...
  }
}
```

**Other Module Imports ConversationModule:**
```typescript
// communication/account/account.module.ts
@Module({
  imports: [
    ConversationModule,  // ← Imports to access ConversationApi
    // ... other imports
  ],
})
export class AccountModule {}
```

---

### Pattern Summary: File Locations

| Layer | Sub-Module | Main Module | Location Pattern |
|-------|-----------|-------------|------------------|
| **Interface** | ✅ | ✅ | `[module]/[sub-module]/integration/interface/[entity]-integration.interface.ts` |
| **Provider** | ✅ | ✅ | `[module]/integration/provider/[entity].public-api.provider.ts` |
| **Registration** | ✅ | ✅ | `[module]/[sub-module]/[sub-module].module.ts` + `[module]/[module].module.ts` |
| **Export** | ✅ | ✅ | Same module's `@Module({ exports: [SomeApi] })` |
| **Cross-Module Interface** | N/A | ✅ | `shared/module/integration/interface/[module]-integration.interface.ts` |

---

#### 2. **Asynchronous via Domain Events/Queues**

```typescript
// ✅ Decoupled event publishing
// campaign/ publishes event when campaign finishes
import { CAMPAIGN_FINISHED_EVENT } from '@shared/module/domain-events/events.const';

this.eventDispatcher.publish(CAMPAIGN_FINISHED_EVENT, { campaignId });

// conversation/ (or any module) can subscribe to this event
```

---

## Development Workflow

All implementation tasks follow this **7-phase workflow**:

### Phase 1: Pre-flight Check
- Check git status: `git status`
- If files are staged, ask user to commit first (ensure clean working tree)
- Only proceed once staging area is empty

### Phase 2: Planning (EnterPlanMode)
- **ALWAYS enter plan mode** before implementing any changes
- **No code execution without explicit user approval**
- Plan must include:
  - Which CLAUDE.md rules and architecture patterns apply
  - Which skills to use (`/entity-creation`, `/factory-creation`, `/controller-builder`, `/e2e-test`, `/unit-test`, `/query-builder`, `/service-builder`, `/git-workflow`, `/changelog`, `/logging`, `/skill-creation`, `/enumerable`)
  - Affected files and structure changes
  - Testing strategy (what to test, what not to test)
  - Commit strategy (logical grouping per `/git-workflow`)
- Wait for ExitPlanMode approval before writing any code

### Phase 3: Testing
Test according to component type:

| Component | Scope | Framework | Location |
|-----------|-------|-----------|----------|
| **Controllers** | Happy path + validation errors only | E2E (database + HTTP) | `src/[module]/http/__test__/[entity].controller.e2e.spec.ts` |
| **Services/UseCases** | Happy path + input validations | Unit (mocked deps) | `src/[module]/**/__test__/[entity].spec.ts` |
| **Other** | Ask user what to test | Varies | Varies |

**Testing Philosophy:**
- **Happy path only:** Cover main success flow
- **Input validations:** Test required field checks, type validation
- **Suggest edge cases:** Ask user via prompt if specific edge cases should be tested
- **E2E is focused:** Only test necessary endpoints, not every status code combination
- Follow skill guidelines: `/e2e-test` for controllers, `/unit-test` for services/usecases

### Phase 4: Plan Review & Execution Verification
After implementation, verify:
- ✅ All planned steps completed
- ✅ All referenced skills properly applied
- ✅ Tests pass and cover critical paths
- ✅ Code follows CLAUDE.md conventions
- ✅ No staged files left uncommitted

### Phase 5: Suggestions & Rule Updates
- Identify any broken patterns during execution
- If pattern broken: Suggest updates to CLAUDE.md or skills
- Ask user: Should we formalize this change?
- Document findings in memory for future tasks

### Phase 6: Logical Commits (Use `/git-workflow` Skill)
- **Skill:** `/git-workflow` (mandatory for all commits)
- **One logical change per commit** (not per file)
- **Branch:** Ensure you're on feature branch (`feat/**`, `fix/**`, or `chore/**`)
- **Format:** `[type]([scope]): [imperative message]` (follow Conventional Commits)
  - Example: `feat(campaign): add message reordering`
  - Example: `test(communication): add channel controller e2e tests`
  - Example: `fix(identity): handle missing user in invitation`
  - Example: `chore(deps): upgrade prisma to 5.x`
- **Atomic commits:** Each commit = one logical change, no file mixing
- **Group related changes:** Don't mix unrelated feat + chore
- **Before pushing:** Use `git rebase` to clean history
- **Push & PR:** Follow `/git-workflow` PR workflow (create PR, review, merge to develop)

### Phase 7: Update Changelog & Release (Use `/changelog` Skill)
- **Skill:** `/changelog` (mandatory for releases)
- **Review commits:** Analyze commits since last release to determine version bump
  - `feat()` commits → MINOR version bump
  - `fix()` commits → PATCH version bump
  - `BREAKING CHANGE` → MAJOR version bump
- **Update CHANGELOG.md:**
  - Aggregate changes from commits
  - Create new section: `## [X.Y.Z] - YYYY-MM-DD`
  - Use sections: Added, Changed, Fixed, Deprecated, Removed, Security
  - Include affected modules in parentheses: `(module)`
- **Bump version:** Use `pnpm version [major|minor|patch]`
  - Automatically updates `package.json`
  - Creates git tag `v[X.Y.Z]`
  - Creates commit with version change
- **Push with tags:** `git push origin [branch] --follow-tags`

---

## Shared Modules

Utilities shared across bounded contexts live in `src/shared/`:

| Path | Purpose |
|------|---------|
| `shared/lib/core/` | Primitives: `Entity`, `Id`, `Repository`, `Factory`, `UseCase`, `Exception` |
| `shared/lib/auth/` | Auth utilities: enums, helpers, auth types |
| `shared/lib/utils/` | General utilities: date helpers, validators, converters |
| `shared/module/auth/` | NestJS auth: guards, decorators, strategies |
| `shared/module/prisma/` | Prisma shared client & utilities |
| `shared/module/config/` | ConfigModule with environment validation |
| `shared/module/email/` | Email adapters & sender |
| `shared/module/redis/` | Redis client & caching |
| `shared/module/domain-events/` | Event dispatcher, queue constants, schemas |
| `shared/module/integration/interface/` | **Public contracts between modules** |

---

## File Naming Conventions

Files follow strict patterns for clarity. Use descriptive, dot-separated names for sub-entity relationships:

| Artifact | Pattern | Example |
|----------|---------|---------|
| **Entity** | `[name].[domain].ts` | `campaign.status.ts`, `campaign.message.sequence.ts`, `text.campaign.message.content.ts` |
| **Exception** | `[issue].[entity].exception.ts` | `not-found.campaign.exception.ts`, `invalid-status.campaign.exception.ts`, `cant-cancel.status.campaign.exception.ts` |
| **Factory** | `[entity].factory.ts` | `campaign.factory.ts`, `campaign.message.content.factory.ts`, `dispatch.campaign.factory.ts` |
| **Repository Abstract** | `[entity].repository.abstract.ts` | `campaign.repository.abstract.ts`, `campaign.message.repository.abstract.ts` |
| **Domain DTO** | `[action].[entity].dto.type.ts` | `create.text.campaign.message.dto.type.ts`, `update.campaign.dto.type.ts`, `setup.campaign.dto.type.ts` |
| **Response Type** | `[entity].response.type.ts` | `campaign.response.type.ts`, `campaign.message.response.type.ts`, `list-on-campaign.campaign.response.type.ts` |
| **Domain Service** | `[entity].service.ts` | `campaign.service.ts`, `lead.service.ts` |
| **Domain UseCase** | `[action].[entity].usecase.ts` | `send.notification.usecase.ts`, `create.campaign.usecase.ts` |
| **Controller** | `[entity].controller.ts` | `campaign.messages.controller.ts`, `campaign.controller.ts`, `lead.controller.ts` |
| **HTTP DTO** | `[action].[entity].dto.ts` | `create.text.campaign.message.dto.ts`, `update.campaign.dto.ts` |
| **HTTP Response** | `[entity].response.ts` | `campaign.message.response.ts`, `campaign.response.ts`, `text.campaign.message.response.ts` |
| **Queue Producer** | `[event].job.queue-producer.ts` | `workspace-create.job.queue-producer.ts`, `campaign-dispatch.job.queue-producer.ts` |
| **Queue Consumer** | `[event].queue-consumer.ts` | `link-membership.queue-consumer.ts`, `campaign-delivery.queue-consumer.ts` |
| **Integration Provider** | `[entity].public-api.provider.ts` | `user.public-api.provider.ts`, `crm.public-api.provider.ts`, `lead.public-api.provider.ts` |
| **Infrastructure Adapter** | `[service].adapter.ts` | `whatsapp.adapter.ts`, `bcrypt.adapter.ts`, `sendgrid.adapter.ts` |
| **Unit Test** | `[entity].spec.ts` (in `__test__/`) | `campaign.status.spec.ts`, `campaign.service.spec.ts`, `sequential.execution.dispatch.campaign.spec.ts` |
| **E2E Controller Suite** | `[entity].controller.e2e.spec.ts` | `campaign.messages.controller.e2e.spec.ts`, `lead.controller.e2e.spec.ts` |
| **E2E Test Case** | `[case].[entity].controller.suite.ts` | `create-text.campaign.message.controller.suite.ts`, `list-by-campaign.campaign.message.controller.suite.ts` |

---

## Import Aliases

Use these aliases for cleaner imports. Avoid legacy aliases (marked `DELETE AFTER REFACTORING`).

| Alias | Maps To | Use Case |
|-------|---------|----------|
| `@root/*` | `src/*` | Top-level source imports |
| `@shared/*` | `src/shared/*` | Shared code & modules |
| `@model/*` | `src/shared/lib/core/model/*` | Domain primitives |
| `@contracts/*` | `src/shared/lib/core/contracts/*` | Interfaces & contracts |
| `@exception/*` | `src/shared/lib/core/exception/*` | Base exceptions |
| `@utils/*` | `src/shared/lib/core/utils/*` | Utility functions |
| `@identity/*` | `src/module/identity/*` | Identity module (shortcut) |
| `@communication/*` | `src/module/communication/*` | Communication module (shortcut) |
| `@prisma-dir/*` | `prisma/*` | Prisma schema & migrations |
| `@test/*` | `test/*` | Test helpers & fixtures |

**Legacy aliases (DO NOT USE):**
```typescript
// ❌ These will be removed
@domain/*            // Old domain layer
@domain-service/*    // Old service layer
@base/*              // Old base classes
@infra/*             // Old infra layer
@primitives/*        // Moved to @model/@exception/@utils
```

---

## Commands

| Task | Command |
|------|---------|
| **Install** | `pnpm install` (Node 22.x) |
| **Dev** | `pnpm start` (watch mode, pretty logs) |
| **Debug** | `pnpm start:debug` |
| **Staging/Prod** | `pnpm start:staging` \| `pnpm start:prd` |
| **Build** | `pnpm build` → `dist/` |
| **Lint** | `pnpm lint` / `pnpm lint:fix` |
| **Format** | `pnpm format` |
| **Unit tests** | `pnpm test` / `pnpm test:watch` / `pnpm test:cov` |
| **E2E tests** | `pnpm test:integration` (requires `.env.test`) |
| **Stop E2E infra** | `pnpm docker:test:down` |
| **Prisma** | `pnpm prisma:generate` \| `prisma:migrate` \| `prisma:seed` |

---

## Code Style & Conventions

### TypeScript & Formatting
- **Strict TypeScript** enabled in `tsconfig.json`.
- **Prettier:** 2-space indent, `singleQuote: true`, `trailingComma: 'all'`.
- **ESLint strict mode:** no unused imports, prefer `import type` for types, no floating promises, limit `console` usage.

### Naming
- **Classes & types:** PascalCase (`CampaignStatus`, `CreateTextCampaignMessageDto`)
- **Functions & variables:** camelCase (`getCampaignById`, `campaignId`)
- **Constants:** UPPER_SNAKE_CASE (`DEFAULT_PAGE_SIZE`, `MAX_RETRIES`)

### Import Organization
```typescript
// 1. External packages
import { Injectable } from '@nestjs/common';
import { CampaignStatus } from 'campaign-types';

// 2. Project aliases (@shared, @root, @identity, etc)
import { Campaign } from '@root/module/campaign/core/entity/campaign';
import { Id } from '@model/id';

// 3. Relative imports (only within same module)
import { InvalidStatusException } from '../exception/invalid-status.campaign.exception';

// 4. Type-only imports
import type { CreateCampaignDto } from './create.campaign.dto.type';
```

### Security
- **Never commit secrets.** Use `.env.example` as reference template.
- **Environment:** Set `MODE` to `development|staging|production|test`.
- **Swagger:** Enabled only outside production, available at `/api`.
- **CORS & logging:** Configure via `shared/module/` adapters.

### Domain Exceptions with i18n

All exceptions in `core/exception/` must support translation:

```typescript
// core/exception/invalid-status.campaign.exception.ts
import { DomainException } from '@exception/domain.exception';

export class InvalidStatusCampaignException extends DomainException {
  constructor(currentStatus: string, attemptedStatus: string) {
    super(
      'INVALID_STATUS_CAMPAIGN', // i18n key
      `Cannot transition from ${currentStatus} to ${attemptedStatus}`,
      400, // HTTP status code
    );
  }
}
```

Exception base class handles:
- Translation key (`INVALID_STATUS_CAMPAIGN`)
- Default message (fallback)
- HTTP status code
- Serialization for API responses

---

## Testing

### Unit Tests
- Location: `src/[module]/**/[entity].spec.ts` (in `__test__/` subdirectory)
- Scope: Single module, no external dependencies, use mocks
- Run: `pnpm test` / `pnpm test:watch` / `pnpm test:cov`

### Integration/E2E Tests
- Location: `src/[module]/http/__test__/[entity].controller.e2e.spec.ts`
- Scope: Full HTTP layer with real database (via `docker-compose.test.yaml`)
- Fixtures: Place in `test/fixture/`
- Helpers: Place in `test/helpers/`
- Cleanup: See memory for `workspace-cleanup.helper.ts` patterns
- Run: `pnpm test:integration` (requires `.env.test`)

### Test Organization
- Group related tests into suites using `/e2e-test` skill guidelines
- Order: 2xx (success) → 400 (validation) → 401 (auth) → 403 (forbidden) → 404 (not found) → 409 (conflict)
- Validate response shapes against `@Response` DTOs exactly

---

## Commits & Pull Requests

**Refer to `/git-workflow` skill for complete branch strategy, atomic commits, and PR procedures.**

### Branch Strategy
- **Protected branches:** `main` (production), `develop` (staging) — no direct push
- **Feature branches:** All changes via `feat/**`, `fix/**`, or `chore/**` branches
- **All branches merge into:** `develop` (then `main` for releases)

### Commits
- **Format:** `[type]([scope]): [imperative message]`
  - Example: `feat(campaign): add message reordering`
  - Example: `fix(identity): handle missing user in invitation flow`
  - Example: `chore(prisma): add migration for campaign status enum`

- **Guidelines:**
  - **Atomic commits:** Each commit must be a single logical change
  - One logical change per commit
  - Group related changes (don't mix feat + chore in same PR)
  - Always update `prisma/` migrations and seed when schema changes
  - Use `git rebase` to clean up history before PR

### Pull Requests
- **Title:** Concise, follows commit format (under 70 chars)
- **Description:** Clear problem statement, approach, and testing notes
- **Screenshots:** Include Swagger (`/api`) screenshots when changing endpoints
- **Checks:** Must pass:
  - `pnpm lint`
  - All unit tests
  - All E2E tests (if applicable)
  - GitHub CI
- **Merge:** Always merge `develop` via `/git-workflow` procedure

---

## Planning

For complex features, architectural decisions, or refactoring:

1. **Create plan:** `pnpm run plan` → generates `.claude/plans/[feature].md`
2. **Document:**
   - Overview: What problem does this solve?
   - Approach: How will we solve it? (with diagrams if needed)
   - Steps: Ordered implementation tasks
   - Files: Key files affected
   - Tests: Testing strategy
3. **User decision:** After work completes, ask if they want to **persist** (keep for reference) or **delete** (clean up)

---

## Available Skills

### `/entity-creation`
**Use when:** Creating a new entity class in the domain layer (`core/entity/`).

Defines:
- Entity file structure: enums before class, explicit property assignments
- Constructor accepts typed object (no interface implementation)
- `[Entity]CreationFields` interface lives in `core/entity/types.ts`
- Unidirectional imports: `types.ts` → `entity.ts` (never reverse)

**Invoke:** `/entity-creation`

### `/factory-creation`
**Use when:** Creating a factory class to encapsulate entity instantiation with generated values.

Defines:
- Factory is static class with single `create(data: [Entity]CreationFields): [Entity]` method
- Auto-generates system fields: `id`, `status`, `createdAt`, `updatedAt`
- Explicit property assignments in entity constructor (no spread operator)
- Factory imported in service layer for entity creation

**Invoke:** `/factory-creation`

---