import { sequelize, JobPosting } from '../server/db';
import { QueryTypes } from 'sequelize';

async function migrateJobPostings() {
  try {
    console.log('Starting job postings migration...');

    // Check if planId and planCode columns exist, if not add them
    const checkColumnsQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'job_postings' AND column_name IN ('plan_id', 'plan_code');
    `;
    
    const existingColumns = await sequelize.query(checkColumnsQuery, { 
      type: QueryTypes.SELECT 
    });
    
    const existingColumnNames = existingColumns.map((col: any) => col.column_name);
    
    // Add planId column if it doesn't exist
    if (!existingColumnNames.includes('plan_id')) {
      console.log('Adding plan_id column to job_postings table...');
      await sequelize.query(`
        ALTER TABLE job_postings 
        ADD COLUMN plan_id INTEGER REFERENCES products(id);
      `);
    }
    
    // Add planCode column if it doesn't exist
    if (!existingColumnNames.includes('plan_code')) {
      console.log('Adding plan_code column to job_postings table...');
      await sequelize.query(`
        ALTER TABLE job_postings 
        ADD COLUMN plan_code TEXT;
      `);
    }
    
    // Get all job postings
    const jobPostings = await JobPosting.findAll();
    console.log(`Found ${jobPostings.length} job postings to update`);
    
    // Update each job posting to set planCode = plan for backward compatibility
    for (const jobPosting of jobPostings) {
      await jobPosting.update({
        planCode: jobPosting.get('plan')
      });
    }
    
    // Create the job_posting_addons table if it doesn't exist
    console.log('Creating or verifying job_posting_addons table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS job_posting_addons (
        job_id INTEGER NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        PRIMARY KEY (job_id, product_id)
      );
    `);
    
    console.log('Job postings migration completed successfully.');
  } catch (error) {
    console.error('Error during job postings migration:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the migration
migrateJobPostings();