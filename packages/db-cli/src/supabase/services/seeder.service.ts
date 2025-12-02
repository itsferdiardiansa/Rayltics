import { Injectable, Logger, Inject } from '@nestjs/common'
import { ISeederService } from '@/common/interfaces/seeder-service.interface'
import { SupabaseClient } from '@supabase/supabase-js'
import ora from 'ora'
import chalk from 'chalk'

export interface SupabaseSeeder {
  tableName: string
  run(client: SupabaseClient): Promise<void>
}

export const SUPABASE_CLIENT_TOKEN = 'RAYLTICS_SUPABASE_CLIENT'
export const SUPABASE_SEEDERS_TOKEN = 'RAYLTICS_SUPABASE_SEEDERS'

@Injectable()
export class SupabaseSeederService implements ISeederService {
  private readonly logger = new Logger(SupabaseSeederService.name)

  constructor(
    @Inject(SUPABASE_CLIENT_TOKEN) private readonly client: SupabaseClient,
    @Inject(SUPABASE_SEEDERS_TOKEN) private readonly seeders: SupabaseSeeder[]
  ) {}

  async seedAll(fresh = false): Promise<void> {
    this.logger.log(
      `Starting Supabase seed process for ${this.seeders.length} tables...`
    )

    for (const seeder of this.seeders) {
      const spinner = ora(`Seeding table: ${seeder.tableName}...`).start()
      try {
        if (fresh) {
          // Delete all rows. Note: This requires Service Role key to bypass RLS
          const { error } = await this.client
            .from(seeder.tableName)
            .delete()
            .neq('id', 0) // Hack to delete all rows usually

          if (error) throw error
        }

        await seeder.run(this.client)
        spinner.succeed(chalk.green(`Seeded ${seeder.tableName}`))
      } catch (error: any) {
        spinner.fail(chalk.red(`Failed to seed ${seeder.tableName}`))
        this.logger.error(error.message || error)
      }
    }
  }

  async dropAll(): Promise<void> {
    // Supabase-js client cannot DROP TABLES (DDL).
    // It can only manipulate data (DML).
    // You would need a raw Postgres connection string and 'pg' library to drop actual tables.
    this.logger.warn(
      'Drop All is not supported via Supabase JS Client. Use "seed --fresh" to truncate data.'
    )
  }
}
