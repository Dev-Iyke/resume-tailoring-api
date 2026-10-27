import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTailoringRequestDto } from './dto/create-tailoring-request.dto.js';
import { UpdateTailoringRequestDto } from './dto/update-tailoring-request.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { successResponse } from '../common/responses/api-response.js';
import { Prisma } from '../generated/prisma/client.js';
import { AiService } from '../ai/ai.service.js';

@Injectable()
export class TailoringRequestsService {
  constructor(private readonly prisma: PrismaService, private readonly ai: AiService) {}

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

  async generate(userId: string, id: string) {
    const request = await this.prisma.tailoringRequest.findFirst({
      where: { id, resume: { is: { user_id: userId } } },
      select: { id: true, resume: {select: {text: true, user: {
        select: {full_name: true}
      }}}, job_description: true },
    });

    if (!request) {
      throw new NotFoundException("Tailoring request not found");
    }

    try {
      const aiResponse = await this.ai.generateTailoringResult(request.resume.text, request.job_description)
      aiResponse.coverLetter.signOff = `Sincerely,\n${request.resume.user.full_name}`;
      
      const updatedRequest = await this.prisma.tailoringRequest.update({
        where: { id },
        data: {status: "COMPLETED", result: aiResponse, generated_at: new Date(Date.now())},
        select: { id: true, result: true, status: true, generated_at: true },
      });
      
      return successResponse("Request received", updatedRequest )
    } catch (error) {
      if(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new NotFoundException("Tailoring request not found");
      } else {
        throw error
      }
    }


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
