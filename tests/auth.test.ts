import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../server/routes';

describe('Authentication System', () => {
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

  describe('User Registration', () => {
    test('should register a new business user', async () => {
      const userData = {
        email: 'test-business@example.com',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'business'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(userData.email);
      expect(response.body.role).toBe(userData.role);
    });

    test('should register a new job seeker user', async () => {
      const userData = {
        email: 'test-seeker@example.com',
        password: 'SecurePassword123!',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'job_seeker'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(userData.email);
      expect(response.body.role).toBe(userData.role);
    });

    test('should reject registration with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'business'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
    });

    test('should reject registration with weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'business'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
    });
  });

  describe('User Login', () => {
    test('should login with valid credentials', async () => {
      // First register a user
      const userData = {
        email: 'login-test@example.com',
        password: 'SecurePassword123!',
        firstName: 'Test',
        lastName: 'User',
        role: 'business'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Then try to login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body).toHaveProperty('id');
      expect(loginResponse.body.email).toBe(userData.email);
    });

    test('should reject login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('Password Reset', () => {
    test('should handle forgot password request', async () => {
      // First register a user
      const userData = {
        email: 'reset-test@example.com',
        password: 'SecurePassword123!',
        firstName: 'Reset',
        lastName: 'Test',
        role: 'business'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Request password reset
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: userData.email });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('password reset link');
    });

    test('should handle forgot password for non-existent email gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('password reset link');
    });
  });
});