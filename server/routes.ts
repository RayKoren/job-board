import express, { type Express, type Request, type Response } from "express";
import { createServer, type Server } from "http";
import { storage, IJobPosting } from "./storage";
import { setupAuth, isAuthenticated, isBusinessUser, isJobSeeker } from "./passwordAuth"; // Using password-based authentication
import { z } from "zod";
import { initDatabase, sequelize } from "./db";
import { QueryTypes } from "sequelize";
import path from "path";
import fs from "fs";
import multer from "multer";
import { getPriceForPlan, getPriceForAddon, calculateJobPostingPrice } from "./services/pricing";
import { insertBusinessProfileSchema, insertJobSeekerProfileSchema, insertJobPostingSchema, insertJobApplicationSchema } from "@shared/zodSchema";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./services/paypal";
import { emailService } from "./services/emailService";

// Helper function to create an object with dynamic fields
function createJobData(baseData: any, extraFields: Record<string, any> = {}): any {
  return { ...baseData, ...extraFields };
}

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
      const jobData = insertJobPostingSchema.parse(
        createJobData({
          ...req.body,
          businessUserId: userId,
        })
      );
      
      // Calculate the expiry date based on the chosen plan
      if (!jobData.expiresAt && jobData.plan) {
        try {
          const { db } = await import('./db');
          const { products } = await import('../shared/schema');
          const { eq, and } = await import('drizzle-orm');
          
          // Look up the plan to determine the listing duration
          const [planProduct] = await db.select()
            .from(products)
            .where(
              and(
                eq(products.code, jobData.plan),
                eq(products.type, 'plan'),
                eq(products.active, true)
              )
            );
            
          if (planProduct) {
            let durationInDays = 15; // Default duration (for Basic plan)
            
            // Determine duration from plan code or description
            switch (planProduct.code) {
              case 'basic':
                durationInDays = 15;
                break;
              case 'standard':
                durationInDays = 30;
                break;
              case 'featured':
                durationInDays = 30;
                break;
              case 'unlimited':
                durationInDays = 90;
                break;
              default:
                // Try to extract duration from description if available
                if (planProduct.description) {
                  const durationMatch = planProduct.description.match(/(\d+)[- ]day/i);
                  if (durationMatch && durationMatch[1]) {
                    durationInDays = parseInt(durationMatch[1], 10);
                  }
                }
            }
            
            // Calculate the expiry date
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + durationInDays);
            
            // Check if job has the "extend-post" add-on and add additional days
            if (jobData.addons && jobData.addons.includes('extend-post')) {
              const extensionDays = 7; // Each extend-post adds 7 days
              expiresAt.setDate(expiresAt.getDate() + extensionDays);
              console.log(`Adding ${extensionDays} days to expiry date due to "extend-post" add-on`);
            }
            
            // Add it to the job data
            jobData.expiresAt = expiresAt;
            jobData.status = 'active'; // Ensure the job is marked as active
            
            // Use the helper function to set dynamic fields
            Object.assign(jobData, { planCode: jobData.plan });
            
            console.log(`Setting job expiry date to ${expiresAt.toISOString()} (${durationInDays} days from now)`);
          }
        } catch (error) {
          console.error('Error determining job expiry date:', error);
        }
      }
      
      // Create the job posting with the calculated expiry date
      const job = await storage.createJobPosting(jobData);
      
      // Now create relationships for plan and add-ons in the database
      try {
        const { db } = await import('./db');
        const { products, jobPostingAddons } = await import('../shared/schema');
        const { eq, and } = await import('drizzle-orm');
        
        console.log('Creating database relationships for job posting:', {
          jobId: job.id,
          plan: jobData.plan,
          expiresAt: jobData.expiresAt,
          addons: jobData.addons
        });
        
        // 1. Use the plan field (which is the plan tier) to look up the corresponding product ID
        if (jobData.plan) {
          // Use plan as the product code/tier
          const [planProduct] = await db.select()
            .from(products)
            .where(
              and(
                eq(products.code, jobData.plan),
                eq(products.type, 'plan')
              )
            );
            
          if (planProduct && planProduct.id !== undefined && job.id !== undefined) {
            // Update the job with the planCode field - we can't set planId directly through the storage interface
            const jobUpdate: Partial<IJobPosting> = {
              planCode: jobData.plan, // Set planCode to match plan for compatibility
              planId: planProduct.id  // Set the plan ID reference
            };
            
            // Update at database level for planId
            try {
              await sequelize.query(
                `UPDATE "JobPostings" SET "planId" = :planId WHERE "id" = :jobId`,
                {
                  replacements: {
                    planId: planProduct.id,
                    jobId: job.id
                  },
                  type: QueryTypes.UPDATE
                }
              );
              console.log(`Updated job ${job.id} with plan product ID ${planProduct.id} (${jobData.plan})`);
            } catch (updateError) {
              console.error('Error updating planId:', updateError);
            }
            
            // Update other fields through the storage interface
            await storage.updateJobPosting(job.id, jobUpdate);
          }
        }
        
        // 2. If we have add-ons, create the relationship records
        if (jobData.addons && jobData.addons.length > 0) {
          // Get all add-on products
          const addonProducts = await db.select()
            .from(products)
            .where(
              and(
                eq(products.type, 'addon'),
                eq(products.active, true)
              )
            );
            
          // Map add-on codes to add-on products
          const addonMap = new Map<string, any>(addonProducts.map(addon => [addon.code, addon]));
          
          // For each add-on code in the job, create a relationship to its product
          for (const addonCode of jobData.addons) {
            // Handle aliases (like social-boost -> social-media-promotion)
            let lookupCode = addonCode;
            if (addonCode === 'social-boost') lookupCode = 'social-media-promotion';
            if (addonCode === 'highlight') lookupCode = 'highlighted';
            
            const addonProduct = addonMap.get(lookupCode);
            if (addonProduct && addonProduct.id && job.id) {
              // Create relationship in the junction table
              try {
                // Use raw SQL query with sequelize to ensure proper validation and compatibility
                await sequelize.query(
                  `INSERT INTO "job_posting_addons" ("job_id", "product_id") 
                   VALUES (:jobId, :productId)
                   ON CONFLICT DO NOTHING`,
                  {
                    replacements: {
                      jobId: job.id,
                      productId: addonProduct.id
                    },
                    type: QueryTypes.INSERT
                  }
                );
                console.log(`Added add-on ${lookupCode} (ID: ${addonProduct.id}) to job ${job.id}`);
              } catch (insertError) {
                console.error(`Error inserting add-on relationship: ${insertError}`);
              }
            } else {
              console.warn(`Add-on product with code ${lookupCode} not found or job ID missing`);
            }
          }
        }
      } catch (dbError) {
        // We'll still return success even if the DB relationships fail
        // This ensures backward compatibility
        console.error("Error linking job posting to products:", dbError);
      }
      
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
  
  // Get specific business job
  app.get('/api/business/jobs/:id', isBusinessUser, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const jobId = parseInt(req.params.id);
      
      if (isNaN(jobId)) {
        return res.status(400).json({ message: 'Invalid job ID' });
      }
      
      const job = await storage.getJobPosting(jobId);
      
      if (!job) {
        return res.status(404).json({ message: 'Job posting not found' });
      }
      
      // Ensure the job belongs to the requesting business
      if (job.businessUserId !== userId) {
        return res.status(403).json({ message: 'You do not have permission to view this job posting' });
      }
      
      return res.status(200).json(job);
    } catch (error) {
      console.error('Error fetching job posting:', error);
      return res.status(500).json({ message: 'Failed to fetch job posting' });
    }
  });
  
  // Update specific business job
  app.put('/api/business/jobs/:id', isBusinessUser, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const jobId = parseInt(req.params.id);
      
      if (isNaN(jobId)) {
        return res.status(400).json({ message: 'Invalid job ID' });
      }
      
      const job = await storage.getJobPosting(jobId);
      
      if (!job) {
        return res.status(404).json({ message: 'Job posting not found' });
      }
      
      // Ensure the job belongs to the requesting business
      if (job.businessUserId !== userId) {
        return res.status(403).json({ message: 'You do not have permission to edit this job posting' });
      }
      
      // Don't allow changing certain fields
      const { 
        plan, planId, planCode, addons, featured, 
        expiresAt, status, businessUserId, ...updateData 
      } = req.body;
      
      // Update the job posting
      const updatedJob = await storage.updateJobPosting(jobId, updateData);
      
      return res.status(200).json(updatedJob);
    } catch (error) {
      console.error('Error updating job posting:', error);
      return res.status(500).json({ message: 'Failed to update job posting' });
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
      const existingJob = await storage.getJobPosting(jobId);
      if (!existingJob) {
        return res.status(404).json({ message: "Job posting not found" });
      }
      
      if (existingJob.businessUserId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this job posting" });
      }
      
      // Create an update object
      const jobUpdateData = createJobData(req.body);
      
      // If the plan was changed, recalculate the expiry date
      if (jobUpdateData.plan && jobUpdateData.plan !== existingJob.plan) {
        try {
          const { db } = await import('./db');
          const { products } = await import('../shared/schema');
          const { eq, and } = await import('drizzle-orm');
          
          // Look up the plan to determine the listing duration
          const [planProduct] = await db.select()
            .from(products)
            .where(
              and(
                eq(products.code, jobUpdateData.plan),
                eq(products.type, 'plan'),
                eq(products.active, true)
              )
            );
            
          if (planProduct) {
            let durationInDays = 15; // Default duration (for Basic plan)
            
            // Determine duration from plan code or description
            switch (planProduct.code) {
              case 'basic':
                durationInDays = 15;
                break;
              case 'standard':
                durationInDays = 30;
                break;
              case 'featured':
                durationInDays = 30;
                break;
              case 'unlimited':
                durationInDays = 90;
                break;
              default:
                // Try to extract duration from description if available
                if (planProduct.description) {
                  const durationMatch = planProduct.description.match(/(\d+)[- ]day/i);
                  if (durationMatch && durationMatch[1]) {
                    durationInDays = parseInt(durationMatch[1], 10);
                  }
                }
            }
            
            // Calculate the new expiry date from today
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + durationInDays);
            
            // Add it to the update data
            jobUpdateData.expiresAt = expiresAt;
            jobUpdateData.status = 'active'; // Ensure the job is marked as active
            
            // Set planCode to match plan
            jobUpdateData.planCode = jobUpdateData.plan;
            
            console.log(`Updating job plan to ${jobUpdateData.plan}: Setting new expiry date to ${expiresAt.toISOString()} (${durationInDays} days from now)`);
            
            // Look up the plan ID for the database relationship
            if (planProduct.id) {
              // Use raw query to update the plan ID directly for better compatibility
              await sequelize.query(
                `UPDATE "JobPostings" SET "planId" = :planId WHERE "id" = :jobId`,
                {
                  replacements: {
                    planId: planProduct.id,
                    jobId: jobId
                  },
                  type: QueryTypes.UPDATE
                }
              );
              console.log(`Updated job ${jobId} with new plan product ID ${planProduct.id} (${jobUpdateData.plan})`);
            }
          }
        } catch (error) {
          console.error('Error recalculating job expiry date:', error);
        }
      }
      
      // Update job
      const updatedJob = await storage.updateJobPosting(jobId, jobUpdateData);
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
  // Route for the main Apply form
  app.post('/api/job-applications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const { jobId, ...rest } = req.body;
      
      // Verify job exists
      const job = await storage.getJobPosting(parseInt(jobId));
      if (!job) {
        return res.status(404).json({ message: "Job posting not found" });
      }
      
      // Create application with proper validation using the Zod schema
      const applicationData = insertJobApplicationSchema.parse({
        ...rest,
        jobId: parseInt(jobId),
        userId,
        status: "pending"
      });
      
      const application = await storage.createJobApplication(applicationData);
      
      // Send email notifications
      try {
        // Send confirmation email to applicant
        await emailService.sendApplicationSubmittedEmail({
          name: application.name,
          email: application.email,
          jobTitle: job.title,
          company: job.company
        });

        // Send notification to business owner
        const businessUser = await storage.getUser(job.businessUserId);
        if (businessUser && businessUser.email) {
          await emailService.sendNewApplicationNotificationEmail({
            businessEmail: businessUser.email,
            applicantName: application.name,
            jobTitle: job.title,
            company: job.company,
            applicationId: application.id || 0
          });
        }
      } catch (emailError) {
        console.error("Email notification error:", emailError);
        // Don't fail the application if email fails
      }
      
      res.status(201).json(application);
    } catch (error) {
      console.error("Error creating job application:", error);
      res.status(400).json({ message: "Invalid application data", error });
    }
  });

  // Legacy route - keep for backward compatibility
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
      
      // Get job seeker profiles for the applications
      const applicationsWithProfiles = await Promise.all(
        applications.map(async (application) => {
          const profile = await storage.getJobSeekerProfile(application.userId);
          return {
            ...application,
            profile: profile ? {
              id: profile.id,
              userId: profile.userId,
              title: profile.title,
              skills: profile.skills,
              resumeUrl: profile.resumeUrl,
              location: profile.location
            } : null
          };
        })
      );
      
      res.json(applicationsWithProfiles);
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
      
      // Get job details for each application
      const applicationsWithJobs = await Promise.all(
        applications.map(async (application) => {
          const job = await storage.getJobPosting(application.jobId);
          return {
            ...application,
            job: job ? {
              id: job.id,
              title: job.title,
              company: job.company,
              location: job.location,
              type: job.type
            } : null
          };
        })
      );
      
      res.json(applicationsWithJobs);
    } catch (error) {
      console.error("Error fetching user applications:", error);
      res.status(500).json({ message: "Failed to fetch user applications" });
    }
  });
  
  // Get all applications for business user's jobs
  app.get('/api/business/applications', isBusinessUser, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      
      // Get all jobs for this business
      const jobs = await storage.getJobPostings({ businessUserId: userId });
      
      // Get applications for each job
      const jobsWithApplications = await Promise.all(
        jobs.map(async (job) => {
          if (!job.id) return { ...job, applicationCount: 0, applications: [] };
          const applications = await storage.getJobApplicationsForJob(job.id);
          return {
            ...job,
            applicationCount: applications.length,
            applications: applications.map(app => ({
              id: app.id,
              name: app.name,
              email: app.email,
              status: app.status,
              appliedAt: app.createdAt
            }))
          };
        })
      );
      
      res.json(jobsWithApplications);
    } catch (error) {
      console.error("Error fetching business applications:", error);
      res.status(500).json({ message: "Failed to fetch business applications" });
    }
  });

  // Update job application status (business only)
  app.patch('/api/applications/:id/status', isBusinessUser, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const { status } = req.body;
      const userId = req.session.user.id;

      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      // Get the application to verify ownership
      const application = await storage.getJobApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      // Get the job to verify business ownership
      const job = await storage.getJobPosting(application.jobId);
      if (!job || job.businessUserId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this application" });
      }

      // Update the application status
      const updatedApplication = await storage.updateJobApplicationStatus(applicationId, status);

      // Send email notification to applicant
      try {
        console.log("Sending status update email to:", application.email);
        await emailService.sendApplicationStatusUpdateEmail({
          name: application.name,
          email: application.email,
          jobTitle: job.title,
          company: job.company,
          status: status
        });
        console.log("Status update email sent successfully");
      } catch (emailError) {
        console.error("Email notification error:", emailError);
        // Don't fail the update if email fails
      }

      res.json(updatedApplication);
    } catch (error) {
      console.error("Error updating application status:", error);
      res.status(500).json({ message: "Failed to update application status" });
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
        if (typeof addon === 'string') {
          addonPrices[addon] = await getPriceForAddon(addon);
        }
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
        amount: String(Number(amount).toFixed(2)), // Format as string with exactly 2 decimal places
        currency: "USD",
        intent: "CAPTURE"
      };
      
      console.log('PayPal request payload:', JSON.stringify(paypalRequestBody, null, 2));
      
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
          paypalResponse.amount = String(Number(amount).toFixed(2));
          
          // Add information about plan and add-ons for reference with properly formatted values
          paypalResponse.planDetails = {
            planTier,
            addons: addonsList,
            priceDetails: {
              planPrice: Number(planPrice),
              addonPrices: Object.entries(addonPrices).reduce((acc: Record<string, number>, [key, value]) => {
                acc[key] = Number(value);
                return acc;
              }, {})
            }
          };
          
          console.log('PayPal response to client:', JSON.stringify(paypalResponse, null, 2));
          
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
      const { eq, and } = await import('drizzle-orm');
      
      // Get all active plans ordered by sortOrder
      const plansList = await db.select()
        .from(products)
        .where(
          and(
            eq(products.type, 'plan'),
            eq(products.active, true) // Only include active plans
          )
        )
        .orderBy(products.sortOrder);
        
      // Get all active add-ons ordered by sortOrder
      const addonsList = await db.select()
        .from(products)
        .where(
          and(
            eq(products.type, 'addon'),
            eq(products.active, true) // Only include active add-ons
          )
        )
        .orderBy(products.sortOrder);
      
      // Transform to expected format
      const plans: Record<string, any> = {};
      for (const plan of plansList) {
        plans[plan.code] = {
          name: plan.name,
          price: Number(plan.price),
          features: plan.features || [],
          active: plan.active, // Include active status
          duration: plan.description // Use description field for duration info
        };
      }
      
      const addons: Record<string, any> = {};
      for (const addon of addonsList) {
        addons[addon.code] = {
          name: addon.name,
          price: Number(addon.price),
          description: addon.description || '',
          active: addon.active // Include active status
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
  
  // No longer need to create uploads directory since we're storing in database
  
  // Endpoint to download resume from database by user ID
  app.get('/api/resume/:userId', async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      
      // Get the job seeker profile with resume data
      const profile = await storage.getJobSeekerProfile(userId);
      
      if (!profile || !profile.resumeData || !profile.resumeType || !profile.resumeName) {
        return res.status(404).json({ message: 'Resume not found' });
      }
      
      // Convert base64 data back to buffer
      const fileBuffer = Buffer.from(profile.resumeData, 'base64');
      
      // Set appropriate headers for file download
      res.setHeader('Content-Type', profile.resumeType);
      res.setHeader('Content-Disposition', `attachment; filename=${profile.resumeName}`);
      res.setHeader('Content-Length', fileBuffer.length);
      
      // Send the file data
      return res.send(fileBuffer);
    } catch (error) {
      console.error('Error downloading resume:', error);
      return res.status(500).json({ message: 'Failed to download resume' });
    }
  });
  
  // Resume upload route (protected) - storing directly in database
  app.post('/api/resume-upload', isJobSeeker, async (req: any, res: Response) => {
    try {
      // Handle single file upload in memory
      const bufferStorage = multer.memoryStorage();
      const upload = multer({
        storage: bufferStorage,
        limits: {
          fileSize: 5 * 1024 * 1024 // 5MB limit
        },
        fileFilter: (req, file, cb) => {
          // Accept only PDF and DOC/DOCX files
          const allowedMimeTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          ];
          
          if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
          } else {
            cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'));
          }
        }
      }).single('resume');

      upload(req, res, async (err) => {
        if (err) {
          return res.status(400).json({ message: 'Error uploading file: ' + err.message });
        }
        
        if (!req.file) {
          return res.status(400).json({ message: 'No file uploaded' });
        }

        const userId = req.session.user.id;
        
        try {
          // Convert buffer to base64 string for storage
          const resumeData = req.file.buffer.toString('base64');
          
          // Get the current job seeker profile
          const profile = await storage.getJobSeekerProfile(userId);
          
          if (profile) {
            console.log("Updating existing job seeker profile with resume data");
            // Update the profile with resume data
            await storage.upsertJobSeekerProfile({
              ...profile,
              resumeData: resumeData,
              resumeName: req.file.originalname,
              resumeType: req.file.mimetype
            });
          } else {
            console.log("Creating new job seeker profile with resume data");
            // Create a new profile with the resume data if none exists
            await storage.upsertJobSeekerProfile({
              userId: userId,
              resumeData: resumeData,
              resumeName: req.file.originalname,
              resumeType: req.file.mimetype
            });
          }
          
          // Return success response
          return res.status(200).json({
            message: 'File uploaded successfully',
            fileName: req.file.originalname,
            fileSize: req.file.size
          });
        } catch (dbError) {
          console.error('Error saving resume to database:', dbError);
          return res.status(500).json({ message: 'Failed to save resume to database' });
        }
      });
    } catch (error) {
      console.error('Error uploading resume:', error);
      return res.status(500).json({ message: 'Failed to upload resume' });
    }
  });
  
  // Track job application clicks
  app.post('/api/jobs/:id/track-click', async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      
      if (isNaN(jobId)) {
        return res.status(400).json({ message: 'Invalid job ID' });
      }
      
      // Update click count in the database
      try {
        await sequelize.query(
          `UPDATE "job_postings" 
           SET "clickCount" = COALESCE("clickCount", 0) + 1 
           WHERE "id" = :jobId`,
          {
            replacements: { jobId },
            type: QueryTypes.UPDATE
          }
        );
        
        return res.status(200).json({ success: true });
      } catch (dbError) {
        console.error('Error updating click count:', dbError);
        return res.status(500).json({ message: 'Failed to update click count' });
      }
    } catch (error) {
      console.error('Error tracking job click:', error);
      return res.status(500).json({ message: 'Failed to track job click' });
    }
  });
  
  // Contact form endpoint using Mailgun
  app.post('/api/contact', async (req, res) => {
    try {
      const contactSchema = z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Invalid email address"),
        subject: z.string().min(1, "Subject is required"),
        message: z.string().min(10, "Message must be at least 10 characters")
      });

      const contactData = contactSchema.parse(req.body);
      
      // Send contact email using Mailgun
      const emailSent = await emailService.sendContactEmail(contactData);
      
      if (emailSent) {
        res.status(200).json({ 
          message: "Thank you for your message! We'll get back to you soon.",
          success: true 
        });
      } else {
        // Even if email fails, we log the contact for follow-up
        res.status(200).json({ 
          message: "Thank you for your message! We've received it and will get back to you soon.",
          success: true 
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Please check your form data", 
          errors: error.errors 
        });
      }
      
      console.error("Contact form error:", error);
      res.status(500).json({ 
        message: "Sorry, there was an error sending your message. Please try again later.",
        success: false 
      });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
