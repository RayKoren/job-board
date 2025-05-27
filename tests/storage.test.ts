import { storage } from '../server/storage';

describe('Database Storage', () => {
  describe('User Operations', () => {
    test('should create and retrieve users', async () => {
      const userData = {
        id: 'test-user-' + Date.now(),
        email: 'storage-test@example.com',
        password: 'hashedpassword123',
        firstName: 'Storage',
        lastName: 'Test',
        role: 'business' as const
      };

      const createdUser = await storage.upsertUser(userData);
      expect(createdUser.email).toBe(userData.email);

      const retrievedUser = await storage.getUser(createdUser.id);
      expect(retrievedUser?.email).toBe(userData.email);
    });

    test('should retrieve user by email', async () => {
      const email = 'email-test@example.com';
      const userData = {
        id: 'email-test-' + Date.now(),
        email,
        password: 'hashedpassword123',
        firstName: 'Email',
        lastName: 'Test',
        role: 'job_seeker' as const
      };

      await storage.upsertUser(userData);
      const user = await storage.getUserByEmail(email);
      expect(user?.email).toBe(email);
    });
  });

  describe('Job Posting Operations', () => {
    test('should create and retrieve job postings', async () => {
      const jobData = {
        businessUserId: 'business-user-' + Date.now(),
        title: 'Test Job Position',
        company: 'Test Company',
        location: 'Sheridan, WY',
        type: 'full-time',
        description: 'Test job description',
        requirements: 'Test requirements',
        compensationType: 'salary',
        salaryRange: '$50,000 - $70,000',
        plan: 'basic',
        status: 'active'
      };

      const createdJob = await storage.createJobPosting(jobData);
      expect(createdJob.title).toBe(jobData.title);

      if (createdJob.id) {
        const retrievedJob = await storage.getJobPosting(createdJob.id);
        expect(retrievedJob?.title).toBe(jobData.title);
      }
    });

    test('should get job postings with filters', async () => {
      const jobs = await storage.getJobPostings({ limit: 10 });
      expect(Array.isArray(jobs)).toBe(true);
    });
  });
});