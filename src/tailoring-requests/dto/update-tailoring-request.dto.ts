import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateTailoringRequestDto } from './create-tailoring-request.dto.js';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class UpdateTailoringRequestDto extends PartialType(CreateTailoringRequestDto) {
  @ApiPropertyOptional({
    example: "Google LLC",
    description: "Name of company user is applying to"
  })
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(60)
  company_name?: string;

  @ApiPropertyOptional({
    example: "Software Engineer",
    description: "Job role user is applying for"
  })
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  job_title?: string;

  @ApiPropertyOptional({
    example: "We are looking to recruit a Software Engineer for our company with the following skills...",
    description: "Job description user is applying for, as posted"
  })
  @IsString()
  @MinLength(100)
  job_description?: string;
}
