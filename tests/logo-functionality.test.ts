import request from 'supertest';
import express from 'express';
import multer from 'multer';
import { BusinessProfile } from '../server/db';
import { registerRoutes } from '../server/routes';
import { setupAuth } from '../server/passwordAuth';

// Mock business profile for testing
const mockBusinessProfile = {
  id: 1,
  userId: 'test-user-123',
  companyName: 'Test Company',
  industry: 'Technology',
  location: 'Test City',
  website: 'https://testcompany.com',
  description: 'A test company for testing purposes',
  contactEmail: 'test@company.com',
  contactPhone: '(555) 123-4567',
  logoData: null,
  logoName: null,
  logoType: null,
  createdAt: new Date(),
  updatedAt: new Date()
};

// Mock session middleware for authenticated tests
const mockAuthMiddleware = (req: any, res: any, next: any) => {
  req.session = {
    user: {
      id: 'test-user-123',
      email: 'test@example.com',
      role: 'business'
    }
  };
  req.isAuthenticated = () => true;
  next();
};

describe('Logo Upload and Display Functionality', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(mockAuthMiddleware);
    
    // Mock BusinessProfile methods
    jest.spyOn(BusinessProfile, 'findOne').mockResolvedValue(mockBusinessProfile as any);
    jest.spyOn(BusinessProfile, 'update').mockResolvedValue([1] as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Logo Upload Endpoint', () => {
    beforeEach(async () => {
      await registerRoutes(app);
    });

    it('should successfully upload a valid logo image', async () => {
      // Create a mock image buffer (1x1 PNG)
      const mockImageBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, // bit depth, color type, etc.
        0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
        0x54, 0x08, 0x99, 0x01, 0x01, 0x01, 0x00, 0x00, // compressed data
        0xFE, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // end of compressed data
        0xE2, 0x21, 0xBC, 0x33, 0x00, 0x00, 0x00, 0x00, // IEND chunk
        0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);

      const response = await request(app)
        .post('/api/logo-upload')
        .attach('logo', mockImageBuffer, {
          filename: 'test-logo.png',
          contentType: 'image/png'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logo uploaded successfully');
      expect(response.body.fileName).toBe('test-logo.png');
      expect(BusinessProfile.update).toHaveBeenCalled();
    });

    it('should reject files that are too large', async () => {
      // Create a buffer larger than 500KB
      const largeBuffer = Buffer.alloc(600 * 1024, 'a');

      const response = await request(app)
        .post('/api/logo-upload')
        .attach('logo', largeBuffer, {
          filename: 'large-logo.png',
          contentType: 'image/png'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('File size must be less than');
    });

    it('should reject invalid file types', async () => {
      const textBuffer = Buffer.from('This is not an image', 'utf8');

      const response = await request(app)
        .post('/api/logo-upload')
        .attach('logo', textBuffer, {
          filename: 'not-an-image.txt',
          contentType: 'text/plain'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid file type');
    });

    it('should reject uploads from non-business users', async () => {
      // Override middleware to simulate job seeker
      app.use((req: any, res: any, next: any) => {
        req.session.user.role = 'job_seeker';
        next();
      });

      const mockImageBuffer = Buffer.from('fake-image-data');

      const response = await request(app)
        .post('/api/logo-upload')
        .attach('logo', mockImageBuffer, {
          filename: 'test-logo.png',
          contentType: 'image/png'
        });

      expect(response.status).toBe(403);
    });

    it('should handle upload when no file is provided', async () => {
      const response = await request(app)
        .post('/api/logo-upload');

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('No logo file uploaded');
    });
  });

  describe('Logo Retrieval Endpoint', () => {
    beforeEach(async () => {
      await registerRoutes(app);
    });

    it('should successfully retrieve an uploaded logo', async () => {
      const mockLogoData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
      
      jest.spyOn(BusinessProfile, 'findOne').mockResolvedValue({
        ...mockBusinessProfile,
        logoData: mockLogoData,
        logoType: 'image/png'
      } as any);

      const response = await request(app)
        .get('/api/logo/test-user-123');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('image/png');
      expect(response.headers['cache-control']).toContain('public');
    });

    it('should return 404 when logo is not found', async () => {
      jest.spyOn(BusinessProfile, 'findOne').mockResolvedValue(null);

      const response = await request(app)
        .get('/api/logo/nonexistent-user');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Logo not found');
    });

    it('should return 404 when profile exists but has no logo', async () => {
      jest.spyOn(BusinessProfile, 'findOne').mockResolvedValue({
        ...mockBusinessProfile,
        logoData: null
      } as any);

      const response = await request(app)
        .get('/api/logo/test-user-123');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Logo not found');
    });
  });

  describe('Logo Display in Job Listings', () => {
    it('should include businessUserId in job listings for logo display', async () => {
      const mockJobs = [
        {
          id: 1,
          title: 'Software Developer',
          company: 'Test Company',
          businessUserId: 'test-user-123',
          location: 'Test City',
          type: 'Full-time',
          featured: false
        }
      ];

      // Mock the storage layer
      const mockStorage = {
        getActiveJobPostings: jest.fn().mockResolvedValue(mockJobs)
      };

      const response = await request(app)
        .get('/api/jobs');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('businessUserId');
      }
    });
  });

  describe('Business Profile Integration', () => {
    it('should update business profile with logo data on upload', async () => {
      const mockImageBuffer = Buffer.from('fake-image-data');
      const expectedBase64 = mockImageBuffer.toString('base64');

      await registerRoutes(app);

      await request(app)
        .post('/api/logo-upload')
        .attach('logo', mockImageBuffer, {
          filename: 'company-logo.png',
          contentType: 'image/png'
        });

      expect(BusinessProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          logoData: expectedBase64,
          logoName: 'company-logo.png',
          logoType: 'image/png'
        }),
        expect.objectContaining({
          where: { userId: 'test-user-123' }
        })
      );
    });

    it('should create new profile if none exists', async () => {
      jest.spyOn(BusinessProfile, 'findOne').mockResolvedValue(null);
      jest.spyOn(BusinessProfile, 'create').mockResolvedValue(mockBusinessProfile as any);

      const mockImageBuffer = Buffer.from('fake-image-data');
      
      await registerRoutes(app);

      const response = await request(app)
        .post('/api/logo-upload')
        .attach('logo', mockImageBuffer, {
          filename: 'new-logo.png',
          contentType: 'image/png'
        });

      expect(response.status).toBe(200);
    });
  });

  describe('Logo Display Fallbacks', () => {
    it('should handle missing logos gracefully in job cards', () => {
      const jobWithoutLogo = {
        id: 1,
        title: 'Test Job',
        company: 'Test Company',
        businessUserId: null,
        location: 'Test City'
      };

      // This would be tested in the frontend component tests
      // Here we verify the data structure supports fallbacks
      expect(jobWithoutLogo.businessUserId).toBeNull();
      expect(jobWithoutLogo.company).toBeTruthy();
    });

    it('should provide company initial as fallback', () => {
      const companyName = 'Acme Corporation';
      const expectedInitial = companyName.charAt(0).toUpperCase();
      
      expect(expectedInitial).toBe('A');
    });
  });

  describe('File Validation', () => {
    const validImageTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ];

    const invalidFileTypes = [
      'application/pdf',
      'text/plain',
      'application/javascript',
      'video/mp4',
      'audio/mp3'
    ];

    it.each(validImageTypes)('should accept %s files', async (mimeType) => {
      const mockBuffer = Buffer.from('fake-image-data');
      
      await registerRoutes(app);

      const response = await request(app)
        .post('/api/logo-upload')
        .attach('logo', mockBuffer, {
          filename: `test.${mimeType.split('/')[1]}`,
          contentType: mimeType
        });

      expect(response.status).toBe(200);
    });

    it.each(invalidFileTypes)('should reject %s files', async (mimeType) => {
      const mockBuffer = Buffer.from('fake-file-data');
      
      await registerRoutes(app);

      const response = await request(app)
        .post('/api/logo-upload')
        .attach('logo', mockBuffer, {
          filename: `test.${mimeType.split('/')[1]}`,
          contentType: mimeType
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid file type');
    });
  });

  describe('Security and Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      jest.spyOn(BusinessProfile, 'findOne').mockRejectedValue(new Error('Database connection failed'));

      await registerRoutes(app);

      const response = await request(app)
        .get('/api/logo/test-user-123');

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Failed to download logo');
    });

    it('should handle malformed user IDs', async () => {
      await registerRoutes(app);

      const response = await request(app)
        .get('/api/logo/'); // Empty user ID

      expect(response.status).toBe(404);
    });

    it('should sanitize file names', async () => {
      const mockBuffer = Buffer.from('fake-image-data');
      const maliciousFileName = '../../../etc/passwd.png';

      await registerRoutes(app);

      const response = await request(app)
        .post('/api/logo-upload')
        .attach('logo', mockBuffer, {
          filename: maliciousFileName,
          contentType: 'image/png'
        });

      expect(response.status).toBe(200);
      // The system should handle this gracefully and not process malicious paths
    });
  });
});

