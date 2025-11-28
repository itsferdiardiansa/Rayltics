import { Injectable, Logger, Inject } from '@nestjs/common'
import { ISeederService } from '@/common/interfaces/seeder-service.interface'
import * as Redis from 'ioredis'
import ora from 'ora'
import chalk from 'chalk'

// Simple interface for a Redis Seeder
export interface RedisSeeder {
  keyPrefix: string
  run(client: Redis.Redis): Promise<void>
  drop?(client: Redis.Redis): Promise<void>
}

export const REDIS_CLIENT_TOKEN = 'RAYLTICS_REDIS_CLIENT'
export const REDIS_SEEDERS_TOKEN = 'RAYLTICS_REDIS_SEEDERS'

@Injectable()
export class RedisSeederService implements ISeederService {
  private readonly logger = new Logger(RedisSeederService.name)

  constructor(
    @Inject(REDIS_CLIENT_TOKEN) private readonly client: Redis.Redis,
    @Inject(REDIS_SEEDERS_TOKEN) private readonly seeders: RedisSeeder[]
  ) {}

  async seedAll(fresh = false): Promise<void> {
    this.logger.log(
      `Starting Redis seed process for ${this.seeders.length} seeders...`
    )

    for (const seeder of this.seeders) {
      const spinner = ora(
        `Seeding Redis prefix: ${seeder.keyPrefix}...`
      ).start()
      try {
        if (fresh && seeder.drop) {
          await seeder.drop(this.client)
        } else if (fresh) {
          // Default drop strategy: Scan and delete keys with prefix
          const keys = await this.client.keys(`${seeder.keyPrefix}*`)
          if (keys.length > 0) await this.client.del(...keys)
        }

        await seeder.run(this.client)
        spinner.succeed(chalk.green(`Seeded ${seeder.keyPrefix}`))
      } catch (error: any) {
        spinner.fail(chalk.red(`Failed to seed ${seeder.keyPrefix}`))
        this.logger.error(error)
      }
    }
  }

  async dropAll(): Promise<void> {
    // Implement global drop logic similar to seedAll(true)
  }
}
