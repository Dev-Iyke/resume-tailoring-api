import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ResumeController } from './resume.controller.js';
import { ResumeService } from './resume.service.js';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [ResumeController],
  providers: [ResumeService],
})
export class ResumeModule {}
