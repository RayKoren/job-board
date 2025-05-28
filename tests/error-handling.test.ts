import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../server/routes';
import { storage } from '../server/storage';

describe('Error Handling Tests', () => {
  let app: express.Application;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    
    // Mock session middleware
    app.use((req: any, res, next) => {
      req.session = { user: { id: 'test-user', role: 'business' } };
      req.isAuthenticated = () => true;
      next();
    });

    await registerRoutes(app);

    // Add error handling middleware
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });
  });

  describe('Authentication Error Handling', () => {
    it('should handle missing credentials in login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('required');
    });

    it('should handle invalid email format in registration', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          confirmPassword: 'password123',
          firstName: 'Test',
          lastName: 'User',
          role: 'job_seeker'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('email');
    });

    it('should handle password mismatch in registration', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          confirmPassword: 'different123',
          firstName: 'Test',
          lastName: 'User',
          role: 'job_seeker'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('match');
    });
  });

  describe('Authorization Error Handling', () => {
    it('should handle unauthorized access to protected routes', async () => {
      const unauthorizedApp = express();
      unauthorizedApp.use(express.json());
      
      // Mock unauthorized session
      unauthorizedApp.use((req: any, res, next) => {
        req.session = {};
        req.isAuthenticated = () => false;
        next();
      });

      await registerRoutes(unauthorizedApp);

      const response = await request(unauthorizedApp)
        .get('/api/business/profile');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Unauthorized');
    });

    it('should handle role-based access control', async () => {
      const jobSeekerApp = express();
      jobSeekerApp.use(express.json());
      
      // Mock job seeker session trying to access business route
      jobSeekerApp.use((req: any, res, next) => {
        req.session = { user: { id: 'test-user', role: 'job_seeker' } };
        req.isAuthenticated = () => true;
        next();
      });

      await registerRoutes(jobSeekerApp);

      const response = await request(jobSeekerApp)
        .get('/api/business/profile');

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access denied: Business role required');
    });
  });

  describe('Validation Error Handling', () => {
    it('should handle invalid job posting data', async () => {
      const response = await request(app)
        .post('/api/jobs')
        .send({
          title: '', // Invalid: empty title
          company: 'Test Company',
          location: 'Test Location',
          type: 'full-time',
          description: 'Test description'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('required');
    });

    it('should handle invalid compensation type', async () => {
      const response = await request(app)
        .post('/api/jobs')
        .send({
          title: 'Test Job',
          company: 'Test Company',
          location: 'Test Location',
          type: 'full-time',
          description: 'Test description',
          requirements: 'Test requirements',
          compensationType: 'invalid_type', // Invalid compensation type
          plan: 'basic'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('compensation');
    });
  });

  describe('Database Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Mock storage to throw error
      const originalGetUser = storage.getUser;
      storage.getUser = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/auth/user');

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Failed to fetch user');

      // Restore original method
      storage.getUser = originalGetUser;
    });

    it('should handle resource not found errors', async () => {
      const response = await request(app)
        .get('/api/jobs/99999'); // Non-existent job ID

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Job not found');
    });
  });

  describe('Email Service Error Handling', () => {
    it('should handle email service failures gracefully', async () => {
      // Create test application and job posting
      const testApp = {
        id: 1,
        jobId: 1,
        userId: 'test-user',
        name: 'Test User',
        email: 'test@example.com',
        status: 'pending'
      };

      // Mock email service to fail
      jest.mock('../server/services/emailService', () => ({
        emailService: {
          sendApplicationStatusUpdateEmail: jest.fn().mockResolvedValue(false)
        }
      }));

      const response = await request(app)
        .put('/api/applications/1/status')
        .send({ status: 'reviewed' });

      // Should still update status even if email fails
      expect(response.status).toBe(200);
    });
  });

  describe('Input Sanitization', () => {
    it('should handle malicious input in job descriptions', async () => {
      const response = await request(app)
        .post('/api/jobs')
        .send({
          title: 'Test Job',
          company: 'Test Company',
          location: 'Test Location',
          type: 'full-time',
          description: '<script>alert("xss")</script>Test description',
          requirements: 'Test requirements',
          compensationType: 'salary',
          salaryRange: '$50,000 - $60,000',
          plan: 'basic'
        });

      expect(response.status).toBe(201);
      // Description should be sanitized (exact behavior depends on implementation)
      expect(response.body.description).not.toContain('<script>');
    });
  });

  describe('Rate Limiting and Security', () => {
    it('should handle too many requests gracefully', async () => {
      // This would test rate limiting if implemented
      const promises = Array(20).fill(null).map(() => 
        request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'wrongpassword'
          })
      );

      const responses = await Promise.all(promises);
      
      // Should handle multiple requests without crashing
      responses.forEach(response => {
        expect([400, 401, 429]).toContain(response.status);
      });
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle concurrent job applications', async () => {
      const promises = Array(5).fill(null).map((_, index) => 
        request(app)
          .post('/api/jobs/1/apply')
          .send({
            name: `Test User ${index}`,
            email: `test${index}@example.com`,
            phone: '555-0123',
            coverLetter: 'Test cover letter',
            resume: 'Test resume content'
          })
      );

      const responses = await Promise.all(promises);
      
      // All requests should be handled properly
      responses.forEach(response => {
        expect([200, 201, 400, 404]).toContain(response.status);
      });
    });
  });
});