import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateTailoringRequestDto } from './create-tailoring-request.dto.js';

export class UpdateTailoringRequestDto extends PartialType(
  OmitType(CreateTailoringRequestDto, ['resume_id'] as const),
) {}