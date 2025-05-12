const { DataTypes } = require('sequelize');
const sequelize = require('./sequelize');
const User = require('./User');

const JobSeekerProfile = sequelize.define('JobSeekerProfile', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: User,
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
    allowNull: true,
    defaultValue: []
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
  resumeUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  availableForWork: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  preferredJobTypes: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
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
  tableName: 'job_seeker_profiles',
  timestamps: true
});

// Define relationship
JobSeekerProfile.belongsTo(User, { foreignKey: 'userId' });
User.hasOne(JobSeekerProfile, { foreignKey: 'userId' });

module.exports = JobSeekerProfile;