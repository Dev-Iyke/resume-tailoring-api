import { Test, TestingModule } from '@nestjs/testing';
import { TailoringRequestsService } from './tailoring-requests.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('TailoringRequestsService', () => {
  let service: TailoringRequestsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TailoringRequestsService,
        {
          provide: PrismaService,
          useValue: {
            tailoringRequest: {
              create: vi.fn(),
              findMany: vi.fn(),
              findUnique: vi.fn(),
              update: vi.fn(),
              delete: vi.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<TailoringRequestsService>(TailoringRequestsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
