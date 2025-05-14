import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isBusinessUser, isJobSeeker } from "./localAuth"; // Using local authentication temporarily
import { z } from "zod";
import { initDatabase } from "./db";
import { getPriceForPlan, getPriceForAddon, calculateJobPostingPrice } from "./services/pricing";
import { insertBusinessProfileSchema, insertJobSeekerProfileSchema, insertJobPostingSchema, insertJobApplicationSchema } from "@shared/zodSchema";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./services/paypal";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize database
  await initDatabase();
  
  // Set up authentication with Auth0
  await setupAuth(app);
  
  // Business profile routes
  app.post('/api/business/profile', isBusinessUser, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      
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
      const userId = req.session.user.id;
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
      const userId = req.session.user.id;
      
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
      const userId = req.session.user.id;
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
      const userId = req.session.user.id;
      
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
      const userId = req.session.user.id;
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
      const userId = req.session.user.id;
      
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
      const userId = req.session.user.id;
      
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
      const userId = req.session.user.id;
      
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
      const userId = req.session.user.id;
      
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
      const userId = req.session.user.id;
      
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
      const userId = req.session.user.id;
      const applications = await storage.getJobApplicationsForUser(userId);
      res.json(applications);
    } catch (error) {
      console.error("Error fetching user applications:", error);
      res.status(500).json({ message: "Failed to fetch user applications" });
    }
  });
  
  // PayPal payment endpoints
  app.get("/paypal/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  app.post("/paypal/order", isAuthenticated, isBusinessUser, async (req, res) => {
    try {
      // Extract job posting details from request
      const { planTier, addons = [] } = req.body;
      
      if (!planTier) {
        return res.status(400).json({ error: 'Plan tier is required' });
      }
      
      // Ensure addons is an array
      const addonsList = Array.isArray(addons) ? addons : [];
      
      // Get pricing service
      const { calculateJobPostingPrice, getPriceForPlan, getPriceForAddon, getPriceForPlanSync, getPriceForAddonSync } = await import('./services/pricing');
      
      // Calculate total price using our pricing service (async database version)
      const amount = await calculateJobPostingPrice(planTier, addonsList);
      
      // Get individual prices
      const planPrice = await getPriceForPlan(planTier);
      const addonPrices: Record<string, number> = {};
      for (const addon of addonsList) {
        addonPrices[addon] = await getPriceForAddon(addon);
      }
      
      // Log the pricing details with more information
      console.log(`Job Posting Price Calculation:
        Plan Tier: ${planTier} (${planPrice})
        Add-ons: ${JSON.stringify(addonsList)}
        Add-on Prices: ${await Promise.all(addonsList.map(async (addon: string) => {
          const price = await getPriceForAddon(addon);
          return `${addon}: $${price}${price === 0 ? ' (WARNING: $0 price)' : ''}`;
        })).then(prices => prices.join(', '))}
        Total Amount: $${amount}
      `);
      
      // Free tier doesn't need payment processing (only "basic" plan is free)
      if (planTier === 'basic' && Number(amount) === 0) {
        return res.json({ 
          freeProduct: true,
          amount: 0
        });
      }
      
      // Create a modified request body specifically for PayPal
      const paypalRequestBody = {
        amount: Number(amount).toFixed(2), // Format with exactly 2 decimal places
        currency: "USD",
        intent: "CAPTURE"
      };
      
      // Store the original body
      const originalBody = req.body;
      
      // Replace the request body with the PayPal-specific data
      req.body = paypalRequestBody;
      
      // Intercept the response
      const originalSend = res.send;
      res.send = function(body) {
        try {
          // Parse the PayPal response
          const paypalResponse = typeof body === 'string' ? JSON.parse(body) : body;
          
          // Add our calculated amount to the response with proper formatting
          paypalResponse.amount = Number(amount).toFixed(2);
          
          // Add information about plan and add-ons for reference
          paypalResponse.planDetails = {
            planTier,
            addons: addonsList,
            priceDetails: {
              planPrice: planPrice,
              addonPrices: addonPrices
            }
          };
          
          // Send the modified response
          return originalSend.call(this, JSON.stringify(paypalResponse));
        } catch (err) {
          console.error('Error modifying PayPal response:', err);
          return originalSend.call(this, body);
        }
      };
      
      // Create PayPal order
      await createPaypalOrder(req, res);
      
      // Restore the original response.send and request body
      res.send = originalSend;
      req.body = originalBody;
    } catch (error: any) {
      console.error('PayPal order creation error:', error);
      res.status(500).json({ 
        error: 'Failed to create PayPal order',
        message: error.message 
      });
    }
  });

  app.post("/paypal/order/:orderID/capture", isAuthenticated, isBusinessUser, async (req, res) => {
    await capturePaypalOrder(req, res);
  });
  
  // Get pricing information for plans and addons from database
  app.get('/api/pricing', async (req, res) => {
    try {
      const { db } = await import('./db');
      const { products } = await import('../shared/schema');
      const { eq } = await import('drizzle-orm');
      
      // Get all active plans ordered by sortOrder
      const plansList = await db.select()
        .from(products)
        .where(
          eq(products.type, 'plan')
        )
        .orderBy(products.sortOrder);
        
      // Get all active add-ons ordered by sortOrder
      const addonsList = await db.select()
        .from(products)
        .where(
          eq(products.type, 'addon')
        )
        .orderBy(products.sortOrder);
      
      // Transform to expected format
      const plans: Record<string, any> = {};
      for (const plan of plansList) {
        plans[plan.code] = {
          name: plan.name,
          price: Number(plan.price),
          features: plan.features || []
        };
      }
      
      const addons: Record<string, any> = {};
      for (const addon of addonsList) {
        addons[addon.code] = {
          name: addon.name,
          price: Number(addon.price),
          description: addon.description || ''
        };
      }
      
      res.json({ plans, addons });
    } catch (error: any) {
      console.error('Error fetching pricing information:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve pricing information',
        message: error.message 
      });
    }
  });
  
  // New PayPal verification endpoint will be added here
  
  const httpServer = createServer(app);
  return httpServer;
}
