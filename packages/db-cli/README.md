# @rayltics/db-cli

A modular, multi-database CLI toolkit for NestJS applications. This library provides a unified interface for seeding and managing database states across MongoDB, Redis, and Supabase, specifically designed for development, testing, and CI/CD pipelines.

## Goals & Objectives

- Unified CLI Experience: Run seeds and database drops using a consistent command structure (seed, drop) regardless of the underlying database technology.
- Modular Architecture: Import only the SDKs you need (DbSdkModule for Mongo, RedisSdkModule for Redis, etc.).
- Type-Safe Seeding: Enforce strict interfaces for seeders to ensure reliability and maintainability.
- CI/CD Ready: Built to be executed in automated pipelines to set up fresh database states for integration tests.
- Developer Friendly: Includes built-in spinners, logging, and error handling for a smooth developer experience.

## Installation

This package is part of the Rayltics monorepo. Ensure you have the necessary peer dependencies installed in your consuming application.

### Install peer dependencies based on the modules you use

```bash
pnpm add @nestjs/common @nestjs/core @nestjs/mongoose mongoose @supabase/supabase-js ioredis
```

## How to Implement in NestJS

### 1. MongoDB Implementation

#### A. Create a Seeder

#### Extend the BaseSeeder class. This gives you access to the getModel helper and automatic connection handling.

```ts
// src/database/seeders/cats.seeder.ts
import { Injectable } from '@nestjs/common'
import { BaseSeeder, Connection, Schema } from '@rayltics/db-cli/mongo'

const CatSchema = new Schema({ name: String, age: Number })

@Injectable()
export class CatsSeeder extends BaseSeeder {
  collectionName = 'cats'

  async run(connection: Connection): Promise<void> {
    const catModel = this.getModel(connection, 'Cat', CatSchema)

    await catModel.create([
      { name: 'Mittens', age: 2 },
      { name: 'Luna', age: 4 },
    ])
  }
}
```

#### B. Register in Module

#### Import DbSdkModule in your CLI-specific module (e.g., DbCliModule or AppModule).

```ts
import { Module } from '@nestjs/common'
import { DbSdkModule } from '@rayltics/db-cli/mongo'
import { CatsSeeder } from './database/seeders/cats.seeder'

@Module({
  imports: [
    DbSdkModule.forRoot({
      mongoUri: process.env.MONGO_URI,
      seeders: [CatsSeeder],
    }),
  ],
})
export class DbCliModule {}
```

#### C. Run the CLI

#### Use the CliFactory to bootstrap the command line interface.

```ts
// src/main-cli.ts
import { CliFactory } from '@rayltics/db-cli/common'
import { DbCliModule } from './db-cli.module'

async function bootstrap() {
  await CliFactory.bootstrap(DbCliModule)
}
bootstrap()
```

### 2. Redis Implementation

#### A. Create a Seeder

```ts
Implement the RedisSeeder interface.
import { Injectable } from '@nestjs/common'
import { RedisSeeder, Redis } from '@rayltics/db-cli/redis'

@Injectable()
export class CacheSeeder implements RedisSeeder {
  keyPrefix = 'app:cache:'

  async run(client: Redis): Promise<void> {
    await client.set('app:cache:config', JSON.stringify({ theme: 'dark' }))
  }
}
```

#### B. Register in Module

```ts
import { RedisSdkModule } from '@rayltics/db-cli/redis'

@Module({
  imports: [
    RedisSdkModule.forRoot({
      host: 'localhost',
      port: 6379,
      seeders: [CacheSeeder],
    }),
  ],
})
export class DbCliModule {}
```

### 3. Supabase Implementation

#### A. Create a Seeder

Implement the SupabaseSeeder interface. Use the clean method for complex relational deletions.

```ts
import { Injectable } from '@nestjs/common'
import { SupabaseSeeder, SupabaseClient } from '@rayltics/db-cli/supabase'

@Injectable()
export class UsersSeeder implements SupabaseSeeder {
  tableName = 'users'

  async clean(client: SupabaseClient) {
    const { data } = await client.auth.admin.listUsers()
    for (const user of data.users) {
      await client.auth.admin.deleteUser(user.id)
    }
  }

  async run(client: SupabaseClient): Promise<void> {
    await client.auth.admin.createUser({
      email: 'admin@example.com',
      password: 'securepassword',
      email_confirm: true,
    })
  }
}
```

#### B. Register in Module

#### Crucial: You must provide the SERVICE_ROLE_KEY to bypass Row Level Security (RLS) during seeding.

```ts
import { SupabaseSdkModule } from '@rayltics/db-cli/supabase'

@Module({
  imports: [
    SupabaseSdkModule.forRoot({
      url: process.env.SUPABASE_URL,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      seeders: [UsersSeeder],
    }),
  ],
})
export class DbCliModule {}
```

## Do's and Don'ts

| Category | Do ✅                                                             | Don't ❌                                                                         |
| -------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Testing  | Use these seeders to prepare a clean state before e2e tests.      | Use these seeders in production without extreme caution.                         |
| Logic    | Keep seeder logic idempotent (able to run multiple times safely). | Put complex business logic inside seeders keep them data-focused.                |
| Supabase | Use clean() method for tables with Foreign Keys.                  | Rely on the default auto-delete for complex relational tables.                   |
| Supabase | Use service_role key for seeding.                                 | Use anon key (it will fail due to RLS and lack of admin rights).                 |
| Mongo    | Use BaseSeeder and getModel for quick model access.               | Define full NestJS Mongoose Schemas inside the seeder file (keep them separate). |
| General  | Use the --fresh flag to reset data before seeding.                | Hardcode credentials in your seeders use ConfigService or env vars.              |

## File Structure & Functionality

| Directory / File           | Description    | Functionality                                                                      |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------- |
| src/common/                | Core Logic     | Shared interfaces and the generic CLI bootstrap logic.                             |
| cli-factory.ts             | CLI Entrypoint | Uses commander to parse args (seed, drop) and triggers the generic ISeederService. |
| constants.ts               | Tokens         | Defines SEEDER_SERVICE_TOKEN used for Dependency Injection decoupling.             |
| src/mongo/                 | MongoDB SDK    | Tools for seeding MongoDB via Mongoose.                                            |
| db-sdk.module.ts           | Module         | Configures Mongoose and binds the Mongo SeederService to the generic token.        |
| abstract/base.seeder.ts    | Helper Class   | Abstract class that handles drop() logic and provides getModel<T>() helper.        |
| src/redis/                 | Redis SDK      | Tools for seeding Redis via ioredis.                                               |
| redis-sdk.module.ts        | Module         | Configures Redis client and binds the Redis SeederService.                         |
| src/supabase/              | Supabase SDK   | Tools for seeding Supabase (Postgres) via supabase-js.                             |
| supabase-sdk.module.ts     | Module         | Configures Supabase client (Auth/DB) and binds the Supabase SeederService.         |
| services/seeder.service.ts | Service        | Handles clean() logic and executes user-defined seeders against the Supabase API.  |
| src/playgrounds/           | Manual Tests   | Isolated scripts to manually verify SDK functionality during development.          |

## CLI Commands

Once integrated into your application's main.ts (or equivalent script), you can run:

```bash
# Seed the database (Append data)
node dist/apps/my-app/main-cli.js seed

# Fresh Seed (Drop/Clean tables first, then seed)
node dist/apps/my-app/main-cli.js seed --fresh

# Drop Only (Clear database)
node dist/apps/my-app/main-cli.js drop
```
