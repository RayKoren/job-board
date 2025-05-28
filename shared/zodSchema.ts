import { z } from "zod";

// User role enum
export const userRoleEnum = z.enum(['business', 'job_seeker']);

// User schema
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  password: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  profileImageUrl: z.string().nullable(),
  role: userRoleEnum.nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Strong password validation
const strongPasswordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character");

// Phone number validation (US format)
const phoneSchema = z.string()
  .regex(/^\(\d{3}\) \d{3}-\d{4}$|^\d{3}-\d{3}-\d{4}$|^\d{10}$/, "Please enter a valid 10-digit phone number");

export const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: strongPasswordSchema,
  confirmPassword: z.string(),
  firstName: z.string().min(1, "First name is required").max(50, "First name too long"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name too long"),
  role: userRoleEnum,
  mailingListConsent: z.boolean().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: strongPasswordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
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

// Job seeker profile schema with proper validation
export const jobSeekerProfileSchema = z.object({
  id: z.number().optional(),
  userId: z.string(),
  title: z.string().max(100, "Title too long").nullable().optional(),
  bio: z.string().max(1000, "Bio too long").nullable().optional(),
  skills: z.array(z.string()).nullable().optional(),
  experience: z.any().nullable().optional(),
  education: z.any().nullable().optional(),
  location: z.string().max(100, "Location too long").nullable().optional(),
  contactEmail: z.string().email("Please enter a valid email address").nullable().optional(),
  contactPhone: z.string().refine((phone) => !phone || phoneSchema.safeParse(phone).success, {
    message: "Please enter a valid 10-digit phone number"
  }).nullable().optional(),
  phone: z.string().refine((phone) => !phone || phoneSchema.safeParse(phone).success, {
    message: "Please enter a valid 10-digit phone number"
  }).nullable().optional(),
  // Database stored resume fields
  resumeData: z.string().nullable().optional(),
  resumeName: z.string().nullable().optional(), 
  resumeType: z.string().nullable().optional(),
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