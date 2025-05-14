import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { PayPalPaymentWrapper } from '@/components/checkout/PayPalPaymentWrapper';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PaymentPage() {
  const [_, setLocation] = useLocation();
  const { isAuthenticated, isBusinessUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [planTier, setPlanTier] = useState<string>('');
  const [addons, setAddons] = useState<string[]>([]);
  const [addonsList, setAddonsList] = useState<any[]>([]);
  const [jobData, setJobData] = useState<any>(null);
  const [pricingData, setPricingData] = useState<{ plans: any; addons: any } | null>(null);
  
  // Use ref to prevent multiple calls to the same data
  const dataInitialized = useRef(false);
  const pricingFetched = useRef(false);
  
  // Initialize data from URL parameters
  useEffect(() => {
    if (dataInitialized.current) return; // Only run once
    dataInitialized.current = true;
    
    // Get URL parameters
    const searchParams = new URLSearchParams(window.location.search);
    const plan = searchParams.get('plan');
    const addonParams = searchParams.get('addons');
    const jobDataParam = searchParams.get('jobData');
    
    // Check required parameters
    if (!plan) {
      toast({
        variant: 'destructive',
        title: 'Invalid Request',
        description: 'Missing plan information. Please return to the job posting page.'
      });
      
      setTimeout(() => {
        setLocation('/post-job');
      }, 3000);
      
      return;
    }
    
    // Set plan tier
    setPlanTier(plan);
    
    // Process addons if present
    if (addonParams) {
      try {
        setAddons(JSON.parse(addonParams));
      } catch (err) {
        console.error('Failed to parse addons', err);
        setAddons([]);
      }
    }
    
    // Process job data if present
    if (jobDataParam) {
      try {
        setJobData(JSON.parse(jobDataParam));
      } catch (err) {
        console.error('Failed to parse job data', err);
      }
    }
  }, [toast, setLocation]);
  
  // Fetch pricing information - separate effect to avoid dependencies on addons
  useEffect(() => {
    // Skip if we've already fetched pricing or if data isn't yet initialized
    if (pricingFetched.current || !dataInitialized.current) return;
    pricingFetched.current = true;
    
    const fetchPricing = async () => {
      try {
        console.log('Fetching pricing data...');
        const response = await fetch('/api/pricing', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`Error fetching pricing data: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Pricing data received:', data);
        setPricingData(data);
        
        // Process selected add-ons
        if (data && data.addons && addons.length > 0) {
          // Map the add-on keys to add-on objects with full information
          const selectedAddonObjects = addons
            .filter(addonKey => {
              // Filter out any non-existent add-ons
              const exists = !!data.addons[addonKey];
              if (!exists) {
                console.warn(`Add-on key "${addonKey}" not found in pricing data`);
                
                // Special handling for social-boost which might be named social-media-promotion in the API
                if (addonKey === 'social-boost' && data.addons['social-media-promotion']) {
                  return true;
                }
              }
              return exists;
            })
            .map(addonKey => {
              // Handle social-boost mapping to social-media-promotion
              const lookupKey = addonKey === 'social-boost' ? 'social-media-promotion' : addonKey;
              return {
                id: addonKey,
                ...data.addons[lookupKey]
              };
            });
          
          console.log('Selected add-ons:', selectedAddonObjects);
          setAddonsList(selectedAddonObjects);
        }
      } catch (err) {
        console.error('Failed to fetch pricing data:', err);
        // Log more details about the error
        if (err instanceof Error) {
          console.error('Error message:', err.message);
          console.error('Error stack:', err.stack);
        }
        
        toast({
          variant: 'destructive',
          title: 'Error Loading Pricing',
          description: 'Failed to load pricing information. Please try again or contact support.'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPricing();
  }, [addons, toast, dataInitialized.current]);

  // Redirect if not authenticated or not a business user
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/login');
    } else if (!isLoading && !isBusinessUser) {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'Only business users can post jobs.'
      });
      setLocation('/');
    }
  }, [isLoading, isAuthenticated, isBusinessUser, setLocation, toast]);

  const handlePaymentSuccess = (orderId: string) => {
    // Calculate the price to store it for later reference
    const totalPrice = (
      (pricingData?.plans[planTier]?.price || 0) + 
      (addons || []).reduce((sum, addon) => sum + (pricingData?.addons[addon]?.price || 0), 0)
    );
    
    // Store data in local storage to resume job posting after payment
    if (jobData) {
      localStorage.setItem('pendingJobPost', JSON.stringify({
        ...jobData,
        planTier,
        planCode: planTier, // Ensure compatibility with backend
        addons,
        orderId,
        price: totalPrice.toString()
      }));
    }
    
    // Navigate to the success page
    setLocation(`/payment-success?order_id=${orderId}`);
  };

  const handleFreeSuccess = () => {
    // For free plans, we can proceed directly to job posting
    if (jobData) {
      localStorage.setItem('pendingJobPost', JSON.stringify({
        ...jobData,
        planTier,
        planCode: planTier, // Ensure compatibility with backend
        addons,
        free: true
      }));
    }
    
    toast({
      title: 'Success',
      description: 'You can now continue with your job posting.'
    });
    
    setLocation('/post-job?continue=true');
  };

  const handleCancel = () => {
    // Add the continue parameter to preserve job posting data
    setLocation('/post-job?continue=true');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <Spinner className="h-10 w-10 mx-auto mb-4" />
            <p className="text-gray-600">Loading payment information...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Display plan information
  const planInfo = pricingData?.plans[planTier];
  
  // Determine which add-ons to display
  const selectedAddons = addonsList.length > 0 
    ? addonsList  // Use the processed add-ons list if available
    : addons.map(addonKey => {
        // Try to find the add-on in the pricing data
        const addonInfo = pricingData?.addons[addonKey];
        if (addonInfo) {
          return { id: addonKey, ...addonInfo };
        }
        
        // Special case for social-boost which might be named social-media-promotion in the API
        if (addonKey === 'social-boost' && pricingData?.addons['social-media-promotion']) {
          return { 
            id: 'social-boost', 
            ...pricingData.addons['social-media-promotion'] 
          };
        }
        
        return null;
      })
      .filter(Boolean); // Remove any null entries

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="pt-28 pb-12 flex-grow">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-center mb-8">Complete Your Payment</h1>
          
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              
              {planInfo && (
                <div className="mb-6 border-b pb-4">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">{planInfo.name} Plan</span>
                    <span>${planInfo.price.toFixed(2)}</span>
                  </div>
                  <div className="text-sm text-gray-600 ml-4">
                    <ul className="list-disc pl-4 space-y-1 mt-2">
                      {planInfo.features.map((feature: string, index: number) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              
              {selectedAddons.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium mb-2">Add-ons</h3>
                  {selectedAddons.map((addon, index) => (
                    <div key={index} className="flex justify-between mb-2 text-sm">
                      <div>
                        <span className="text-gray-800">{addon.name}</span>
                        <p className="text-xs text-gray-500">{addon.description}</p>
                      </div>
                      <span>${addon.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="border-t pt-4">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>
                    $
                    {(
                      (planInfo?.price || 0) + 
                      selectedAddons.reduce((sum, addon) => sum + addon.price, 0)
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
              
              <div className="mt-6">
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleCancel}
                >
                  Return to Job Posting
                </Button>
              </div>
            </div>
            
            <div>
              <PayPalPaymentWrapper
                planTier={planTier}
                addons={addons}
                onPaymentSuccess={handlePaymentSuccess}
                onCancel={handleCancel}
                onFreeSuccess={handleFreeSuccess}
              />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}