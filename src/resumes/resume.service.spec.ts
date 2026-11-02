import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ResumeService } from './resume.service.js';

describe('ResumeService', () => {
  let service: ResumeService;
  const userId = '4fdc88a1-5f02-4e23-8878-2b82592e90a0';
  const resume = {
    id: '5f4e2d39-214d-4e83-a511-8602d3d830bc',
    user_id: userId,
    text: 'Frontend developer resume text',
    created_at: new Date(),
    updated_at: new Date(),
  };
  const transactionMock = {
    resume: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    tailoringRequest: {
      updateMany: vi.fn(),
    },
  };
  const prismaMock = {
    resume: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(
      async (callback: (tx: typeof transactionMock) => Promise<unknown>) =>
        callback(transactionMock),
    ),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResumeService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<ResumeService>(ResumeService);
  });

  it('creates a resume for the authenticated user', async () => {
    prismaMock.resume.create.mockResolvedValue(resume);

    await service.create(userId, { text: resume.text });

    expect(prismaMock.resume.create).toHaveBeenCalledWith({
      data: { user_id: userId, text: resume.text },
    });
  });

  it('returns a conflict when the user already has a resume', async () => {
    prismaMock.resume.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed on user_id',
        { code: 'P2002', clientVersion: '7.10.0' },
      ),
    );

    await expect(
      service.create(userId, { text: resume.text }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('gets the resume using the authenticated user ID', async () => {
    prismaMock.resume.findUnique.mockResolvedValue(resume);

    await service.findMine(userId);

    expect(prismaMock.resume.findUnique).toHaveBeenCalledWith({
      where: { user_id: userId },
    });
  });

  it('returns not found when the user has no resume', async () => {
    prismaMock.resume.findUnique.mockResolvedValue(null);

    await expect(service.findMine(userId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updates only the authenticated user resume', async () => {
    transactionMock.resume.findUnique.mockResolvedValue(resume);
    transactionMock.resume.update.mockResolvedValue({
      ...resume,
      text: 'Updated resume text',
    });
    transactionMock.tailoringRequest.updateMany.mockResolvedValue({ count: 1 });

    await service.updateMine(userId, { text: 'Updated resume text' });

    expect(transactionMock.resume.findUnique).toHaveBeenCalledWith({
      where: { user_id: userId },
      select: { id: true, text: true },
    });
    expect(transactionMock.resume.update).toHaveBeenCalledWith({
      where: { user_id: userId },
      data: { text: 'Updated resume text' },
    });
    expect(transactionMock.tailoringRequest.updateMany).toHaveBeenCalledWith({
      where: { resume_id: resume.id, status: 'COMPLETED' },
      data: { status: 'STALE' },
    });
  });

  it('does not mark requests stale when the resume text is unchanged', async () => {
    transactionMock.resume.findUnique.mockResolvedValue(resume);
    transactionMock.resume.update.mockResolvedValue(resume);

    await service.updateMine(userId, { text: resume.text });

    expect(transactionMock.tailoringRequest.updateMany).not.toHaveBeenCalled();
  });

  it('rejects an update with no resume text', async () => {
    await expect(service.updateMine(userId, {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prismaMock.resume.update).not.toHaveBeenCalled();
  });

  it('returns not found when updating a missing resume', async () => {
    transactionMock.resume.findUnique.mockResolvedValue(null);

    await expect(
      service.updateMine(userId, { text: 'Updated resume text' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(transactionMock.resume.update).not.toHaveBeenCalled();
    expect(transactionMock.tailoringRequest.updateMany).not.toHaveBeenCalled();
  });
});
