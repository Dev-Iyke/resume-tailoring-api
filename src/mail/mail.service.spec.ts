import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service.js';

const { createTransportMock, sendMailMock } = vi.hoisted(() => {
  const sendMailMock = vi.fn();

  return {
    sendMailMock,
    createTransportMock: vi.fn(() => ({ sendMail: sendMailMock })),
  };
});

vi.mock('nodemailer', () => ({
  default: { createTransport: createTransportMock },
}));

describe('MailService', () => {
  let service: MailService;
  const config = {
    SMTP_HOST: 'smtp.gmail.com',
    SMTP_PORT: '587',
    SMTP_SECURE: 'false',
    SMTP_USER: 'sender@example.com',
    SMTP_PASSWORD: 'test-app-password',
    EMAIL_FROM: 'sender@example.com',
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: vi.fn((key: keyof typeof config) => config[key]),
          },
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it('configures the Gmail SMTP transport from environment settings', () => {
    expect(createTransportMock).toHaveBeenCalledWith({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'sender@example.com',
        pass: 'test-app-password',
      },
    });
  });

  it('sends a verification code to the requested address', async () => {
    await service.sendVerificationCode('candidate@example.com', '01234567');

    expect(sendMailMock).toHaveBeenCalledWith({
      from: 'sender@example.com',
      to: 'candidate@example.com',
      subject: 'Verify your email address',
      text: 'Your verification code is 01234567. It expires in 10 minutes.',
    });
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
