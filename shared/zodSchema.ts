import { z } from "zod";

// User role enum
export const userRoleEnum = z.enum(['business', 'job_seeker']);

// User schema
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  profileImageUrl: z.string().nullable(),
  role: userRoleEnum.nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const insertUserSchema = userSchema.omit({ createdAt: true, updatedAt: true });

// Business profile schema
export const businessProfileSchema = z.object({
  id: z.number().optional(),
  userId: z.string(),
  companyName: z.string(),
  companySize: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  contactEmail: z.string().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const insertBusinessProfileSchema = businessProfileSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

// Job seeker profile schema
export const jobSeekerProfileSchema = z.object({
  id: z.number().optional(),
  userId: z.string(),
  title: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  skills: z.array(z.string()).nullable().optional(),
  experience: z.any().nullable().optional(),
  education: z.any().nullable().optional(),
  location: z.string().nullable().optional(),
  contactEmail: z.string().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  resumeUrl: z.string().nullable().optional(),
  availableForWork: z.boolean().optional(),
  preferredJobTypes: z.array(z.string()).nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const insertJobSeekerProfileSchema = jobSeekerProfileSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

// Job posting schema
export const jobPostingSchema = z.object({
  id: z.number().optional(),
  businessUserId: z.string(),
  title: z.string(),
  company: z.string(),
  location: z.string(),
  type: z.string(),
  description: z.string(),
  requirements: z.string(),
  benefits: z.string().nullable().optional(),
  compensationType: z.string(),
  salaryRange: z.string().nullable().optional(),
  hourlyRate: z.string().nullable().optional(),
  contactEmail: z.string().nullable().optional(),
  applicationUrl: z.string().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  status: z.string().optional().default('active'),
  plan: z.string(),
  addons: z.array(z.string()).optional().default([]),
  featured: z.boolean().optional().default(false),
  expiresAt: z.date().nullable().optional(),
  tags: z.array(z.string()).optional().default([]),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const insertJobPostingSchema = jobPostingSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

// Job application schema
export const jobApplicationSchema = z.object({
  id: z.number().optional(),
  jobId: z.number(),
  userId: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().nullable().optional(),
  coverLetter: z.string().nullable().optional(),
  resume: z.string().nullable().optional(),
  status: z.string().optional().default('pending'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const insertJobApplicationSchema = jobApplicationSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

// Type definitions
export type User = z.infer<typeof userSchema>;
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type BusinessProfile = z.infer<typeof businessProfileSchema>;
export type UpsertBusinessProfile = z.infer<typeof insertBusinessProfileSchema>;
export type JobSeekerProfile = z.infer<typeof jobSeekerProfileSchema>;
export type UpsertJobSeekerProfile = z.infer<typeof insertJobSeekerProfileSchema>;
export type JobPosting = z.infer<typeof jobPostingSchema>;
export type UpsertJobPosting = z.infer<typeof insertJobPostingSchema>;
export type JobApplication = z.infer<typeof jobApplicationSchema>;
export type UpsertJobApplication = z.infer<typeof insertJobApplicationSchema>;