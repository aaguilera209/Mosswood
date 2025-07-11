import React, { useState, useEffect } from 'react';
import { useStripe, useElements, PaymentElement, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { X, CreditCard } from 'lucide-react';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  videoTitle: string;
  videoPrice: number;
  videoId: number;
}

// Payment Form Component (inside Elements provider)
function PaymentForm({ onSuccess, onClose, videoTitle, videoPrice, videoId }: Omit<PaymentModalProps, 'isOpen'>) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Load email from localStorage if available
  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements || !email || !name) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin,
          receipt_email: email,
          payment_method_data: {
            billing_details: {
              name: name,
              email: email,
            }
          }
        },
        redirect: 'if_required'
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message || "Please try again.",
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Record the purchase
        await apiRequest('POST', '/api/record-purchase', {
          email,
          videoId: videoId.toString(),
          paymentIntentId: paymentIntent.id
        });

        // Store email in localStorage for session persistence
        localStorage.setItem('userEmail', email);

        toast({
          title: "Payment Successful!",
          description: "You now have access to this video.",
        });

        onSuccess();
        onClose();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Video Info */}
      <div className="bg-muted p-4 rounded-lg">
        <div className="flex items-center space-x-3">
          <div className="bg-primary/10 p-2 rounded">
            <CreditCard className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium">{videoTitle}</h3>
            <p className="text-lg font-bold text-primary">${videoPrice.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer Information */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
        </div>

        {/* Payment Element */}
        <div className="space-y-2">
          <Label>Payment Details *</Label>
          <div className="border rounded-lg p-3">
            <PaymentElement />
          </div>
          
          {/* Test Card Info */}
          <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
            <strong>Test Mode:</strong> Use card number 4242 4242 4242 4242 with any future date and CVC.
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          disabled={!stripe || !elements || isProcessing}
        >
          {isProcessing ? 'Processing...' : `Pay $${videoPrice.toFixed(2)}`}
        </Button>
      </form>
    </div>
  );
}

// Main PaymentModal Component
export function PaymentModal({ isOpen, onClose, onSuccess, videoTitle, videoPrice, videoId }: PaymentModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const { toast } = useToast();

  // Create payment intent when modal opens
  useEffect(() => {
    if (isOpen && videoPrice > 0) {
      createPaymentIntent();
    }
  }, [isOpen, videoPrice]);

  const createPaymentIntent = async () => {
    try {
      const response = await apiRequest('POST', '/api/create-payment-intent', {
        amount: videoPrice,
        videoId,
        videoTitle
      });
      const data = await response.json();
      setClientSecret(data.clientSecret);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setClientSecret(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">Complete Purchase</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm
              onSuccess={onSuccess}
              onClose={handleClose}
              videoTitle={videoTitle}
              videoPrice={videoPrice}
              videoId={videoId}
            />
          </Elements>
        ) : (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}