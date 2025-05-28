import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { emailService } from '../server/services/emailService';

describe('Email Integration Tests', () => {
  let originalTransporter: any;
  let mockSendMail: jest.MockedFunction<any>;

  beforeEach(() => {
    // Store original transporter
    originalTransporter = (emailService as any).transporter;
    
    // Create mock sendMail function
    mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-message-id' });
    
    // Replace transporter with mock
    (emailService as any).transporter = {
      sendMail: mockSendMail
    };
  });

  afterEach(() => {
    // Restore original transporter
    (emailService as any).transporter = originalTransporter;
    jest.clearAllMocks();
  });

  describe('Application Status Update Emails', () => {
    it('should send status update email when application is accepted', async () => {
      const applicantData = {
        name: 'Test Applicant',
        email: 'applicant@example.com',
        jobTitle: 'Software Developer',
        company: 'Tech Corp',
        status: 'accepted'
      };

      const result = await emailService.sendApplicationStatusUpdateEmail(applicantData);

      expect(result).toBe(true);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
      
      const emailCall = mockSendMail.mock.calls[0][0];
      expect(emailCall.to).toBe('applicant@example.com');
      expect(emailCall.subject).toContain('Application Status Update');
      expect(emailCall.html).toContain('Test Applicant');
      expect(emailCall.html).toContain('Software Developer');
      expect(emailCall.html).toContain('Tech Corp');
      expect(emailCall.html).toContain('accepted');
    });

    it('should send status update email when application is rejected', async () => {
      const applicantData = {
        name: 'Test Applicant',
        email: 'applicant@example.com',
        jobTitle: 'Marketing Manager',
        company: 'Marketing Inc',
        status: 'rejected'
      };

      const result = await emailService.sendApplicationStatusUpdateEmail(applicantData);

      expect(result).toBe(true);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
      
      const emailCall = mockSendMail.mock.calls[0][0];
      expect(emailCall.html).toContain('rejected');
    });

    it('should handle email failures gracefully', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('SMTP Error'));

      const applicantData = {
        name: 'Test Applicant',
        email: 'applicant@example.com',
        jobTitle: 'Test Job',
        company: 'Test Company',
        status: 'reviewed'
      };

      const result = await emailService.sendApplicationStatusUpdateEmail(applicantData);

      expect(result).toBe(false);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
    });
  });

  describe('Application Submitted Emails', () => {
    it('should send confirmation email to applicant', async () => {
      const applicantData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        jobTitle: 'Designer',
        company: 'Design Studio'
      };

      const result = await emailService.sendApplicationSubmittedEmail(applicantData);

      expect(result).toBe(true);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
      
      const emailCall = mockSendMail.mock.calls[0][0];
      expect(emailCall.to).toBe('jane@example.com');
      expect(emailCall.subject).toContain('Application Submitted');
      expect(emailCall.html).toContain('Jane Doe');
      expect(emailCall.html).toContain('Designer');
      expect(emailCall.html).toContain('Design Studio');
      expect(emailCall.html).toContain('Sheridan Jobs');
    });
  });

  describe('Business Notification Emails', () => {
    it('should send new application notification to business', async () => {
      const businessData = {
        businessEmail: 'business@example.com',
        applicantName: 'John Smith',
        jobTitle: 'Developer',
        company: 'Tech Corp',
        applicationId: 123
      };

      const result = await emailService.sendNewApplicationNotificationEmail(businessData);

      expect(result).toBe(true);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
      
      const emailCall = mockSendMail.mock.calls[0][0];
      expect(emailCall.to).toBe('business@example.com');
      expect(emailCall.subject).toContain('New Job Application');
      expect(emailCall.html).toContain('John Smith');
      expect(emailCall.html).toContain('Developer');
      expect(emailCall.html).toContain('Tech Corp');
    });
  });

  describe('Email Content Validation', () => {
    it('should include proper branding in all emails', async () => {
      const testData = {
        name: 'Test User',
        email: 'test@example.com',
        jobTitle: 'Test Position',
        company: 'Test Company',
        status: 'pending'
      };

      await emailService.sendApplicationStatusUpdateEmail(testData);

      const emailCall = mockSendMail.mock.calls[0][0];
      expect(emailCall.html).toContain('Sheridan Jobs');
      expect(emailCall.html).toContain('🏔️');
      expect(emailCall.from).toContain(process.env.EMAIL_FROM || 'noreply@sheridanjobs.com');
    });

    it('should use responsive email design', async () => {
      const testData = {
        name: 'Test User',
        email: 'test@example.com',
        jobTitle: 'Test Position',
        company: 'Test Company',
        status: 'accepted'
      };

      await emailService.sendApplicationStatusUpdateEmail(testData);

      const emailCall = mockSendMail.mock.calls[0][0];
      expect(emailCall.html).toContain('max-width: 600px');
      expect(emailCall.html).toContain('margin: 0 auto');
    });
  });
});