import { Module, Injectable } from '@nestjs/common'
import { SupabaseSdkModule } from '@/supabase/supabase-sdk.module'
import { SupabaseSeeder } from '@/supabase/services/seeder.service'
import { CliFactory } from '@/common/cli-factory'
import { SupabaseClient } from '@supabase/supabase-js'

@Injectable()
class UsersSeeder implements SupabaseSeeder {
  tableName = 'users'

  async run(client: SupabaseClient): Promise<void> {
    console.log('Starting Supabase Seeder...')
    console.log('   (Skipping actual insert - Mock Mode)')
    console.log('Supabase Logic Verified')
  }
}

@Module({
  imports: [
    SupabaseSdkModule.forRoot({
      url: process.env.SUPABASE_URL || 'https://xyz.supabase.co',
      serviceRoleKey: process.env.SUPABASE_KEY || 'fake-key',
      seeders: [UsersSeeder],
    }),
  ],
  providers: [UsersSeeder],
})
class SupabasePlaygroundModule {}

async function bootstrap() {
  process.argv = ['node', 'pg', 'seed', '--fresh']
  await CliFactory.bootstrap(SupabasePlaygroundModule)
}
bootstrap()
