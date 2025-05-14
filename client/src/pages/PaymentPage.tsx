import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { PayPalPaymentWrapper } from '@/components/checkout/PayPalPaymentWrapper';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { apiRequest } from '@/lib/queryClient';

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
  
  useEffect(() => {
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
    
    // Fetch pricing information
    const fetchPricing = async () => {
      try {
        const response = await apiRequest('GET', '/api/pricing');
        const data = await response.json();
        setPricingData(data);
        
        // Process selected add-ons
        if (data && data.addons && addons.length > 0) {
          const selectedAddonObjects = addons
            .filter(addonKey => data.addons[addonKey]) // Filter out any non-existent add-ons
            .map(addonKey => ({
              id: addonKey,
              ...data.addons[addonKey]
            }));
          
          console.log('Selected add-ons:', selectedAddonObjects);
          setAddonsList(selectedAddonObjects);
        }
      } catch (err) {
        console.error('Failed to fetch pricing data', err);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load pricing information. Please try again.'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPricing();
  }, [setLocation, toast, addons]);

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
  const selectedAddons = addonsList.length > 0 
    ? addonsList 
    : addons.map(addon => pricingData?.addons[addon])
           .filter(Boolean)
           .map(addon => ({ id: addon.name.toLowerCase().replace(/\s+/g, '-'), ...addon }));

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