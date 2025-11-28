import { Connection } from 'mongoose'

export interface Seeder {
  /**
   * The name of the collection this seeder manages.
   * Used for logging and selective dropping.
   */
  collectionName: string

  /**
   * The execution logic for the seed.
   * @param connection The mongoose connection instance
   */
  run(connection: Connection): Promise<void>

  /**
   * Optional: Logic to run before seeding (e.g. clearing specific data)
   */
  beforeRun?(connection: Connection): Promise<void>
}
