# Area Intelligence — Backend Architecture

Status: **Implemented** (`src/modules/area-intelligence/`). See "Implementation Notes & Deviations" at the end of this document for where the shipped code diverges from the original design and why.
Scope: `bharat-app-backend` only (NestJS + PostgreSQL + Prisma + Redis).

## 0. Grounding: what the existing backend already gives us

Before designing anything new, these existing pieces are load-bearing and Area Intelligence is designed to **sit on top of them**, not duplicate them:

| Existing piece | File | Reused as |
|---|---|---|
| `State→District→City→(Locality\|Ward)` hierarchy | `src/location/` | The geographic backbone. `AreaMaster` extends `Locality`, it does not duplicate the chain. |
| `LocationDataProvider` interface + `LocationDataService` ordered-fallback | `src/location/providers/` | The template for every Area Intelligence external-source provider (Nearby Places, Crime, Traffic, Healthcare, Schools, Internet). |
| `GovtLocationProvider` (data.gov.in pincode directory) | `src/location/providers/govt-location.provider.ts` | Proof that data.gov.in integration and its quirks (field-name variants, pagination, timeouts) are already solved — the Area Master sync job calls the same resource family. |
| `Role.permissions[]` + `"*"` wildcard, `RolesGuard`, `PermissionsGuard` | `src/auth/` | Area Intelligence write endpoints are gated the same way (`area-intelligence:manage`), no new auth mechanism. |
| `JwtStrategy` re-reading role/permissions from DB per request | `src/auth/strategies/jwt.strategy.ts` | Confirms role/permission changes apply immediately — relevant for revoking Area Intelligence admin access. |
| Direct `fetch()`-based OpenAI calls, JSON-array parsing with graceful "not configured" fallback | `src/location/location.service.ts` (`suggestNames`) | The template for the AI Summary generator — same style, not the OpenAI SDK. |
| Flexible `Listing.data Json?` for future-proofing | `src/prisma/schema.prisma` | The template for `AreaStatistic`'s key/value+JSON design, so new stat types don't need migrations. |
| `source: "manual" \| "ai" \| "govt"` + `xFetched: Boolean` lazy-fetch flags on `City`/`District` | `schema.prisma` | The template for `AreaMaster.syncStatus`/`lastSyncedAt`. |

**No `Property` or `Builder` domain model exists yet.** `PropertyStatistics`, `PriceHistory`, and `BuilderRating` are designed against a future Property module; until it ships they key on `areaId` + free-text (`builderName`) rather than a hard FK, and get upgraded to a real FK once Property lands. This is flagged again in §3.

---

## 1. Module Breakdown

New top-level domain module, following the `src/modules/<name>/` convention (matches `medicine`, `water`):

```
src/modules/area-intelligence/
```

Sub-domains inside it, each independently testable:

1. **Area Master** — canonical area registry, synced from government data.
2. **Area Scoring Engine** — pure computation: raw inputs → category scores → overall score + confidence. No I/O.
3. **Area Insights** — AI-generated summary/pros/cons/recommendations, built from Scoring Engine output.
4. **Data Providers** — one provider family per external-data category (Nearby Places, Traffic, Crime, Healthcare, Schools, Internet, Weather), each behind a common interface with fallback ordering, mirroring `LocationDataService`.
5. **Data Collector** — orchestrates providers → normalization → persistence. The only layer allowed to call external APIs.
6. **Area Query API** — public-facing read surface (`/areas/*`).
7. **Area Admin API** — sync/refresh/recalculate/job/data-source management (`/admin/areas/*`).
8. **Background Jobs** — cron triggers + BullMQ processors for sync, refresh, recompute, cleanup.
9. **Property Statistics** (stub until Property module exists) — computed aggregates, never owner-writable.

---

## 2. Folder Structure

