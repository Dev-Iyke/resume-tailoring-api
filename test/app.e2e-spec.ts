import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { hash } from 'argon2';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { AiService } from '../src/ai/ai.service.js';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter.js';
import { MailService } from '../src/mail/mail.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('API (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let activeUser: { id: string; email: string };
  let pendingUser: { id: string; email: string };
  let activeUserToken: string;
  let activeUsersResumeId: string;
  let pendingUsersRequestId: string;
  const testPassword = 'Test-only-password-2026!';
  const userIds: string[] = [];
  const resumeIds: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailService)
      .useValue({ sendVerificationCode: vi.fn() })
      .overrideProvider(AiService)
      .useValue({ generateTailoringResult: vi.fn() })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter(app.get(HttpAdapterHost)));
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.setGlobalPrefix('api/v1');
    await app.init();

    prisma = app.get(PrismaService);
    const passwordHash = await hash(testPassword);
    const suffix = randomUUID();
    activeUser = await prisma.user.create({
      data: {
        full_name: 'E2E Active User',
        email: `e2e-active-${suffix}@example.test`,
        password_hash: passwordHash,
        status: 'ACTIVE',
        email_verified_at: new Date(),
      },
      select: { id: true, email: true },
    });
    pendingUser = await prisma.user.create({
      data: {
        full_name: 'E2E Pending User',
        email: `e2e-pending-${suffix}@example.test`,
        password_hash: passwordHash,
      },
      select: { id: true, email: true },
    });
    userIds.push(activeUser.id, pendingUser.id);

    const activeUsersResume = await prisma.resume.create({
      data: {
        user_id: activeUser.id,
        text: 'Test-only resume content for CRUD checks.',
      },
      select: { id: true },
    });
    activeUsersResumeId = activeUsersResume.id;
    resumeIds.push(activeUsersResume.id);

    const pendingUsersResume = await prisma.resume.create({
      data: {
        user_id: pendingUser.id,
        text: 'Test-only resume content for ownership checks.',
      },
      select: { id: true },
    });
    resumeIds.push(pendingUsersResume.id);
    const pendingUsersRequest = await prisma.tailoringRequest.create({
      data: {
        resume_id: pendingUsersResume.id,
        job_title: 'Test Engineer',
        job_description: 'A test-only role used for integration checks.',
      },
      select: { id: true },
    });
    pendingUsersRequestId = pendingUsersRequest.id;

    activeUserToken = await app.get(JwtService).signAsync({
      sub: activeUser.id,
    });
  });

  it('returns the health response', () => {
    return request(app.getHttpServer())
      .get('/api/v1')
      .expect(200)
      .expect('Hello World!');
  });

  it('rejects an unauthenticated request to a protected endpoint', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/tailoring-requests')
      .expect(401);

    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns the standard validation error for an invalid registration body', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({})
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('logs in an active, verified user', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: activeUser.email, password: testPassword })
      .expect(200);

    expect(response.body.data.access_token).toEqual(expect.any(String));
    expect(response.body.data.token_type).toBe('Bearer');
  });

  it('forbids login for an unverified user', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: pendingUser.email, password: testPassword })
      .expect(403);

    expect(response.body.error.code).toBe('FORBIDDEN');
  });

  it('returns 429 after the auth route exceeds its request limit', async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await request(app.getHttpServer())
        .post('/api/v1/auth/verify-email')
        .send({})
        .expect(400);
    }

    await request(app.getHttpServer())
      .post('/api/v1/auth/verify-email')
      .send({})
      .expect(429);
  });

  it('returns not found for an authenticated request with an unknown ID', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/tailoring-requests/${randomUUID()}`)
      .set('Authorization', `Bearer ${activeUserToken}`)
      .expect(404);

    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('does not list another users tailoring requests', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/tailoring-requests')
      .set('Authorization', `Bearer ${activeUserToken}`)
      .expect(200);

    expect(response.body.data).toEqual([]);
  });

  it('hides another users tailoring request as not found', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/tailoring-requests/${pendingUsersRequestId}`)
      .set('Authorization', `Bearer ${activeUserToken}`)
      .expect(404);

    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('rejects a malformed request ID', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/tailoring-requests/not-a-uuid')
      .set('Authorization', `Bearer ${activeUserToken}`)
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('creates, lists, fetches, updates, and deletes an owned tailoring request', async () => {
    const createdResponse = await request(app.getHttpServer())
      .post('/api/v1/tailoring-requests')
      .set('Authorization', `Bearer ${activeUserToken}`)
      .send({
        resume_id: activeUsersResumeId,
        company_name: 'Test Company',
        job_title: 'Backend Developer',
        job_description:
          'A test-only backend role requiring Node.js, API development, PostgreSQL, testing, and collaboration with a product engineering team.',
      })
      .expect(201);

    const requestId = createdResponse.body.data.id as string;
    expect(createdResponse.body.data.status).toBe('PENDING');
    expect(createdResponse.body.data.result).toBeNull();

    const listResponse = await request(app.getHttpServer())
      .get('/api/v1/tailoring-requests')
      .set('Authorization', `Bearer ${activeUserToken}`)
      .expect(200);

    expect(
      listResponse.body.data.map((item: { id: string }) => item.id),
    ).toContain(requestId);

    const fetchedResponse = await request(app.getHttpServer())
      .get(`/api/v1/tailoring-requests/${requestId}`)
      .set('Authorization', `Bearer ${activeUserToken}`)
      .expect(200);

    expect(fetchedResponse.body.data.id).toBe(requestId);

    const updatedResponse = await request(app.getHttpServer())
      .patch(`/api/v1/tailoring-requests/${requestId}`)
      .set('Authorization', `Bearer ${activeUserToken}`)
      .send({ job_title: 'Junior Backend Developer' })
      .expect(200);

    expect(updatedResponse.body.data.job_title).toBe(
      'Junior Backend Developer',
    );
    expect(updatedResponse.body.data.status).toBe('PENDING');

    const deletedResponse = await request(app.getHttpServer())
      .delete(`/api/v1/tailoring-requests/${requestId}`)
      .set('Authorization', `Bearer ${activeUserToken}`)
      .expect(200);

    expect(deletedResponse.body.data.id).toBe(requestId);
  });

  afterAll(async () => {
    if (prisma && userIds.length > 0) {
      await prisma.tailoringRequest.deleteMany({
        where: { resume_id: { in: resumeIds } },
      });
      await prisma.emailVerification.deleteMany({
        where: { user_id: { in: userIds } },
      });
      await prisma.resume.deleteMany({ where: { id: { in: resumeIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
    if (app) {
      await app.close();
    }
  });
});
