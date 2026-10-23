import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { successResponse } from '../common/responses/api-response.js';
import { hash } from 'argon2';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomInt } from 'node:crypto';
import { MailService } from '../mail/mail.service.js';
import { Prisma, type User } from '../generated/prisma/client.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async register(payload: RegisterDto) {
    const password_hash = await hash(payload.password);

    // OTP Config
    const otpSecret = this.configService.getOrThrow<string>('OTP_HMAC_SECRET');
    const otp = randomInt(0, 100_000_000).toString().padStart(8, '0');
    const code_hash = createHmac('sha256', otpSecret).update(otp).digest('hex');
    const expires_at = new Date(Date.now() + 10 * 60 * 1000);

    let user: User
    try {
      user = await this.prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            full_name: payload.full_name,
            email: payload.email,
            password_hash,
          },
        });
  
        await tx.emailVerification.create({
          data: {
            user_id: createdUser.id,
            code_hash,
            expires_at,
          },
        });
        
        return createdUser;
      });
    } catch (error: unknown) {
      if(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"){
        throw new ConflictException("An account with this email already exists.")
      }

      throw error
    }
    
    // Send OTP
    await this.mailService.sendVerificationCode(user.email, otp)

    const { id, full_name, email, status } = user;
    return successResponse(`An OTP has been sent to ${email} for verification`, {
      id,
      full_name,
      email,
      status,
    });
  }
}
