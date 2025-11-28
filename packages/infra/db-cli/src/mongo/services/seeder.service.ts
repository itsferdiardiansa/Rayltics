import { Injectable, Inject, Logger } from '@nestjs/common'
import { InjectConnection } from '@nestjs/mongoose'
import { Connection } from 'mongoose'
import chalk from 'chalk'
import ora from 'ora'
import { Seeder } from '../interfaces/seeder.interface'
import { SEEDER_TOKEN } from '../constants'
import { ISeederService } from '@/common/interfaces/seeder-service.interface'

@Injectable()
export class SeederService implements ISeederService {
  private readonly logger = new Logger(SeederService.name)

  constructor(
    @InjectConnection() private readonly connection: Connection,
    @Inject(SEEDER_TOKEN) private readonly seeders: Seeder[]
  ) {}

  /**
   * Runs all registered seeders
   */
  async seedAll(fresh = false): Promise<void> {
    this.logger.log(
      `Starting seed process for ${this.seeders.length} seeders...`
    )

    for (const seeder of this.seeders) {
      const spinner = ora(`Seeding ${seeder.collectionName}...`).start()

      try {
        if (fresh) {
          await seeder.beforeRun?.(this.connection)
          if ((seeder as any).drop) {
            await (seeder as any).drop(this.connection)
          }
        }

        await seeder.run(this.connection)
        spinner.succeed(chalk.green(`Seeded ${seeder.collectionName}`))
      } catch (error: any) {
        spinner.fail(chalk.red(`Failed to seed ${seeder.collectionName}`))
        this.logger.error(error.message, error.stack)
      }
    }

    this.logger.log('Seeding process completed.')
  }

  /**
   * Drops all collections managed by registered seeders
   */
  async dropAll(): Promise<void> {
    const spinner = ora('Dropping collections...').start()

    for (const seeder of this.seeders) {
      try {
        await this.connection.dropCollection(seeder.collectionName)
        spinner.text = `Dropped ${seeder.collectionName}`
      } catch (error: any) {
        if (error.code !== 26) {
          this.logger.error(
            `Error dropping ${seeder.collectionName}: ${error.message}`
          )
        }
      }
    }

    spinner.succeed('All managed collections dropped.')
  }
}
