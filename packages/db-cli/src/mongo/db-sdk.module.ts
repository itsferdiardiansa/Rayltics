import { DynamicModule, Module, Provider, Type, Global } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { SeederService } from './services/seeder.service'
import { SEEDER_TOKEN } from './constants'
import { Seeder } from './interfaces/seeder.interface'
import { SEEDER_SERVICE_TOKEN } from '@/common/constants'

export interface DbSdkOptions {
  mongoUri: string
  seeders?: Type<Seeder>[]
}

export interface DbSdkAsyncOptions {
  imports?: any[]
  useFactory: (...args: any[]) => Promise<DbSdkOptions> | DbSdkOptions
  inject?: any[]
}

@Global()
@Module({})
export class DbSdkModule {
  static forRoot(options: DbSdkOptions): DynamicModule {
    const providers = this.createSeederProviders(options.seeders || [])

    return {
      module: DbSdkModule,
      imports: [
        MongooseModule.forRoot(options.mongoUri, {
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 10000,
        }),
      ],
      providers: [
        SeederService, // Keep concrete for internal use if needed
        {
          provide: SEEDER_SERVICE_TOKEN, // Bind generic token to concrete service
          useExisting: SeederService,
        },
        ...providers,
      ],
      exports: [SeederService, MongooseModule, SEEDER_SERVICE_TOKEN],
    }
  }

  static forRootAsync(options: DbSdkAsyncOptions): DynamicModule {
    return {
      module: DbSdkModule,
      imports: [
        ...(options.imports || []),
        MongooseModule.forRootAsync({
          imports: options.imports || [],
          useFactory: async (...args) => {
            const config = await options.useFactory(...args)
            return {
              uri: config.mongoUri,
              serverSelectionTimeoutMS: 5000,
              connectTimeoutMS: 10000,
            }
          },
          inject: options.inject || [],
        }),
      ],
      providers: [
        SeederService,
        {
          provide: SEEDER_SERVICE_TOKEN,
          useExisting: SeederService,
        },
        ...this.createAsyncSeederProviders(options),
      ],
      exports: [SeederService, MongooseModule, SEEDER_SERVICE_TOKEN],
    }
  }

  private static createSeederProviders(seeders: Type<Seeder>[]): Provider[] {
    const seederProviders: Provider[] = seeders.map(seeder => ({
      provide: seeder,
      useClass: seeder,
    }))

    const seederArrayProvider: Provider = {
      provide: SEEDER_TOKEN,
      useFactory: (...instances: Seeder[]) => instances,
      inject: seeders,
    }

    return [...seederProviders, seederArrayProvider]
  }

  private static createAsyncSeederProviders(
    options: DbSdkAsyncOptions
  ): Provider[] {
    return [
      {
        provide: SEEDER_TOKEN,
        useFactory: async (...args) => {
          // You might want to instantiate specific seeders here in a real async scenario
          return []
        },
        inject: options.inject || [],
      },
    ]
  }
}
