import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TailoringRequestsService } from './tailoring-requests.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('TailoringRequestsService', () => {
  let service: TailoringRequestsService;
  const userId = '4fdc88a1-5f02-4e23-8878-2b82592e90a0';
  const resumeId = '5f4e2d39-214d-4e83-a511-8602d3d830bc';
  const requestId = '8c39e7cb-9ff4-4a0b-9b09-8353da957e30';
  const prismaMock = {
    resume: { findFirst: vi.fn() },
    tailoringRequest: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TailoringRequestsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<TailoringRequestsService>(TailoringRequestsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a request only after confirming the resume belongs to the user', async () => {
    const payload = {
      resume_id: resumeId,
      job_title: 'Backend Developer',
      job_description: 'A sufficiently detailed job description for testing.',
    };
    const createdRequest = { id: requestId, ...payload };
    prismaMock.resume.findFirst.mockResolvedValue({ id: resumeId });
    prismaMock.tailoringRequest.create.mockResolvedValue(createdRequest);

    await service.create(userId, payload);

    expect(prismaMock.resume.findFirst).toHaveBeenCalledWith({
      where: { id: resumeId, user_id: userId },
      select: { id: true },
    });
    expect(prismaMock.tailoringRequest.create).toHaveBeenCalledWith({
      data: payload,
    });
  });

  it('rejects creation when the resume does not belong to the user', async () => {
    prismaMock.resume.findFirst.mockResolvedValue(null);

    await expect(
      service.create(userId, {
        resume_id: resumeId,
        job_title: 'Backend Developer',
        job_description: 'A sufficiently detailed job description for testing.',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prismaMock.tailoringRequest.create).not.toHaveBeenCalled();
  });

  it('lists requests belonging only to the authenticated user', async () => {
    prismaMock.tailoringRequest.findMany.mockResolvedValue([]);

    await service.findAll(userId);

    expect(prismaMock.tailoringRequest.findMany).toHaveBeenCalledWith({
      where: { resume: { is: { user_id: userId } } },
    });
  });

  it('returns not found when a request is not owned by the authenticated user', async () => {
    prismaMock.tailoringRequest.findFirst.mockResolvedValue(null);

    await expect(
      service.findOneById(userId, requestId),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prismaMock.tailoringRequest.findFirst).toHaveBeenCalledWith({
      where: { id: requestId, resume: { is: { user_id: userId } } },
    });
  });

  it('does not update a request that is not owned by the authenticated user', async () => {
    prismaMock.tailoringRequest.findFirst.mockResolvedValue(null);

    await expect(
      service.update(userId, requestId, { job_title: 'Updated title' }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prismaMock.tailoringRequest.update).not.toHaveBeenCalled();
  });

  it('does not delete a request that is not owned by the authenticated user', async () => {
    prismaMock.tailoringRequest.findFirst.mockResolvedValue(null);

    await expect(
      service.remove(userId, requestId),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prismaMock.tailoringRequest.delete).not.toHaveBeenCalled();
  });
});
