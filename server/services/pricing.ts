import { db } from '../db';
import { products } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';

// Cache to avoid excessive database queries
let productCache: Record<string, number> = {};
let cacheExpiry = 0;
const CACHE_TTL = 60000; // 1 minute

// Get price data based on the job posting plan tier
export async function getPriceForPlan(planTier: string): Promise<number> {
  await refreshCacheIfNeeded();
  
  const cacheKey = `plan:${planTier}`;
  if (productCache[cacheKey] !== undefined) {
    return productCache[cacheKey];
  }
  
  // If not in cache, query directly
  const [plan] = await db.select()
    .from(products)
    .where(
      and(
        eq(products.code, planTier),
        eq(products.type, 'plan'),
        eq(products.active, true)
      )
    );
  
  if (!plan) {
    console.log(`Plan not found in database: ${planTier}, defaulting to $0`);
    return 0;
  }
  
  // Store in cache
  productCache[cacheKey] = Number(plan.price);
  return Number(plan.price);
}

// Get addon price
export async function getPriceForAddon(addonType: string): Promise<number> {
  await refreshCacheIfNeeded();
  
  // Normalize addon code names (for backwards compatibility)
  const normalizedAddonType = normalizeAddonCode(addonType);
  const cacheKey = `addon:${normalizedAddonType}`;
  
  if (productCache[cacheKey] !== undefined) {
    return productCache[cacheKey];
  }
  
  // If not in cache, query directly
  const [addon] = await db.select()
    .from(products)
    .where(
      and(
        eq(products.code, normalizedAddonType),
        eq(products.type, 'addon'),
        eq(products.active, true)
      )
    );
  
  if (!addon) {
    console.log(`Addon not found in database: ${normalizedAddonType}, defaulting to $0`);
    return 0;
  }
  
  // Store in cache
  productCache[cacheKey] = Number(addon.price);
  return Number(addon.price);
}

// Normalize addon codes for backwards compatibility
function normalizeAddonCode(addonCode: string): string {
  switch (addonCode) {
    case 'boost':
    case 'visibility-boost':
      return 'highlighted';
    case 'highlight':
      return 'highlighted';
    case 'social-boost':
      return 'social-media-promotion';
    case 'extended':
      return 'top-of-search';
    case 'email-blast':
      return 'social-media-promotion';
    default:
      return addonCode;
  }
}

// Calculate total price for a job posting
export async function calculateJobPostingPrice(
  planTier: string,
  addons: string[] = []
): Promise<number> {
  // Refresh cache if needed
  await refreshCacheIfNeeded();
  
  let totalPrice = await getPriceForPlan(planTier);
  
  // Add any addon prices
  for (const addon of addons) {
    totalPrice += await getPriceForAddon(addon);
  }
  
  return totalPrice;
}

// Load all products into cache
async function refreshCacheIfNeeded(): Promise<void> {
  const now = Date.now();
  if (now > cacheExpiry) {
    // Clear existing cache
    productCache = {};
    
    // Get all active products
    const allProducts = await db.select().from(products).where(eq(products.active, true));
    
    // Add plans to cache
    for (const product of allProducts) {
      if (product.type === 'plan') {
        productCache[`plan:${product.code}`] = Number(product.price);
      } else if (product.type === 'addon') {
        productCache[`addon:${product.code}`] = Number(product.price);
      }
    }
    
    // Set cache expiry
    cacheExpiry = now + CACHE_TTL;
  }
}

// For backward compatibility
export function getPriceForPlanSync(planTier: string): number {
  // Fallback for non-async contexts
  switch (planTier) {
    case 'basic':
      return 0; // Free tier
    case 'standard':
      return 20.00;
    case 'featured':
      return 50.00;
    case 'unlimited':
      return 150.00;
    default:
      return 0;
  }
}

// For backward compatibility
export function getPriceForAddonSync(addonType: string): number {
  // Fallback for non-async contexts
  switch (addonType) {
    case 'boost':
      return 10.00;
    case 'highlight':
    case 'highlighted':
      return 10.00;
    case 'top-of-search':
      return 25.00;
    case 'resume-access':
      return 15.00;
    case 'social-boost':
    case 'social-media-promotion':
      return 20.00;
    case 'urgent':
      return 15.00;
    case 'extended':
      return 20.00;
    case 'email-blast':
      return 30.00;
    default:
      console.log(`Unknown addon type: ${addonType}, defaulting to $0`);
      return 0;
  }
}

// For backward compatibility
export function calculateJobPostingPriceSync(
  planTier: string,
  addons: string[] = []
): number {
  let totalPrice = getPriceForPlanSync(planTier);
  
  // Add any addon prices
  for (const addon of addons) {
    totalPrice += getPriceForAddonSync(addon);
  }
  
  return totalPrice;
}