```
src/modules/area-intelligence/
  area-intelligence.module.ts

  area-master/
    area-master.controller.ts        # /areas, /areas/search, /areas/:id
    area-master.service.ts
    dto/
      search-area.dto.ts
      create-area-master.dto.ts

  scoring/
    area-scoring.engine.ts           # pure function(s): inputs -> scores. No Prisma, no fetch.
    area-scoring.types.ts
    category-scorers/
      safety.scorer.ts
      traffic.scorer.ts
      healthcare.scorer.ts
      school.scorer.ts
      internet.scorer.ts
      utilities.scorer.ts
    area-scoring.service.ts          # I/O wrapper: loads inputs, calls engine, persists AreaScoreSnapshot

  insights/
    area-ai-summary.service.ts       # LLM call, same fetch()-based style as location.service.ts
    area-ai-summary.types.ts

  providers/                          # mirrors src/location/providers/
    nearby-places/
      nearby-places.types.ts          # NearbyPlacesProvider interface
      google-places.provider.ts
      osm-places.provider.ts
      nearby-places-data.service.ts   # ordered-fallback aggregator (like LocationDataService)
    traffic/
      traffic.types.ts
      google-traffic.provider.ts
      traffic-data.service.ts
    crime/
      crime.types.ts
      govt-crime.provider.ts          # data.gov.in / NCRB-style datasets
      crime-data.service.ts
    healthcare/
    schools/
    internet/
    weather/                          # optional, future

  collector/
    area-data-collector.service.ts    # orchestrates all providers -> normalization -> DB writes
    normalization/
      geo-normalizer.ts               # lat/long rounding, geohash, distance calc

  property-stats/
    property-statistics.service.ts    # stub, keys on areaId until Property module exists

  jobs/
    queues.ts                         # BullMQ queue names/tokens
    processors/
      area-master-sync.processor.ts
      nearby-refresh.processor.ts
      traffic-update.processor.ts
      internet-update.processor.ts
      score-recalc.processor.ts
      property-stats-update.processor.ts
      builder-rating-update.processor.ts
      history-cleanup.processor.ts
    schedulers/
      area-intelligence.scheduler.ts  # @Cron() triggers that enqueue jobs

  cache/
    area-cache.service.ts             # Redis key builders + TTLs (wraps existing RedisService)

  area.controller.ts                  # public read surface: intelligence/nearby/summary/compare/save
  area.service.ts                     # query orchestration, cache-through
  area-admin.controller.ts            # /admin/areas/*, /admin/jobs, /admin/data-sources
  area-admin.service.ts

  dto/
    area-query.dto.ts
    compare-areas.dto.ts
    save-area.dto.ts
```

`AreaIntelligenceModule` imports `PrismaModule` (global), `RedisModule` (global), and exports `AreaScoringEngine`/`AreaMasterService` for any future module (e.g. a Property module) that needs to read area scores.

---

## 3. Database Design & Prisma Model Planning

Design principles applied throughout (all match existing schema conventions — `cuid()` ids, `@@index`, cascade rules, `source` string discriminators):

- **No duplicate geo hierarchy.** `AreaMaster` is a 1:1 extension of `Locality` (`localityId @unique`), not a parallel State/District/City/Area table. State/District/City are reached via `Locality.city.district.state`.
- **Owner-editable vs system-only is enforced by *which service can write the table*, not by a column flag.** No property-owner-facing controller ever imports `AreaScoreSnapshot`/`AreaCategoryScore`/`AreaInsight` repositories. This is the actual guarantee behind "property owners can never edit Area Intelligence" — covered again in §11.
- **Flexible stat rows over wide tables.** `AreaStatistic` is key/value+JSON (like `Listing.data`) so new stat types (walkability, AQI, noise, rental demand) need zero migrations later (§14).
- **`AreaCache` is intentionally NOT a Postgres table.** A DB-persisted cache defeats the purpose of a cache and adds write amplification on every read. It's implemented as Redis keys — see §10.
- **`AreaRefreshLog` + `DataSyncLog` are merged into one `BackgroundJobLog`** distinguished by a `jobType` enum, to avoid two near-identical audit tables.

### Core registry

```
AreaMaster
  id                String   @id @default(cuid())
  localityId        String   @unique
  locality          Locality @relation(fields: [localityId], references: [id], onDelete: Cascade)
  administrativeCode String?           // LGD / Census code
  population         Int?
  populationYear     Int?
  source             AreaMasterSource  @default(GOVT)   // GOVT | MANUAL | DERIVED
  syncStatus         SyncStatus        @default(PENDING) // PENDING | SYNCED | FAILED | STALE
  lastSyncedAt       DateTime?
  createdAt / updatedAt

  @@index([syncStatus])
```

Latitude/longitude/pincode/city already live on `Locality` — read through the relation, not copied.

### Scoring

