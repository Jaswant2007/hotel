import nodemailer from 'nodemailer';
import { config } from '../../config';
import { generateOtpEmailHtml, generateOtpEmailPlain, OtpEmailProps } from './templates/otp-email';

export interface SendOtpMailParams extends OtpEmailProps {
  to: string;
}

export class MailService {
  private transporter: nodemailer.Transporter;
  private isConfigured = false;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
      connectionTimeout: 5000,
    });

    this.transporter
      .verify()
      .then(() => {
        this.isConfigured = true;
        console.log(`[MailService] SMTP transport verified at ${config.smtp.host}:${config.smtp.port}`);
      })
      .catch((err) => {
        this.isConfigured = false;
        console.warn(`[MailService] SMTP server unreachable (${err.message}). Safe development mode will log OTP delivery.`);
      });
  }

  /**
   * Asynchronously send OTP email with retry/backoff
   */
  public async sendOtpEmail(params: SendOtpMailParams, maxRetries = 2): Promise<void> {
    const html = generateOtpEmailHtml(params);
    const text = generateOtpEmailPlain(params);

    const mailOptions = {
      from: config.smtp.from,
      to: params.to,
      subject: `${params.code} is your Harbour Inn verification code`,
      html,
      text,
      headers: {
        'X-Entity-Ref-ID': `${Date.now()}-${Math.random()}`,
        'Precedence': 'bulk',
      },
    };

    let attempt = 0;
    while (attempt <= maxRetries) {
      try {
        if (this.isConfigured) {
          const info = await this.transporter.sendMail(mailOptions);
          console.log(`[MailService] Email delivered to ${params.to}. MessageId: ${info.messageId}`);
          return;
        } else {
          // Development sandbox output (safe console logger so local developers see code instantly)
          console.log(`\n======================================================`);
          console.log(`✉️ [MAIL SANDBOX] Dispatched OTP Email to: ${params.to}`);
          console.log(`🔑 6-Digit Code: [ ${params.code} ]`);
          console.log(`⏱ Valid for: ${params.expiryMinutes} minutes`);
          console.log(`======================================================\n`);
          return;
        }
      } catch (err: any) {
        attempt++;
        console.error(`[MailService] Send attempt ${attempt} failed for ${params.to}:`, err.message);
        if (attempt > maxRetries) {
          console.error(`[MailService Error] Permanent delivery failure to ${params.to}. Logging bounce incident.`);
          // Log failure but don't crash main thread
          return;
        }
        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      }
    }
  }
}

export const mailService = new MailService();
