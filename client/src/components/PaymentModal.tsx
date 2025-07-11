import React, { useState, useEffect } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { X, CreditCard } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  videoTitle: string;
  videoPrice: number;
  videoId: number;
}

export function PaymentModal({ isOpen, onClose, onSuccess, videoTitle, videoPrice, videoId }: PaymentModalProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

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
      setPaymentIntentId(data.clientSecret?.split('_secret_')[0]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
    }
  };

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">Complete Purchase</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

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
            <div>
              <Label>Payment Details</Label>
              <div className="mt-2">
                <PaymentElement />
              </div>
            </div>

            {/* Test Card Info */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-1">
                Test Mode - Use Test Card:
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-300 font-mono">
                4242 4242 4242 4242 | Any future date | Any CVC
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={!stripe || isProcessing}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isProcessing ? "Processing..." : `Pay $${videoPrice.toFixed(2)}`}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}