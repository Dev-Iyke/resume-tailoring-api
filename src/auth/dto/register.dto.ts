import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Jerry Example', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  full_name!: string;

  @ApiProperty({ example: 'jerry@mailinator.com', maxLength: 254 })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({
    example: 'ExamplePassword123!',
    minLength: 12,
    maxLength: 128,
    writeOnly: true,
  })
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password!: string;
}