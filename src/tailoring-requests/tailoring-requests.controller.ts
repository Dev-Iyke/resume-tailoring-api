import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, UseGuards, Req } from '@nestjs/common';
import { TailoringRequestsService } from './tailoring-requests.service.js';
import { CreateTailoringRequestDto } from './dto/create-tailoring-request.dto.js';
import { UpdateTailoringRequestDto } from './dto/update-tailoring-request.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { Request } from 'express';
import { ApiBearerAuth } from '@nestjs/swagger';


type AuthenticatedRequest = Request & {
  user: {userId: string}
}

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tailoring-requests')
export class TailoringRequestsController {
  constructor(private readonly tailoringRequestsService: TailoringRequestsService) {}

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() createTailoringRequestDto: CreateTailoringRequestDto) {
    return this.tailoringRequestsService.create(req.user.userId, createTailoringRequestDto);
  }

  @Post(':id/generate')
  generate(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tailoringRequestsService.generate(req.user.userId, id);
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.tailoringRequestsService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Req() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.tailoringRequestsService.findOneById(req.user.userId, id);
  }

  @Patch(':id')
  update(@Req() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string, @Body() updateTailoringRequestDto: UpdateTailoringRequestDto) {
    return this.tailoringRequestsService.update(req.user.userId, id, updateTailoringRequestDto);
  }

  @Delete(':id')
  remove(@Req() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.tailoringRequestsService.remove(req.user.userId, id);
  }
}
