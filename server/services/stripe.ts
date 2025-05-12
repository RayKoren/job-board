import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-04-30.basil',
});

export interface PaymentIntentRequest {
  amount: number;
  currency?: string;
  metadata?: Record<string, string>;
}

// Create a payment intent for one-time payments
export async function createPaymentIntent(data: PaymentIntentRequest) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(data.amount * 100), // Convert to cents
      currency: data.currency || 'usd',
      metadata: data.metadata,
    });
    
    return {
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id,
    };
  } catch (error: any) {
    console.error('Error creating payment intent:', error.message);
    throw error;
  }
}

// Retrieve a payment intent
export async function retrievePaymentIntent(paymentIntentId: string) {
  try {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error: any) {
    console.error('Error retrieving payment intent:', error.message);
    throw error;
  }
}

// Get price data based on the job posting plan tier
export function getPriceForPlan(planTier: string): number {
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

// Get addon price
export function getPriceForAddon(addonType: string): number {
  switch (addonType) {
    case 'boost':
      return 10.00;
    case 'highlight':
      return 5.00;
    case 'urgent':
      return 15.00;
    case 'extended':
      return 20.00;
    default:
      return 0;
  }
}

// Calculate total price for a job posting
export function calculateJobPostingPrice(
  planTier: string,
  addons: string[] = []
): number {
  let totalPrice = getPriceForPlan(planTier);
  
  // Add any addon prices
  for (const addon of addons) {
    totalPrice += getPriceForAddon(addon);
  }
  
  return totalPrice;
}