import { Connection, Model, Schema } from 'mongoose'
import { Seeder } from '../interfaces/seeder.interface'

export abstract class BaseSeeder implements Seeder {
  abstract collectionName: string
  abstract run(connection: Connection): Promise<void>

  protected getModel<T>(
    connection: Connection,
    name: string,
    schema: Schema
  ): Model<T> {
    if (connection.models[name]) {
      return connection.models[name] as Model<T>
    }

    return connection.model(name, schema) as unknown as Model<T>
  }

  async drop(connection: Connection): Promise<void> {
    try {
      await connection.dropCollection(this.collectionName)
    } catch (error: any) {
      if (error.code !== 26) {
        throw error
      }
    }
  }
}
