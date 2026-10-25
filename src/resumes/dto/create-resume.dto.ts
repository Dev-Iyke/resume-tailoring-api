import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength } from 'class-validator';

export class CreateResumeDto {
  @ApiProperty({
    example:
      'Frontend developer with experience building accessible web applications using React and TypeScript.',
    description: 'Plain-text resume content.',
    maxLength: 50000,
  })
  @IsString()
  @Matches(/\S/, { message: 'text must contain non-whitespace characters' })
  @MaxLength(50000)
  text!: string;
}
