import { IsEmail, Matches } from 'class-validator';

export class VerifyEmailDto {
  @IsEmail()
  email: string;

  @Matches(/^\d{8}$/)
  code: string;
}