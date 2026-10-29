import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { successResponse } from '../common/responses/api-response.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateResumeDto } from './dto/create-resume.dto.js';
import { UpdateResumeDto } from './dto/update-resume.dto.js';

@Injectable()
export class ResumeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, payload: CreateResumeDto) {
    try {
      const resume = await this.prisma.resume.create({
        data: {
          user_id: userId,
          text: payload.text,
        },
      });

      return successResponse('Resume created successfully.', resume);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A resume already exists for this account.',
        );
      }

      throw error;
    }
  }

  async findMine(userId: string) {
    const resume = await this.prisma.resume.findUnique({
      where: { user_id: userId },
    });

    if (!resume) {
      throw new NotFoundException('Resume not found.');
    }

    return successResponse('Resume retrieved successfully.', resume);
  }

  async updateMine(userId: string, payload: UpdateResumeDto) {
    if (payload.text === undefined) {
      throw new BadRequestException('Resume text is required.');
    }

    try {
      const resume = await this.prisma.$transaction(async (tx) => {
        const currentResume = await tx.resume.findUnique({
          where: { user_id: userId },
          select: { id: true, text: true },
        });

        if (!currentResume) {
          throw new NotFoundException('Resume not found.');
        }

        const updatedResume = await tx.resume.update({
          where: { user_id: userId },
          data: { text: payload.text },
        });

        if (currentResume.text !== payload.text) {
          await tx.tailoringRequest.updateMany({
            where: { resume_id: currentResume.id, status: 'COMPLETED' },
            data: { status: 'STALE' },
          });
        }

        return updatedResume;
      });

      return successResponse('Resume updated successfully.', resume);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Resume not found.');
      }

      throw error;
    }
  }
}
