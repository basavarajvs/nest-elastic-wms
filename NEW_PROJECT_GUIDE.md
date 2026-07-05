# New Project Guide — WMS App Architecture & Tech Stack

Use this guide to spin off a greenfield NestJS project reusing the existing database.
Start with `prisma db pull` to generate the client from the live DB, then build on top.

---

## 1. Tech Stack

| Layer             | Library                        | Version  | Purpose                            |
|-------------------|--------------------------------|----------|------------------------------------|
| Framework         | NestJS (Fastify adapter)       | 11       | DI, modular, opinionated           |
| HTTP              | Fastify                        | 5        | HTTP server                        |
| Language          | TypeScript                     | 5.7      | Strict mode                        |
| ORM               | Prisma                         | 5.22     | multiSchema preview feature        |
| Database          | PostgreSQL                     | —        | Via Prisma                         |
| Queue             | BullMQ                         | 5.76     | Redis-backed job queues            |
| Redis Client      | ioredis                        | 5.10     | Cache, queue, rate-limit backend   |
| Validation        | class-validator                | 0.15     | DTO decorators                     |
| Serialization     | class-transformer              | 0.5      | DTO plain-to-instance              |
| Config            | @nestjs/config + Joi           | 4 + 18   | Env schema validation              |
| Auth (JWT verify) | jsonwebtoken (verify only)     | 9        | Bearer token verification          |
| Permissions       | @casl/ability                  | 6        | Role × action × subject matrix     |
| Logging           | nestjs-pino + pino             | 4 + 10   | Structured JSON logs               |
| Docs              | @nestjs/swagger                | 11       | OpenAPI / Swagger UI               |
| Security Headers  | @fastify/helmet                | 13       | CSP, XSS, frame protection         |
| Rate Limiting     | @fastify/rate-limit            | 10       | Global request throttling          |
| Events            | @nestjs/event-emitter          | 3        | In-process event bus               |
| Scheduling        | @nestjs/schedule               | 6        | Cron jobs                          |
| Tracing           | OpenTelemetry SDK              | 0.218    | Distributed tracing (OTLP)         |
| Metrics           | @willsoto/nestjs-prometheus    | 6        | Prometheus /metrics endpoint       |
| State Machines    | xstate                         | 5.31     | Workflow state engine              |
| Rule Engine       | @gorules/zen-engine            | 0.54     | DMN decision table evaluation      |
| BPMN              | bpmn-engine + bpmn-moddle      | 25 + 10  | BPMN 2.0 process execution         |
| HTTP Client       | axios                          | 1.9      | External API calls (SaaS Core)     |
| File Storage      | @aws-sdk/client-s3             | 3.1048   | S3 uploads + presigned URLs        |
| Excel Export      | exceljs                        | 4.4      | XLSX generation                    |
| CSV Export        | csv-stringify                  | 6.7      | CSV generation                     |
| UUID              | uuid                           | 10       | UUID v4 generation                 |
| Schema Validator  | zod                            | 4        | Runtime validation (engine rules)  |
| CLI               | @nestjs/cli                    | 11       | Build, generate                    |
| Testing           | Jest + supertest               | 30 + 7   | Unit + E2E                         |
| Linter            | ESLint                         | 9        | Code quality                       |
| Formatter         | Prettier                       | 3        | Code formatting                    |
| Package Manager   | pnpm                           | —        | Faster, disk-efficient             |

