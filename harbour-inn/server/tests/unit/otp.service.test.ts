import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OtpService } from '../../src/modules/otp/otp.service';

describe('OtpService (Unit Tests)', () => {
  let otpService: OtpService;

  beforeEach(() => {
    otpService = new OtpService();
  });

  it('should generate a cryptographically valid 6-digit numeric string', () => {
    for (let i = 0; i < 20; i++) {
      const code = otpService.generateOtpCode();
      expect(code).toHaveLength(6);
      expect(/^\d{6}$/.test(code)).toBe(true);
      const num = parseInt(code, 10);
      expect(num).toBeGreaterThanOrEqual(100000);
      expect(num).toBeLessThan(1000000);
    }
  });

  it('should produce deterministic HMAC-SHA256 hashes using the server secret', () => {
    const code = '482910';
    const hash1 = otpService.hashOtpCode(code);
    const hash2 = otpService.hashOtpCode(code);
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 hex length
  });

  it('should perform constant-time comparison correctly', () => {
    const code = '592817';
    const candidateHash = otpService.hashOtpCode(code);
    const validHash = otpService.hashOtpCode('592817');
    const wrongHash = otpService.hashOtpCode('123456');

    expect(otpService.compareHash(candidateHash, validHash)).toBe(true);
    expect(otpService.compareHash(candidateHash, wrongHash)).toBe(false);
  });

  it('should reject timing comparison if hash lengths mismatch', () => {
    expect(otpService.compareHash('abc', 'abcdef')).toBe(false);
  });
});
