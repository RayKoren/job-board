import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../shared/schema';

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : undefined
  });

  const db = drizzle(pool, { schema });

  console.log('Creating Drizzle tables...');
  
  // Create tables directly from the schema
  try {
    // Create productTypeEnum type
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE product_type AS ENUM ('plan', 'addon');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);
    
    // Create userRoleEnum type
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('business', 'job_seeker');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);
    
    // Create products table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        type product_type NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        active BOOLEAN DEFAULT TRUE,
        sort_order INTEGER DEFAULT 0,
        features JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create job_posting_addons table (junction table)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS job_posting_addons (
        job_id INTEGER NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        PRIMARY KEY (job_id, product_id)
      );
    `);

    console.log('Drizzle tables created successfully!');
  } catch (error) {
    console.error('Error creating tables:', error);
  } finally {
    await pool.end();
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error running migration:', err);
    process.exit(1);
  });