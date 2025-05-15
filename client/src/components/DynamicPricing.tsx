import { 
  Check, 
  X, 
  Star,
  Bookmark,
  Share2,
  Mail,
  Home,
  AlertCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface PlanFeature {
  name: string;
  included: boolean;
}

interface PricingTier {
  id: string;
  name: string;
  price: string;
  duration: string;
  description: string;
  features: PlanFeature[];
  highlighted?: boolean;
  buttonText: string;
  icon: React.ReactNode;
}

interface AddonItem {
  id: string;
  name: string;
  price: string;
  description: string;
  icon: React.ReactNode;
}

// Helper function to get icon based on name/description
const getIconForAddon = (code: string, name: string): React.ReactNode => {
  if (code.includes('extend') || name.includes('Extend')) return <Bookmark className="h-5 w-5" />;
  if (code.includes('social') || name.includes('Social')) return <Share2 className="h-5 w-5" />;
  if (code.includes('top') || name.includes('Top') || code.includes('priority') || name.includes('Priority')) return <Star className="h-5 w-5" />;
  if (code.includes('banner') || name.includes('Banner')) return <Home className="h-5 w-5" />;
  if (code.includes('urgent') || name.includes('Urgent')) return <AlertCircle className="h-5 w-5" />;
  return <Star className="h-5 w-5" />;
};

// Helper function to get icon based on plan name
const getIconForPlan = (code: string, name: string): React.ReactNode => {
  if (code === 'basic' || name.includes('Basic')) return <Bookmark className="h-6 w-6" />;
  if (code === 'standard' || name.includes('Standard')) return <Star className="h-6 w-6" />;
  if (code === 'featured' || name.includes('Featured')) return <Share2 className="h-6 w-6" />;
  if (code === 'unlimited' || name.includes('Unlimited')) return <Star className="h-6 w-6" />;
  return <Bookmark className="h-6 w-6" />;
};

// Split feature string from DB to array of feature objects
const parseFeatures = (features: string[]): PlanFeature[] => {
  return features.map(feature => ({
    name: feature,
    included: true
  }));
};

const PricingTier = ({ 
  id,
  name, 
  price, 
  duration, 
  description, 
  features, 
  highlighted = false,
  buttonText,
  icon
}: PricingTier) => {
  const [_, setLocation] = useLocation();
  const { isAuthenticated, isBusinessUser } = useAuth();
  const { toast } = useToast();
  
  const handleSelectPlan = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to post a job with this plan.",
      });
      setLocation('/login');
      return;
    }
    
    if (!isBusinessUser) {
      toast({
        title: "Business Account Required",
        description: "Only business users can post jobs. Please select the Business role in your profile settings.",
      });
      setLocation('/select-role');
      return;
    }
    
    // Redirect to payment page with plan information
    setLocation(`/payment?plan=${id}`);
  };
  
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={`relative rounded-xl p-8 ${highlighted ? 'border-2 border-clay shadow-lg' : 'border border-gray-200'} bg-white`}
    >
      {highlighted && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-clay text-white px-4 py-1 rounded-full text-sm font-bold">
          Most Popular
        </div>
      )}
      <div className="text-center mb-6">
        <div className="mx-auto w-12 h-12 flex items-center justify-center bg-sand rounded-full text-clay mb-4">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-forest">{name}</h3>
        <div className="mt-2">
          <span className="text-3xl font-bold text-brown">{price}</span>
          {duration && <span className="text-gray-500 text-sm ml-1">/{duration}</span>}
        </div>
        <p className="text-gray-600 mt-3 text-sm">{description}</p>
      </div>
      
      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            {feature.included ? (
              <Check className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
            ) : (
              <X className="h-5 w-5 text-gray-300 mt-0.5 mr-2 flex-shrink-0" />
            )}
            <span className={`text-sm ${feature.included ? 'text-brown' : 'text-gray-500'}`}>{feature.name}</span>
          </li>
        ))}
      </ul>
      
      <Button 
        className={`w-full ${highlighted ? 'bg-clay' : 'bg-forest'} hover:bg-opacity-90`}
        onClick={handleSelectPlan}
      >
        {buttonText}
      </Button>
    </motion.div>
  );
};

