import { useEffect, useState } from 'react';
import { loadStripe, Stripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { CheckoutForm } from './CheckoutForm';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

// Make sure to call loadStripe outside of any component render function
// This needs to be a singleton to avoid recreating the Stripe object on every render
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
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    // Create a payment intent as soon as the page loads
    const createPaymentIntent = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiRequest('POST', '/api/create-payment-intent', {
          planTier,
          addons
        });
        
        const data = await response.json();
        
        // Handle free plans
        if (data.free) {
          setIsLoading(false);
          onFreeSuccess?.();
          return;
        }
        
        setClientSecret(data.clientSecret);
        setAmount(data.amount);
        setIsLoading(false);
      } catch (err: any) {
        setError('Failed to initialize payment. Please try again later.');
        setIsLoading(false);
        console.error('Payment initialization error:', err);
      }
    };

    createPaymentIntent();
  }, [planTier, addons, onFreeSuccess]);

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12">
            <Spinner className="h-8 w-8 mb-4" />
            <p className="text-sm text-gray-500">Initializing payment...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="text-red-500 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-10 w-10"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p className="text-center text-gray-700 mb-4">{error}</p>
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 text-sm"
            >
              Go Back
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const options: StripeElementsOptions = {
    clientSecret: clientSecret!,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#9b846c',
        colorBackground: '#ffffff',
        colorText: '#3c3c3c',
        colorDanger: '#ef4444',
        fontFamily: 'Inter, system-ui, sans-serif',
        borderRadius: '8px',
      },
    },
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="pt-6">
        {clientSecret && (
          <Elements options={options} stripe={stripePromise}>
            <CheckoutForm 
              onSuccess={onPaymentSuccess} 
              onCancel={onCancel} 
              amount={amount}
            />
          </Elements>
        )}
      </CardContent>
    </Card>
  );
}