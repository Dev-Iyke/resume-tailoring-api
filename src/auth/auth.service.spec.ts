import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  ConflictException,
  HttpException,
} from '@nestjs/common';
import { createHmac } from 'node:crypto';
import { verify } from 'argon2';
import { AuthService } from './auth.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { MailService } from '../mail/mail.service.js';
import { Prisma } from '../generated/prisma/client.js';

describe('AuthService', () => {
  let service: AuthService;
  const user = {
    id: '4fdc88a1-5f02-4e23-8878-2b82592e90a0',
    full_name: 'Test Candidate',
    email: 'candidate@example.com',
    status: 'PENDING_VERIFICATION',
    password_hash: 'stored-hash',
  };
  const txMock = {
    user: { create: vi.fn(), update: vi.fn() },
    emailVerification: { create: vi.fn(), updateMany: vi.fn() },
  };
  const prismaMock = {
    user: { findUnique: vi.fn() },
    emailVerification: { findUnique: vi.fn(), updateMany: vi.fn() },
    $transaction: vi.fn(),
  };
  const mailMock = {
    sendVerificationCode: vi.fn(),
  };
  const otpSecret = 'test-only-otp-hmac-secret';
  const validCode = '01234567';
  const makeVerification = (overrides: Record<string, unknown> = {}) => ({
    id: '5f4e2d39-214d-4e83-a511-8602d3d830bc',
    user_id: user.id,
    code_hash: createHmac('sha256', otpSecret).update(validCode).digest('hex'),
    attempt_count: 0,
    expires_at: new Date(Date.now() + 5 * 60 * 1000),
    consumed_at: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    prismaMock.user.findUnique.mockResolvedValue({
      id: user.id,
      email: user.email,
    });
    prismaMock.emailVerification.findUnique.mockResolvedValue(
      makeVerification(),
    );
    prismaMock.emailVerification.updateMany.mockResolvedValue({ count: 1 });
    txMock.user.create.mockResolvedValue(user);
    txMock.user.update.mockResolvedValue({ ...user, status: 'ACTIVE' });
    txMock.emailVerification.create.mockResolvedValue({});
    txMock.emailVerification.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.$transaction.mockImplementation(
      async (callback: (tx: typeof txMock) => Promise<unknown>) =>
        callback(txMock),
    );
    mailMock.sendVerificationCode.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        {
          provide: ConfigService,
          useValue: { getOrThrow: vi.fn(() => otpSecret) },
        },
        { provide: MailService, useValue: mailMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('creates the user and verification record, then emails the OTP', async () => {
    const result = await service.register({
      full_name: 'Test Candidate',
      email: 'candidate@example.com',
      password: 'a-long-test-password',
    });

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(txMock.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        full_name: 'Test Candidate',
        email: 'candidate@example.com',
      }),
    });

    const savedPasswordHash = txMock.user.create.mock.calls[0][0].data.password_hash;
    expect(savedPasswordHash).not.toBe('a-long-test-password');
    await expect(verify(savedPasswordHash, 'a-long-test-password')).resolves.toBe(true);

    const verificationData = txMock.emailVerification.create.mock.calls[0][0].data;
    const [sentEmail, sentCode] = mailMock.sendVerificationCode.mock.calls[0];
    expect(sentEmail).toBe('candidate@example.com');
    expect(sentCode).toMatch(/^\d{8}$/);
    expect(verificationData).toEqual({
      user_id: user.id,
      code_hash: createHmac('sha256', otpSecret).update(sentCode).digest('hex'),
      expires_at: expect.any(Date),
    });

    expect(result.data).toEqual({
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      status: user.status,
    });
    expect(JSON.stringify(result)).not.toContain(sentCode);
    expect(JSON.stringify(result)).not.toContain(verificationData.code_hash);
  });

  it('does not send email if the database transaction fails', async () => {
    prismaMock.$transaction.mockRejectedValueOnce(new Error('database failure'));

    await expect(
      service.register({
        full_name: 'Test Candidate',
        email: 'candidate@example.com',
        password: 'a-long-test-password',
      }),
    ).rejects.toThrow('database failure');

    expect(mailMock.sendVerificationCode).not.toHaveBeenCalled();
  });

  it('returns a conflict for an email that is already registered', async () => {
    const duplicateEmailError = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed on the email field',
      {
        code: 'P2002',
        clientVersion: '7.10.0',
        meta: { target: ['email'] },
      },
    );
    prismaMock.$transaction.mockRejectedValueOnce(duplicateEmailError);

    const error = await service
      .register({
        full_name: 'Test Candidate',
        email: 'candidate@example.com',
        password: 'a-long-test-password',
      })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ConflictException);
    expect((error as ConflictException).getStatus()).toBe(409);
    expect((error as ConflictException).message).toBe(
      'An account with this email already exists.',
    );
    expect(mailMock.sendVerificationCode).not.toHaveBeenCalled();
  });

  it('verifies the code, consumes it, and activates the user', async () => {
    const result = await service.verifyEmail({
      email: user.email,
      code: validCode,
    });

    expect(txMock.emailVerification.updateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        id: '5f4e2d39-214d-4e83-a511-8602d3d830bc',
        consumed_at: null,
      }),
      data: { consumed_at: expect.any(Date) },
    });
    expect(txMock.user.update).toHaveBeenCalledWith({
      where: { id: user.id },
      data: {
        email_verified_at: expect.any(Date),
        status: 'ACTIVE',
      },
    });
    expect(result.data).toMatchObject({
      email: user.email,
      status: 'ACTIVE',
    });
  });

  it('increments attempts and rejects an incorrect code', async () => {
    await expect(
      service.verifyEmail({ email: user.email, code: '87654321' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prismaMock.emailVerification.updateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        id: '5f4e2d39-214d-4e83-a511-8602d3d830bc',
        attempt_count: { lt: 5 },
      }),
      data: { attempt_count: { increment: 1 } },
    });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('rejects an expired verification code', async () => {
    prismaMock.emailVerification.findUnique.mockResolvedValueOnce(
      makeVerification({ expires_at: new Date(Date.now() - 1000) }),
    );

    await expect(
      service.verifyEmail({ email: user.email, code: validCode }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('returns 429 after the attempt limit is reached', async () => {
    prismaMock.emailVerification.findUnique.mockResolvedValueOnce(
      makeVerification({ attempt_count: 5 }),
    );

    const error = await service
      .verifyEmail({ email: user.email, code: validCode })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(HttpException);
    expect((error as HttpException).getStatus()).toBe(429);
    expect(prismaMock.emailVerification.updateMany).not.toHaveBeenCalled();
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('resets the verification code and emails a new one after the cooldown', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: user.id,
      status: 'PENDING_VERIFICATION',
      email_verified_at: null,
    });

    const result = await service.resendVerification({ email: user.email });

    expect(prismaMock.emailVerification.updateMany).toHaveBeenCalledWith({
      where: {
        user_id: user.id,
        consumed_at: null,
        last_sent_at: { lte: expect.any(Date) },
      },
      data: {
        code_hash: expect.any(String),
        attempt_count: 0,
        expires_at: expect.any(Date),
        last_sent_at: expect.any(Date),
      },
    });

    const [sentEmail, sentCode] = mailMock.sendVerificationCode.mock.calls[0];
    expect(sentEmail).toBe(user.email);
    expect(sentCode).toMatch(/^\d{8}$/);
    expect(
      prismaMock.emailVerification.updateMany.mock.calls[0][0].data.code_hash,
    ).toBe(createHmac('sha256', otpSecret).update(sentCode).digest('hex'));
    expect(result.message).toContain('If this account needs verification');
  });

  it('does not send another code during the cooldown', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: user.id,
      status: 'PENDING_VERIFICATION',
      email_verified_at: null,
    });
    prismaMock.emailVerification.updateMany.mockResolvedValueOnce({ count: 0 });

    const result = await service.resendVerification({ email: user.email });

    expect(result.message).toContain('If this account needs verification');
    expect(mailMock.sendVerificationCode).not.toHaveBeenCalled();
  });

  it('returns the same generic response without sending for an unknown email', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);

    const result = await service.resendVerification({ email: user.email });

    expect(result.message).toContain('If this account needs verification');
    expect(prismaMock.emailVerification.updateMany).not.toHaveBeenCalled();
    expect(mailMock.sendVerificationCode).not.toHaveBeenCalled();
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
