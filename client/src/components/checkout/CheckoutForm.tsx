import { useState, useEffect } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';

interface CheckoutFormProps {
  onSuccess?: (paymentIntentId: string) => void;
  onCancel?: () => void;
  amount: number;
}

export function CheckoutForm({ onSuccess, onCancel, amount }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    // Get payment intent client secret from URL query params
    const clientSecret = new URLSearchParams(window.location.search).get(
      'payment_intent_client_secret'
    );

    if (!clientSecret) {
      return;
    }

    // Retrieve the payment intent using the client secret
    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      if (!paymentIntent) return;

      switch (paymentIntent.status) {
        case 'succeeded':
          setMessage('Payment succeeded!');
          onSuccess?.(paymentIntent.id);
          break;
        case 'processing':
          setMessage('Your payment is processing.');
          break;
        case 'requires_payment_method':
          setMessage('Please provide your payment information.');
          break;
        default:
          setMessage('Something went wrong.');
          break;
      }
    });
  }, [stripe, onSuccess]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded.
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success`,
      },
      redirect: 'if_required'
    });

    if (error) {
      if (error.type === 'card_error' || error.type === 'validation_error') {
        setMessage(error.message || 'An unexpected error occurred');
        toast({
          variant: 'destructive',
          title: 'Payment Failed',
          description: error.message || 'An unexpected error occurred'
        });
      } else {
        setMessage('An unexpected error occurred');
        toast({
          variant: 'destructive',
          title: 'Payment Failed',
          description: 'An unexpected error occurred'
        });
      }
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-1">Payment Information</h3>
        <p className="text-gray-500 text-sm">
          Total amount: ${amount.toFixed(2)}
        </p>
      </div>
      
      <PaymentElement />
      
      <div className="flex justify-between mt-6">
        <Button 
          type="button" 
          variant="outline" 
          disabled={isLoading} 
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading || !stripe || !elements}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Spinner className="h-4 w-4" /> Processing...
            </span>
          ) : (
            `Pay $${amount.toFixed(2)}`
          )}
        </Button>
      </div>
      
      {message && <div className="mt-4 text-sm text-center text-gray-600">{message}</div>}
    </form>
  );
}