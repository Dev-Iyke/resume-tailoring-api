import { PartialType } from '@nestjs/swagger';
import { CreateResumeDto } from './create-resume.dto.js';

export class UpdateResumeDto extends PartialType(CreateResumeDto) {}
