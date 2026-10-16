import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { TailoringRequestsModule } from './tailoring-requests/tailoring-requests.module.js';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    TailoringRequestsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
