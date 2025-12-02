import * as Redis from 'ioredis'
import { Module, Injectable } from '@nestjs/common'
import { RedisSdkModule } from '@/redis/redis-sdk.module'
import { RedisSeeder } from '@/redis/services/seeder.service'
import { CliFactory } from '@/common/cli-factory'

@Injectable()
class CacheSeeder implements RedisSeeder {
  keyPrefix = 'app:cache:'

  async run(client: Redis.Redis): Promise<void> {
    console.log('Starting Redis Seeder...')
    await client.set(`${this.keyPrefix}config`, '{"theme": "dark"}')
    console.log('Redis Seeded! Key set.')
  }
}

@Module({
  imports: [
    RedisSdkModule.forRoot({
      host: 'localhost',
      port: 6379,
      password: 'securepassword123',
      seeders: [CacheSeeder],
    }),
  ],
  providers: [CacheSeeder],
})
class RedisPlaygroundModule {}

async function bootstrap() {
  process.argv = ['node', 'pg', 'seed', '--fresh']
  await CliFactory.bootstrap(RedisPlaygroundModule)
}
bootstrap()