```
AreaScoreSnapshot        // current live score, one row per area, upserted on recompute
  id            String   @id @default(cuid())
  areaId        String   @unique
  area          AreaMaster @relation(fields: [areaId], references: [id], onDelete: Cascade)
  overallScore  Float?              // null = "insufficient data", never a fake default
  confidence    Float?              // 0-100
  algoVersion   String              // scoring-engine version that produced this
  computedAt    DateTime

AreaCategoryScore         // child rows, one per category per area
  id            String   @id @default(cuid())
  areaId        String
  category      AreaScoreCategory   // SAFETY | TRAFFIC | HEALTHCARE | SCHOOL | INTERNET | UTILITIES
  score         Float?
  confidence    Float?
  weight        Float               // weight used in the overall-score rollup for THIS computation
  inputsUsed    Json                // which raw inputs/sources contributed, for auditability
  computedAt    DateTime
  @@unique([areaId, category])

AreaHistory                // append-only trend snapshots (nightly), cheap denormalized blob
  id             String   @id @default(cuid())
  areaId         String
  snapshotAt     DateTime
  overallScore   Float?
  categoryScores Json               // { SAFETY: 8.1, TRAFFIC: 6.4, ... }
  statsSnapshot  Json               // key stats at the time, for trend charts
  @@index([areaId, snapshotAt])
```

### Statistics & amenities

```
AreaStatistic
  id       String   @id @default(cuid())
  areaId   String
  statKey  String            // "avg_commute_min", "literacy_rate", "aqi", ...
  value    Float?
  unit     String?
  source   String
  asOfDate DateTime
  @@unique([areaId, statKey, asOfDate])
  @@index([areaId])

NearbyAmenity              // standalone POI table — reused across areas, not duplicated per area
  id             String   @id @default(cuid())
  category       AmenityCategory   // HOSPITAL | SCHOOL | POLICE | PARK | MARKET | ATM | BUS_STOP | METRO
  name           String
  latitude       Float
  longitude      Float
  externalPlaceId String?  @unique  // dedupe key from the provider (Google Place ID / OSM id)
  source         String
  rating         Float?
  lastSyncedAt   DateTime
  @@index([category])

AreaNearbyAmenity           // join: which amenities are near which area, computed by the collector job
  areaId          String
  amenityId       String
  distanceMeters  Int
  walkTimeMin     Int?
  @@id([areaId, amenityId])
  @@index([areaId])
```

### AI Insights

```
AreaInsight                 // versioned so summaries can be regenerated without losing audit history
  id             String   @id @default(cuid())
  areaId         String
  summary        String
  pros           String[]
  cons           String[]
  recommendations String[]
  confidence     Float?
  modelVersion   String
  promptVersion  String
  generatedAt    DateTime
  isCurrent      Boolean  @default(true)
  @@index([areaId, isCurrent])
```

### Property-adjacent (stub until a Property module exists)

```
PropertyStatistics
  areaId        String   @unique
  avgPrice      Float?
  pricePerSqft  Float?
  listingCount  Int      @default(0)
  demandIndex   Float?
  computedAt    DateTime

PriceHistory
  id           String @id @default(cuid())
  areaId       String
  period       DateTime          // month granularity
  avgPrice     Float
  pricePerSqft Float?
  sampleSize   Int
  @@unique([areaId, period])

BuilderRating              // no Builder FK yet — keys on name until Property/Builder module ships
  id          String @id @default(cuid())
  areaId      String
  builderName String
  rating      Float?
  reviewCount Int      @default(0)
  source      String
  @@index([areaId, builderName])
```

### Saved areas

```
SavedArea
  userId  String
  areaId  String
  createdAt DateTime @default(now())
  @@id([userId, areaId])
```

`AreaComparison` (`POST /areas/compare`) is **stateless** — computed on the fly from `AreaScoreSnapshot`/`AreaStatistic`, not persisted. No table.

### External sources & sync infra

```
ExternalDataSource          // DB-backed registry so admins can toggle providers without redeploying
  id             String @id @default(cuid())
  providerKey    String @unique   // matches the provider's `.name` in code, e.g. "govt-crime"
  category       DataSourceCategory  // GOVT | MAPS | TRAFFIC | HEALTHCARE | SCHOOL | CRIME | INTERNET | WEATHER
  displayName    String
  isActive       Boolean @default(true)
  priority       Int     @default(0)   // fallback order within a category
  rateLimitPerMin Int?
  lastSuccessAt  DateTime?
  lastFailureAt  DateTime?

SourceConfidence             // per area+category+source, feeds the Scoring Engine's confidence calc
  areaId          String
  category        AreaScoreCategory
  sourceId        String
  confidenceScore Float
  sampleSize      Int?
  lastVerifiedAt  DateTime
  @@id([areaId, category, sourceId])

BackgroundJobLog              // merges DataSyncLog + AreaRefreshLog + generic job audit
  id             String @id @default(cuid())
  jobType        BackgroundJobType  // AREA_MASTER_SYNC | NEARBY_REFRESH | SCORE_RECALC | ...
  areaId         String?            // null = bulk/global run
  status         JobStatus          // RUNNING | SUCCESS | FAILED | PARTIAL
  recordsProcessed Int?
  errorMessage   String?
  startedAt      DateTime
  finishedAt     DateTime?
  @@index([jobType, startedAt])
  @@index([areaId])
```

