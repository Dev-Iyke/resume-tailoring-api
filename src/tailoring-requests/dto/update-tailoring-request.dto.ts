import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsObject, IsOptional } from 'class-validator';
import { CreateTailoringRequestDto } from './create-tailoring-request.dto.js';
import type { TailoringResult } from '../../ai/schemas/tailoring-result.schema.js';

export class UpdateTailoringRequestDto extends PartialType(
  OmitType(CreateTailoringRequestDto, ['resume_id'] as const),
) {
  @ApiPropertyOptional({
    description:
      'Full edited tailoring result. Send this without job-detail fields. Editing the result alone keeps status COMPLETED; stale results must be regenerated before they can be edited.',
    example: {
      fitAnalysis: {
        summary: 'Strong match for the role.',
        matchedRequirements: [],
        gaps: [],
      },
      resumeDraft: {
        professionalSummary: 'Frontend developer...',
        skills: [],
        experience: [],
        projects: [],
        education: [],
        other: [],
      },
      coverLetter: {
        greeting: 'Dear Hiring Team,',
        opening: 'I am applying for...',
        body: [],
        closing: 'Thank you for your consideration.',
        signOff: 'Sincerely,\nCandidate Name',
      },
    },
  })
  @IsOptional()
  @IsObject()
  result?: TailoringResult;
}
