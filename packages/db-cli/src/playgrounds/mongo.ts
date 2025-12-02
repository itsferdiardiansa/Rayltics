import { Module, Injectable } from '@nestjs/common'
import { Connection, Schema } from 'mongoose'
import { DbSdkModule } from '@/mongo/db-sdk.module'
import { BaseSeeder } from '@/mongo/abstract/base.seeder'
import { CliFactory } from '@/common/cli-factory'

const UserSchema = new Schema({
  name: String,
  email: String,
  age: Number,
  active: Boolean,
})

@Injectable()
class ComplexMongoTestSeeder extends BaseSeeder {
  collectionName = 'users'

  async run(connection: Connection): Promise<void> {
    console.log('Starting Mongo Test...')
    const userModel = this.getModel(connection, 'User', UserSchema)

    console.log('Testing CREATE...')
    await userModel.create([
      { name: 'Alice', email: 'alice@example.com', age: 25, active: true },
      { name: 'Bob', email: 'bob@example.com', age: 30, active: false },
      { name: 'Charlie', email: 'charlie@example.com', age: 35, active: true },
    ])

    console.log('Testing READ...')
    const activeUsers = await userModel.find({ active: true })
    if (activeUsers.length !== 2)
      throw new Error('READ failed: Expected 2 active users')

    console.log('Testing UPDATE...')
    await userModel.updateOne({ name: 'Bob' }, { active: true })
    const bob = await userModel.findOne({ name: 'Bob' })
    if ((!bob as unknown as { active: boolean })?.active)
      throw new Error('UPDATE failed: Bob should be active')

    console.log('Testing DELETE...')
    await userModel.deleteOne({ name: 'Alice' })
    const alice = await userModel.findOne({ name: 'Alice' })
    if (alice) throw new Error('DELETE failed: Alice should be gone')

    console.log('Testing AGGREGATION...')
    const stats = await userModel.aggregate([
      { $group: { _id: null, avgAge: { $avg: '$age' } } },
    ])
    if (stats[0].avgAge !== 32.5)
      throw new Error(
        `AGGREGATION failed: Expected avg 32.5, got ${stats[0].avgAge}`
      )

    console.log('All Mongo Operations Passed!')
  }
}

@Module({
  imports: [
    DbSdkModule.forRoot({
      mongoUri:
        'mongodb://admin:securepassword123@localhost:27017/test_db?authSource=admin',
      seeders: [ComplexMongoTestSeeder],
    }),
  ],
  providers: [ComplexMongoTestSeeder],
})
class PlaygroundModule {}

async function bootstrap() {
  console.log('Bootstrapping Playground...')
  process.argv = ['node', 'playground', 'seed', '--fresh']
  await CliFactory.bootstrap(PlaygroundModule)
}

bootstrap()
