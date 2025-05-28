import { z } from 'zod';
import {
  registerSchema,
  loginSchema,
  resetPasswordSchema,
  jobSeekerProfileSchema,
  businessProfileSchema,
  insertJobPostingSchema
} from '../shared/zodSchema';

describe('Validation Tests', () => {
  
  describe('Strong Password Validation', () => {
    const testPassword = (password: string) => {
      return registerSchema.safeParse({
        email: 'test@example.com',
        password,
        confirmPassword: password,
        firstName: 'John',
        lastName: 'Doe',
        role: 'job_seeker'
      });
    };

    it('should accept strong passwords', () => {
      const strongPasswords = [
        'MyStr0ng!Pass',
        'P@ssw0rd123',
        'Secure#123',
        'Complex1!Word',
        'V@lid123Pass'
      ];

      strongPasswords.forEach(password => {
        const result = testPassword(password);
        expect(result.success).toBe(true);
      });
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        'password', // No uppercase, numbers, or special chars
        'PASSWORD', // No lowercase, numbers, or special chars
        '12345678', // No letters or special chars
        'Password', // No numbers or special chars
        'Pass123',  // No special chars
        'Pass!',    // Too short
        'pass123!', // No uppercase
        'PASS123!', // No lowercase
        'Password!', // No numbers
      ];

      weakPasswords.forEach(password => {
        const result = testPassword(password);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues.some(issue => 
            issue.path.includes('password')
          )).toBe(true);
        }
      });
    });

    it('should enforce minimum length', () => {
      const result = testPassword('Sh0rt!');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.message.includes('at least 8 characters')
        )).toBe(true);
      }
    });

    it('should require lowercase letters', () => {
      const result = testPassword('NOLOW3R!');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.message.includes('lowercase letter')
        )).toBe(true);
      }
    });

    it('should require uppercase letters', () => {
      const result = testPassword('noupp3r!');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.message.includes('uppercase letter')
        )).toBe(true);
      }
    });

    it('should require numbers', () => {
      const result = testPassword('NoNumbers!');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.message.includes('number')
        )).toBe(true);
      }
    });

    it('should require special characters', () => {
      const result = testPassword('NoSpecial123');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.message.includes('special character')
        )).toBe(true);
      }
    });
  });

  describe('Phone Number Validation', () => {
    const testPhone = (phone: string) => {
      return jobSeekerProfileSchema.safeParse({
        userId: 'test-user',
        contactPhone: phone
      });
    };

    it('should accept valid phone numbers', () => {
      const validPhones = [
        '(555) 123-4567',
        '555-123-4567',
        '5551234567',
        '(307) 555-0123',
        '307-555-0123',
        '3075550123'
      ];

      validPhones.forEach(phone => {
        const result = testPhone(phone);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid phone numbers', () => {
      const invalidPhones = [
        '555-123', // Too short
        '555-123-456', // Too short
        '555-123-45678', // Too long
        '(555) 123-456', // Wrong format
        '555.123.4567', // Wrong separator
        '555 123 4567', // Wrong separator
        'abc-def-ghij', // Non-numeric
        '555-abc-1234', // Mixed characters
        '1-555-123-4567', // Too long with country code
        '+1-555-123-4567', // International format
        '(555-123-4567', // Missing closing parenthesis
        '555) 123-4567', // Missing opening parenthesis
      ];

      invalidPhones.forEach(phone => {
        const result = testPhone(phone);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues.some(issue => 
            issue.message.includes('valid 10-digit phone number')
          )).toBe(true);
        }
      });
    });

    it('should accept null or empty phone numbers', () => {
      const result1 = jobSeekerProfileSchema.safeParse({
        userId: 'test-user',
        contactPhone: null
      });
      const result2 = jobSeekerProfileSchema.safeParse({
        userId: 'test-user'
      });

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });
  });

  describe('Email Validation', () => {
    const testEmail = (email: string) => {
      return loginSchema.safeParse({
        email,
        password: 'ValidPass123!'
      });
    };

    it('should accept valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.email@domain.org',
        'user+tag@example.co.uk',
        'firstname.lastname@company.net',
        'user123@test-domain.com',
        'valid_email@subdomain.example.com'
      ];

      validEmails.forEach(email => {
        const result = testEmail(email);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'plainaddress',
        'missing@domain',
        '@missinglocal.com',
        'spaces @domain.com',
        'user@',
        'user@domain',
        'user..double.dot@example.com',
        'user@domain..com',
        'user@-domain.com',
        'user@domain-.com',
        'user@domain.c',
        'user@domain.toolongext',
        'toolonglocal'.repeat(10) + '@domain.com'
      ];

      invalidEmails.forEach(email => {
        const result = testEmail(email);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues.some(issue => 
            issue.message.includes('valid email address')
          )).toBe(true);
        }
      });
    });
  });

  describe('Registration Validation', () => {
    it('should validate complete registration data', () => {
      const validRegistration = {
        email: 'user@example.com',
        password: 'ValidPass123!',
        confirmPassword: 'ValidPass123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'job_seeker' as const,
        mailingListConsent: true
      };

      const result = registerSchema.safeParse(validRegistration);
      expect(result.success).toBe(true);
    });

    it('should reject mismatched passwords', () => {
      const invalidRegistration = {
        email: 'user@example.com',
        password: 'ValidPass123!',
        confirmPassword: 'DifferentPass123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'job_seeker' as const
      };

      const result = registerSchema.safeParse(invalidRegistration);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.message.includes("Passwords don't match")
        )).toBe(true);
      }
    });

    it('should reject empty required fields', () => {
      const invalidRegistration = {
        email: '',
        password: 'ValidPass123!',
        confirmPassword: 'ValidPass123!',
        firstName: '',
        lastName: '',
        role: 'job_seeker' as const
      };

      const result = registerSchema.safeParse(invalidRegistration);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });

    it('should enforce maximum field lengths', () => {
      const longString = 'a'.repeat(100);
      const invalidRegistration = {
        email: 'user@example.com',
        password: 'ValidPass123!',
        confirmPassword: 'ValidPass123!',
        firstName: longString,
        lastName: longString,
        role: 'job_seeker' as const
      };

      const result = registerSchema.safeParse(invalidRegistration);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.message.includes('too long')
        )).toBe(true);
      }
    });
  });

  describe('Job Seeker Profile Validation', () => {
    it('should validate job seeker profile with contact info', () => {
      const validProfile = {
        userId: 'test-user',
        title: 'Software Developer',
        bio: 'Experienced developer with 5 years in web development.',
        location: 'Sheridan, WY',
        contactEmail: 'developer@example.com',
        contactPhone: '(307) 555-0123',
        skills: ['JavaScript', 'React', 'Node.js'],
        availableForWork: true
      };

      const result = jobSeekerProfileSchema.safeParse(validProfile);
      expect(result.success).toBe(true);
    });

    it('should reject invalid contact information', () => {
      const invalidProfile = {
        userId: 'test-user',
        contactEmail: 'invalid-email',
        contactPhone: '123-45' // Too short
      };

      const result = jobSeekerProfileSchema.safeParse(invalidProfile);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.message.includes('valid email address') ||
          issue.message.includes('valid 10-digit phone number')
        )).toBe(true);
      }
    });

    it('should enforce field length limits', () => {
      const longTitle = 'a'.repeat(150);
      const longBio = 'a'.repeat(1500);
      const longLocation = 'a'.repeat(150);

      const invalidProfile = {
        userId: 'test-user',
        title: longTitle,
        bio: longBio,
        location: longLocation
      };

      const result = jobSeekerProfileSchema.safeParse(invalidProfile);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.message.includes('too long')
        )).toBe(true);
      }
    });
  });

  describe('Business Profile Validation', () => {
    it('should validate business profile with contact info', () => {
      const validProfile = {
        userId: 'test-user',
        companyName: 'Tech Solutions Inc.',
        companySize: '10-50',
        industry: 'Technology',
        location: 'Sheridan, WY',
        website: 'https://techsolutions.com',
        description: 'Leading technology solutions provider.',
        contactEmail: 'info@techsolutions.com',
        contactPhone: '(307) 555-0123'
      };

      const result = businessProfileSchema.safeParse(validProfile);
      expect(result.success).toBe(true);
    });

    it('should reject invalid business contact information', () => {
      const invalidProfile = {
        userId: 'test-user',
        companyName: 'Test Company',
        contactEmail: 'invalid-email',
        contactPhone: '555-123', // Too short
        website: 'not-a-url'
      };

      const result = businessProfileSchema.safeParse(invalidProfile);
      expect(result.success).toBe(false);
    });
  });

  describe('Cross-Field Validation', () => {
    it('should validate password reset with matching passwords', () => {
      const validReset = {
        token: 'valid-token-123',
        password: 'NewStr0ng!Pass',
        confirmPassword: 'NewStr0ng!Pass'
      };

      const result = resetPasswordSchema.safeParse(validReset);
      expect(result.success).toBe(true);
    });

    it('should reject password reset with mismatched passwords', () => {
      const invalidReset = {
        token: 'valid-token-123',
        password: 'NewStr0ng!Pass',
        confirmPassword: 'DifferentPass123!'
      };

      const result = resetPasswordSchema.safeParse(invalidReset);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.message.includes("Passwords don't match")
        )).toBe(true);
      }
    });
  });

  describe('Input Sanitization', () => {
    it('should handle special characters in text fields', () => {
      const profileWithSpecialChars = {
        userId: 'test-user',
        title: 'Software Developer & Engineer',
        bio: 'Expert in C++, C#, and other "challenging" languages. <script>alert("test")</script>',
        location: 'Sheridan, WY (USA)'
      };

      const result = jobSeekerProfileSchema.safeParse(profileWithSpecialChars);
      expect(result.success).toBe(true);
    });

    it('should reject extremely long inputs', () => {
      const extremelyLongBio = 'a'.repeat(2000);
      const profile = {
        userId: 'test-user',
        bio: extremelyLongBio
      };

      const result = jobSeekerProfileSchema.safeParse(profile);
      expect(result.success).toBe(false);
    });
  });
});