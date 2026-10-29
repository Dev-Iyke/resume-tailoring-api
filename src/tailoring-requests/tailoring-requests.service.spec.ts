import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AiService } from '../ai/ai.service.js';
import { TailoringRequestsService } from './tailoring-requests.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';

describe('TailoringRequestsService', () => {
  let service: TailoringRequestsService;
  const userId = '4fdc88a1-5f02-4e23-8878-2b82592e90a0';
  const resumeId = '5f4e2d39-214d-4e83-a511-8602d3d830bc';
  const requestId = '8c39e7cb-9ff4-4a0b-9b09-8353da957e30';
  const validResult = {
    fitAnalysis: {
      summary: 'Strong match for the role.',
      matchedRequirements: [],
      gaps: [],
    },
    resumeDraft: {
      professionalSummary: 'Frontend developer with relevant experience.',
      skills: [],
      experience: [],
      projects: [],
      education: [],
      other: [],
    },
    coverLetter: {
      greeting: 'Dear Hiring Team,',
      opening: 'I am applying for this role.',
      body: [],
      closing: 'Thank you for your consideration.',
      signOff: 'Sincerely, Candidate Name',
    },
  };
  const aiMock = {
    generateTailoringResult: vi.fn(),
  };
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
        { provide: AiService, useValue: aiMock },
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
    expect(aiMock.generateTailoringResult).not.toHaveBeenCalled();
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

  it('generates and saves a result for a request owned by the user', async () => {
    const aiResult = structuredClone(validResult);
    const generatedAt = new Date();
    const request = {
      id: requestId,
      resume: {
        text: 'Candidate resume text',
        user: { full_name: 'Candidate Name' },
      },
      job_description: 'Backend developer role',
    };
    const updatedRequest = {
      id: requestId,
      result: aiResult,
      status: 'COMPLETED',
      generated_at: generatedAt,
    };
    prismaMock.tailoringRequest.findFirst.mockResolvedValue(request);
    aiMock.generateTailoringResult.mockResolvedValue(aiResult);
    prismaMock.tailoringRequest.update.mockResolvedValue(updatedRequest);

    const response = await service.generate(userId, requestId);

    expect(prismaMock.tailoringRequest.findFirst).toHaveBeenCalledWith({
      where: { id: requestId, resume: { is: { user_id: userId } } },
      select: {
        id: true,
        resume: {
          select: { text: true, user: { select: { full_name: true } } },
        },
        job_description: true,
      },
    });
    expect(aiMock.generateTailoringResult).toHaveBeenCalledWith(
      request.resume.text,
      request.job_description,
    );
    expect(prismaMock.tailoringRequest.update).toHaveBeenCalledWith({
      where: { id: requestId },
      data: {
        status: 'COMPLETED',
        result: aiResult,
        generated_at: expect.any(Date),
      },
      select: { id: true, result: true, status: true, generated_at: true },
    });
    expect(response.data).toEqual(updatedRequest);
  });

  it('does not generate a result for a request not owned by the user', async () => {
    prismaMock.tailoringRequest.findFirst.mockResolvedValue(null);

    await expect(service.generate(userId, requestId)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(aiMock.generateTailoringResult).not.toHaveBeenCalled();
    expect(prismaMock.tailoringRequest.update).not.toHaveBeenCalled();
  });

  it('does not save a result when AI generation fails', async () => {
    prismaMock.tailoringRequest.findFirst.mockResolvedValue({
      id: requestId,
      resume: { text: 'Candidate resume text' },
      job_description: 'Backend developer role',
    });
    const aiError = new Error('AI provider unavailable');
    aiMock.generateTailoringResult.mockRejectedValue(aiError);

    await expect(service.generate(userId, requestId)).rejects.toBe(aiError);

    expect(prismaMock.tailoringRequest.update).not.toHaveBeenCalled();
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

    await expect(service.findOneById(userId, requestId)).rejects.toBeInstanceOf(
      NotFoundException,
    );

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

  it('saves a structurally valid user-edited result without changing source details', async () => {
    prismaMock.tailoringRequest.findFirst.mockResolvedValue({
      id: requestId,
      job_title: 'Frontend Developer',
      company_name: 'Northstar Products',
      job_description: 'Frontend developer role',
      status: 'COMPLETED',
      result: validResult,
    });
    prismaMock.tailoringRequest.update.mockResolvedValue({
      id: requestId,
      result: validResult,
      status: 'COMPLETED',
    });

    await service.update(userId, requestId, { result: validResult });

    expect(prismaMock.tailoringRequest.update).toHaveBeenCalledWith({
      where: { id: requestId },
      data: { result: validResult },
    });
  });

  it('rejects a malformed edited result without updating the request', async () => {
    prismaMock.tailoringRequest.findFirst.mockResolvedValue({
      id: requestId,
      job_title: 'Frontend Developer',
      company_name: 'Northstar Products',
      job_description: 'Frontend developer role',
      status: 'COMPLETED',
      result: validResult,
    });

    await expect(
      service.update(userId, requestId, {
        result: { coverLetter: {} } as never,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prismaMock.tailoringRequest.update).not.toHaveBeenCalled();
  });

  it('rejects an update that combines edited results and job details', async () => {
    prismaMock.tailoringRequest.findFirst.mockResolvedValue({
      id: requestId,
      job_title: 'Frontend Developer',
      company_name: 'Northstar Products',
      job_description: 'Frontend developer role',
      status: 'COMPLETED',
      result: validResult,
    });

    await expect(
      service.update(userId, requestId, {
        job_title: 'Senior Frontend Developer',
        result: validResult,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prismaMock.tailoringRequest.update).not.toHaveBeenCalled();
  });

  it('preserves the result and marks it stale when source job details change', async () => {
    prismaMock.tailoringRequest.findFirst.mockResolvedValue({
      id: requestId,
      job_title: 'Frontend Developer',
      company_name: 'Northstar Products',
      job_description: 'Frontend developer role',
      status: 'COMPLETED',
      result: validResult,
    });
    prismaMock.tailoringRequest.update.mockResolvedValue({
      id: requestId,
      job_title: 'Senior Frontend Developer',
      status: 'STALE',
      result: validResult,
      generated_at: new Date(),
    });

    await service.update(userId, requestId, {
      job_title: 'Senior Frontend Developer',
    });

    expect(prismaMock.tailoringRequest.update).toHaveBeenCalledWith({
      where: { id: requestId },
      data: {
        job_title: 'Senior Frontend Developer',
        status: 'STALE',
      },
    });
  });

  it('keeps a request pending when source details change before generation', async () => {
    prismaMock.tailoringRequest.findFirst.mockResolvedValue({
      id: requestId,
      job_title: 'Frontend Developer',
      company_name: 'Northstar Products',
      job_description: 'Frontend developer role',
      status: 'PENDING',
      result: null,
    });
    prismaMock.tailoringRequest.update.mockResolvedValue({
      id: requestId,
      job_title: 'Senior Frontend Developer',
      status: 'PENDING',
      result: null,
    });

    await service.update(userId, requestId, {
      job_title: 'Senior Frontend Developer',
    });

    expect(prismaMock.tailoringRequest.update).toHaveBeenCalledWith({
      where: { id: requestId },
      data: { job_title: 'Senior Frontend Developer', status: 'PENDING' },
    });
  });

  it('does not delete a request that is not owned by the authenticated user', async () => {
    prismaMock.tailoringRequest.findFirst.mockResolvedValue(null);

    await expect(service.remove(userId, requestId)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(prismaMock.tailoringRequest.delete).not.toHaveBeenCalled();
  });
});