### Anti-patterns to avoid
- Do NOT use Express — the project uses Fastify (`@nestjs/platform-fastify`)
- Do NOT use TypeORM, Sequelize, or MikroORM — Prisma is the only ORM
- Do NOT use plain JavaScript — strict TypeScript everywhere
- Do NOT use `express` types in controller parameters (use Fastify's `FastifyRequest`)
- Do NOT use `@nestjs/serve-static` — use `@fastify/static` for Swagger
- Do NOT use `@nestjs/jwt` for signing — this app never issues tokens; use `jsonwebtoken.verify()` only

---

## 2. Project Structure

```
src/
├── app.module.ts                  # Root module
├── main.ts                        # Bootstrap
├── @types/                        # Global type declarations
├── common/
│   ├── auth/                      # JwtAuthGuard, JwtValidationService
│   ├── cache/                     # RedisModule (global, ioredis)
│   ├── context/                   # TenantContextService (AsyncLocalStorage)
│   ├── decorators/                # @CurrentUser, @CheckAbility, @AuditLog, etc.
│   ├── exceptions/                # QuotaExceededException, etc.
│   ├── filters/                   # Rfc7807ExceptionFilter (global)
│   ├── guards/                    # CaslGuard, RfSessionGuard, QuotaGuard, etc.
│   ├── interceptors/              # ResponseInterceptor, AuditInterceptor, etc.
│   ├── middleware/                # Tenant resolution, shutdown drain
│   └── rate-limiter/              # Token bucket implementation
├── config/
│   └── app.config.ts              # Joi env validation schema
├── casl/
│   ├── casl.types.ts              # WmsAction enum, WmsSubjects type
│   ├── wms-ability.factory.ts     # Build MongoAbility from JWT
│   ├── permission-registry.ts     # 6 roles × 70+ subjects × 33 actions
│   └── casl.module.ts             # Global module
├── prisma/
│   ├── prisma.service.ts          # $use tenant isolation middleware
│   └── prisma.module.ts           # Global module
├── {domain}/                      # One folder per feature
│   ├── web/                       # Web controllers
│   ├── rf/                        # RF handheld controllers
│   ├── dtos/                      # Request/response DTOs
│   ├── *.service.ts               # Business logic
│   └── *.module.ts                # Feature module
├── observability/                 # Tracing, metrics, audit
├── lifecycle/                     # ShutdownService
├── health/                        # Health check module
├── seed/                          # Seed data
├── core-client/                   # SaaS Core API client
├── cluster/                       # Multi-instance coordination
└── security/                      # Security utilities

prisma/
├── schema.prisma                  # 142+ models, multi-tenant schema
└── migrations/                    # Prisma migrations
```

---

## 3. How JWT Authentication Works

### Token Issuance (NOT in this app)
- JWT tokens are issued by **SaaS Core** (a separate auth service)
- This WMS app never signs or issues tokens
- The token encodes: `tenantId`, `userId`, `roles[]`, `permissions[]`, `facilityIds[]`, `warehouseRole`

### Token Verification (in this app)
- `JwtAuthGuard` extracts the Bearer token from `Authorization` header
- `JwtValidationService` validates the token structure (decodes payload, checks `iat`, `jti`) using **`jsonwebtoken.verify()`** — no token is ever signed here
- Supports **secret rotation**: `JWT_ACCESS_SECRET_OLD` env var allows validating tokens signed with a previous secret
- On verification, creates a CASL `WmsAbility` from the JWT payload (extracts roles + permissions)
- Attaches to request: `req.user`, `req.ability`, `req.tokenId`

### Why jsonwebtoken instead of @nestjs/jwt
- `@nestjs/jwt`'s `JwtService` includes a `sign()` method and requires a secret for its module registration
- This app only verifies tokens — never signs them
- Using `jsonwebtoken` directly (`verify()`) is the correct lightweight approach: no unnecessary `JwtModule` registration, no signing capability exposed

### Auth Guard Chain
```
Web routes:   @UseGuards(JwtAuthGuard, CaslGuard)
RF routes:    @UseGuards(RfSessionGuard, RfActionLightweightGuard)
Public routes: @Public() + (no guards)
```

### Auth Flow (detailed)
```
Request → JwtAuthGuard (global)
  ├─ @Public()? → skip
  ├─ Extract Bearer token from Authorization header
  ├─ JwtValidationService.validateToken() → decode payload, check iat/jti
  ├─ jsonwebtoken.verify(token, secret) → verify signature
  ├─ WmsAbilityFactory.createForUser(payload) → build CASL ability
  └─ Set req.user, req.ability, req.tokenId

Request → CaslGuard
  ├─ Read @CheckAbility() metadata from handler
  └─ Check ability.can(action, subject) → 403 or pass
```

---

## 4. Request Headers

| Header                  | Required | Where             | Purpose                                 |
|-------------------------|----------|-------------------|-----------------------------------------|
| `Authorization`         | Yes*     | All web routes    | `Bearer <jwt>` — auth token             |
| `x-rf-session-id`       | Yes*     | All RF routes     | Active RF device session UUID           |
| `Idempotency-Key`       | No       | POST/PATCH routes | Deduplicate mutations (SHA256 body hash fallback) |
| `x-tenant-id`           | No       | All routes        | Explicit tenant override (rare)         |
| `Content-Type`          | Yes      | All body routes   | `application/json`                      |
| `Accept`                | No       | All routes        | Responses in JSON                       |

`*` Required unless `@Public()` is used.

### RF Session Header
- RF devices send `x-rf-session-id: <uuid>` on every request
- `RfSessionGuard` validates the session (exists, not expired, belongs to user)
- Sets `req.rfSession` with device info, user, facility
- `RfActionLightweightGuard` then validates the action permission

---

## 5. Redis Usage Patterns

Redis is used for **four distinct purposes**:

### 5a. BullMQ Queue Backend
```typescript
// Global queue config in app.module.ts
BullModule.forRootAsync({
  useFactory: (config: ConfigService) => ({
    connection: {
      host: config.get('REDIS_HOST'),
      port: config.get('REDIS_PORT'),
      password: config.get('REDIS_PASSWORD'),
    },
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    },
    limiter: { max: 50, duration: 5000 }, // Per-tenant rate limit
  }),
  inject: [ConfigService],
})
```
BullMQ uses Redis lists, streams, and pub/sub for job queues, delayed jobs, and repeatable jobs.

### 5b. Cache Layer
```typescript
// Global Redis module provides REDIS_CLIENT (ioredis)
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (config: ConfigService) => {
        return new Redis({
          host: config.get('REDIS_HOST'),
          port: config.get('REDIS_PORT'),
          password: config.get('REDIS_PASSWORD'),
          retryStrategy: (times) => Math.min(times * 100, 2000),
          maxRetriesPerRequest: 3,
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: ['REDIS_CLIENT'],
})
```

Cached items with TTLs:
- State machine definitions (prefix `wms:sm:`, TTL 300s)
- Rule engine definitions (prefix `wms:rule:`, TTL 300s)
- Rule input hash cache (TTL 60s)
- Barcode lookups (warm-up TTL 900s, steady TTL 7200s)
- Session data, facility configs

### 5c. Rate Limiting
`@fastify/rate-limit` uses Redis as its backing store:
```typescript
await app.register(rateLimit, {
  redis: redisClient,  // ioredis instance
  global: true,
  max: 100,
  timeWindow: 60000,
  keyGenerator: (req) => req.ip,
});
```

### 5d. Cross-instance Events
Redis pub/sub used for inter-instance communication:
- Cache invalidation across nodes
- Queue event broadcasting

---

## 6. Module Registration Pattern

```typescript
@Module({
  imports: [
    PrismaModule,             // Always needed for DB access
    BullModule.registerQueue({ name: 'MY_QUEUE' }),
    // Cross-module imports when using another module's service:
    InventoryModule,
    NotificationModule,
  ],
  controllers: [
    WebController,
    RfController,
  ],
  providers: [MyService],
  exports: [
    MyService,               // Only if other modules consume it
    BullModule,              // Re-export queue token for importers
  ],
})
export class MyModule {}
```

### Cross-module DI rules
- If `ServiceA` in `ModuleA` calls `ServiceB` in `ModuleB`: `ModuleA` must import `ModuleB`
- **Global modules** are always available without import: `PrismaModule`, `CaslModule`, `RfSessionModule`, `RedisModule`
- Bull queues must be registered with `BullModule.registerQueue()` in every module that uses them
- If a queue's job token must be accessible to importing modules, re-export `BullModule`

---

## 7. Controller Patterns

### Web Controllers
```typescript
@ApiTags('My Domain')
@Controller('web/my-domain')
@UseGuards(JwtAuthGuard, CaslGuard)
export class MyWebController {
  constructor(private readonly service: MyService) {}

  @Post()
  @CheckAbility({ action: WmsAction.Create, subject: 'MySubject' })
  @AuditLog({ eventType: 'MY_CREATE' })
  async create(@Req() req: any, @Body() dto: CreateMyDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.create(tenantId, dto);
  }

  @Get()
  @CheckAbility({ action: WmsAction.List, subject: 'MySubject' })
  async findAll(@Req() req: any, @Query() query: QueryMyDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAll(tenantId, query);
  }
}
```

### RF Controllers
```typescript
@ApiTags('WMS-RF')
@Controller('rf/my-domain')
@UseGuards(RfSessionGuard, RfActionLightweightGuard)
export class MyRfController {
  @Post('/scan')
  @RfAction('read')
  async scan(@Req() req: any, @Body() dto: RfScanDto) {
    const tenantId = req.tenantContext.getTenantId();
    const session = req.rfSession;
    return this.service.scan(tenantId, session.userId, dto);
  }
}
```

### Route Conventions
| Type | Method | Pattern |
|------|--------|---------|
| Web CRUD | `POST/GET/PATCH/DELETE` | `/web/{domain}`, `/web/{domain}/:id` |
| RF actions | Always `POST` | `/rf/{domain}/{action}` |
| Bulk operations | `POST` | `/web/{domain}/batch-{action}` |
| Exports | `POST` | `/web/{domain}/export` |

---

## 8. Security & Authorization

### CASL Permission System
```typescript
// 6 roles
enum WmsRole {
  SYSTEM_ADMIN,        // Manage all (super-admin)
  WAREHOUSE_ADMIN,     // Manage all WMS subjects
  WAREHOUSE_SUPERVISOR,// Read all + Approve, Adjust, Pick, Pack, Ship, etc.
  WAREHOUSE_OPERATOR,  // Execute tasks + Cycle count
  SCANNER_USER,        // Validate, Lookup + Read
  INVENTORY_CLERK,     // CRUD products, Adjust, Count
}

// 33 actions
enum WmsAction {
  Manage, Create, Read, Update, Delete, List,
  Receive, ExecutePutaway, PerformQc, Pick, Pack, Ship,
  Release, ShortPick, Reallocate, Cancel, Adjust, Count,
  Approve, Transact, InitiateTransfer, ReceiveTransfer,
  ExecuteCycleCount, ApproveAdjustment, ManageCycleCountSchedule,
  OverrideApproval, Validate, Lookup, TriggerSync,
  ViewWebhookLogs, RegisterDevice,
}
```

### How to add a new subject
1. Add subject name to `WmsSubjects` type union in `casl.types.ts`
2. Grant permissions in `permission-registry.ts` under each role
3. Add model PascalCase name to `PrismaService.hasTenantId()` for tenant isolation
4. Decorate controller methods with `@CheckAbility({ action, subject })`

### Tenant Isolation
- Every query goes through `PrismaService.$use()` middleware
- `AsyncLocalStorage` holds per-request tenant context
- Middleware injects `tenantId` into every `where`/`data`/`create`
- Rejects requests without tenant context (outside test mode)
- Sets `app.tenant_id` PostgreSQL session variable for RLS at DB level

---

## 9. Prisma Patterns

### Schema Conventions
```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["multiSchema"]
  output          = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["multitenant"]
}

model MyModel {
  id         String   @id @default(uuid()) @db.Uuid
  tenantId   String   @map("tenant_id") @db.Uuid
  facilityId String   @map("facility_id") @db.Uuid
  code       String   @map("code") @db.VarChar(50)
  name       String?  @db.VarChar(255)
  isActive   Boolean  @default(true) @map("is_active")
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt  DateTime @updatedAt @map("updated_at") @db.Timestamptz

  facility WarehouseFacility @relation(fields: [facilityId], references: [id])

  @@unique([tenantId, facilityId, code], name: "my_model_code_uq")
  @@index([tenantId, facilityId, isActive], name: "idx_my_model_active")
  @@map("my_models")
  @@schema("multitenant")
}
```

### Every model must have
- `id` (UUID), `tenantId` (UUID), `createdAt`, `updatedAt`
- `@@map("snake_case_table_name")`
- `@@schema("multitenant")`
- `@map("snake_case_column")` on every field

### Type mapping
| Prisma       | PostgreSQL       | When                     |
|--------------|------------------|--------------------------|
| `@db.Uuid`   | UUID             | IDs, foreign keys        |
| `@db.VarChar(N)` | VARCHAR(N)   | Codes, names, short strs |
| `@db.Text`   | TEXT             | Long descriptions        |
| `@db.Timestamptz` | TIMESTAMPTZ | All timestamps          |
| `@db.Json`   | JSON             | Flexible config fields   |
| `@db.Decimal(M,N)` | DECIMAL(M,N) | Money, rates           |
| `@db.Real`   | REAL             | Floats, measurements     |

### Tenant Isolation Middleware
`PrismaService.$use()` automatically:
- Injects `tenantId` into `where` for `findUnique`, `findFirst`, `findMany`, `count`, `aggregate`
- Injects `tenantId` into `data` for `create`, `createMany`
- Injects `tenantId` into `where` for `update`, `updateMany`, `upsert`, `delete`, `deleteMany`
- Sets `SET LOCAL app.tenant_id = <tenantId>` on each query
- Records slow queries (>100ms) as warnings
- Adds OpenTelemetry span to every query

### Register a model for tenant isolation
Add PascalCase model name to `hasTenantId()` array:
```typescript
private hasTenantId(model: string): boolean {
  const wmsModels = ['MyModel', /* existing models */];
  return wmsModels.includes(model);
}
```

---

## 10. DTO & Validation Pattern

```typescript
import { IsString, IsOptional, IsUUID, IsBoolean, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMyDto {
  @ApiProperty({ example: 'WH-001' })
  @IsString()
  @MinLength(2)
  code: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty()
  @IsUUID()
  facilityId: string;
}

// RF DTOs — flat, no nesting, minimal validation
export class RfScanDto {
  @IsString()
  barcode: string;

  @IsOptional()
  @IsUUID()
  locationId?: string;
}
```

### Rules
- Use `class-validator` decorators for validation
- Use `class-transformer` `@Type(() => ...)` for nested objects
- Always use swagger decorators for OpenAPI generation
- RF DTOs are always flat (handheld terminals send simple key-value pairs)
- Query DTOs extend `PickType` / `PartialType` from `@nestjs/swagger` when possible

---

## 11. Response & Error Format

### Success Response (global interceptor)
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

### Error Response (global exception filter, RFC 7807)
```json
{
  "type": "https://httpstatuses.com/422",
  "title": "Unprocessable Entity",
  "status": 422,
  "detail": "Foreign key constraint failed on field: facilityId",
  "traceId": "abc-123",
  "tenantId": "tenant-uuid",
  "errors": [
    { "field": "facilityId", "message": "Facility not found" }
  ],
  "retryAfterMs": 0
}
```

### HTTP status code mapping
| Code | Condition |
|------|-----------|
| 400 | Prisma P2014, validation errors |
| 404 | Prisma P2025, not found |
| 409 | Prisma P2002, unique constraint |
| 422 | Prisma P2003, FK constraint |
| 429 | QuotaExceededException, rate limit |
| 500 | Unknown (detail stripped in production) |

---

## 12. Global Infrastructure

### Interceptor Chain (order matters)
| # | Interceptor | Purpose |
|---|-------------|---------|
| 1 | `ResponseInterceptor` | Wraps `{ success, data, timestamp }` |
| 2 | `PiiRedactorInterceptor` | Redacts emails/phones/tokens in prod |
| 3 | `RequestSemaphoreInterceptor` | DB pool gate at 80% capacity |
| 4 | `IdempotencyInterceptor` | Dedup via key or SHA256 body hash |
| 5 | `AuditInterceptor` | Auto-log for `@AuditLog()` methods |

### Decorators
| Decorator | Signature | Purpose |
|-----------|-----------|---------|
| `@CurrentUser()` | — | Injects `req.user` |
| `@CurrentTenant()` | — | Injects tenant context |
| `@Public()` | — | Skips all auth guards |
| `@CheckAbility()` | `{ action, subject, field? }` | CASL permission check |
| `@QuotaCheck()` | `resourceType` | Quota enforcement |
| `@RfAction()` | `'read'\|'create'\|'update'\|'delete'` | RF action type |
| `@AuditLog()` | `{ eventType, detail? }` | Auto audit log |
| `@HoldOverride()` | — | Supervisor PIN override |

### Middleware
| Middleware | Purpose |
|------------|---------|
| `TenantResolutionMiddleware` | Extracts tenantId from JWT, sets `AsyncLocalStorage` context |
| `ShutdownDrainMiddleware` | During shutdown: rejects non-RF requests with 503 |

---

## 13. RF (Handheld) API Patterns

### Principles
- **Prefix:** All RF routes under `rf/` (no version prefix)
- **Method:** Always `POST` (handheld terminals send form data)
- **Auth:** `RfSessionGuard` + `RfActionLightweightGuard`
- **Session header:** `x-rf-session-id: <uuid>`
- **Response:** Same `{ success, data, timestamp }` envelope
- **Error:** Same RFC 7807 format

### Naming convention
```
POST /rf/{domain}/my-tasks          — list my tasks
POST /rf/{domain}/next              — next available task
POST /rf/{domain}/scan-{entity}     — scan a barcode
POST /rf/{domain}/confirm           — confirm an action
POST /rf/{domain}/complete          — complete a session
POST /rf/{domain}/start             — begin new workflow
POST /rf/{domain}/recover           — recover interrupted task
```

### Real RF endpoints across domains
```
Inbound:      /rf/inbound/receive/start, /scan, /confirm, /putaway/confirm
Outbound:     /rf/outbound/pick/next, /assign, /scan-location, /scan-product, /confirm
              /rf/outbound/pack/start, /scan-lpn, /seal
              /rf/outbound/ship/load, /dispatch
Quality:      /rf/quality/inspections/my-tasks, /:id/record-result
Inventory:    /rf/cycle-counts/start, /scan-location, /enter-qty, /submit-line, /complete
Transfers:    /rf/transfers/initiate, /scan-lpn, /complete
VAS:          /rf/vas/workstations, /check-in, /check-out
Dock/Yard:    /rf/dock-appointments/upcoming
Labor:        /rf/labor/clock-in, /clock-out, /my-metrics
Equipment:    /rf/equipment/available, /check-out, /check-in
Work Orders:  /rf/work-orders/my-tasks, /:id/start-operation, /complete-operation
```

---

## 14. Workflow & Rule Engine

### Three Engines (orchestrated by `WorkflowOrchestratorService`)

#### A. State Machine Engine (`xstate` v5)
- Definitions in `wms_state_machines` table
- Runtime instances in `wms_execution_instances` table
- XState actor state persisted via `contextJson.__xstate_persisted`
- Versioned (auto-increment on update)
- Safety: depth limit 20, function injection detection
- Context ring buffer (50 entries for audit trail)
- Redis cache for definitions (TTL 300s, prefix `wms:sm:`)

#### B. Rule Engine (`@gorules/zen-engine` + custom JDM fallback)
- DMN-compatible decision table format
- Hit policies: FIRST, ALL, PRIORITY, COLLECT, RULE_ORDER
- Aggregation: SUM, MIN, MAX, COUNT
- 20+ operators: eq, neq, gt, gte, lt, lte, in, contains, matches (regex), between, isNull, lessThanDate
- Context resolvers for: inventory on-hand, carrier rates, product attributes
- Cached: Redis (TTL 300s) + in-memory input hash (TTL 60s)
- Security: function injection detection, expression blacklist

#### C. BPMN Engine (`bpmn-engine` v25)
- BPMN 2.0 XML process execution
- No `scriptTask` elements allowed (security restriction)
- Depth limit 50
- Recovery job: auto-suspends instances running >24h
- Registered service tasks: `evaluateRule`, `transitionStateMachine`, `checkInventory`, `createAuditLog`

#### Orchestration Flow
```
BPMN start → evaluateRule (JDM/DMN) → transitionStateMachine (XState) → signal completion
```

---

## 15. Queue / BullMQ Patterns

```typescript
// Register queue
BullModule.registerQueue({ name: 'my-queue' })

// Inject
@InjectQueue('my-queue') private readonly myQueue: Queue

// Add job
await this.myQueue.add('ProcessItem', payload, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
});

// Consumer
@Processor('my-queue')
export class MyConsumer {
  @Process('ProcessItem')
  async process(job: Job) {
    const tenantId = job.data.tenantId;
    // ... work
  }
}
```

### Conventions
- Default: 3 retries, exponential backoff 5s
- Per-tenant rate limiter: 50 jobs / 5 seconds
- Job naming: PascalCase action + noun (e.g., `ProcessInboundShipment`, `GenerateInvoice`)
- Each job payload includes `tenantId` for context
- Idempotency via job deduplication where possible

---

## 16. Audit Logging

```typescript
// Decorator on controller method
@AuditLog({ eventType: 'MY_ACTION', detail: (req, body) => `${body.id}` })
@Post()
async create(@Body() dto: CreateDto) { ... }

// Or directly via AuditService
await this.auditService.log({
  tenantId,
  userId,
  action: 'MY_ACTION',
  entity: 'MyEntity',
  entityId: record.id,
  oldValue: previous,
  newValue: record,
});
```

The `AuditInterceptor` (global) reads `@AuditLog()` metadata from the matched route handler and automatically writes to `system_audit_logs` table on success.

---

## 17. Environment Variables

```bash
# ── Core ──
NODE_ENV=development|production|test
PORT=3001
API_PREFIX=api/v1/wms
APP_URL=http://localhost:3001
LOG_LEVEL=info

# ── Database ──
DATABASE_URL=postgresql://user:pass@host:5432/db?schema=multitenant
PGBOUNCER_ENABLED=false
DB_POOL_LIMIT=20

# ── Auth (JWT verification — tokens issued by SaaS Core) ──
JWT_ACCESS_SECRET=<shared secret, 32+ chars>
JWT_REFRESH_SECRET=<shared secret, 32+ chars>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
JWT_ACCESS_SECRET_OLD=<previous secret for rotation>

# ── SaaS Core API (token validation, tenant provisioning) ──
CORE_API_URL=https://core-api.example.com
CORE_API_TOKEN=<32+ chars, used for server-to-server calls>

# ── Redis ──
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis123
REDIS_MAXMEMORY=512mb
REDIS_MAXMEMORY_POLICY=allkeys-lru

# ── Observability ──
OTLP_ENDPOINT=http://otel-collector:4318
METRICS_PATH=/metrics

# ── Optional ──
SWAGGER_ENABLED=true
CORS_ORIGINS=*
RATE_LIMIT_GLOBAL_TTL=60000
RATE_LIMIT_GLOBAL_LIMIT=100
SHUTDOWN_TIMEOUT_MS=15000
IDEMPOTENCY_TTL_MS=300000
DEPLOYMENT_MODE=rolling|blue-green|standalone
HEAP_WARNING_THRESHOLD_MB=1200
E2E_TEST_DB_URL=postgresql://...?schema=multitenant
```

All variables validated by Joi at startup — app fails to boot if required values are missing.

---

## 18. Testing Strategy

```bash
# Unit tests (alongside source as *.spec.ts)
pnpm run test

# E2E (requires E2E_TEST_DB_URL — separate test database)
pnpm run test:e2e

# Load tests (k6 scripts in load-tests/)
k6 run load-tests/rf-barcode-spike.js
```

### Jest config
```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "src",
  "testRegex": ".*\\.spec\\.ts$",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" },
  "testEnvironment": "node"
}
```

---

## 19. Database Migration Workflow

```bash
# 1. Pull current schema from live DB (fresh project start)
npx prisma db pull

# 2. Edit schema.prisma to add/modify models

# 3. Generate migration diff against live DB
npx prisma migrate diff \
  --from-url "$DATABASE_URL" \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/NNNN_description/migration.sql

# 4. Review the generated SQL for destructive operations
# 5. Apply to database
psql "$DATABASE_URL" -f prisma/migrations/NNNN_description/migration.sql

# 6. Register with Prisma
npx prisma migrate resolve --applied NNNN_description

# 7. Generate Prisma client
npx prisma generate
```

### Scripts in package.json
```json
{
  "build": "nest build",
  "start": "node dist/src/main.js",
  "start:dev": "nest start --watch",
  "test": "jest",
  "test:e2e": "jest --config ./test/jest-e2e.json",
  "db:pull": "npx prisma db pull",
  "db:generate": "npx prisma generate",
  "db:studio": "npx prisma studio",
  "db:migrate": "npx prisma migrate deploy",
  "lint": "eslint src/",
  "format": "prettier --write src/"
}
```

---

## 20. Observability

### Metrics (Prometheus)
- Endpoint: `GET /metrics`
- Registered via `@willsoto/nestjs-prometheus` + `prom-client`
- Custom metrics: throughput per endpoint, queue depth, DB pool utilization

### Tracing (OpenTelemetry)
- OTLP HTTP exporter to configurable endpoint
- Auto-instrumentation: HTTP, PostgreSQL (`instrumentation-pg`), Redis (`instrumentation-redis-4`)
- Custom spans: every Prisma query + trace context middleware

### Health Check
- `GET /health` → 200 OK with module statuses
- Aggregated from all feature modules

### Swagger / OpenAPI
- `GET /api/docs` — Swagger UI (only when `SWAGGER_ENABLED=true`)
- Auto-generated from `@ApiTags`, `@ApiProperty`, `@ApiOperation` decorators

---

## 21. Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Multi-tenancy | Postgres schema isolation (`multitenant` schema) | Hard boundaries, no data leaks |
| API versioning | URL prefix `/api/v1/wms` | Simple, no header negotiation |
| Auth | External JWT (SaaS Core) + CASL | Stateless, fine-grained, token not issued here |
| JWT library | `jsonwebtoken` (verify only) | No signing capability needed; avoids `@nestjs/jwt` module registration |
| Error format | RFC 7807 `application/problem+json` | Standardized machine-readable errors |
| Response format | `{ success, data, timestamp }` | Consistent JS client parsing |
| Workflow | Triple engine (XState + Zen + BPMN) | Different problems need different tools |
| Queue | BullMQ (Redis) | Reliable, observable, delayed retries |
| Idempotency | Global interceptor | Safe retry without duplicates |
| RF architecture | Session-based, stateless actions | Handheld terminals with intermittent connectivity |
| Deploy | Rolling / blue-green | Zero-downtime deployments |
| Shutdown | Drain + reject non-RF first | RF devices don't time out during deploy |

---

## 22. SaaS Core Integration

This app does NOT handle:
- User registration / login
- JWT token issuance
- Tenant creation / provisioning
- Billing / subscription management

These are all handled by **SaaS Core** (separate service). This WMS app:
- Verifies JWT tokens signed by SaaS Core (shared secret) using `jsonwebtoken.verify()`
- Makes server-to-server API calls to SaaS Core via axios (`CORE_API_URL` + `CORE_API_TOKEN`)
- Syncs quota data (resource limits per tenant)
- Syncs role/permission definitions
- Registers itself on tenant provisioning

The `core-client` module encapsulates all SaaS Core API calls.

---

## 23. Delivery Phases

The project is organized into 15 phases. Each phase has its own plan file in `.opencode/plans/`.

| Phase | Name | Description |
|-------|------|-------------|
| P00 | Foundation Infrastructure | Redis, BullMQ, tenant isolation, helmet, rate-limit, interceptors, decorators, middleware, event bus, scheduling, health check |
| P01 | Master Data | Facilities, zones, locations, products, categories, UOMs, barcodes, clients, vendors, carriers, brands |
| P02 | Inbound Processing | PO management, ASN, receiving, putaway, cross-docking, customer returns |
| P03 | Inventory Management | On-hand, transactions, holds, adjustments, cycle counts, replenishment, lot tracking |
| P04 | Outbound Processing | Sales orders, allocations, picking waves, packing, shipment, shipping labels, carrier rates |
| P05 | Quality Management | Inspections, QC dispositions, compliance, hazmat |
| P06 | VAS Catalog & Execution | Service rates, workstations, execution, billing |
| P07 | Labor & Equipment | Shifts, time tracking, performance, equipment maintenance |
| P08 | Work Orders & Exceptions | WO lifecycle, operations, components, exception comments, escalation |
| P09 | Integrations & Transfers | Inventory transfers, sync logs, webhooks, entity mappings |
| P10 | Workflow Engine | State machines, rules, BPMN processes, execution instances |
| P11 | Fulfillment Workflow | Workflow events, transitions, fulfillment billing |
| P12 | Dock/Yard & Storage Billing | Appointments, yard vehicles, storage rates, snapshots, invoicing |
| P13 | Settings, Reports, RF & Security | System settings, async reports, RF sessions, supervisor PINs |
| P14 | Observability & Analytics | KPI, heatmaps, audit logs, warehouse events, OTel, Prometheus |
| P15 | SaaS Core Integration | Core API client, quotas, seeding, shutdown, cluster mode |

Detailed phase plans are in `.opencode/plans/PHASE_*.md`.

---

## 24. Quickstart (from zero)

```bash
# 1. Clone/pnpm install
pnpm install

# 2. Set up .env (see §17 for all required vars)
cp .env.example .env

# 3. Pull Prisma schema from existing database
npx prisma db pull

# 4. Generate Prisma client
npx prisma generate

# 5. Build
pnpm run build

# 6. Start
pnpm run start
```

---

## 25. Self-Challenge: What's Missing?

Items below are NOT included in this guide but are important patterns in the existing
codebase. Research these before building:

- [ ] **Role seeding** — `WmsRoleSeederService` seeds permissions per-tenant on provision
- [ ] **UOM seeding** — `UomSeederService` seeds units of measure per-tenant
- [ ] **Quota enforcement** — `QuotaGuard` + `@QuotaCheck()` decorator checks `resource_quotas` table
- [ ] **RF session lifecycle** — `DbRfSession` table tracks active sessions, expiry, device info
- [ ] **Hold override** — Supervisor PIN entry for inventory hold release with audit trail
- [ ] **Barcode label printing** — Label generation + print queue + template system
- [ ] **ASN import pipeline** — Upload file → parse → validate → create ASN flow (multi-step)
- [ ] **Product import pipeline** — CSV/Excel upload → validate → create products flow
- [ ] **Carrier integration** — Rate shopping across carriers, label generation, tracking
- [ ] **Webhook system** — Outgoing webhooks to external systems for events
- [ ] **Integration sync** — Shopify/WooCommerce/etc order sync via `sync_webhook_logs`
- [ ] **Approval workflow** — `AdjustmentApproval` + `ApprovalThresholdConfig` for auto/manual approvals
- [ ] **Packing station workflow** — Station check-in/out, container management, slip generation
- [ ] **Storage billing** — Daily snapshots → charge calculation → invoice generation
- [ ] **VAS billing** — Service charge calculation per client rate
- [ ] **Dock scheduling** — Appointment booking, check-in, yard vehicle tracking
- [ ] **Exception management** — Issue tracking with comments + escalation rules
- [ ] **Supervisor PIN** — `supervisor_pins` table for override operations
- [ ] **KPI/analytics** — `daily_kpi_metrics` + `location_pick_heatmaps` for warehouse analytics
- [ ] **OpenTelemetry** — OTLP exporter config, auto-instrumentation setup
- [ ] **Graceful shutdown** — `ShutdownService` drains active jobs, pauses queues, closes connections
- [ ] **Cluster mode** — Multi-instance coordination via Redis (mutex for migrations, leader election)
- [ ] **k6 load tests** — Scripts in `load-tests/` for RF, inventory, queue pressure testing
- [ ] **Permission registry bootstrap** — Startup validation that all subjects/actions are registered