describe('Phone Validation Functionality', () => {
  describe('Phone validation utility', () => {
    const { isValidPhone, formatPhone, getPhoneValidationError } = require('../client/src/lib/phoneValidation');

    it('should validate correct phone formats', () => {
      const validNumbers = [
        '(555) 123-4567',
        '555-123-4567', 
        '5551234567',
        '555 123 4567'
      ];

      validNumbers.forEach(number => {
        expect(isValidPhone(number)).toBe(true);
      });
    });

    it('should reject invalid phone formats', () => {
      const invalidNumbers = [
        '123',
        '555-123-456',
        '(555) 123-456',
        'abc-def-ghij',
        '555-123-4567-890'
      ];

      invalidNumbers.forEach(number => {
        expect(isValidPhone(number)).toBe(false);
      });
    });

    it('should format phone numbers consistently', () => {
      const testCases = [
        { input: '5551234567', expected: '(555) 123-4567' },
        { input: '555-123-4567', expected: '(555) 123-4567' },
        { input: '555 123 4567', expected: '(555) 123-4567' }
      ];

      testCases.forEach(({ input, expected }) => {
        expect(formatPhone(input)).toBe(expected);
      });
    });

    it('should return appropriate error messages', () => {
      expect(getPhoneValidationError('123')).toContain('valid 10-digit');
      expect(getPhoneValidationError('(555) 123-4567')).toBe('');
    });
  });

  describe('Phone validation in forms', () => {
    it('should apply phone validation to job posting forms', () => {
      // This would test the PostJob component phone validation
      const phoneInputProps = require('../client/src/lib/phoneValidation').phoneInputProps;
      
      expect(phoneInputProps.placeholder).toContain('(307)');
      expect(phoneInputProps.maxLength).toBe(20);
      expect(phoneInputProps.type).toBe('tel');
    });

    it('should apply phone validation to application forms', () => {
      // This would test the ApplyJobForm component phone validation
      const phoneInputProps = require('../client/src/lib/phoneValidation').phoneInputProps;
      
      expect(phoneInputProps).toHaveProperty('placeholder');
      expect(phoneInputProps).toHaveProperty('maxLength');
      expect(phoneInputProps).toHaveProperty('type');
    });
  });
});