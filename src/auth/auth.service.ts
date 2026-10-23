import {
  BadRequestException,
  ConflictException,
  HttpException,
  UnauthorizedException,
  ForbiddenException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { successResponse } from '../common/responses/api-response.js';
import { hash, verify } from 'argon2';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { MailService } from '../mail/mail.service.js';
import { Prisma, type User } from '../generated/prisma/client.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';
import { ResendVerificationDto } from './dto/resend-verification.dto.js';
import { LoginDto } from './dto/login.dto.js';
import {JwtService} from "@nestjs/jwt"

const MAX_VERIFY_ATTEMPTS = 5;
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
  ) {}

  async register(payload: RegisterDto) {
    const password_hash = await hash(payload.password);

    // OTP Config
    const otpSecret = this.configService.getOrThrow<string>('OTP_HMAC_SECRET');
    const otp = randomInt(0, 100_000_000).toString().padStart(8, '0');
    const code_hash = createHmac('sha256', otpSecret).update(otp).digest('hex');
    const expires_at = new Date(Date.now() + 10 * 60 * 1000);

    let user: User;
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
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'An account with this email already exists.',
        );
      }

      throw error;
    }

    // Send OTP
    await this.mailService.sendVerificationCode(user.email, otp);

    const { id, full_name, email, status } = user;
    return successResponse(
      `An OTP has been sent to ${email} for verification`,
      {
        id,
        full_name,
        email,
        status,
      },
    );
  }

  async verifyEmail(payload: VerifyEmailDto) {
    const invalidCode = () =>
      new BadRequestException('Invalid or expired verification code.');

    const user = await this.prisma.user.findUnique({
      where: { email: payload.email },
      select: { id: true, email: true },
    });

    if (!user) {
      throw invalidCode();
    }

    const verification = await this.prisma.emailVerification.findUnique({
      where: { user_id: user.id },
    });

    const now = new Date();

    if (
      !verification ||
      verification.consumed_at ||
      verification.expires_at <= now
    ) {
      throw invalidCode();
    }

    if (verification.attempt_count >= MAX_VERIFY_ATTEMPTS) {
      throw new HttpException(
        'Too many verification attempts.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const otpSecret = this.configService.getOrThrow<string>('OTP_HMAC_SECRET');
    const submittedHash = createHmac('sha256', otpSecret)
      .update(payload.code)
      .digest('hex');

    const storedHashBuffer = Buffer.from(verification.code_hash, 'hex');
    const submittedHashBuffer = Buffer.from(submittedHash, 'hex');

    const codeMatches =
      storedHashBuffer.length === submittedHashBuffer.length &&
      timingSafeEqual(storedHashBuffer, submittedHashBuffer);

    if (!codeMatches) {
      await this.prisma.emailVerification.updateMany({
        where: {
          id: verification.id,
          consumed_at: null,
          expires_at: { gt: now },
          attempt_count: { lt: MAX_VERIFY_ATTEMPTS },
        },
        data: {
          attempt_count: { increment: 1 },
        },
      });

      if (verification.attempt_count + 1 >= MAX_VERIFY_ATTEMPTS) {
        throw new HttpException(
          'Too many verification attempts.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      throw invalidCode();
    }

    const verifiedAt = new Date();

    await this.prisma.$transaction(async (tx) => {
      const consumed = await tx.emailVerification.updateMany({
        where: {
          id: verification.id,
          consumed_at: null,
          expires_at: { gt: verifiedAt },
          attempt_count: { lt: MAX_VERIFY_ATTEMPTS },
        },
        data: { consumed_at: verifiedAt },
      });

      if (consumed.count !== 1) {
        throw invalidCode();
      }

      await tx.user.update({
        where: { id: user.id },
        data: {
          email_verified_at: verifiedAt,
          status: 'ACTIVE',
        },
      });
    });

    return successResponse('Email verified successfully.', {
      email: user.email,
      email_verified_at: verifiedAt,
      status: 'ACTIVE',
    });
  }

  async resendVerification(payload: ResendVerificationDto) {
    const genericResponse = () =>
      successResponse(
        'If this account needs verification, a new code will be sent.',
        { email: payload.email },
      );

    const user = await this.prisma.user.findUnique({
      where: { email: payload.email },
      select: {
        id: true,
        status: true,
        email_verified_at: true,
      },
    });

    if (
      !user ||
      user.status !== 'PENDING_VERIFICATION' ||
      user.email_verified_at
    ) {
      return genericResponse();
    }

    const now = new Date();
    const cooldownEndsBefore = new Date(now.getTime() - 60 * 1000);
    const otpSecret = this.configService.getOrThrow<string>('OTP_HMAC_SECRET');
    const otp = randomInt(0, 100_000_000).toString().padStart(8, '0');
    const code_hash = createHmac('sha256', otpSecret).update(otp).digest('hex');

    const updated = await this.prisma.emailVerification.updateMany({
      where: {
        user_id: user.id,
        consumed_at: null,
        last_sent_at: { lte: cooldownEndsBefore },
      },
      data: {
        code_hash,
        attempt_count: 0,
        expires_at: new Date(now.getTime() + 10 * 60 * 1000),
        last_sent_at: now,
      },
    });

    if (updated.count !== 1) {
      return genericResponse();
    }

    await this.mailService.sendVerificationCode(payload.email, otp);

    return genericResponse();
  }

  async login(payload: LoginDto) {
  const user = await this.prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user || !(await verify(user.password_hash, payload.password))) {
    throw new UnauthorizedException('Invalid email or password.');
  }

  if (!user.email_verified_at || user.status !== 'ACTIVE') {
    throw new ForbiddenException('This account is not active.');
  }

  const accessToken = await this.jwtService.signAsync({
    sub: user.id,
  });

  return successResponse('Login successful.', {
    access_token: accessToken,
    token_type: 'Bearer',
  });
}
}
