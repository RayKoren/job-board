import { pgTable, text, serial, integer, varchar, timestamp, jsonb, index, boolean, pgEnum, decimal, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Define user roles enum
export const userRoleEnum = pgEnum('user_role', ['business', 'job_seeker']);

// Define product type enum
export const productTypeEnum = pgEnum('product_type', ['plan', 'addon']);

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
  role: userRoleEnum("role"),
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

// Products table for plans and add-ons
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(), // e.g., 'basic', 'standard', etc.
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  type: productTypeEnum("type").notNull(), // 'plan' or 'addon'
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  active: boolean("active").default(true),
  sortOrder: integer("sort_order").default(0),
  features: jsonb("features").default([]),
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
  planId: integer("plan_id").references(() => products.id), // Reference to the selected plan product
  planCode: text("plan_code").notNull(), // For backward compatibility (basic, standard, featured, unlimited)
  status: text("status").default("pending").notNull(), // pending, active, expired, deleted
});

// Junction table for job postings and product add-ons
export const jobPostingAddons = pgTable("job_posting_addons", {
  jobId: integer("job_id").notNull().references(() => jobPostings.id, { onDelete: 'cascade' }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.jobId, table.productId] }),
}));

// Job applications
export const jobApplications = pgTable("job_applications", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobPostings.id, { onDelete: 'cascade' }),
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
  plan: one(products, {
    fields: [jobPostings.planId],
    references: [products.id],
  }),
  addons: many(jobPostingAddons),
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

// Relations for the product tables
export const productsRelations = relations(products, ({ many }) => ({
  jobPostings: many(jobPostings),
  jobPostingAddons: many(jobPostingAddons),
}));

export const jobPostingAddonsRelations = relations(jobPostingAddons, ({ one }) => ({
  jobPosting: one(jobPostings, {
    fields: [jobPostingAddons.jobId],
    references: [jobPostings.id],
  }),
  product: one(products, {
    fields: [jobPostingAddons.productId],
    references: [products.id],
  }),
}));

// Zod schemas for data insertion
export const insertUserSchema = createInsertSchema(users);
export const insertBusinessProfileSchema = createInsertSchema(businessProfiles);
export const insertJobSeekerProfileSchema = createInsertSchema(jobSeekerProfiles);
export const insertJobPostingSchema = createInsertSchema(jobPostings);
export const insertJobApplicationSchema = createInsertSchema(jobApplications);
export const insertProductSchema = createInsertSchema(products);
export const insertJobPostingAddonSchema = createInsertSchema(jobPostingAddons);

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
export type Product = typeof products.$inferSelect;
export type UpsertProduct = typeof products.$inferInsert;
export type JobPostingAddon = typeof jobPostingAddons.$inferSelect;
export type UpsertJobPostingAddon = typeof jobPostingAddons.$inferInsert;