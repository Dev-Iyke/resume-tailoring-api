import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, Matches } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({ example: 'example@email.com', maxLength: 100 })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '11111111'
  })
  @Matches(/^\d{8}$/)
  code: string;
}