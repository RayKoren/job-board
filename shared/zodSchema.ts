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

// Job posting schema with character limits for security and UI
export const jobPostingSchema = z.object({
  id: z.number().optional(),
  businessUserId: z.string(),
  title: z.string().min(1, "Title is required").max(100, "Title must be 100 characters or less"),
  company: z.string().min(1, "Company name is required").max(80, "Company name must be 80 characters or less"),
  location: z.string().min(1, "Location is required").max(60, "Location must be 60 characters or less"),
  type: z.enum(['Full-time', 'Part-time', 'Contract', 'Temporary', 'Gig']),
  description: z.string().min(1, "Description is required").max(2000, "Description must be 2000 characters or less"),
  requirements: z.string().min(1, "Requirements are required").max(1500, "Requirements must be 1500 characters or less"),
  benefits: z.string().max(1000, "Benefits must be 1000 characters or less").nullable().optional(),
  compensationType: z.enum(['Salary', 'Hourly']),
  salaryRange: z.string().max(50, "Salary range must be 50 characters or less").nullable().optional(),
  hourlyRate: z.string().max(50, "Hourly rate must be 50 characters or less").nullable().optional(),
  contactEmail: z.string().email("Please enter a valid email").max(100, "Email must be 100 characters or less").nullable().optional(),
  applicationUrl: z.string().max(200, "Application URL must be 200 characters or less").nullable().optional(),
  contactPhone: z.string().max(20, "Phone number must be 20 characters or less").nullable().optional(),
  status: z.string().optional().default('active'),
  plan: z.enum(['basic', 'standard', 'featured', 'unlimited']),
  addons: z.array(z.string()).optional().default([]),
  featured: z.boolean().optional().default(false),
  expiresAt: z.date().nullable().optional(),
  tags: z.array(z.string().max(30, "Tag must be 30 characters or less")).max(10, "Maximum 10 tags allowed").optional().default([]),
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