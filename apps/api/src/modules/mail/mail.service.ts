import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend: Resend;
  private readonly logger = new Logger(MailService.name);

  constructor() {
    // Expect RESEND_API_KEY in environment variables
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendActivationEmail(to: string, name: string, token: string) {
    const activationLink = `${process.env.FRONTEND_URL}/activate?token=${token}`;

    try {
      const { data, error } = await this.resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Rescue Link Taguig <rescuelinktaguig@gmail.com>',
        to,
        subject: 'Activate Your Rescue Link Taguig Account',
        html: `
          <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #0f172a; margin: 0;">Welcome to Rescue Link Taguig</h2>
              <p style="color: #64748b; margin-top: 8px;">Command Center System</p>
            </div>
            
            <p>Hi <strong>${name}</strong>,</p>
            <p>An account has been created for you on the Rescue Link Taguig Command Center system.</p>
            <p>Please click the button below to securely set your password and activate your account:</p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${activationLink}" style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;">
                Activate Account
              </a>
            </div>
            
            <p style="font-size: 14px;">Or paste this link into your browser:</p>
            <p style="font-size: 14px; word-break: break-all; color: #2563eb;">
              <a href="${activationLink}" style="color: #2563eb;">${activationLink}</a>
            </p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
            <p style="color: #64748b; font-size: 12px; text-align: center;">
              This link is valid for 24 hours. If you did not expect this invitation, please ignore this email.
            </p>
          </div>
        `,
      });

      if (error) {
        this.logger.error(`Failed to send activation email to ${to}: ${error.message}`);
        throw new Error(error.message);
      }

      this.logger.log(`Activation email sent successfully to ${to}`);
      return data;
    } catch (error) {
      this.logger.error(`Error sending activation email to ${to}`, error);
      throw error;
    }
  }
}
