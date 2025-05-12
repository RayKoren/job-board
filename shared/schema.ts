import { pgTable, text, serial, integer, varchar, timestamp, jsonb, index, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Define user roles enum
export const userRoleEnum = pgEnum('user_role', ['business', 'job_seeker']);

// Session storage table (for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (Core user data)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Additional info for business users
export const businessProfiles = pgTable("business_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  companyName: text("company_name").notNull(),
  industry: text("industry"),
  location: text("location"),
  website: text("website"),
  description: text("description"),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Additional info for job seekers
export const jobSeekerProfiles = pgTable("job_seeker_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text("title"),
  bio: text("bio"),
  skills: text("skills").array(),
  experience: text("experience"),
  education: text("education"),
  resumeUrl: text("resume_url"),
  phone: text("phone"),
  location: text("location"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Job postings
export const jobPostings = pgTable("job_postings", {
  id: serial("id").primaryKey(),
  businessUserId: varchar("business_user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  company: text("company").notNull(),
  location: text("location").notNull(),
  type: text("type").notNull(), // Full-time, Part-time, Gig
  compensationType: text("compensation_type").notNull(), // Salary, Hourly
  salaryRange: text("salary_range"),
  hourlyRate: text("hourly_rate"),
  description: text("description").notNull(),
  requirements: text("requirements"),
  featured: boolean("featured").default(false),
  tags: text("tags").array(),
  postedAt: timestamp("posted_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  planTier: text("plan_tier").notNull(), // Basic, Standard, Featured, Unlimited
});

// Job applications
export const jobApplications = pgTable("job_applications", {
  id: serial("id").primaryKey(),
  jobId: serial("job_id").notNull().references(() => jobPostings.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  coverLetter: text("cover_letter"),
  resumeUrl: text("resume_url"),
  status: text("status").default("pending"), // pending, reviewed, contacted, rejected
  appliedAt: timestamp("applied_at").defaultNow(),
});

// Define relations
export const usersRelations = relations(users, ({ one, many }) => ({
  businessProfile: one(businessProfiles, {
    fields: [users.id],
    references: [businessProfiles.userId],
  }),
  jobSeekerProfile: one(jobSeekerProfiles, {
    fields: [users.id],
    references: [jobSeekerProfiles.userId],
  }),
  jobPostings: many(jobPostings),
  jobApplications: many(jobApplications),
}));

export const jobPostingsRelations = relations(jobPostings, ({ one, many }) => ({
  business: one(users, {
    fields: [jobPostings.businessUserId],
    references: [users.id],
  }),
  applications: many(jobApplications),
}));

export const jobApplicationsRelations = relations(jobApplications, ({ one }) => ({
  job: one(jobPostings, {
    fields: [jobApplications.jobId],
    references: [jobPostings.id],
  }),
  applicant: one(users, {
    fields: [jobApplications.userId],
    references: [users.id],
  }),
}));

// Zod schemas for data insertion
export const insertUserSchema = createInsertSchema(users);
export const insertBusinessProfileSchema = createInsertSchema(businessProfiles);
export const insertJobSeekerProfileSchema = createInsertSchema(jobSeekerProfiles);
export const insertJobPostingSchema = createInsertSchema(jobPostings);
export const insertJobApplicationSchema = createInsertSchema(jobApplications);

// Types
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type BusinessProfile = typeof businessProfiles.$inferSelect;
export type UpsertBusinessProfile = typeof businessProfiles.$inferInsert;
export type JobSeekerProfile = typeof jobSeekerProfiles.$inferSelect;
export type UpsertJobSeekerProfile = typeof jobSeekerProfiles.$inferInsert;
export type JobPosting = typeof jobPostings.$inferSelect;
export type UpsertJobPosting = typeof jobPostings.$inferInsert;
export type JobApplication = typeof jobApplications.$inferSelect;
export type UpsertJobApplication = typeof jobApplications.$inferInsert;
