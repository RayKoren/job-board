const User = require('./User');
const BusinessProfile = require('./BusinessProfile');
const JobSeekerProfile = require('./JobSeekerProfile');
const JobPosting = require('./JobPosting');
const JobApplication = require('./JobApplication');
const sequelize = require('../config/database');

// Define associations
User.hasOne(BusinessProfile, { foreignKey: 'userId', as: 'businessProfile' });
User.hasOne(JobSeekerProfile, { foreignKey: 'userId', as: 'jobSeekerProfile' });
User.hasMany(JobPosting, { foreignKey: 'businessUserId', as: 'jobPostings' });
User.hasMany(JobApplication, { foreignKey: 'userId', as: 'applications' });

BusinessProfile.belongsTo(User, { foreignKey: 'userId' });

JobSeekerProfile.belongsTo(User, { foreignKey: 'userId' });

JobPosting.belongsTo(User, { foreignKey: 'businessUserId', as: 'businessUser' });
JobPosting.hasMany(JobApplication, { foreignKey: 'jobId', as: 'applications' });

JobApplication.belongsTo(User, { foreignKey: 'userId', as: 'applicant' });
JobApplication.belongsTo(JobPosting, { foreignKey: 'jobId', as: 'jobPosting' });

// Create a Session model for authentication sessions
const Session = sequelize.define('Session', {
  sid: {
    type: sequelize.Sequelize.STRING,
    primaryKey: true,
  },
  expires: sequelize.Sequelize.DATE,
  sess: sequelize.Sequelize.JSON,
}, {
  tableName: 'sessions',
  timestamps: false,
});

const models = {
  sequelize,
  User,
  BusinessProfile,
  JobSeekerProfile,
  JobPosting,
  JobApplication,
  Session
};

module.exports = models;
module.exports.default = models;