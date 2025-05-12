import { Sequelize, Model } from 'sequelize';

// Define interfaces for our models
export interface UserModel extends Model {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  role: 'business' | 'job_seeker' | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BusinessProfileModel extends Model {
  id: number;
  userId: string;
  companyName: string;
  companySize: string | null;
  industry: string | null;
  location: string | null;
  website: string | null;
  description: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  logoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobSeekerProfileModel extends Model {
  id: number;
  userId: string;
  title: string | null;
  bio: string | null;
  skills: string[] | null;
  experience: any | null;
  education: any | null;
  location: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  resumeUrl: string | null;
  availableForWork: boolean;
  preferredJobTypes: string[] | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobPostingModel extends Model {
  id: number;
  businessUserId: string;
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  requirements: string;
  benefits: string | null;
  compensationType: string;
  salaryRange: string | null;
  hourlyRate: string | null;
  contactEmail: string | null;
  applicationUrl: string | null;
  contactPhone: string | null;
  status: string;
  plan: string;
  addons: string[];
  featured: boolean;
  expiresAt: Date | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface JobApplicationModel extends Model {
  id: number;
  jobId: number;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  coverLetter: string | null;
  resume: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionModel extends Model {
  sid: string;
  expires: Date;
  sess: any;
}

// Define the export interface
declare const models: {
  sequelize: Sequelize;
  User: typeof UserModel;
  BusinessProfile: typeof BusinessProfileModel;
  JobSeekerProfile: typeof JobSeekerProfileModel;
  JobPosting: typeof JobPostingModel;
  JobApplication: typeof JobApplicationModel;
  Session: typeof SessionModel;
};

export default models;