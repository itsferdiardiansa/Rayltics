import { Command } from 'commander'
import { NestFactory } from '@nestjs/core'
import { SeederService } from './services/seeder.service'

export class CliFactory {
  static async bootstrap(AppModule: any) {
    const program = new Command()

    program.version('1.0.0').description('Service specific Database CLI')

    const appContext = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn'],
    })

    const seederService = appContext.get(SeederService)

    program
      .command('seed')
      .description('Run seeders registered in this service')
      .option('--fresh', 'Drop collections before seeding', false)
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
      .description('Drop all collections registered in this service')
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
