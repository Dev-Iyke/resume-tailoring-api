import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ConflictException } from '@nestjs/common';
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
    user: { create: vi.fn() },
    emailVerification: { create: vi.fn() },
  };
  const prismaMock = {
    $transaction: vi.fn(),
  };
  const mailMock = {
    sendVerificationCode: vi.fn(),
  };
  const otpSecret = 'test-only-otp-hmac-secret';

  beforeEach(async () => {
    vi.clearAllMocks();
    txMock.user.create.mockResolvedValue(user);
    txMock.emailVerification.create.mockResolvedValue({});
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

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
