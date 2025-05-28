import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../server/routes';
import { storage } from '../server/storage';
import { emailService } from '../server/services/emailService';

// Mock email service
jest.mock('../server/services/emailService', () => ({
  emailService: {
    sendApplicationSubmittedEmail: jest.fn().mockResolvedValue(true),
    sendNewApplicationNotificationEmail: jest.fn().mockResolvedValue(true),
    sendApplicationStatusUpdateEmail: jest.fn().mockResolvedValue(true),
  }
}));

describe('Application Workflow with Email Notifications', () => {
  let app: express.Application;
  let server: any;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  describe('Job Application Submission', () => {
    it('should send emails when application is submitted', async () => {
      // Mock authentication and user session
      const mockUser = {
        id: 'test-user-123',
        email: 'applicant@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'job_seeker'
      };

      // Mock business user
      const mockBusinessUser = {
        id: 'business-user-123',
        email: 'business@example.com',
        firstName: 'Business',
        lastName: 'Owner',
        role: 'business'
      };

      // Mock job posting
      const mockJob = {
        id: 1,
        title: 'Software Developer',
        company: 'Tech Corp',
        businessUserId: 'business-user-123',
        location: 'Sheridan, WY',
        type: 'Full-time',
        description: 'Great job',
        requirements: 'Experience required',
        compensationType: 'salary',
        salaryRange: '$60,000 - $80,000',
        status: 'active',
        plan: 'standard',
        addons: [],
        featured: false,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock storage methods
      jest.spyOn(storage, 'getJobPosting').mockResolvedValue(mockJob);
      jest.spyOn(storage, 'getUser').mockResolvedValue(mockBusinessUser);
      jest.spyOn(storage, 'createJobApplication').mockResolvedValue({
        id: 1,
        jobId: 1,
        userId: 'test-user-123',
        name: 'Test User',
        email: 'applicant@example.com',
        phone: '555-0123',
        coverLetter: 'I am interested in this position',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Mock session middleware for authentication
      app.use((req: any, res, next) => {
        req.session = { user: mockUser };
        req.isAuthenticated = () => true;
        next();
      });

      const applicationData = {
        jobId: 1,
        name: 'Test User',
        email: 'applicant@example.com',
        phone: '555-0123',
        coverLetter: 'I am interested in this position'
      };

      const response = await request(app)
        .post('/api/job-applications')
        .send(applicationData)
        .expect(201);

      // Verify application was created
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test User');

      // Verify emails were sent
      expect(emailService.sendApplicationSubmittedEmail).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'applicant@example.com',
        jobTitle: 'Software Developer',
        company: 'Tech Corp'
      });

      expect(emailService.sendNewApplicationNotificationEmail).toHaveBeenCalledWith({
        businessEmail: 'business@example.com',
        applicantName: 'Test User',
        jobTitle: 'Software Developer',
        company: 'Tech Corp',
        applicationId: 1
      });
    });
  });

  describe('Application Status Updates', () => {
    it('should send email when application status is updated', async () => {
      // Mock business user authentication
      const mockBusinessUser = {
        id: 'business-user-123',
        email: 'business@example.com',
        firstName: 'Business',
        lastName: 'Owner',
        role: 'business'
      };

      // Mock application
      const mockApplication = {
        id: 1,
        jobId: 1,
        userId: 'applicant-user-123',
        name: 'Jane Applicant',
        email: 'jane@example.com',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock job
      const mockJob = {
        id: 1,
        title: 'Marketing Manager',
        company: 'Marketing Inc',
        businessUserId: 'business-user-123',
        location: 'Sheridan, WY',
        type: 'Full-time',
        description: 'Marketing position',
        requirements: 'Marketing experience',
        compensationType: 'salary',
        status: 'active',
        plan: 'standard',
        addons: [],
        featured: false,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock storage methods
      jest.spyOn(storage, 'getJobApplication').mockResolvedValue(mockApplication);
      jest.spyOn(storage, 'getJobPosting').mockResolvedValue(mockJob);
      jest.spyOn(storage, 'updateJobApplicationStatus').mockResolvedValue({
        ...mockApplication,
        status: 'accepted'
      });

      // Mock session middleware for business user
      app.use((req: any, res, next) => {
        req.session = { user: mockBusinessUser };
        req.isAuthenticated = () => true;
        next();
      });

      const response = await request(app)
        .patch('/api/applications/1/status')
        .send({ status: 'accepted' })
        .expect(200);

      // Verify status was updated
      expect(response.body.status).toBe('accepted');

      // Verify email was sent
      expect(emailService.sendApplicationStatusUpdateEmail).toHaveBeenCalledWith({
        name: 'Jane Applicant',
        email: 'jane@example.com',
        jobTitle: 'Marketing Manager',
        company: 'Marketing Inc',
        status: 'accepted'
      });
    });
  });

  describe('Email Service Error Handling', () => {
    it('should not fail application submission if email fails', async () => {
      // Mock email service to fail
      (emailService.sendApplicationSubmittedEmail as jest.Mock).mockRejectedValueOnce(
        new Error('SMTP Error')
      );

      const mockUser = {
        id: 'test-user-123',
        email: 'applicant@example.com',
        role: 'job_seeker'
      };

      const mockJob = {
        id: 1,
        title: 'Developer',
        company: 'Tech Corp',
        businessUserId: 'business-user-123'
      };

      jest.spyOn(storage, 'getJobPosting').mockResolvedValue(mockJob);
      jest.spyOn(storage, 'createJobApplication').mockResolvedValue({
        id: 1,
        jobId: 1,
        userId: 'test-user-123',
        name: 'Test User',
        email: 'applicant@example.com',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      app.use((req: any, res, next) => {
        req.session = { user: mockUser };
        req.isAuthenticated = () => true;
        next();
      });

      const response = await request(app)
        .post('/api/job-applications')
        .send({
          jobId: 1,
          name: 'Test User',
          email: 'applicant@example.com'
        })
        .expect(201);

      // Application should still be created despite email failure
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test User');
    });

    it('should not fail status update if email fails', async () => {
      // Mock email service to fail
      (emailService.sendApplicationStatusUpdateEmail as jest.Mock).mockRejectedValueOnce(
        new Error('Email Service Down')
      );

      const mockBusinessUser = {
        id: 'business-user-123',
        email: 'business@example.com',
        role: 'business'
      };

      const mockApplication = {
        id: 1,
        jobId: 1,
        name: 'Test Applicant',
        email: 'applicant@example.com',
        status: 'pending'
      };

      const mockJob = {
        id: 1,
        businessUserId: 'business-user-123',
        title: 'Test Job',
        company: 'Test Company'
      };

      jest.spyOn(storage, 'getJobApplication').mockResolvedValue(mockApplication);
      jest.spyOn(storage, 'getJobPosting').mockResolvedValue(mockJob);
      jest.spyOn(storage, 'updateJobApplicationStatus').mockResolvedValue({
        ...mockApplication,
        status: 'rejected'
      });

      app.use((req: any, res, next) => {
        req.session = { user: mockBusinessUser };
        req.isAuthenticated = () => true;
        next();
      });

      const response = await request(app)
        .patch('/api/applications/1/status')
        .send({ status: 'rejected' })
        .expect(200);

      // Status should still be updated despite email failure
      expect(response.body.status).toBe('rejected');
    });
  });
});