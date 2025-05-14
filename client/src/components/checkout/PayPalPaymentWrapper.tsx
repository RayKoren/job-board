import { useState, useEffect, useRef } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';

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
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const paypalButtonRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load the PayPal SDK script
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const loadPayPalScript = () => {
      const script = document.createElement('script');
      script.src = 'https://www.sandbox.paypal.com/web-sdk/v6/core';
      script.async = true;
      script.onload = () => {
        console.log('PayPal SDK script loaded successfully');
        setScriptLoaded(true);
      };
      script.onerror = () => {
        console.error('Failed to load PayPal SDK script');
      };
      document.body.appendChild(script);
    };
    
    if (!(window as any).paypal) {
      loadPayPalScript();
    } else {
      setScriptLoaded(true);
    }
  }, []);

  // Step 1: Create PayPal order and get order ID
  useEffect(() => {
    const createPayPalOrder = async () => {
      try {
        console.log('Creating PayPal order with:', { planTier, addons });
        
        // Create PayPal order
        const response = await apiRequest('POST', '/paypal/order', {
          planTier,
          addons
        });
        
        const data = await response.json();
        console.log('Response from PayPal order creation:', data);
        
        // If the plan is free, handle accordingly
        if (data.freeProduct) {
          console.log('Free plan detected, no payment needed');
          setIsLoading(false);
          setPrice(0);
          if (onFreeSuccess) {
            onFreeSuccess();
          }
          return;
        }
        
        if (data.id) {
          console.log('PayPal order created with ID:', data.id);
          setOrderId(data.id);
          
          // Extract the amount from the response
          // Calculate the amount from the server response
          // First try to get from PayPal response, then fall back to the amount property
          const amount = parseFloat(
            data.purchase_units?.[0]?.amount?.value || 
            data.purchaseUnits?.[0]?.amount?.value || 
            data.amount || 
            '0'
          );
          
          console.log('Price calculation data:', {
            fromResponse: data.purchase_units?.[0]?.amount?.value || data.purchaseUnits?.[0]?.amount?.value,
            fromAmount: data.amount,
            finalAmount: amount
          });
          console.log('Amount extracted from response:', amount);
          setPrice(amount);
        } else {
          throw new Error('Failed to create PayPal order - no ID returned');
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

  // Step 2: Initialize PayPal button when script is loaded and orderId is available
  useEffect(() => {
    const initializePayPalButton = async () => {
      if (!scriptLoaded || !orderId || !paypalButtonRef.current) return;
      
      try {
        console.log('Initializing PayPal button with order ID:', orderId);
        
        // Get the client token
        const tokenResponse = await fetch('/paypal/setup');
        const tokenData = await tokenResponse.json();
        
        if (!tokenData.clientToken) {
          throw new Error('Failed to get PayPal client token');
        }
        
        console.log('PayPal client token received');
        
        const { paypal } = window as any;
        if (!paypal) {
          throw new Error('PayPal SDK not loaded');
        }
        
        // Clear existing content
        paypalButtonRef.current.innerHTML = '';
        
        // Create the PayPal button
        const sdkInstance = await paypal.createInstance({
          clientToken: tokenData.clientToken,
          components: ['paypal-payments'],
        });
        
        const paypalCheckout = sdkInstance.createPayPalOneTimePaymentSession({
          onApprove: async (data: any) => {
            console.log('Payment approved:', data);
            
            try {
              // Capture the order
              const captureResponse = await fetch(`/paypal/order/${orderId}/capture`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
              });
              
              const captureData = await captureResponse.json();
              console.log('Payment captured:', captureData);
              
              toast({
                title: 'Payment Successful',
                description: 'Your payment has been processed successfully.',
              });
              
              if (onPaymentSuccess) {
                onPaymentSuccess(orderId);
              }
            } catch (error) {
              console.error('Failed to capture payment:', error);
              toast({
                variant: 'destructive',
                title: 'Payment Error',
                description: 'Your payment was approved but could not be captured.',
              });
            }
          },
          onCancel: () => {
            console.log('Payment cancelled');
            toast({
              title: 'Payment Cancelled',
              description: 'You cancelled the payment process.',
            });
          },
          onError: (err: any) => {
            console.error('Payment error:', err);
            toast({
              variant: 'destructive',
              title: 'Payment Error',
              description: 'There was an error processing your payment.',
            });
          },
        });
        
        // Create the button element
        const paypalButton = document.createElement('paypal-button');
        paypalButton.id = 'paypal-button';
        paypalButton.textContent = 'Pay with PayPal';
        paypalButtonRef.current.appendChild(paypalButton);
        
        // Setup click handler
        paypalButton.addEventListener('click', async () => {
          try {
            console.log('PayPal button clicked, starting checkout with order ID:', orderId);
            // Create a Promise that resolves with the orderId object
            const orderPromise = Promise.resolve({ orderId });
            
            // Start the PayPal checkout with the promise
            await paypalCheckout.start(
              { paymentFlow: 'auto' },
              orderPromise
            );
          } catch (err) {
            console.error('Failed to start PayPal checkout:', err);
          }
        });
      } catch (error) {
        console.error('Error initializing PayPal button:', error);
        toast({
          variant: 'destructive',
          title: 'Payment Setup Error',
          description: 'Could not initialize the PayPal payment button.',
        });
      }
    };
    
    initializePayPalButton();
  }, [scriptLoaded, orderId, onPaymentSuccess, toast]);

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
          {orderId ? (
            <div 
              ref={paypalButtonRef}
              className="bg-[#FFC439] hover:bg-[#F2BA36] text-blue-900 rounded-md py-2.5 px-4 flex items-center justify-center font-bold mb-4 cursor-pointer h-12"
            >
              {!scriptLoaded && <Spinner className="h-5 w-5 mr-2" />}
              <span>Pay with PayPal</span>
            </div>
          ) : (
            <div className="bg-gray-200 text-gray-500 rounded-md py-2.5 px-4 flex items-center justify-center font-bold mb-4 h-12">
              <span>PayPal Button Unavailable</span>
            </div>
          )}
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