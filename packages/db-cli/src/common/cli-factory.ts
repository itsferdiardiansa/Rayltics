import { Command } from 'commander'
import { NestFactory } from '@nestjs/core'
import { SEEDER_SERVICE_TOKEN } from './constants'
import { ISeederService } from './interfaces/seeder-service.interface'

export class CliFactory {
  static async bootstrap(AppModule: any) {
    const program = new Command()

    program.version('1.0.0').description('Service specific Database CLI')

    const appContext = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn'],
    })

    // GENERIC: Resolve the service using the shared TOKEN, not a concrete class
    const seederService = appContext.get<ISeederService>(SEEDER_SERVICE_TOKEN)

    program
      .command('seed')
      .description('Run seeders registered in this service')
      .option('--fresh', 'Drop collections/tables before seeding', false)
      .action(async options => {
        try {
          await seederService.seedAll(options.fresh)
          process.exit(0)
        } catch (e) {
          console.error(e)
          process.exit(1)
        }
      })

    program
      .command('drop')
      .description('Drop all collections/tables registered in this service')
      .action(async () => {
        try {
          await seederService.dropAll()
          process.exit(0)
        } catch (e) {
          console.error(e)
          process.exit(1)
        }
      })

    await program.parseAsync(process.argv)
  }
}
