import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465, // true for port 465, false for 587/others
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  async sendActivationEmail(to: string, name: string, token: string) {
    const activationLink = `${process.env.FRONTEND_URL}/activate?token=${token}`;

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject: 'Activate Your Rescue Link Taguig Account',
      html: `
        <p>Hi ${name},</p>
        <p>An account has been created for you on the Rescue Link Taguig Command Center system.</p>
        <p>Click the link below to set your password and activate your account:</p>
        <p><a href="${activationLink}">${activationLink}</a></p>
        <p>This link will expire in 24 hours.</p>
      `,
    });
  }
}
