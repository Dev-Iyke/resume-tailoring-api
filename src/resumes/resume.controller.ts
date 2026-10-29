import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CreateResumeDto } from './dto/create-resume.dto.js';
import { UpdateResumeDto } from './dto/update-resume.dto.js';
import { ResumeService } from './resume.service.js';

type AuthenticatedRequest = Request & {
  user: { userId: string };
};

@ApiTags('resumes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('resumes')
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() payload: CreateResumeDto) {
    return this.resumeService.create(req.user.userId, payload);
  }

  @Get('me')
  findMine(@Req() req: AuthenticatedRequest) {
    return this.resumeService.findMine(req.user.userId);
  }

  @Patch('me')
  @ApiOperation({
    description:
      'Updating the resume marks completed tailoring requests that use it as STALE. Their saved results and generated_at timestamps are retained.',
  })
  updateMine(
    @Req() req: AuthenticatedRequest,
    @Body() payload: UpdateResumeDto,
  ) {
    return this.resumeService.updateMine(req.user.userId, payload);
  }
}
