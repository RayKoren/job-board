import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { emailService } from '../server/services/emailService';

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransporter: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
  }))
}));

describe('Email Service', () => {
  let mockSendMail: jest.MockedFunction<any>;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Mock the transporter's sendMail method
    mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-message-id' });
    (emailService as any).transporter = {
      sendMail: mockSendMail
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Application Submitted Emails', () => {
    it('should send application confirmation email to applicant', async () => {
      const applicantData = {
        name: 'John Doe',
        email: 'john@example.com',
        jobTitle: 'Software Developer',
        company: 'Tech Corp'
      };

      const result = await emailService.sendApplicationSubmittedEmail(applicantData);

      expect(result).toBe(true);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
      
      const emailCall = mockSendMail.mock.calls[0][0];
      expect(emailCall.to).toBe('john@example.com');
      expect(emailCall.subject).toContain('Application Submitted');
      expect(emailCall.html).toContain('John Doe');
      expect(emailCall.html).toContain('Software Developer');
      expect(emailCall.html).toContain('Tech Corp');
    });

    it('should handle email sending errors gracefully', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('SMTP Error'));

      const applicantData = {
        name: 'John Doe',
        email: 'john@example.com',
        jobTitle: 'Software Developer',
        company: 'Tech Corp'
      };

      const result = await emailService.sendApplicationSubmittedEmail(applicantData);

      expect(result).toBe(false);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
    });
  });

  describe('Application Status Update Emails', () => {
    it('should send status update email with accepted status', async () => {
      const applicantData = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        jobTitle: 'Marketing Manager',
        company: 'Marketing Inc',
        status: 'accepted'
      };

      const result = await emailService.sendApplicationStatusUpdateEmail(applicantData);

      expect(result).toBe(true);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
      
      const emailCall = mockSendMail.mock.calls[0][0];
      expect(emailCall.to).toBe('jane@example.com');
      expect(emailCall.subject).toContain('Application Status Update');
      expect(emailCall.html).toContain('Jane Smith');
      expect(emailCall.html).toContain('Marketing Manager');
      expect(emailCall.html).toContain('Marketing Inc');
      expect(emailCall.html).toContain('accepted');
    });

    it('should send status update email with rejected status', async () => {
      const applicantData = {
        name: 'Bob Johnson',
        email: 'bob@example.com',
        jobTitle: 'Designer',
        company: 'Design Studio',
        status: 'rejected'
      };

      const result = await emailService.sendApplicationStatusUpdateEmail(applicantData);

      expect(result).toBe(true);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
      
      const emailCall = mockSendMail.mock.calls[0][0];
      expect(emailCall.to).toBe('bob@example.com');
      expect(emailCall.subject).toContain('Application Status Update');
      expect(emailCall.html).toContain('rejected');
    });

    it('should handle missing status gracefully', async () => {
      const applicantData = {
        name: 'Test User',
        email: 'test@example.com',
        jobTitle: 'Test Job',
        company: 'Test Company',
        status: ''
      };

      const result = await emailService.sendApplicationStatusUpdateEmail(applicantData);

      expect(result).toBe(true);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
    });
  });

  describe('New Application Notification Emails', () => {
    it('should send notification email to business owner', async () => {
      const businessData = {
        businessEmail: 'business@example.com',
        applicantName: 'John Applicant',
        jobTitle: 'Developer Position',
        company: 'Tech Company',
        applicationId: 123
      };

      const result = await emailService.sendNewApplicationNotificationEmail(businessData);

      expect(result).toBe(true);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
      
      const emailCall = mockSendMail.mock.calls[0][0];
      expect(emailCall.to).toBe('business@example.com');
      expect(emailCall.subject).toContain('New Job Application');
      expect(emailCall.html).toContain('John Applicant');
      expect(emailCall.html).toContain('Developer Position');
      expect(emailCall.html).toContain('Tech Company');
      expect(emailCall.html).toContain('123');
    });

    it('should handle email sending failure', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('Network Error'));

      const businessData = {
        businessEmail: 'business@example.com',
        applicantName: 'John Applicant',
        jobTitle: 'Developer Position',
        company: 'Tech Company',
        applicationId: 123
      };

      const result = await emailService.sendNewApplicationNotificationEmail(businessData);

      expect(result).toBe(false);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
    });
  });

  describe('Contact Form Emails', () => {
    it('should send contact email and confirmation', async () => {
      const contactData = {
        name: 'Contact Person',
        email: 'contact@example.com',
        subject: 'Test Subject',
        message: 'Test message content'
      };

      const result = await emailService.sendContactEmail(contactData);

      expect(result).toBe(true);
      expect(mockSendMail).toHaveBeenCalledTimes(2); // Contact email + confirmation
      
      // Check contact email
      const contactEmailCall = mockSendMail.mock.calls[0][0];
      expect(contactEmailCall.subject).toContain('Test Subject');
      expect(contactEmailCall.html).toContain('Contact Person');
      expect(contactEmailCall.html).toContain('Test message content');
      
      // Check confirmation email
      const confirmationEmailCall = mockSendMail.mock.calls[1][0];
      expect(confirmationEmailCall.to).toBe('contact@example.com');
      expect(confirmationEmailCall.subject).toContain('Thank you for contacting');
    });
  });

  describe('Password Reset Emails', () => {
    it('should send password reset email', async () => {
      const email = 'user@example.com';
      const resetToken = 'test-reset-token-123';

      const result = await emailService.sendPasswordResetEmail(email, resetToken);

      expect(result).toBe(true);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
      
      const emailCall = mockSendMail.mock.calls[0][0];
      expect(emailCall.to).toBe('user@example.com');
      expect(emailCall.subject).toContain('Password Reset');
      expect(emailCall.html).toContain(resetToken);
    });

    it('should handle password reset email failure', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('SMTP Error'));

      const result = await emailService.sendPasswordResetEmail('user@example.com', 'token');

      expect(result).toBe(false);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
    });
  });

  describe('Email Content Validation', () => {
    it('should include all required elements in application submitted email', async () => {
      const applicantData = {
        name: 'Test User',
        email: 'test@example.com',
        jobTitle: 'Test Job',
        company: 'Test Company'
      };

      await emailService.sendApplicationSubmittedEmail(applicantData);

      const emailCall = mockSendMail.mock.calls[0][0];
      const htmlContent = emailCall.html;
      
      // Check for branding elements
      expect(htmlContent).toContain('Sheridan Jobs');
      expect(htmlContent).toContain('🏔️');
      
      // Check for required content
      expect(htmlContent).toContain('Test User');
      expect(htmlContent).toContain('Test Job');
      expect(htmlContent).toContain('Test Company');
      
      // Check for professional styling
      expect(htmlContent).toContain('color:');
      expect(htmlContent).toContain('font-family:');
    });

    it('should include proper styling in status update emails', async () => {
      const applicantData = {
        name: 'Test User',
        email: 'test@example.com',
        jobTitle: 'Test Job',
        company: 'Test Company',
        status: 'accepted'
      };

      await emailService.sendApplicationStatusUpdateEmail(applicantData);

      const emailCall = mockSendMail.mock.calls[0][0];
      const htmlContent = emailCall.html;
      
      // Check for responsive design elements
      expect(htmlContent).toContain('max-width: 600px');
      expect(htmlContent).toContain('margin: 0 auto');
      
      // Check for status-specific content
      expect(htmlContent).toContain('accepted');
    });
  });
});