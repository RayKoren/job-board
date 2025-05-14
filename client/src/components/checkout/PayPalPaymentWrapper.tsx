import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import PayPalButton from '@/components/PayPalButton';

interface PayPalPaymentWrapperProps {
  planTier: string;
  addons?: string[];
  onPaymentSuccess?: (orderId: string) => void;
  onCancel?: () => void;
  onFreeSuccess?: () => void; // Called when a free plan is selected (no payment required)
}

export function PayPalPaymentWrapper({
  planTier,
  addons = [],
  onPaymentSuccess,
  onCancel,
  onFreeSuccess
}: PayPalPaymentWrapperProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [price, setPrice] = useState<number>(0);
  const [orderId, setOrderId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const createPayPalOrder = async () => {
      try {
        // Create PayPal order
        const response = await apiRequest('POST', '/paypal/order', {
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
        
        if (data.id) {
          setOrderId(data.id);
          
          // Extract the amount from the response
          const amount = parseFloat(
            data.purchaseUnits?.[0]?.amount?.value || '0'
          );
          setPrice(amount);
        } else {
          throw new Error('Failed to create PayPal order');
        }
      } catch (err) {
        console.error('Failed to create PayPal order:', err);
        toast({
          variant: 'destructive',
          title: 'Payment Error',
          description: 'Could not initialize payment. Please try again later.'
        });
      } finally {
        setIsLoading(false);
      }
    };

    createPayPalOrder();
  }, [planTier, addons, toast, onFreeSuccess]);

  // Handle successful payment
  const handlePaymentSuccess = (capturedOrderId: string) => {
    if (onPaymentSuccess) {
      onPaymentSuccess(capturedOrderId);
    }
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

  // Only show the free plan message for the "basic" plan tier
  if (planTier === 'basic' && price === 0) {
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
      
      <div className="mb-6">
        <p className="text-gray-700 mb-4">
          Complete your job posting by paying with PayPal. You can use a PayPal account or credit/debit card.
        </p>
        
        <div className="font-medium text-lg mb-6">
          Amount to pay: <span className="text-green-700">${price.toFixed(2)}</span>
        </div>
      </div>
      
      <div className="flex flex-col space-y-4">
        <div className="paypal-button-container">
          <div className="bg-[#FFC439] text-blue-900 rounded-md py-2.5 px-4 flex items-center justify-center font-bold mb-4">
            <PayPalButton 
              amount={price.toString()}
              currency="USD"
              intent="CAPTURE"
            />
          </div>
        </div>
        
        {onCancel && (
          <Button 
            variant="outline"
            onClick={onCancel}
            className="w-full"
          >
            Cancel Payment
          </Button>
        )}
      </div>
    </div>
  );
}