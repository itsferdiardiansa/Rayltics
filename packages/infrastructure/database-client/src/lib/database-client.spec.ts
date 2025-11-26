import { databaseClient } from './database-client.js'

describe('databaseClient', () => {
  it('should work', () => {
    expect(databaseClient()).toEqual('database-client')
  })
})
