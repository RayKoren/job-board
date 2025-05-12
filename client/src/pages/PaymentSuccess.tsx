import { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { apiRequest } from '@/lib/queryClient';

// Load stripe outside of component render
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export default function PaymentSuccessPage() {
  const [_, setLocation] = useLocation();
  const [match, params] = useRoute('/payment-success');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get the client secret from the URL query parameters
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const paymentIntentId = urlParams.get('payment_intent');
    const paymentIntentClientSecret = urlParams.get('payment_intent_client_secret');

    if (!paymentIntentId) {
      setStatus('error');
      setError('Payment information not found. Your payment may not have been completed.');
      return;
    }

    const verifyPayment = async () => {
      try {
        // Verify payment status with the server
        const response = await apiRequest('GET', `/api/verify-payment/${paymentIntentId}`);
        const data = await response.json();

        if (data.success) {
          setStatus('success');
        } else {
          setStatus('error');
          setError(`Payment status: ${data.status}. Please contact support if you believe this is an error.`);
        }
      } catch (err) {
        console.error('Error verifying payment:', err);
        setStatus('error');
        setError('Failed to verify payment status. Please contact support.');
      }
    };

    verifyPayment();
  }, []);

  if (status === 'loading') {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-xl text-center">Verifying Your Payment</CardTitle>
            <CardDescription className="text-center">
              Please wait while we confirm your payment...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-10">
            <Spinner className="h-10 w-10" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-xl text-center text-red-600">Payment Issue</CardTitle>
            <CardDescription className="text-center">
              We encountered a problem with your payment
            </CardDescription>
          </CardHeader>
          <CardContent className="py-4">
            <div className="flex flex-col items-center">
              <div className="rounded-full bg-red-100 p-3 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6 text-red-600"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <p className="text-center text-sm text-gray-600 mb-4">
                {error || 'An unexpected error occurred. Please try again.'}
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => setLocation('/pricing')}
            >
              Return to Pricing
            </Button>
            <Button onClick={() => setLocation('/contact')}>
              Contact Support
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-xl text-center text-green-600">Payment Successful!</CardTitle>
          <CardDescription className="text-center">
            Thank you for your payment
          </CardDescription>
        </CardHeader>
        <CardContent className="py-4">
          <div className="flex flex-col items-center">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-green-600"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <p className="text-center text-sm text-gray-600 mb-4">
              Your payment has been processed successfully. You can now continue with your job posting.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={() => setLocation('/post-job')}>
            Continue to Job Posting
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}