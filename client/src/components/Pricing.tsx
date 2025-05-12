import { 
  Check, 
  X, 
  Star,
  Bookmark,
  Share2,
  Mail,
  Home 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface PlanFeature {
  name: string;
  included: boolean;
}

interface PricingTier {
  name: string;
  price: string;
  duration: string;
  description: string;
  features: PlanFeature[];
  highlighted?: boolean;
  buttonText: string;
  icon: React.ReactNode;
}

const PricingTier = ({ 
  name, 
  price, 
  duration, 
  description, 
  features, 
  highlighted = false,
  buttonText,
  icon
}: PricingTier) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={`relative rounded-xl p-8 ${highlighted ? 'border-2 border-clay shadow-lg' : 'border border-gray-200'}`}
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
      >
        {buttonText}
      </Button>
    </motion.div>
  );
};

interface AddonProps {
  name: string;
  price: string;
  description: string;
  icon: React.ReactNode;
}

const Addon = ({
  name,
  price,
  description,
  icon
}: AddonProps) => {
  return (
    <motion.div 
      className="border border-gray-200 rounded-lg p-5 flex items-start"
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

const Pricing = () => {
  const pricingTiers: PricingTier[] = [
    {
      name: "Basic Post",
      price: "Free",
      duration: "",
      description: "Get started with a simple job post",
      buttonText: "Post a Job",
      icon: <Bookmark className="h-6 w-6" />,
      features: [
        { name: "7-day listing", included: true },
        { name: "Standard listing in feed", included: true },
        { name: "Company logo", included: false },
        { name: "Searchable with filters", included: false },
        { name: "Top placement", included: false },
        { name: "Email blast inclusion", included: false },
        { name: "Social media sharing", included: false }
      ]
    },
    {
      name: "Standard Post",
      price: "$20",
      duration: "post",
      description: "Perfect for most local businesses",
      buttonText: "Choose Standard",
      highlighted: true,
      icon: <Star className="h-6 w-6" />,
      features: [
        { name: "14-day listing", included: true },
        { name: "Standard listing in feed", included: true },
        { name: "Company logo", included: true },
        { name: "Searchable with filters", included: true },
        { name: "Slight highlight in listings", included: true },
        { name: "Email blast inclusion", included: false },
        { name: "Social media sharing", included: false }
      ]
    },
    {
      name: "Featured Post",
      price: "$50",
      duration: "post",
      description: "Maximum visibility for your position",
      buttonText: "Choose Featured",
      icon: <Share2 className="h-6 w-6" />,
      features: [
        { name: "30-day listing", included: true },
        { name: "Top of feed placement", included: true },
        { name: "Company logo + image", included: true },
        { name: "Searchable with filters", included: true },
        { name: "Premium highlight in listings", included: true },
        { name: "Email blast inclusion", included: true },
        { name: "Social media sharing", included: true }
      ]
    },
    {
      name: "Unlimited Monthly",
      price: "$150",
      duration: "month",
      description: "For agencies and frequent hirers",
      buttonText: "Choose Unlimited",
      icon: <Star className="h-6 w-6" />,
      features: [
        { name: "Unlimited job posts", included: true },
        { name: "Top of feed placement", included: true },
        { name: "Company logo + image", included: true },
        { name: "Searchable with filters", included: true },
        { name: "Premium highlight in listings", included: true },
        { name: "Email blast inclusion", included: true },
        { name: "Social media sharing", included: true }
      ]
    }
  ];
  
  const addons = [
    {
      name: "Extend Post",
      price: "+$5",
      description: "Add 7 more days to any job post",
      icon: <Bookmark className="h-5 w-5" />
    },
    {
      name: "Social Media Boost",
      price: "+$15",
      description: "Promote your job on our social channels",
      icon: <Share2 className="h-5 w-5" />
    },
    {
      name: "Priority Banner",
      price: "+$25",
      description: "Featured on homepage for 3 days",
      icon: <Home className="h-5 w-5" />
    }
  ];
  
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {pricingTiers.map((tier, index) => (
            <PricingTier
              key={index}
              name={tier.name}
              price={tier.price}
              duration={tier.duration}
              description={tier.description}
              features={tier.features}
              highlighted={tier.highlighted}
              buttonText={tier.buttonText}
              icon={tier.icon}
            />
          ))}
        </div>
        
        <div className="bg-white rounded-xl p-8 shadow-sm mb-16">
          <h3 className="text-2xl font-bold text-forest mb-8 text-center">Enhance Your Listing with Add-ons</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {addons.map((addon, index) => (
              <Addon
                key={index}
                name={addon.name}
                price={addon.price}
                description={addon.description}
                icon={addon.icon}
              />
            ))}
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

export default Pricing;