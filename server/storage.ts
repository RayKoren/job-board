import { 
  User, 
  BusinessProfile, 
  JobSeekerProfile, 
  JobPosting, 
  JobApplication 
} from './db';
import { Op } from 'sequelize';
import { Model } from 'sequelize';

// Define types for our storage operations
export interface IUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  role: 'business' | 'job_seeker' | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IBusinessProfile {
  id?: number;
  userId: string;
  companyName: string;
  companySize?: string | null;
  industry?: string | null;
  location?: string | null;
  website?: string | null;
  description?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  logoUrl?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IJobSeekerProfile {
  id?: number;
  userId: string;
  title?: string | null;
  bio?: string | null;
  skills?: string[] | null;
  experience?: any | null;
  education?: any | null;
  location?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  resumeUrl?: string | null;
  availableForWork?: boolean;
  preferredJobTypes?: string[] | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IJobPosting {
  id?: number;
  businessUserId: string;
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  requirements: string;
  benefits?: string | null;
  compensationType: string;
  salaryRange?: string | null;
  hourlyRate?: string | null;
  contactEmail?: string | null;
  applicationUrl?: string | null;
  contactPhone?: string | null;
  status?: string;
  plan: string;
  addons?: string[];
  featured?: boolean;
  expiresAt?: Date | null;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IJobApplication {
  id?: number;
  jobId: number;
  userId: string;
  name: string;
  email: string;
  phone?: string | null;
  coverLetter?: string | null;
  resume?: string | null;
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IStorage {
  // User operations
  getUser(id: string): Promise<IUser | null>;
  getUserByEmail(email: string): Promise<IUser | null>;
  upsertUser(user: IUser): Promise<IUser>;
  
  // Business profile operations
  getBusinessProfile(userId: string): Promise<IBusinessProfile | null>;
  upsertBusinessProfile(profile: IBusinessProfile): Promise<IBusinessProfile>;
  
  // Job seeker profile operations
  getJobSeekerProfile(userId: string): Promise<IJobSeekerProfile | null>;
  upsertJobSeekerProfile(profile: IJobSeekerProfile): Promise<IJobSeekerProfile>;
  
  // Job posting operations
  getJobPosting(id: number): Promise<IJobPosting | null>;
  getJobPostings(options?: { 
    businessUserId?: string;
    featured?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<IJobPosting[]>;
  createJobPosting(posting: IJobPosting): Promise<IJobPosting>;
  updateJobPosting(id: number, posting: Partial<IJobPosting>): Promise<IJobPosting>;
  deleteJobPosting(id: number): Promise<void>;
  
  // Job application operations
  getJobApplication(id: number): Promise<IJobApplication | null>;
  getJobApplicationsForJob(jobId: number): Promise<IJobApplication[]>;
  getJobApplicationsForUser(userId: string): Promise<IJobApplication[]>;
  createJobApplication(application: IJobApplication): Promise<IJobApplication>;
  updateJobApplicationStatus(id: number, status: string): Promise<IJobApplication>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<IUser | null> {
    const user = await User.findByPk(id);
    return user ? user.toJSON() as IUser : null;
  }

  async getUserByEmail(email: string): Promise<IUser | null> {
    const user = await User.findOne({
      where: { email }
    });
    return user ? user.toJSON() as IUser : null;
  }

  async upsertUser(userData: IUser): Promise<IUser> {
    const [user, created] = await User.upsert(userData);
    return user.toJSON() as IUser;
  }
  
  // Business profile operations
  async getBusinessProfile(userId: string): Promise<IBusinessProfile | null> {
    const profile = await BusinessProfile.findOne({
      where: { userId }
    });
    return profile ? profile.toJSON() as IBusinessProfile : null;
  }

  async upsertBusinessProfile(profileData: IBusinessProfile): Promise<IBusinessProfile> {
    const existingProfile = await BusinessProfile.findOne({
      where: { userId: profileData.userId }
    });

    if (existingProfile) {
      await existingProfile.update(profileData);
      return existingProfile.toJSON() as IBusinessProfile;
    } else {
      const newProfile = await BusinessProfile.create(profileData);
      return newProfile.toJSON() as IBusinessProfile;
    }
  }
  
  // Job seeker profile operations
  async getJobSeekerProfile(userId: string): Promise<IJobSeekerProfile | null> {
    return await JobSeekerProfile.findOne({
      where: { userId }
    });
  }

  async upsertJobSeekerProfile(profileData: IJobSeekerProfile): Promise<IJobSeekerProfile> {
    const existingProfile = await JobSeekerProfile.findOne({
      where: { userId: profileData.userId }
    });

    if (existingProfile) {
      await existingProfile.update(profileData);
      return existingProfile;
    } else {
      return await JobSeekerProfile.create(profileData);
    }
  }
  
  // Job posting operations
  async getJobPosting(id: number): Promise<IJobPosting | null> {
    return await JobPosting.findByPk(id);
  }

  async getJobPostings(options: { 
    businessUserId?: string;
    featured?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<IJobPosting[]> {
    const whereClause: any = {};
    
    if (options.businessUserId) {
      whereClause.businessUserId = options.businessUserId;
    }
    
    if (options.featured !== undefined) {
      whereClause.featured = options.featured;
    }
    
    return await JobPosting.findAll({
      where: whereClause,
      limit: options.limit,
      offset: options.offset,
      order: [
        ['featured', 'DESC'],
        ['createdAt', 'DESC']
      ]
    });
  }

  async createJobPosting(postingData: IJobPosting): Promise<IJobPosting> {
    return await JobPosting.create(postingData);
  }

  async updateJobPosting(id: number, postingData: Partial<IJobPosting>): Promise<IJobPosting> {
    const posting = await JobPosting.findByPk(id);
    if (!posting) {
      throw new Error(`Job posting with ID ${id} not found`);
    }
    
    await posting.update(postingData);
    return posting;
  }

  async deleteJobPosting(id: number): Promise<void> {
    const posting = await JobPosting.findByPk(id);
    if (posting) {
      await posting.destroy();
    }
  }
  
  // Job application operations
  async getJobApplication(id: number): Promise<IJobApplication | null> {
    return await JobApplication.findByPk(id);
  }

  async getJobApplicationsForJob(jobId: number): Promise<IJobApplication[]> {
    return await JobApplication.findAll({
      where: { jobId },
      order: [['createdAt', 'DESC']]
    });
  }

  async getJobApplicationsForUser(userId: string): Promise<IJobApplication[]> {
    return await JobApplication.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });
  }

  async createJobApplication(applicationData: IJobApplication): Promise<IJobApplication> {
    return await JobApplication.create(applicationData);
  }

  async updateJobApplicationStatus(id: number, status: string): Promise<IJobApplication> {
    const application = await JobApplication.findByPk(id);
    if (!application) {
      throw new Error(`Job application with ID ${id} not found`);
    }
    
    await application.update({ status });
    return application;
  }
}

export const storage = new DatabaseStorage();