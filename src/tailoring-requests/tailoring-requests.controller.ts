import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { TailoringRequestsService } from './tailoring-requests.service.js';
import { CreateTailoringRequestDto } from './dto/create-tailoring-request.dto.js';
import { UpdateTailoringRequestDto } from './dto/update-tailoring-request.dto.js';

@Controller('tailoring-requests')
export class TailoringRequestsController {
  constructor(private readonly tailoringRequestsService: TailoringRequestsService) {}

  @Post()
  create(@Body() createTailoringRequestDto: CreateTailoringRequestDto) {
    return this.tailoringRequestsService.create(createTailoringRequestDto);
  }

  @Get()
  findAll() {
    return this.tailoringRequestsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tailoringRequestsService.findOneById(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateTailoringRequestDto: UpdateTailoringRequestDto) {
    return this.tailoringRequestsService.update(id, updateTailoringRequestDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tailoringRequestsService.remove(id);
  }
}
