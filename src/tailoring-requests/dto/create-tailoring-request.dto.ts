import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {IsOptional, IsString, IsUUID, MaxLength, MinLength} from "class-validator"

export class CreateTailoringRequestDto {
  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "ID of the user resume"
  })
  @IsString()
  @IsUUID()
  resume_id!: string;

  @ApiPropertyOptional({
    example: "Google LLC",
    description: "Name of company user is applying to"
  })
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(60)
  company_name?: string;

  @ApiProperty({
    example: "Software Engineer",
    description: "Job role user is applying for"
  })
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  job_title!: string;

  @ApiProperty({
    example: "We are looking to recruit a Software Engineer for our company with the following skills...",
    description: "Job description user is applying for, as posted"
  })
  @IsString()
  @MinLength(100)
  job_description!: string;
}
