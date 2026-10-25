import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from "nodemailer"

@Injectable()
export class MailService {
  private readonly transporter: ReturnType<typeof nodemailer.createTransport>
  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow<string>("SMTP_HOST"),
      port: Number(this.configService.getOrThrow<string>("SMTP_PORT")),
      secure: this.configService.getOrThrow<string>("SMTP_SECURE") === "true",
      auth: {
        user: this.configService.getOrThrow<string>("SMTP_USER"),
        pass: this.configService.getOrThrow<string>("SMTP_PASSWORD")
      }
    })
  }

  async sendVerificationCode(to: string, code: string): Promise<void> {
    await this.transporter.sendMail({
      from: this.configService.getOrThrow<string>("EMAIL_FROM"),
      to,
      subject: "Verify your email address",
      text: `Your verification code is ${code}. It expires in 10 minutes.`,
    })
  }
}
