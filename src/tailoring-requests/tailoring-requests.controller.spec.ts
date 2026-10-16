import { Test, TestingModule } from '@nestjs/testing';
import { TailoringRequestsController } from './tailoring-requests.controller.js';
import { TailoringRequestsService } from './tailoring-requests.service.js';

describe('TailoringRequestsController', () => {
  let controller: TailoringRequestsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TailoringRequestsController],
      providers: [
        {
          provide: TailoringRequestsService,
          useValue: {
            create: vi.fn(),
            findAll: vi.fn(),
            findOneById: vi.fn(),
            update: vi.fn(),
            remove: vi.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TailoringRequestsController>(TailoringRequestsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
