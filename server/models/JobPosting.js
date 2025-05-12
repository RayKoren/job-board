const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const JobPosting = sequelize.define('JobPosting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  businessUserId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: User,
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
  addons: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  expiresAt: {
    type: DataTypes.DATE
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
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
  tableName: 'job_postings',
  timestamps: true
});

// Define relationship
JobPosting.belongsTo(User, { foreignKey: 'businessUserId', as: 'businessUser' });
User.hasMany(JobPosting, { foreignKey: 'businessUserId' });

module.exports = JobPosting;