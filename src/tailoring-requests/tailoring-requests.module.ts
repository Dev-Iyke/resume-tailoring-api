import { Module } from '@nestjs/common';
import { TailoringRequestsService } from './tailoring-requests.service.js';
import { TailoringRequestsController } from './tailoring-requests.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { AiModule } from '../ai/ai.module.js';

@Module({
  imports: [PrismaModule, AuthModule, AiModule],
  controllers: [TailoringRequestsController],
  providers: [TailoringRequestsService],
})
export class TailoringRequestsModule {}
