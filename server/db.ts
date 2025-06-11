import { Sequelize, DataTypes } from 'sequelize';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../shared/schema';

// Check for database URL
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create Postgres pool for Drizzle
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : undefined
});

// Create Drizzle instance
export const db = drizzle(pool, { schema });

// Create Sequelize instance
export const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: process.env.NODE_ENV === 'production',
      rejectUnauthorized: false,
    },
  },
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Define models
// User model
export const User = sequelize.define('User', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true // Allow null for existing users during migration
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  profileImageUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM('business', 'job_seeker'),
    allowNull: true
  },
  resetToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  resetTokenExpiry: {
    type: DataTypes.DATE,
    allowNull: true
  },
  mailingListConsent: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false
  }
}, {
  tableName: 'users',
  timestamps: true
});

// Business Profile model
export const BusinessProfile = sequelize.define('BusinessProfile', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  companySize: {
    type: DataTypes.STRING,
    allowNull: true
  },
  industry: {
    type: DataTypes.STRING,
    allowNull: true
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  website: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  contactEmail: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contactPhone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  logoData: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  logoName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  logoType: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'business_profiles',
  timestamps: true
});

// Job Seeker Profile model
export const JobSeekerProfile = sequelize.define('JobSeekerProfile', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  skills: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true
  },
  experience: {
    type: DataTypes.JSON,
    allowNull: true
  },
  education: {
    type: DataTypes.JSON,
    allowNull: true
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contactEmail: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contactPhone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // New fields for database-stored resumes
  resumeData: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  resumeName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  resumeType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  availableForWork: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  preferredJobTypes: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true
  }
}, {
  tableName: 'job_seeker_profiles',
  timestamps: true
});

// Job Posting model
export const JobPosting = sequelize.define('JobPosting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  businessUserId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  company: {
    type: DataTypes.STRING,
    allowNull: false
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  requirements: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  benefits: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  compensationType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  salaryRange: {
    type: DataTypes.STRING,
    allowNull: true
  },
  hourlyRate: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contactEmail: {
    type: DataTypes.STRING,
    allowNull: true
  },
  applicationUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contactPhone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'active'
  },
  plan: {
    type: DataTypes.STRING,
    allowNull: false
  },
  planCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  planId: {
    type: DataTypes.INTEGER,
    allowNull: true
    // Will be linked to products table
  },
  addons: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  clickCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  }
}, {
  tableName: 'job_postings',
  timestamps: true
});

// Job Application model
export const JobApplication = sequelize.define('JobApplication', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  jobId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'job_postings',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  coverLetter: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  resume: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending'
  }
}, {
  tableName: 'job_applications',
  timestamps: true
});

// Session model for express-session
export const Session = sequelize.define('Session', {
  sid: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  expires: DataTypes.DATE,
  sess: DataTypes.JSON
}, {
  tableName: 'sessions',
  timestamps: false
});

// Define associations
User.hasOne(BusinessProfile, { foreignKey: 'userId' });
BusinessProfile.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(JobSeekerProfile, { foreignKey: 'userId' });
JobSeekerProfile.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(JobPosting, { foreignKey: 'businessUserId' });
JobPosting.belongsTo(User, { foreignKey: 'businessUserId' });

JobPosting.hasMany(JobApplication, { foreignKey: 'jobId' });
JobApplication.belongsTo(JobPosting, { foreignKey: 'jobId' });

User.hasMany(JobApplication, { foreignKey: 'userId' });
JobApplication.belongsTo(User, { foreignKey: 'userId' });

// Initialize database
export const initDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    // Sync all models (in development)
    // In production, use migrations instead
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('All models were synchronized successfully.');
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};