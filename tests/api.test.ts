import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../server/routes';

describe('API Endpoints', () => {
  let app: express.Application;
  let server: any;
  let authCookie: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);

    // Create and login a test user
    const userData = {
      email: 'api-test@example.com',
      password: 'SecurePassword123!',
      firstName: 'API',
      lastName: 'Test',
      role: 'business'
    };

    await request(app)
      .post('/api/auth/register')
      .send(userData);

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: userData.email,
        password: userData.password
      });

    authCookie = loginResponse.headers['set-cookie'];
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  describe('Job Postings API', () => {
    test('should get all job postings', async () => {
      const response = await request(app)
        .get('/api/jobs');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('should create a new job posting for authenticated business user', async () => {
      const jobData = {
        title: 'Test Developer',
        company: 'Test Company',
        location: 'Sheridan, WY',
        type: 'full-time',
        description: 'Test job description for development position',
        requirements: 'Test requirements for the position',
        compensationType: 'salary',
        salaryRange: '$50,000 - $70,000',
        plan: 'basic'
      };

      const response = await request(app)
        .post('/api/jobs')
        .set('Cookie', authCookie)
        .send(jobData);

      expect(response.status).toBe(201);
      expect(response.body.title).toBe(jobData.title);
      expect(response.body.company).toBe(jobData.company);
    });

    test('should reject job posting creation for unauthenticated user', async () => {
      const jobData = {
        title: 'Test Developer',
        company: 'Test Company',
        location: 'Sheridan, WY',
        type: 'full-time',
        description: 'Test job description',
        requirements: 'Test requirements',
        compensationType: 'salary',
        plan: 'basic'
      };

      const response = await request(app)
        .post('/api/jobs')
        .send(jobData);

      expect(response.status).toBe(401);
    });
  });

  describe('Contact Form API', () => {
    test('should accept valid contact form submission', async () => {
      const contactData = {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Test Inquiry',
        message: 'This is a test message with more than 10 characters.'
      };

      const response = await request(app)
        .post('/api/contact')
        .send(contactData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Thank you');
    });

    test('should reject contact form with invalid data', async () => {
      const contactData = {
        name: '',
        email: 'invalid-email',
        subject: '',
        message: 'Short'
      };

      const response = await request(app)
        .post('/api/contact')
        .send(contactData);

      expect(response.status).toBe(400);
    });
  });

  describe('Business Profile API', () => {
    test('should create business profile for authenticated business user', async () => {
      const profileData = {
        companyName: 'Test Company LLC',
        companySize: '10-50',
        industry: 'Technology',
        location: 'Sheridan, WY',
        description: 'A test company for API testing'
      };

      const response = await request(app)
        .post('/api/business/profile')
        .set('Cookie', authCookie)
        .send(profileData);

      expect(response.status).toBe(200);
      expect(response.body.companyName).toBe(profileData.companyName);
    });

    test('should get business profile for authenticated business user', async () => {
      const response = await request(app)
        .get('/api/business/profile')
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('companyName');
    });
  });

  describe('Pricing API', () => {
    test('should get pricing information', async () => {
      const response = await request(app)
        .get('/api/pricing');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('plans');
      expect(response.body).toHaveProperty('addons');
    });
  });
});