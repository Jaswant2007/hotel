const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'sharklasers.com',
  'yopmail.com',
  'dispostable.com',
  'getairmail.com',
  'trashmail.com',
  'fakeinbox.com',
  'throwawaymail.com',
]);

export function isDisposableEmail(email: string): boolean {
  const parts = email.toLowerCase().trim().split('@');
  if (parts.length !== 2) return true;
  const domain = parts[1];
  return DISPOSABLE_DOMAINS.has(domain);
}

export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}
