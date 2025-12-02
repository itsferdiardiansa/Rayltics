# @rayltics/db-cli

`2025-12-01`
## 1.0.0

### Check updates [here](https://github.com/itsferdiardiansa/Rayltics/pull/2)

### Major Changes

- Implementing multi-database SDKs for `Mongo`, `Redis`, and `Supabase`
  - **Core Architecture:**
    - Refactored entire project structure into modular SDKs (`src/mongo`, `src/redis`, `src/supabase`) for better separation of concerns.
    - Introduced generic `CliFactory` and `ISeederService` interface in `src/common` to decouple the CLI runner from specific database implementations.
    - Configured `@/*` path aliases to simplify imports and improve maintainability.
  - **MongoDB SDK:**
    - Implemented `DbSdkModule` with `forRoot` and `forRootAsync` support for flexible configuration.
    - Added `BaseSeeder` abstract class featuring a `getModel` helper that bypasses complex Mongoose recursive type checks during build time, significantly improving compilation speed.
    - Implemented automatic collection dropping logic in `SeederService`.
  - **Redis SDK:**
    - Implemented `RedisSdkModule` wrapping `ioredis` for seamless NestJS integration.
    - Created `RedisSeederService` with support for prefix-based key clearing (`drop`), allowing targeted cleanup of cache keys.
  - **Supabase SDK:**
    - Implemented `SupabaseSdkModule` wrapping the official `@supabase/supabase-js` client.
    - Added crucial support for the `service_role` key to bypass Row Level Security (RLS) during seeding operations.
    - Implemented a smart `clean()` hook in seeders to manually handle complex relational deletions (Foreign Keys) before seeding, solving issues where generic drops would fail due to constraints.
  - **Developer Experience & Testing:**
    - Added a dedicated `src/playgrounds` directory with isolated scripts (`mongo.ts`, `redis.ts`, `supabase.ts`) for rapid manual verification of each SDK.
    - Added `docker-compose.yml` to instantly spin up local Mongo and Redis instances for testing.
    - Configured `tsconfig.playground.json` to enable `tsx` execution with decorators and path aliases support, separating test configuration from the strict production build.
