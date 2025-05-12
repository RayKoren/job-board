import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { CheckoutForm } from './CheckoutForm';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Spinner } from '@/components/ui/spinner';

// Make sure to call loadStripe outside of a component's render
// to avoid recreating the Stripe object on every render
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface StripePaymentWrapperProps {
  planTier: string;
  addons?: string[];
  onPaymentSuccess?: (paymentIntentId: string) => void;
  onCancel?: () => void;
  onFreeSuccess?: () => void; // Called when a free plan is selected (no payment required)
}

export function StripePaymentWrapper({
  planTier,
  addons = [],
  onPaymentSuccess,
  onCancel,
  onFreeSuccess
}: StripePaymentWrapperProps) {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [price, setPrice] = useState<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        // Calculate payment amount
        const response = await apiRequest('POST', '/api/payments/create-intent', {
          planTier,
          addons
        });
        
        const data = await response.json();
        
        // If the plan is free, handle accordingly
        if (data.freeProduct) {
          setIsLoading(false);
          setPrice(0);
          if (onFreeSuccess) {
            onFreeSuccess();
          }
          return;
        }
        
        setClientSecret(data.clientSecret);
        setPrice(data.amount / 100); // Convert cents to dollars for display
      } catch (err) {
        console.error('Failed to create payment intent:', err);
        toast({
          variant: 'destructive',
          title: 'Payment Error',
          description: 'Could not initialize payment. Please try again later.'
        });
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentIntent();
  }, [planTier, addons, toast, onFreeSuccess]);

  const options: any = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#718267', // clay color
        colorBackground: '#ffffff',
        colorText: '#444444',
        colorDanger: '#df1b41',
        fontFamily: '"Inter", system-ui, sans-serif',
        borderRadius: '6px',
      },
    },
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-full flex items-center justify-center">
        <div className="text-center">
          <Spinner className="h-10 w-10 mx-auto mb-4" />
          <p className="text-gray-600">Preparing payment...</p>
        </div>
      </div>
    );
  }

  // For free plans, show success message
  if (price === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-8 w-8 text-green-500" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 13l4 4L19 7" 
              />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No Payment Required</h3>
          <p className="text-gray-600 mb-6">
            You've selected the Basic free plan. You can now post your job without payment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-semibold mb-6">Payment Information</h2>
      
      {clientSecret && (
        <Elements stripe={stripePromise} options={options}>
          <CheckoutForm 
            price={price}
            onPaymentSuccess={onPaymentSuccess}
            onCancel={onCancel}
          />
        </Elements>
      )}
    </div>
  );
}