---

## 4. API Design

Global prefix stays `/api`; add URI versioning (`app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' })`) so this ships as `/api/v1/...` — the current codebase has no versioning yet, and this is the first module big enough to need it.

### Public read surface (`@Controller({ path: 'areas', version: '1' })`)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/areas` | JwtAuthGuard | Cursor-paginated list, filterable by city/locality |
| GET | `/areas/search` | JwtAuthGuard | Text/geo search (name, pincode, lat/long+radius) |
| GET | `/areas/:id` | JwtAuthGuard | Area Master + current score summary |
| GET | `/areas/:id/intelligence` | JwtAuthGuard | Full scores (overall + per-category) + confidence |
| GET | `/areas/:id/nearby` | JwtAuthGuard | `AreaNearbyAmenity`, filterable by category |
| GET | `/areas/:id/property-stats` | JwtAuthGuard | `PropertyStatistics` + `PriceHistory` |
| GET | `/areas/:id/history` | JwtAuthGuard | `AreaHistory` trend series, date-ranged |
| GET | `/areas/:id/summary` | JwtAuthGuard | Current `AreaInsight` (AI summary/pros/cons) |
| POST | `/areas/save` | JwtAuthGuard | body `{ areaId }` → upsert `SavedArea` |
| DELETE | `/areas/save/:id` | JwtAuthGuard | Remove a saved area |
| POST | `/areas/compare` | JwtAuthGuard | body `{ areaIds: string[2..4] }` → stateless side-by-side |

Validation: DTOs with `class-validator` (existing `ValidationPipe({ whitelist, transform, forbidNonWhitelisted })` covers this globally — no controller-level change needed). `compare` DTO caps `areaIds` at 4 to bound query cost. Errors follow existing convention: `NotFoundException`/`BadRequestException`/`ForbiddenException` → Nest's default JSON `{statusCode, message, error}`; no new error shape introduced.

### Admin surface (`@Controller({ path: 'admin/areas', version: '1' })`, `@Roles('SUPER_ADMIN')` or `@Permissions('area-intelligence:manage')`)

| Method | Path | Notes |
|---|---|---|
| POST | `/admin/areas/sync` | Trigger `AREA_MASTER_SYNC` (enqueues BullMQ job, returns jobId immediately — never blocks on external calls) |
| POST | `/admin/areas/refresh` | body `{ areaId? }` — nearby/statistics refresh, single area or all |
| POST | `/admin/areas/recalculate` | body `{ areaId? }` — force score + AI summary recompute |
| GET | `/admin/jobs` | `BackgroundJobLog`, filterable by `jobType`/`status`, paginated |
| GET | `/admin/data-sources` | `ExternalDataSource` registry + last success/failure |
| PATCH | `/admin/data-sources/:id` | toggle `isActive`, adjust `priority` — no redeploy needed |

