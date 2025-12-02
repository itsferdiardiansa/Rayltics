import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { AppController } from './app.controller'

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
