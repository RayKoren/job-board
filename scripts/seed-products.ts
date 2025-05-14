import { db } from '../server/db';
import { products, productTypeEnum } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function seedProducts() {
  console.log('Seeding products...');

  // First, check if products already exist
  const existingProducts = await db.select().from(products);
  if (existingProducts.length > 0) {
    console.log(`Found ${existingProducts.length} existing products. Skipping seed.`);
    return;
  }

  // Define product data for plans
  const planProducts = [
    {
      code: 'basic',
      name: 'Basic',
      description: 'Basic job listing for 15 days',
      type: 'plan',
      price: 0.00,
      active: true,
      sortOrder: 1,
      features: ['15-day listing', 'Basic visibility', 'Standard search placement']
    },
    {
      code: 'standard',
      name: 'Standard',
      description: 'Standard job listing for 30 days',
      type: 'plan',
      price: 20.00,
      active: true,
      sortOrder: 2,
      features: ['30-day listing', 'Enhanced visibility', 'Higher search placement', 'Email notifications']
    },
    {
      code: 'featured',
      name: 'Featured',
      description: 'Featured job listing for 30 days with priority placement',
      type: 'plan',
      price: 50.00,
      active: true,
      sortOrder: 3,
      features: ['30-day listing', 'Premium visibility', 'Top search placement', 'Featured label', 'Homepage highlight']
    },
    {
      code: 'unlimited',
      name: 'Unlimited',
      description: 'Premium job listing for 90 days with maximum exposure',
      type: 'plan',
      price: 150.00,
      active: true,
      sortOrder: 4,
      features: ['90-day listing', 'Maximum visibility', 'Top search placement', 'Featured label', 'Homepage highlight', 'Social media promotion']
    }
  ];

  // Define product data for add-ons
  const addonProducts = [
    {
      code: 'highlighted',
      name: 'Highlighted Listing',
      description: 'Make your listing stand out with a highlight',
      type: 'addon',
      price: 10.00,
      active: true,
      sortOrder: 10,
      features: ['Colored highlight border', 'Increased visibility']
    },
    {
      code: 'top-of-search',
      name: 'Top of Search Results',
      description: 'Priority placement in search results for 14 days',
      type: 'addon',
      price: 25.00,
      active: true,
      sortOrder: 11,
      features: ['Priority search placement', '14-day boost']
    },
    {
      code: 'social-media-promotion',
      name: 'Social Media Promotion',
      description: 'Promote your job on our social media channels',
      type: 'addon',
      price: 20.00,
      active: true,
      sortOrder: 12,
      features: ['Facebook post', 'Twitter post', 'LinkedIn post']
    },
    {
      code: 'resume-access',
      name: 'Resume Database Access',
      description: 'Access all resumes for 30 days',
      type: 'addon',
      price: 15.00,
      active: true,
      sortOrder: 13,
      features: ['Browse resumes', 'Contact candidates directly', '30-day access']
    },
    {
      code: 'urgent',
      name: 'Urgent Hiring',
      description: 'Mark as "Urgent Hiring" with special badge',
      type: 'addon',
      price: 15.00,
      active: true,
      sortOrder: 14,
      features: ['Urgent badge', 'Increased visibility']
    }
  ];

  // Insert all products
  try {
    // Insert plans
    for (const plan of planProducts) {
      await db.insert(products).values({
        code: plan.code,
        name: plan.name,
        description: plan.description,
        type: plan.type as any,
        price: plan.price,
        active: plan.active,
        sortOrder: plan.sortOrder,
        features: plan.features
      });
      console.log(`Added plan: ${plan.name}`);
    }

    // Insert add-ons
    for (const addon of addonProducts) {
      await db.insert(products).values({
        code: addon.code,
        name: addon.name,
        description: addon.description,
        type: addon.type as any,
        price: addon.price,
        active: addon.active,
        sortOrder: addon.sortOrder,
        features: addon.features
      });
      console.log(`Added add-on: ${addon.name}`);
    }

    console.log('Product seeding completed!');
  } catch (error) {
    console.error('Error seeding products:', error);
  }
}

// Run the seed function
seedProducts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error during product seeding:', error);
    process.exit(1);
  });