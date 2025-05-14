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
    case 'highlighted':
      return 5.00;
    case 'urgent':
      return 15.00;
    case 'extended':
      return 20.00;
    // Additional add-ons available in the UI
    case 'top-of-search':
      return 15.00;
    case 'resume-access':
      return 25.00;
    case 'social-boost':
      return 20.00;
    case 'email-blast':
      return 30.00;
    default:
      console.log(`Unknown addon type: ${addonType}, defaulting to $0`);
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