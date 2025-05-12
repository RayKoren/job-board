import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';

interface CheckoutFormProps {
  price: number;
  onPaymentSuccess?: (paymentIntentId: string) => void;
  onCancel?: () => void;
}

export function CheckoutForm({ price, onPaymentSuccess, onCancel }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't loaded yet
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url: `${window.location.origin}/payment-success`,
      }
    });

    if (error) {
      setPaymentError(error.message || 'An error occurred during payment processing.');
      toast({
        variant: 'destructive',
        title: 'Payment Failed',
        description: error.message || 'Your payment could not be processed.'
      });
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Payment successful
      toast({
        title: 'Payment Successful',
        description: 'Your payment has been successfully processed.'
      });
      if (onPaymentSuccess) {
        onPaymentSuccess(paymentIntent.id);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement className="mb-6" />
      
      {paymentError && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
          {paymentError}
        </div>
      )}
      
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Total Amount:</span>
          <span className="text-xl font-semibold">${price.toFixed(2)}</span>
        </div>
        <p className="text-xs text-gray-500">
          Your payment is processed securely through Stripe. We do not store your payment details.
        </p>
      </div>
      
      <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
        {onCancel && (
          <Button 
            type="button" 
            variant="outline" 
            className="w-full"
            onClick={onCancel}
            disabled={isProcessing}
          >
            Cancel
          </Button>
        )}
        
        <Button 
          type="submit" 
          className="w-full bg-clay hover:bg-clay/90 text-white"
          disabled={isProcessing || !stripe || !elements}
        >
          {isProcessing ? (
            <span className="flex items-center justify-center">
              <Spinner className="h-5 w-5 mr-2" />
              Processing...
            </span>
          ) : (
            `Pay $${price.toFixed(2)}`
          )}
        </Button>
      </div>
    </form>
  );
}