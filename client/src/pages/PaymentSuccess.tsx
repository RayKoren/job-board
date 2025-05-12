import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { Check, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PaymentSuccessPage() {
  const [_, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        // Get the payment intent ID from URL
        const searchParams = new URLSearchParams(window.location.search);
        const paymentIntentId = searchParams.get('payment_intent');
        
        if (!paymentIntentId) {
          setError('No payment information found.');
          setIsLoading(false);
          return;
        }
        
        // Call API to verify payment
        const response = await apiRequest('GET', `/api/payments/${paymentIntentId}`);
        const data = await response.json();
        
        if (data.status === 'succeeded') {
          setPaymentDetails(data);
          
          // Check for a pending job post in localStorage
          const pendingJobPost = localStorage.getItem('pendingJobPost');
          if (pendingJobPost) {
            // Leave it in localStorage - we'll process it when the user goes to post-job page
            // with the continue=true parameter
          }
        } else {
          setError('Your payment is still processing. Please check back in a few minutes.');
        }
      } catch (err) {
        console.error('Error fetching payment details:', err);
        setError('Failed to verify payment. Please contact support.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isAuthenticated) {
      fetchPaymentDetails();
    } else {
      setIsLoading(false);
      setError('Please log in to view payment details.');
    }
  }, [isAuthenticated]);

  const handleContinue = () => {
    setLocation('/post-job?continue=true');
  };

  const handleViewDashboard = () => {
    setLocation('/business/dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <Spinner className="h-10 w-10 mx-auto mb-4" />
            <p className="text-gray-600">Verifying your payment...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="pt-28 pb-20 flex-grow">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            {error ? (
              <div className="text-center">
                <div className="bg-amber-100 p-4 rounded-full h-16 w-16 mx-auto mb-4 flex items-center justify-center">
                  <Clock className="h-8 w-8 text-amber-500" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-4">Payment Status</h1>
                <p className="text-gray-600 mb-6">{error}</p>
                <Button onClick={() => setLocation('/')}>
                  Return to Home
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <div className="bg-green-100 p-4 rounded-full h-16 w-16 mx-auto mb-4 flex items-center justify-center">
                  <Check className="h-8 w-8 text-green-500" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h1>
                <p className="text-gray-600 mb-6">
                  Thank you for your payment. Your job posting plan has been activated.
                </p>
                
                {paymentDetails && (
                  <div className="border-t border-gray-200 pt-6 mb-6">
                    <div className="grid grid-cols-2 gap-4 text-sm text-left">
                      <div className="text-gray-500">Amount Paid:</div>
                      <div className="font-medium text-right">${(paymentDetails.amount / 100).toFixed(2)}</div>
                      
                      <div className="text-gray-500">Date:</div>
                      <div className="font-medium text-right">
                        {new Date(paymentDetails.created * 1000).toLocaleDateString()}
                      </div>
                      
                      <div className="text-gray-500">Transaction ID:</div>
                      <div className="font-medium text-right text-gray-800 truncate">
                        {paymentDetails.id}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 justify-center">
                  <Button 
                    onClick={handleContinue}
                    className="bg-clay hover:bg-clay/90"
                  >
                    Continue to Job Posting
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleViewDashboard}
                  >
                    View Dashboard
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}