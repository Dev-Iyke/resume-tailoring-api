import { Module } from '@nestjs/common';
import { TailoringRequestsService } from './tailoring-requests.service.js';
import { TailoringRequestsController } from './tailoring-requests.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [TailoringRequestsController],
  providers: [TailoringRequestsService],
})
export class TailoringRequestsModule {}
