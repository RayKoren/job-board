import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isBusinessUser, isJobSeeker } from "./replitAuth";
import { z } from "zod";
import { insertBusinessProfileSchema, insertJobSeekerProfileSchema, insertJobPostingSchema, insertJobApplicationSchema } from "@shared/schema";
import { initDatabase } from "./db";
import { createPaymentIntent, calculateJobPostingPrice, retrievePaymentIntent } from "./services/stripe";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize database
  await initDatabase();
  
  // Set up authentication
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Fetch additional profile data based on user role
      let profileData = null;
      if (user?.role === 'business') {
        profileData = await storage.getBusinessProfile(userId);
      } else if (user?.role === 'job_seeker') {
        profileData = await storage.getJobSeekerProfile(userId);
      }
      
      res.json({ user, profile: profileData });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  // Check if user needs role selection
  app.get('/api/auth/check-role', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !user.role) {
        return res.json({ needsRoleSelection: true });
      }
      
      res.json({ 
        needsRoleSelection: false,
        role: user.role,
        dashboardUrl: user.role === 'business' ? '/business/dashboard' : '/jobseeker/dashboard'
      });
    } catch (error) {
      console.error("Error checking user role:", error);
      res.status(500).json({ message: "Failed to check user role" });
    }
  });
  
  // Role selection
  app.get('/api/auth/select-role/:role', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { role } = req.params;
      
      // Validate role
      if (role !== 'business' && role !== 'job_seeker') {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      // Update user role
      const updatedUser = await storage.upsertUser({
        id: userId,
        role: role as any,
      });
      
      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });
  
  // Business profile routes
  app.post('/api/business/profile', isBusinessUser, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate profile data
      const profileData = insertBusinessProfileSchema.parse({
        ...req.body,
        userId,
      });
      
      const profile = await storage.upsertBusinessProfile(profileData);
      res.json(profile);
    } catch (error) {
      console.error("Error creating business profile:", error);
      res.status(400).json({ message: "Invalid profile data", error });
    }
  });
  
  app.get('/api/business/profile', isBusinessUser, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getBusinessProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Error fetching business profile:", error);
      res.status(500).json({ message: "Failed to fetch business profile" });
    }
  });
  
  // Job seeker profile routes
  app.post('/api/job-seeker/profile', isJobSeeker, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate profile data
      const profileData = insertJobSeekerProfileSchema.parse({
        ...req.body,
        userId,
      });
      
      const profile = await storage.upsertJobSeekerProfile(profileData);
      res.json(profile);
    } catch (error) {
      console.error("Error creating job seeker profile:", error);
      res.status(400).json({ message: "Invalid profile data", error });
    }
  });
  
  app.get('/api/job-seeker/profile', isJobSeeker, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getJobSeekerProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Error fetching job seeker profile:", error);
      res.status(500).json({ message: "Failed to fetch job seeker profile" });
    }
  });
  
  // Job posting routes
  app.post('/api/jobs', isBusinessUser, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate job posting data
      const jobData = insertJobPostingSchema.parse({
        ...req.body,
        businessUserId: userId,
      });
      
      const job = await storage.createJobPosting(jobData);
      res.status(201).json(job);
    } catch (error) {
      console.error("Error creating job posting:", error);
      res.status(400).json({ message: "Invalid job posting data", error });
    }
  });
  
  // Get all job postings (public)
  app.get('/api/jobs', async (req, res) => {
    try {
      const { featured, limit, offset } = req.query;
      
      const options: any = {};
      if (featured !== undefined) {
        options.featured = featured === 'true';
      }
      if (limit) {
        options.limit = parseInt(limit as string);
      }
      if (offset) {
        options.offset = parseInt(offset as string);
      }
      
      const jobs = await storage.getJobPostings(options);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching job postings:", error);
      res.status(500).json({ message: "Failed to fetch job postings" });
    }
  });
  
  // Get business job postings
  app.get('/api/business/jobs', isBusinessUser, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const jobs = await storage.getJobPostings({ businessUserId: userId });
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching business job postings:", error);
      res.status(500).json({ message: "Failed to fetch business job postings" });
    }
  });
  
  // Get single job posting (public)
  app.get('/api/jobs/:id', async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const job = await storage.getJobPosting(jobId);
      
      if (!job) {
        return res.status(404).json({ message: "Job posting not found" });
      }
      
      res.json(job);
    } catch (error) {
      console.error("Error fetching job posting:", error);
      res.status(500).json({ message: "Failed to fetch job posting" });
    }
  });
  
  // Update job posting
  app.put('/api/jobs/:id', isBusinessUser, async (req: any, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Verify job belongs to this business
      const job = await storage.getJobPosting(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job posting not found" });
      }
      
      if (job.businessUserId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this job posting" });
      }
      
      // Update job
      const updatedJob = await storage.updateJobPosting(jobId, req.body);
      res.json(updatedJob);
    } catch (error) {
      console.error("Error updating job posting:", error);
      res.status(400).json({ message: "Invalid job posting data", error });
    }
  });
  
  // Delete job posting
  app.delete('/api/jobs/:id', isBusinessUser, async (req: any, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Verify job belongs to this business
      const job = await storage.getJobPosting(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job posting not found" });
      }
      
      if (job.businessUserId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this job posting" });
      }
      
      // Delete job
      await storage.deleteJobPosting(jobId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting job posting:", error);
      res.status(500).json({ message: "Failed to delete job posting" });
    }
  });
  
  // Job application routes
  app.post('/api/jobs/:jobId/apply', isAuthenticated, async (req: any, res) => {
    try {
      const jobId = parseInt(req.params.jobId);
      const userId = req.user.claims.sub;
      
      // Verify job exists
      const job = await storage.getJobPosting(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job posting not found" });
      }
      
      // Create application
      const applicationData = insertJobApplicationSchema.parse({
        ...req.body,
        jobId,
        userId,
      });
      
      const application = await storage.createJobApplication(applicationData);
      res.status(201).json(application);
    } catch (error) {
      console.error("Error creating job application:", error);
      res.status(400).json({ message: "Invalid application data", error });
    }
  });
  
  // Get job applications for a job posting (business only)
  app.get('/api/jobs/:id/applications', isBusinessUser, async (req: any, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Verify job belongs to this business
      const job = await storage.getJobPosting(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job posting not found" });
      }
      
      if (job.businessUserId !== userId) {
        return res.status(403).json({ message: "Not authorized to view applications for this job" });
      }
      
      // Get applications
      const applications = await storage.getJobApplicationsForJob(jobId);
      res.json(applications);
    } catch (error) {
      console.error("Error fetching job applications:", error);
      res.status(500).json({ message: "Failed to fetch job applications" });
    }
  });
  
  // Update job application status (business only)
  app.put('/api/applications/:id/status', isBusinessUser, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const { status } = req.body;
      const userId = req.user.claims.sub;
      
      // Validate status
      if (!['pending', 'reviewed', 'contacted', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      // Get application to verify ownership
      const application = await storage.getJobApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // Get job to verify business ownership
      const job = await storage.getJobPosting(application.jobId);
      if (!job || job.businessUserId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this application" });
      }
      
      // Update status
      const updatedApplication = await storage.updateJobApplicationStatus(applicationId, status);
      res.json(updatedApplication);
    } catch (error) {
      console.error("Error updating application status:", error);
      res.status(500).json({ message: "Failed to update application status" });
    }
  });
  
  // Get user's job applications (job seeker only)
  app.get('/api/my-applications', isJobSeeker, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const applications = await storage.getJobApplicationsForUser(userId);
      res.json(applications);
    } catch (error) {
      console.error("Error fetching user applications:", error);
      res.status(500).json({ message: "Failed to fetch user applications" });
    }
  });
  
  // Payment endpoints
  app.post('/api/create-payment-intent', isAuthenticated, isBusinessUser, async (req: any, res) => {
    try {
      const { planTier, addons } = req.body;
      
      if (!planTier) {
        return res.status(400).json({ error: 'Plan tier is required' });
      }
      
      // Calculate the total amount based on the plan tier and any addons
      const amount = calculateJobPostingPrice(planTier, addons || []);
      
      // Free tier doesn't need payment processing
      if (amount === 0) {
        return res.json({ 
          clientSecret: null,
          amount: 0,
          free: true
        });
      }
      
      // Create a payment intent with Stripe
      const paymentData = await createPaymentIntent({ 
        amount,
        metadata: { 
          userId: req.user.claims.sub,
          planTier,
          addons: addons ? JSON.stringify(addons) : '[]'
        }
      });
      
      res.json({
        clientSecret: paymentData.clientSecret,
        amount,
        free: false
      });
    } catch (error: any) {
      console.error('Payment intent creation error:', error);
      res.status(500).json({ 
        error: 'Failed to create payment intent',
        message: error.message 
      });
    }
  });
  
  // Get pricing information for plans and addons
  app.get('/api/pricing', async (req, res) => {
    try {
      // Pricing information for all plan tiers
      const plans = {
        basic: {
          name: 'Basic',
          price: getPriceForPlan('basic'),
          features: [
            'Single job posting',
            'Basic listing visibility',
            'Available for 30 days',
            'Standard search placement'
          ]
        },
        standard: {
          name: 'Standard',
          price: getPriceForPlan('standard'),
          features: [
            'Enhanced job listing',
            'Better search visibility',
            'Available for 30 days',
            'Company logo display',
            'Email support'
          ]
        },
        featured: {
          name: 'Featured',
          price: getPriceForPlan('featured'),
          features: [
            'Premium job listing',
            'Top search placement',
            'Available for 45 days',
            'Featured on homepage',
            'Company profile highlight',
            'Priority email support'
          ]
        },
        unlimited: {
          name: 'Unlimited',
          price: getPriceForPlan('unlimited'),
          features: [
            'Up to 10 active job listings',
            'Highest search visibility',
            'Available for 60 days',
            'Featured on homepage',
            'Dedicated company profile page',
            'Priority support',
            'Applicant tracking'
          ]
        }
      };
      
      // Pricing information for addons
      const addons = {
        boost: {
          name: 'Visibility Boost',
          price: getPriceForAddon('boost'),
          description: 'Boosted search placement for 7 days'
        },
        highlight: {
          name: 'Listing Highlight',
          price: getPriceForAddon('highlight'),
          description: 'Highlight your listing with a colored border'
        },
        urgent: {
          name: 'Urgent Hiring',
          price: getPriceForAddon('urgent'),
          description: 'Mark as "Urgent Hiring" with special badge'
        },
        extended: {
          name: 'Extended Duration',
          price: getPriceForAddon('extended'),
          description: 'Extend listing duration by 30 days'
        }
      };
      
      res.json({ plans, addons });
    } catch (error: any) {
      console.error('Error fetching pricing information:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve pricing information',
        message: error.message 
      });
    }
  });
  
  // Verify a payment was successful
  app.get('/api/verify-payment/:paymentIntentId', isAuthenticated, async (req, res) => {
    try {
      const { paymentIntentId } = req.params;
      
      if (!paymentIntentId) {
        return res.status(400).json({ error: 'Payment intent ID is required' });
      }
      
      const paymentIntent = await retrievePaymentIntent(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded') {
        return res.json({ 
          success: true,
          status: paymentIntent.status
        });
      } else {
        return res.json({ 
          success: false,
          status: paymentIntent.status
        });
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      res.status(500).json({ 
        error: 'Failed to verify payment',
        message: error.message 
      });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
