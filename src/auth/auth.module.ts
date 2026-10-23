import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { MailModule } from '../mail/mail.module.js';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  imports: [PrismaModule, MailModule]
})
export class AuthModule {}