All admin mutation endpoints return `202 Accepted` + `jobId` (async), not the finished result — external-data operations are seconds-to-minutes long and must never hold an HTTP request open (same reasoning already applied in `LocationService.createDistrict`'s fire-and-forget `autoFetchCities`, generalized here into a real queue instead of a bare `void` call).

---

## 5. AI Scoring Engine

Split into two layers, matching `scoring/area-scoring.engine.ts` (pure) vs `scoring/area-scoring.service.ts` (I/O), so the math is unit-testable without a database:

**Category scores** (0–10 each): each category is a weighted blend of normalized raw inputs.
Example — Safety: `crimeRateNormalized * 0.4 + policeStationDensity * 0.3 + incidentReportsInverse * 0.3`.

- **Normalization**: every raw input maps to 0–10 via a documented per-input function (e.g., min-max clamp against a national reference range, or percentile rank) before weighting — never mixed units.
- **Missing-input handling**: if an input is unavailable, its weight is **redistributed proportionally** across the remaining available inputs for that category (weights renormalized to sum to 1), not defaulted to a neutral value. If *zero* inputs are available for a category, that category's `score` is `null` and `confidence` is `0` — surfaced to the frontend as "Data unavailable," never a fabricated number.
- **Overall score**: weighted mean of the 6 category scores, using only categories with a non-null score (same redistribution rule).
- **Confidence score**: a function of (a) how many of the category's inputs were actually available, (b) `SourceConfidence` rows for that area/category (freshness + sample size), (c) data recency (`lastSyncedAt` age). Output 0–100%.
- **AI Summary**: a separate step, downstream of the numeric scores — takes the structured `{overallScore, categoryScores, topStats, nearbyHighlights}` JSON as context and asks the LLM (same `fetch()`-to-OpenAI pattern as `location.service.ts:suggestNames`) for a JSON-mode response: `{summary, pros[], cons[], recommendations[]}`. Stored versioned (`modelVersion`, `promptVersion`) in `AreaInsight`. Never influences the numeric scores — summary is descriptive of already-computed numbers, not a second source of truth for them.
- **Recompute triggers**: nightly full sweep (cron), on-demand via `/admin/areas/recalculate`, and event-triggered when a data-collection job writes enough new raw inputs for an area to move a category score materially (threshold-based, avoids recomputing on every trivial write).

---

## 6. Data Collection Architecture & Data Flow

```
data.gov.in (Area Master, Crime, Census)
Google Maps / Places  (Nearby Places, geocoding)
OpenStreetMap          (Nearby Places fallback)
Other trusted providers (Traffic, Internet, Healthcare, Schools)
        │
        ▼
  Provider layer (src/modules/area-intelligence/providers/**)
  — one <Domain>DataProvider interface per category, each provider
    implements isConfigured()/name/fetchX(), exactly like
    LocationDataProvider today.
        │
        ▼
  <Domain>DataService (ordered fallback, first non-empty result wins)
  — one per category, mirrors LocationDataService exactly.
        │
        ▼
  AreaDataCollectorService
  — the ONLY place that calls provider services. Normalizes units,
    dedupes (externalPlaceId), attaches areaId, and writes rows.
    Runs inside a BullMQ job, never inline on an HTTP request.
        │
        ▼
  Normalization Layer (geo rounding, geohash, distance calc, unit conversion)
        │
        ▼
  Postgres — AreaMaster / AreaStatistic / NearbyAmenity / AreaNearbyAmenity
        │
        ▼
  AreaScoringEngine (pure) — reads persisted raw data, computes
  AreaCategoryScore + AreaScoreSnapshot + confidence
        │
        ▼
  AreaAiSummaryService — reads the score snapshot, calls the LLM,
  writes AreaInsight
        │
        ▼
  Redis (cache-through on next read, or pre-warmed by the recompute job)
        │
        ▼
  REST API (area.controller.ts) — reads cache first, DB on miss
        │
        ▼
  Frontend
```

Every arrow above is a **one-way** dependency: providers never know about Prisma, the scoring engine never calls `fetch()`, the controller never calls a provider directly. This is what makes "Area Intelligence never depends on property owners" enforceable — the write path to `AreaScoreSnapshot`/`AreaCategoryScore`/`AreaInsight` has exactly one entry point (the collector + scoring jobs), and no property-owner-facing controller has a reference to it.

---

## 7. Background Jobs

**Infra decision**: add `@nestjs/schedule` (cron triggers) + `@nestjs/bullmq` (`bullmq` + existing `ioredis`, already a dependency) for the actual job queue. Cron alone (no queue) can't give retry/backoff/concurrency-limits/dead-letter, which the spec explicitly asks for ("Retry Strategy," "Failure Recovery"); a queue backed by the Redis instance already in the stack is the standard NestJS answer and needs no new infrastructure to provision.

| Job | Trigger | Notes |
|---|---|---|
| Daily Government Data Sync | cron 02:00 IST | Enqueues per-`ExternalDataSource` sync jobs |
| Area Master Sync | weekly | Reconciles new `Locality` rows into `AreaMaster` |
| Nearby Places Refresh | weekly, staggered | Rate-limit aware, spread across the week per area batch |
| Property Statistics Update | nightly | No-op / stub until Property module ships |
| Builder Rating Update | nightly | Same stub caveat |
| AI Score Recalculation | nightly full sweep + on-demand + event-triggered | See §5 |
| Traffic Update | every 15–60 min (provider-dependent) | Only for areas with recent traffic-relevant queries, not all areas |
| Internet Availability Update | weekly | Slow-changing data |
| Area Cache Refresh | immediately after score/insight recompute | Warms Redis so the first user request isn't a cold read |
| History Cleanup | monthly | Prunes `AreaHistory` beyond a retention window (e.g. 24 months) |

**Retry strategy**: BullMQ exponential backoff, per-job-type max attempts (e.g. 5 for external-API jobs, 2 for pure-DB jobs). Exhausted retries write `BackgroundJobLog.status = FAILED` with `errorMessage`, surfaced on `GET /admin/jobs` — never silently dropped.
**Monitoring**: Bull Board (or BullMQ's own APIs) mounted behind the admin auth guard for a live job dashboard; `GET /admin/jobs` gives the same data as JSON for the admin frontend.

---

## 8. External Integrations (Provider Architecture)

Every category gets its own `<Domain>DataProvider` interface, its own concrete providers, and its own `<Domain>DataService` fallback orchestrator — copy-pasted in *shape* from `src/location/providers/`, not shared as one generic interface, because each domain's fetch signature differs (villages vs. nearby-POIs vs. crime-rate-by-district). This keeps each provider independently swappable, per the spec's "add or replace providers without changing business logic" requirement.

| Category | Preferred | Fallback |
|---|---|---|
| Area Master / Census | data.gov.in | manual admin entry |
| Nearby Places | Google Places | OpenStreetMap |
| Traffic | Google Maps (Distance Matrix / Roads) | none initially |
| Crime | data.gov.in / NCRB open datasets | none — category shows "insufficient data" |
| Healthcare | data.gov.in health facility datasets | Google Places (hospital density as proxy) |
| Schools | data.gov.in UDISE+ datasets | Google Places (school density as proxy) |
| Internet | TRAI open data | none initially |
| Weather (future) | IMD / OpenWeather | — |

`ExternalDataSource` (DB row, §3) lets an admin flip `isActive`/`priority` per provider without a deploy — the `<Domain>DataService` reads this table to build its ordered list at request time (cached in Redis with a short TTL, invalidated on `PATCH /admin/data-sources/:id`).

---

## 9. Redis Caching Strategy

Extends the existing bare `RedisService` (currently just `get/set/del`) with typed JSON helpers, not a decorator/interceptor layer — matches the codebase's existing low-abstraction style (explicit service calls everywhere, no magic).

| Key | TTL | Invalidated by |
|---|---|---|
| `area:{id}:detail` | 6h | Score/insight recompute for that area |
| `area:{id}:intelligence` | 6h | same |
| `area:{id}:nearby` | 24h | Nearby refresh job |
| `area:{id}:property-stats` | 1h | Property stats job |
| `area:{id}:summary` | 12h | AI summary regeneration |
| `area:search:{queryHash}` | 5min | time-based only (cheap to recompute, changes with new areas) |
| `area:compare:{sortedIdsHash}` | 5min | time-based only |
| `datasource:active-providers:{category}` | 1min | `PATCH /admin/data-sources/:id` |

Write path: the recompute job writes DB, then proactively sets the cache (cache-aside *and* warm-on-write, since these are exactly the jobs that just computed the fresh value — no reason to wait for a cache miss). Read path: cache-first, DB fallback on miss, with the same TTL re-applied.

---

## 10. Security

No new auth mechanism — reuses exactly what exists:

- **JWT auth**: `JwtAuthGuard` on every route (existing).
- **RBAC**: new permission string `area-intelligence:manage` on the `Role` model (existing `Role.permissions[]`, no schema change) for the admin surface; `@Roles('SUPER_ADMIN')` as an additional/alternative gate on the most sensitive endpoints (`/admin/data-sources`), matching the existing pattern where `SUPER_ADMIN` bypasses `RolesGuard` automatically.
- **The real guarantee that property owners can't touch Area Intelligence is architectural, not a permission check**: no property/listing controller imports any Area Intelligence write service. This is enforced at code-review time and by module boundaries (`AreaIntelligenceModule` only exports read-oriented services), the same way `Listing` already can't reach into `Medicine`'s tables.
- **Rate limiting**: add `@nestjs/throttler`, applied globally (not present in the codebase today), with a stricter limit on `/admin/areas/sync|refresh|recalculate` since each call can enqueue expensive external-API fan-out.
- **Audit logs**: every admin-triggered sync/refresh/recalculate is captured in `BackgroundJobLog` (§3) with the triggering `userId` added to that table.
- **Input validation**: existing global `ValidationPipe({ whitelist, transform, forbidNonWhitelisted })` covers every new DTO automatically.
- **SQL injection**: Prisma parameterized queries throughout (existing default); the one raw-SQL risk area is geospatial nearest-neighbor queries (§11) — those use Prisma's tagged-template `$queryRaw` (auto-parameterized), never string concatenation.

---

## 11. Performance & Scalability

- **Geospatial queries need PostGIS**, which Prisma doesn't model natively. Add the `postgis` extension and a `geometry(Point,4326)` column (via `Unsupported("geometry")` + a raw-SQL migration) on `AreaMaster`/`NearbyAmenity`, with a GiST index. Naive haversine-in-application-code does not scale past a few thousand areas; a GiST-indexed nearest-neighbor query does.
- **Cursor pagination** (not offset) on `GET /areas` and `GET /admin/jobs` — offset pagination degrades badly once `AreaHistory`/`BackgroundJobLog` grow into millions of rows.
- **Indexes**: every FK used in a hot-path query (`AreaCategoryScore.areaId`, `AreaHistory(areaId, snapshotAt)`, `NearbyAmenity.category`, `BackgroundJobLog(jobType, startedAt)`) — all specified in §3.
- **Query shaping**: `select`-only field lists on list endpoints (matches the existing `safeUserSelect` pattern in `admin.service.ts`), never `include` full relations on list views.
- **Background processing** takes every external-API call and every recompute off the request path (§7) — the API layer only ever reads Postgres/Redis.
- **Horizontal scaling**: NestJS pods are stateless (JWT, no session) and can scale behind a load balancer as-is; BullMQ workers scale independently from the API pods (separate process/pod, same Redis); Postgres read-replica for the read-heavy `/areas/*` surface once traffic warrants it — the query layer already goes through `area.service.ts`, a single seam to point at a replica connection later.

---

## 12. Observability

None of this exists in the codebase yet — recommended additions, scoped to what Area Intelligence's job-heavy surface actually needs:

- **Structured logging**: replace ad-hoc `Logger`/`console.log` usage with `nestjs-pino` (or keep Nest's built-in `Logger` but ensure every job/provider call logs `jobId`/`areaId`/`providerName` as structured fields, not string interpolation) — needed to debug a specific area's failed sync without grepping.
- **Health checks**: `@nestjs/terminus`, checking Postgres, Redis, and BullMQ queue health — not present today at all (`main.ts` has no `/health` endpoint).
- **Metrics**: `prom-client` exposing job success/failure counts, queue depth, provider latency per category — `/metrics` endpoint behind internal-only access.
- **Job dashboard**: Bull Board mounted at an admin-only route, or `GET /admin/jobs` (§4) for a lighter in-app view.
- **Error tracking**: Sentry (or similar) for uncaught exceptions in both the API and the BullMQ workers — jobs fail silently otherwise unless someone checks `BackgroundJobLog`.

---

## 13. Future Scalability — how new signals slot in without refactoring

Because category scores are already an enum + row (`AreaCategoryScore`), not hardcoded columns, and stats are already key/value (`AreaStatistic`), every item on the spec's future list is additive:

- **Crime Prediction, Flood Risk, AQI, Noise Pollution, Walkability, Livability, Investment, Rental Demand** → new `AreaScoreCategory` enum value (or, if not weighted into the overall score, just a new `AreaStatistic.statKey`) + one new provider implementing the existing provider interface shape. No table changes.
- **Public Transport Score** → reuses `NearbyAmenity` (BUS_STOP/METRO categories already modeled) + a new scorer function.
- **AI Chat about Areas** → new module, reuses `AreaInsight`'s structured context as the chat's grounding data — no change to Area Intelligence itself.
- **Area Trends / Forecasting** → reads `AreaHistory`'s existing append-only snapshots; forecasting is a new read-side service, not a new write path.

---

## 14. Development Roadmap (implementation order)

1. **Foundations** — add `@nestjs/schedule`, `bullmq`/`@nestjs/bullmq`, `@nestjs/throttler`, `@nestjs/terminus`; enable API versioning in `main.ts`; add `area-intelligence:manage` permission seed.
2. **Prisma schema migration** — all §3 models, `postgis` extension + geometry columns.
3. **Area Master** — sync job extending the `GovtLocationProvider` pattern; `AreaMasterService` + read endpoints.
4. **Provider framework** — Nearby Places (Google Places + OSM) first (highest product value), then Traffic/Crime/Healthcare/Schools/Internet.
5. **Data Collector + normalization layer.**
6. **Area Scoring Engine** (pure) — unit-tested independently of any DB/HTTP.
7. **AI Summary generation** (`AreaInsight`).
8. **Redis caching layer** on top of the read services.
9. **Public REST API** (`/areas/*`) + Saved Areas + Compare.
10. **Background job scheduling + BullMQ processors** wiring everything above into cron.
11. **Admin API** (`/admin/areas/*`, `/admin/jobs`, `/admin/data-sources`) + Bull Board.
12. **Property Statistics / Price History / Builder Ratings** — deferred until the Property module exists; stub tables ship in step 2 but stay empty/unused until then.
13. **Observability hardening** (health checks, metrics, structured logs, Sentry).
14. **Load testing + read-replica/queue-worker horizontal scaling validation.**

---

Once this is approved, implementation proceeds module-by-module in the order above, inside this existing `bharat-app-backend` project.

---

## 15. Implementation Notes & Deviations

Steps 1–11 of the roadmap (§14) are implemented. Where the shipped code differs from the design above:

- **Schema apply method**: the project has no `prisma/migrations` history (it's always been managed with `prisma db push`, not `migrate dev`). The Area Intelligence tables were added the same way — `npx prisma db push` — rather than starting a migration history that the rest of the schema doesn't have.
- **PostGIS deferred (§11)**. No `postgis` extension / `geometry` column was added. Geo search (`GET /areas/search` with lat/long+radius) uses a lat/long bounding box (index-friendly on `Locality`) followed by an in-application Haversine distance filter/sort (`area-master.service.ts`, `collector/normalization/geo-normalizer.ts`). This is sufficient well past launch scale (thousands of areas) and needs no new Postgres extension; revisit with a GiST index only once area volume actually warrants it.
- **RBAC gate is `@Roles('AREA_MANAGER')`, not a new `area-intelligence:manage` permission string.** `prisma/seed.ts` already seeded an `AREA_MANAGER` role (`area:view`/`area:manage` permissions) and an `AREA` department before this work started. The admin controller (`area-admin.controller.ts`) uses `@Roles('AREA_MANAGER')` + `RolesGuard`, matching every other module's admin surface (Medicine, Water) exactly — `SUPER_ADMIN` bypasses `RolesGuard` automatically, same as elsewhere. No new permission string was introduced.
- **One BullMQ processor, not one per job type.** §2's folder sketch shows a processor file per job (`area-master-sync.processor.ts`, `nearby-refresh.processor.ts`, …). Since one `@Processor()` class == one BullMQ worker pool bound to a queue, having 8 separate worker classes consume the *same* queue would mean 8 workers racing over every job. The shipped code uses a single queue (`AREA_INTELLIGENCE_QUEUE`) and a single `AreaIntelligenceProcessor` that dispatches by `job.name` (== `BackgroundJobType`) to per-job-type logic — same retry/backoff/BackgroundJobLog guarantees, one worker pool to reason about and scale.
- **Admin `/admin/jobs` and `/admin/data-sources` are nested under `/admin/areas/`** (i.e. `/api/v1/admin/areas/jobs`, `/api/v1/admin/areas/data-sources`), matching this document's own §2 controller declaration (`@Controller({ path: 'admin/areas', version: '1' })`) rather than §4's table, which dropped the `/areas` segment for brevity. `BackgroundJobLog`/`ExternalDataSource` are Area-Intelligence-scoped tables, so nesting avoids any future collision with a generic cross-module `/admin/jobs` endpoint.
- **`GET /areas/saved/mine` was added**, not in the original §4 table. `POST /areas/save` / `DELETE /areas/save/:id` with no way to list what's saved would have been an incomplete feature; this is the minimal read-side completion.
- **Traffic/Crime/Healthcare/Schools/Internet providers ship as framework + one provider each, most disabled until an operator supplies real resource IDs** — consistent with §8's own fallback table ("Crime: none — insufficient data", "Internet: none initially"). `GoogleTrafficProvider` needs `GOOGLE_MAPS_API_KEY`; the four `data.gov.in`-backed providers (`GovtCrimeProvider`, `GovtHealthcareProvider`, `GovtSchoolProvider`, `TraiInternetProvider`) each need `DATA_GOV_IN_API_KEY` **and** a category-specific `DATA_GOV_IN_*_RESOURCE_ID` env var — unlike the pincode directory reused from `src/location`, no single stable/free resource id exists for these datasets, so an operator supplies the one they've vetted. Nearby Places (Google Places + OpenStreetMap Overpass, the latter free/keyless) is the one provider family that's fully live out of the box, per the roadmap's "highest product value" ordering.
- **Property Statistics / Price History / Builder Ratings** remain a true no-op stub (`property-stats/property-statistics.service.ts`) exactly as designed in §12 — read endpoints work (return empty/null), the nightly jobs run and log success with 0 records processed, until a Property module exists.
- **Not yet implemented**: §12 Observability hardening (structured logging via `nestjs-pino`, `@nestjs/terminus` health checks, `prom-client` metrics, Bull Board, Sentry) and §14 step 14 (load testing / read-replica validation). These are lower-risk, additive follow-ups that don't block the module's core functionality and were deferred to keep this change reviewable.
