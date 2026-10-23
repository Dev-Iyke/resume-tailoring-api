import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTailoringRequestDto } from './dto/create-tailoring-request.dto.js';
import { UpdateTailoringRequestDto } from './dto/update-tailoring-request.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { successResponse } from '../common/responses/api-response.js';
import { Prisma } from '../generated/prisma/client.js';

@Injectable()
export class TailoringRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, payload: CreateTailoringRequestDto) {
    const resume = await this.prisma.resume.findFirst({
      where: { id: payload.resume_id, user_id: userId },
      select: { id: true },
    });

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    const tailoringRequest = await this.prisma.tailoringRequest.create({
      data: payload
    })

    return successResponse("Request received", tailoringRequest)
  }

  async findAll(userId: string) {
    const tailoringRequests = await this.prisma.tailoringRequest.findMany({
      where: { resume: { is: { user_id: userId } } }
    })
    return successResponse("All requests retrieved", tailoringRequests);
  }

  async findOneById(userId: string, id: string) {
    const tailoringRequest = await this.prisma.tailoringRequest.findFirst({
      where: {id, resume: { is: { user_id: userId } },}
    })

    if(!tailoringRequest){
      throw new NotFoundException("Tailoring request not found");
    }

    return successResponse(
      "Tailoring request fetched successfully",
      tailoringRequest
    )
  }

  async update(userId: string, id: string, payload: UpdateTailoringRequestDto) {
    try {
      const prevTailoringRequest = await this.prisma.tailoringRequest.findFirst({
        where: {id, resume: { is: { user_id: userId } },}
      })

      if(!prevTailoringRequest){
        throw new NotFoundException("Tailoring request not found");
      }

      const tailoringRequest = await this.prisma.tailoringRequest.update({
        where: {id},
        data: payload
      })

      return successResponse(
        "Tailoring request updated successfully",
        tailoringRequest
      )

    } catch (error) {
      if(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new NotFoundException("Tailoring request not found");
      } else {
        throw error
      }
    }

  }

  async remove(userId: string, id: string) {
    try {
      const prevTailoringRequest = await this.prisma.tailoringRequest.findFirst({
        where: {id, resume: { is: { user_id: userId } },}
      })

      if(!prevTailoringRequest){
        throw new NotFoundException("Tailoring request not found");
      }
      const tailoringRequest = await this.prisma.tailoringRequest.delete({
        where: {id},
      })

      return successResponse(
        "Tailoring request deleted successfully",
        tailoringRequest
      )

    } catch (error) {
      if(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new NotFoundException("Tailoring request not found");
      } else {
        throw error
      }
    }
  }
}
