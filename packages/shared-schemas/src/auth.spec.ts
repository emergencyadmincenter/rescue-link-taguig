import { signInSchema } from './auth';

describe('Auth Validation Schemas', () => {
  describe('signInSchema', () => {
    it('TC-U-16: should validate correct email and password', () => {
      const result = signInSchema.safeParse({ email: 'admin@taguig.gov.ph', password: 'securepassword123' });
      expect(result.success).toBe(true);
    });

    it('TC-U-17: should reject missing email', () => {
      const result = signInSchema.safeParse({ password: 'securepassword123' });
      expect(result.success).toBe(false);
    });

    it('TC-U-18: should reject invalid email format (no @)', () => {
      const result = signInSchema.safeParse({ email: 'admintaguig.gov.ph', password: 'securepassword123' });
      expect(result.success).toBe(false);
    });

    it('TC-U-19: should reject password shorter than 6 characters', () => {
      const result = signInSchema.safeParse({ email: 'admin@taguig.gov.ph', password: '12345' });
      expect(result.success).toBe(false);
    });

    it('TC-U-20: should strip unknown properties from the payload', () => {
      const payload = { email: 'admin@test.com', password: 'password', role: 'SUPERADMIN' };
      const result = signInSchema.parse(payload);
      expect((result as any).role).toBeUndefined();
    });
  });
});
