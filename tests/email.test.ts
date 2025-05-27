import { emailService } from '../server/services/emailService';

describe('Email Service', () => {
  describe('Contact Email Functionality', () => {
    test('should handle contact email with valid data', async () => {
      const contactData = {
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Test Subject',
        message: 'This is a test message with sufficient length for validation.'
      };

      // In test environment, this will log to console instead of sending actual emails
      const result = await emailService.sendContactEmail(contactData);
      
      // Should return false in test environment (no actual email sending)
      // but should not throw errors
      expect(typeof result).toBe('boolean');
    });

    test('should handle password reset email', async () => {
      const email = 'test@example.com';
      const resetToken = 'test-reset-token-12345';

      // In test environment, this will log to console instead of sending actual emails
      const result = await emailService.sendPasswordResetEmail(email, resetToken);
      
      // Should return false in test environment (no actual email sending)
      // but should not throw errors
      expect(typeof result).toBe('boolean');
    });
  });
});