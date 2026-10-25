import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ResendVerificationDto {
  @ApiProperty({ example: 'example@email.com', maxLength: 100 })
  @IsEmail()
  email: string;
}