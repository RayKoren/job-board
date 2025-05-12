import { eq, and } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  businessProfiles,
  jobSeekerProfiles,
  jobPostings,
  jobApplications,
  type User,
  type UpsertUser,
  type BusinessProfile,
  type UpsertBusinessProfile,
  type JobSeekerProfile, 
  type UpsertJobSeekerProfile,
  type JobPosting,
  type UpsertJobPosting,
  type JobApplication,
  type UpsertJobApplication
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Business profile operations
  getBusinessProfile(userId: string): Promise<BusinessProfile | undefined>;
  upsertBusinessProfile(profile: UpsertBusinessProfile): Promise<BusinessProfile>;
  
  // Job seeker profile operations
  getJobSeekerProfile(userId: string): Promise<JobSeekerProfile | undefined>;
  upsertJobSeekerProfile(profile: UpsertJobSeekerProfile): Promise<JobSeekerProfile>;
  
  // Job posting operations
  getJobPosting(id: number): Promise<JobPosting | undefined>;
  getJobPostings(options?: { 
    businessUserId?: string;
    featured?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<JobPosting[]>;
  createJobPosting(posting: UpsertJobPosting): Promise<JobPosting>;
  updateJobPosting(id: number, posting: Partial<UpsertJobPosting>): Promise<JobPosting>;
  deleteJobPosting(id: number): Promise<void>;
  
  // Job application operations
  getJobApplication(id: number): Promise<JobApplication | undefined>;
  getJobApplicationsForJob(jobId: number): Promise<JobApplication[]>;
  getJobApplicationsForUser(userId: string): Promise<JobApplication[]>;
  createJobApplication(application: UpsertJobApplication): Promise<JobApplication>;
  updateJobApplicationStatus(id: number, status: string): Promise<JobApplication>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }
  
  // Business profile operations
  async getBusinessProfile(userId: string): Promise<BusinessProfile | undefined> {
    const [profile] = await db.select().from(businessProfiles).where(eq(businessProfiles.userId, userId));
    return profile;
  }
  
  async upsertBusinessProfile(profileData: UpsertBusinessProfile): Promise<BusinessProfile> {
    const [profile] = await db
      .insert(businessProfiles)
      .values(profileData)
      .onConflictDoUpdate({
        target: [businessProfiles.userId],
        set: {
          ...profileData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return profile;
  }
  
  // Job seeker profile operations
  async getJobSeekerProfile(userId: string): Promise<JobSeekerProfile | undefined> {
    const [profile] = await db.select().from(jobSeekerProfiles).where(eq(jobSeekerProfiles.userId, userId));
    return profile;
  }
  
  async upsertJobSeekerProfile(profileData: UpsertJobSeekerProfile): Promise<JobSeekerProfile> {
    const [profile] = await db
      .insert(jobSeekerProfiles)
      .values(profileData)
      .onConflictDoUpdate({
        target: [jobSeekerProfiles.userId],
        set: {
          ...profileData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return profile;
  }
  
  // Job posting operations
  async getJobPosting(id: number): Promise<JobPosting | undefined> {
    const [posting] = await db.select().from(jobPostings).where(eq(jobPostings.id, id));
    return posting;
  }
  
  async getJobPostings(options: { 
    businessUserId?: string;
    featured?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<JobPosting[]> {
    let query = db.select().from(jobPostings);
    
    // Apply filters
    if (options.businessUserId) {
      query = query.where(eq(jobPostings.businessUserId, options.businessUserId));
    }
    
    if (options.featured !== undefined) {
      query = query.where(eq(jobPostings.featured, options.featured));
    }
    
    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    if (options.offset) {
      query = query.offset(options.offset);
    }
    
    return await query;
  }
  
  async createJobPosting(postingData: UpsertJobPosting): Promise<JobPosting> {
    const [posting] = await db
      .insert(jobPostings)
      .values(postingData)
      .returning();
    return posting;
  }
  
  async updateJobPosting(id: number, postingData: Partial<UpsertJobPosting>): Promise<JobPosting> {
    const [posting] = await db
      .update(jobPostings)
      .set(postingData)
      .where(eq(jobPostings.id, id))
      .returning();
    return posting;
  }
  
  async deleteJobPosting(id: number): Promise<void> {
    await db.delete(jobPostings).where(eq(jobPostings.id, id));
  }
  
  // Job application operations
  async getJobApplication(id: number): Promise<JobApplication | undefined> {
    const [application] = await db.select().from(jobApplications).where(eq(jobApplications.id, id));
    return application;
  }
  
  async getJobApplicationsForJob(jobId: number): Promise<JobApplication[]> {
    return await db.select().from(jobApplications).where(eq(jobApplications.jobId, jobId));
  }
  
  async getJobApplicationsForUser(userId: string): Promise<JobApplication[]> {
    return await db.select().from(jobApplications).where(eq(jobApplications.userId, userId));
  }
  
  async createJobApplication(applicationData: UpsertJobApplication): Promise<JobApplication> {
    const [application] = await db
      .insert(jobApplications)
      .values(applicationData)
      .returning();
    return application;
  }
  
  async updateJobApplicationStatus(id: number, status: string): Promise<JobApplication> {
    const [application] = await db
      .update(jobApplications)
      .set({ status })
      .where(eq(jobApplications.id, id))
      .returning();
    return application;
  }
}

export const storage = new DatabaseStorage();
