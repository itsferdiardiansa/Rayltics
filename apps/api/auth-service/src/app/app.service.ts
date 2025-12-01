import { Injectable } from '@nestjs/common'

@Injectable()
export class AppService {
  generateToken(): { token: string | number } {
    return { token: 'Bearers: ' + +new Date() }
  }
}
