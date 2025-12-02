import { DynamicModule, Module, Global, Provider, Type } from '@nestjs/common'
import { createClient } from '@supabase/supabase-js'
import {
  SupabaseSeederService,
  SUPABASE_CLIENT_TOKEN,
  SUPABASE_SEEDERS_TOKEN,
  SupabaseSeeder,
} from './services/seeder.service'
import { SEEDER_SERVICE_TOKEN } from '@/common/constants'

export interface SupabaseSdkOptions {
  url: string
  serviceRoleKey: string
  seeders?: Type<SupabaseSeeder>[]
}

@Global()
@Module({})
export class SupabaseSdkModule {
  static forRoot(options: SupabaseSdkOptions): DynamicModule {
    const supabaseProvider: Provider = {
      provide: SUPABASE_CLIENT_TOKEN,
      useFactory: () =>
        createClient(options.url, options.serviceRoleKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        }),
    }

    const seederProviders = (options.seeders || []).map(s => ({
      provide: s,
      useClass: s,
    }))

    const seederArrayProvider: Provider = {
      provide: SUPABASE_SEEDERS_TOKEN,
      useFactory: (...instances: SupabaseSeeder[]) => instances,
      inject: options.seeders || [],
    }

    return {
      module: SupabaseSdkModule,
      providers: [
        supabaseProvider,
        ...seederProviders,
        seederArrayProvider,
        SupabaseSeederService,
        {
          provide: SEEDER_SERVICE_TOKEN,
          useExisting: SupabaseSeederService,
        },
      ],
      exports: [SUPABASE_CLIENT_TOKEN, SEEDER_SERVICE_TOKEN],
    }
  }
}