interface AddonProps {
  id: string;
  name: string;
  price: string;
  description: string;
  icon: React.ReactNode;
}

const Addon = ({
  id,
  name,
  price,
  description,
  icon
}: AddonProps) => {
  return (
    <motion.div 
      className="border border-gray-200 rounded-lg p-5 flex items-start bg-white"
      whileHover={{ y: -3, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)" }}
    >
      <div className="w-10 h-10 rounded-full bg-sand flex items-center justify-center text-clay mr-4 flex-shrink-0">
        {icon}
      </div>
      <div>
        <div className="flex items-baseline mb-1">
          <h4 className="font-medium text-forest text-lg">{name}</h4>
          <span className="text-clay font-bold ml-2">{price}</span>
        </div>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </motion.div>
  );
};

interface DiscountProps {
  name: string;
  description: string;
  icon: React.ReactNode;
}

const Discount = ({
  name,
  description,
  icon
}: DiscountProps) => {
  return (
    <motion.div 
      className="flex items-start"
      whileHover={{ x: 3 }}
    >
      <div className="w-8 h-8 rounded-full bg-clay bg-opacity-10 flex items-center justify-center text-clay mr-3">
        {icon}
      </div>
      <div>
        <h4 className="font-medium text-forest">{name}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </motion.div>
  );
};

const PricingTierSkeleton = () => (
  <div className="border border-gray-200 rounded-xl p-8 bg-white">
    <div className="text-center mb-6">
      <Skeleton className="w-12 h-12 rounded-full mx-auto mb-4" />
      <Skeleton className="h-6 w-32 mx-auto mb-2" />
      <Skeleton className="h-8 w-20 mx-auto mb-2" />
      <Skeleton className="h-4 w-40 mx-auto" />
    </div>
    
    <div className="space-y-3 mb-8">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
    </div>
    
    <Skeleton className="h-10 w-full" />
  </div>
);

const AddonSkeleton = () => (
  <div className="border border-gray-200 rounded-lg p-5 flex items-start bg-white">
    <Skeleton className="w-10 h-10 rounded-full mr-4 flex-shrink-0" />
    <div className="w-full">
      <Skeleton className="h-6 w-32 mb-2" />
      <Skeleton className="h-4 w-40" />
    </div>
  </div>
);

const DynamicPricing = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pricingData, setPricingData] = useState<{ plans: Record<string, any>, addons: Record<string, any> } | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchPricingData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/pricing');
        
        if (!response.ok) {
          throw new Error(`Error fetching pricing data: ${response.status}`);
        }
        
        const data = await response.json();
        setPricingData(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch pricing data:', err);
        setError('Failed to load pricing information. Please try again later.');
        toast({
          variant: 'destructive',
          title: 'Error Loading Pricing',
          description: 'Failed to load pricing information. Please try again later.'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPricingData();
  }, [toast]);
  
  // Transform API data to pricing tiers
  const pricingTiers = !isLoading && pricingData ? 
    Object.entries(pricingData.plans)
      .filter(([_, plan]) => plan.active)
      .map(([code, plan]: [string, any]) => {
        // Determine plan details
        const planName = plan.name.includes('Post') ? plan.name : `${plan.name} Post`;
        const planPrice = plan.price === 0 ? 'Free' : `$${plan.price}`;
        const duration = code === 'unlimited' ? 'month' : 'post';
        
        // Set descriptions based on plan type
        let description = plan.description || '';
        if (!description) {
          if (code === 'basic') description = 'Get started with a simple job post';
          else if (code === 'standard') description = 'Perfect for most local businesses';
          else if (code === 'featured') description = 'Maximum visibility for your position';
          else if (code === 'unlimited') description = 'For agencies and frequent hirers';
        }
        
        // Parse features to the expected format
        let planFeatures: PlanFeature[] = [];
        if (plan.features && Array.isArray(plan.features)) {
          planFeatures = parseFeatures(plan.features);
        }
        
        // Set button text based on tier
        const buttonText = code === 'basic' ? 'Post a Job' : `Choose ${plan.name}`;
        
        // Determine if this should be highlighted (standard plan)
        const highlighted = code === 'standard';
        
        return {
          id: code,
          name: planName,
          price: planPrice,
          duration,
          description,
          features: planFeatures,
          highlighted,
          buttonText,
          icon: getIconForPlan(code, plan.name)
        };
      })
      .sort((a, b) => {
        // Basic always first, Unlimited always last
        if (a.id === 'basic') return -1;
        if (b.id === 'basic') return 1;
        if (a.id === 'unlimited') return 1;
        if (b.id === 'unlimited') return -1;
        
        // Price sorting for others
        const priceA = parseFloat(a.price.replace('$', '')) || 0;
        const priceB = parseFloat(b.price.replace('$', '')) || 0;
        return priceA - priceB;
      }) : [];
  
  // Transform API data to add-ons
  const addons = !isLoading && pricingData ?
    Object.entries(pricingData.addons)
      .filter(([_, addon]) => addon.active)
      .map(([code, addon]: [string, any]) => ({
        id: code,
        name: addon.name,
        price: `+$${addon.price}`,
        description: addon.description || '',
        icon: getIconForAddon(code, addon.name)
      })) : [];
  
  // Fixed sample discounts (these typically don't come from the API)
  const discounts = [
    {
      name: "Nonprofit & Education Discount",
      description: "50% off any paid plan for verified nonprofits and schools",
      icon: <Check className="h-4 w-4" />
    },
    {
      name: "New User Promotion",
      description: "First paid job posting is free for new users",
      icon: <Check className="h-4 w-4" />
    },
    {
      name: "Bundle Discount",
      description: "Get 5 Standard posts for $80 (save $20)",
      icon: <Check className="h-4 w-4" />
    }
  ];

  return (
    <section id="pricing" className="py-20 bg-sand">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-forest mb-4">Job Posting Plans</h2>
          <p className="text-lg text-brown max-w-2xl mx-auto">
            Choose the right plan for your hiring needs. From free basic listings to featured placements with maximum visibility.
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-6 mb-16 text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-bold mb-2">Error Loading Pricing</h3>
            <p>{error}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {isLoading ? (
            [...Array(4)].map((_, index) => (
              <PricingTierSkeleton key={index} />
            ))
          ) : pricingTiers.length > 0 ? (
            pricingTiers.map((tier, index) => (
              <PricingTier
                key={index}
                id={tier.id}
                name={tier.name}
                price={tier.price}
                duration={tier.duration}
                description={tier.description}
                features={tier.features}
                highlighted={tier.highlighted}
                buttonText={tier.buttonText}
                icon={tier.icon}
              />
            ))
          ) : (
            <div className="col-span-4 text-center py-10">
              <AlertCircle className="h-10 w-10 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-bold mb-2 text-forest">No Plans Available</h3>
              <p className="text-gray-600">Please check back later for our pricing plans.</p>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-xl p-8 shadow-sm mb-16">
          <h3 className="text-2xl font-bold text-forest mb-8 text-center">Enhance Your Listing with Add-ons</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {isLoading ? (
              [...Array(3)].map((_, index) => (
                <AddonSkeleton key={index} />
              ))
            ) : addons.length > 0 ? (
              addons.map((addon, index) => (
                <Addon
                  key={index}
                  id={addon.id}
                  name={addon.name}
                  price={addon.price}
                  description={addon.description}
                  icon={addon.icon}
                />
              ))
            ) : (
              <div className="col-span-3 text-center py-10">
                <AlertCircle className="h-8 w-8 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-bold mb-2 text-forest">No Add-ons Available</h3>
                <p className="text-gray-600">Please check back later for add-on options.</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-8 shadow-sm">
          <h3 className="text-2xl font-bold text-forest mb-8 text-center">Special Discounts</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {discounts.map((discount, index) => (
              <Discount
                key={index}
                name={discount.name}
                description={discount.description}
                icon={discount.icon}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DynamicPricing;