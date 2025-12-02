export interface ISeederService {
  seedAll(fresh?: boolean): Promise<void>
  dropAll(): Promise<void>
}
