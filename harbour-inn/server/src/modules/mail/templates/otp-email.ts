export interface OtpEmailProps {
  name?: string;
  code: string;
  expiryMinutes: number;
  ip: string;
  userAgent: string;
}

export function generateOtpEmailHtml(props: OtpEmailProps): string {
  const greeting = props.name ? `Dear ${props.name},` : 'Dear Guest,';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Harbour Inn Verification Code</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #FAF7F2; font-family: 'Figtree', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #262320; -webkit-font-smoothing: antialiased;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FAF7F2; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; background-color: #FFFFFF; border-radius: 12px; border: 1px solid #E3DCD4; overflow: hidden; box-shadow: 0 4px 16px rgba(31, 78, 74, 0.06);">
          <!-- Hotel Header -->
          <tr>
            <td style="background-color: #1F4E4A; padding: 36px 32px; text-align: center;">
              <h1 style="margin: 0; font-family: 'Newsreader', Georgia, serif; font-size: 28px; font-weight: 600; color: #FAF7F2; letter-spacing: 0.04em;">
                HARBOUR INN
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; color: #C4DFD7; font-weight: 500;">
                Boutique Coastal Sanctuary &amp; Suites
              </p>
            </td>
          </tr>

          <!-- Email Content Body -->
          <tr>
            <td style="padding: 40px 32px;">
              <h2 style="margin: 0 0 16px 0; font-family: 'Newsreader', Georgia, serif; font-size: 22px; font-weight: 600; color: #1F4E4A;">
                Your Secure Verification Code
              </h2>
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #524E48;">
                ${greeting}
              </p>
              <p style="margin: 0 0 28px 0; font-size: 15px; line-height: 1.6; color: #524E48;">
                Use the single-use 6-digit code below to complete your authentication. For your protection, never share this code with anyone.
              </p>

              <!-- 6-Digit Code Highlight Box -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 28px;">
                <tr>
                  <td align="center" style="background-color: #F4EFEA; border-radius: 8px; border: 1px dashed #C4DFD7; padding: 24px 16px;">
                    <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #9A5B2E; display: block; margin-bottom: 8px;">
                      Single-Use Access Code
                    </span>
                    <span style="font-family: 'Figtree', monospace, sans-serif; font-size: 38px; font-weight: 800; letter-spacing: 0.35em; color: #1F4E4A; display: inline-block; padding-left: 0.35em;">
                      ${props.code}
                    </span>
                    <span style="font-size: 12px; color: #6E6862; display: block; margin-top: 10px;">
                      ⏱ Expires in <strong>${props.expiryMinutes} minutes</strong>
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Notice and Security advisory -->
              <div style="background-color: #FDF9F5; border-left: 3px solid #9A5B2E; padding: 14px 16px; border-radius: 4px; margin-bottom: 28px;">
                <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #804820;">
                  <strong>Didn’t request this code?</strong> If you did not initiate this sign-in or booking attempt, you can safely ignore this email. No changes will be made to your account.
                </p>
              </div>

              <!-- Request metadata audit snippet -->
              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #948E88;">
                Dispatched to your registered email address. Request originated from IP <code>${props.ip}</code>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #FAF7F2; padding: 24px 32px; border-top: 1px solid #E3DCD4; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #6E6862;">
                Harbour Inn Hotel &amp; Waterfront Residences · 42 Marina Boulevard
              </p>
              <p style="margin: 0; font-size: 11px; color: #948E88;">
                This automated notification contains no clickable login links for phishing prevention.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function generateOtpEmailPlain(props: OtpEmailProps): string {
  const greeting = props.name ? `Dear ${props.name},` : 'Dear Guest,';
  return `HARBOUR INN - VERIFICATION CODE

${greeting}

Your 6-digit verification code is: ${props.code}

This code expires in ${props.expiryMinutes} minutes and can only be used once.

Didn't request this code?
If you did not initiate this sign-in or booking attempt, you can safely ignore this email. No action will be taken.

For your security, this email contains no clickable login links.

--
Harbour Inn Hotel & Waterfront Residences
42 Marina Boulevard
`;
}
