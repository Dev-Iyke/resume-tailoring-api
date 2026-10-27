import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'ike-resume2@mailinator.com', maxLength: 254 })
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