const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const JobPosting = require('./JobPosting');

const JobApplication = sequelize.define('JobApplication', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  jobId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: JobPosting,
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: User,
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
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'job_applications',
  timestamps: true
});

// Define relationships
JobApplication.belongsTo(JobPosting, { foreignKey: 'jobId' });
JobApplication.belongsTo(User, { foreignKey: 'userId' });

JobPosting.hasMany(JobApplication, { foreignKey: 'jobId' });
User.hasMany(JobApplication, { foreignKey: 'userId' });

module.exports = JobApplication;