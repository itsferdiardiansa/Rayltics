import Redis from 'ioredis'
import { DynamicModule, Module, Global, Provider, Type } from '@nestjs/common'
import {
  RedisSeederService,
  REDIS_CLIENT_TOKEN,
  REDIS_SEEDERS_TOKEN,
  RedisSeeder,
} from './services/seeder.service'
import { SEEDER_SERVICE_TOKEN } from '@/common/constants'

export interface RedisSdkOptions {
  host: string
  port: number
  password?: string
  seeders?: Type<RedisSeeder>[]
}

@Global()
@Module({})
export class RedisSdkModule {
  static forRoot(options: RedisSdkOptions): DynamicModule {
    const redisProvider: Provider = {
      provide: REDIS_CLIENT_TOKEN,
      useFactory: () =>
        new Redis({
          host: options.host,
          port: options.port,
          password: options.password,
        }),
    }

    const seederProviders = (options.seeders || []).map(s => ({
      provide: s,
      useClass: s,
    }))

    const seederArrayProvider: Provider = {
      provide: REDIS_SEEDERS_TOKEN,
      useFactory: (...instances: RedisSeeder[]) => instances,
      inject: options.seeders || [],
    }

    return {
      module: RedisSdkModule,
      providers: [
        redisProvider,
        ...seederProviders,
        seederArrayProvider,
        RedisSeederService,
        {
          provide: SEEDER_SERVICE_TOKEN,
          useExisting: RedisSeederService,
        },
      ],
      exports: [REDIS_CLIENT_TOKEN, SEEDER_SERVICE_TOKEN],
    }
  }
}
