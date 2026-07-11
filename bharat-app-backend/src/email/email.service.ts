import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/**
 * EmailService
 *
 * Reusable email layer built on Nodemailer + a Gmail App Password.
 * Credentials are read from environment variables only (never hardcoded):
 *   EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM
 *
 * Keep all email logic here — AuthService should only CALL this service.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter;

  constructor() {
    const port = Number(process.env.EMAIL_PORT);

    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port,
      // Port 465 uses implicit TLS; 587 uses STARTTLS.
      secure: port === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  /**
   * Generic reusable sender. Any future email (welcome, password reset, etc.)
   * can reuse this method.
   */
  async sendMail(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html,
      });
    } catch (error) {
      // Do not leak SMTP internals to the client; log server-side and throw 500.
      this.logger.error(`Failed to send email to ${to}`, error as Error);
      throw new InternalServerErrorException('Failed to send email');
    }
  }

  /**
   * Sends the OTP verification email using the branded HTML template.
   */
  async sendOtpEmail(to: string, otp: string): Promise<void> {
    const subject = 'Your Bharat Super App Verification Code';
    const html = this.buildOtpTemplate(otp);
    await this.sendMail(to, subject, html);
  }

  /**
   * Clean, self-contained HTML template (inline styles for email-client safety).
   */
  private buildOtpTemplate(otp: string): string {
    return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Bharat Super App Verification Code</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f4f5f7;font-family:Arial,Helvetica,sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:24px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
              <tr>
                <td style="background-color:#0d47a1;padding:20px 32px;">
                  <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">Bharat Super App</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:32px;">
                  <p style="margin:0 0 16px;font-size:15px;color:#333333;">Hello,</p>
                  <p style="margin:0 0 20px;font-size:15px;color:#333333;">Your OTP is</p>
                  <div style="text-align:center;margin:0 0 24px;">
                    <span style="display:inline-block;font-size:34px;font-weight:700;letter-spacing:10px;color:#0d47a1;background-color:#e8f0fe;padding:14px 24px;border-radius:8px;">${otp}</span>
                  </div>
                  <p style="margin:0 0 8px;font-size:14px;color:#555555;">This OTP is valid for <strong>5 minutes</strong>.</p>
                  <p style="margin:0 0 24px;font-size:14px;color:#555555;">If you didn't request this OTP, please ignore this email.</p>
                  <p style="margin:0;font-size:14px;color:#333333;">Regards,<br />Bharat Super App Team</p>
                </td>
              </tr>
              <tr>
                <td style="background-color:#fafafa;padding:16px 32px;border-top:1px solid #eeeeee;">
                  <p style="margin:0;font-size:12px;color:#999999;">This is an automated message, please do not reply.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
  }
}
