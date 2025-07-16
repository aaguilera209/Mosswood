import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

export default function Checkout() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const redirectToCheckout = async () => {
      try {
        // Get sessionId from URL query parameters
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('sessionId');

        if (!sessionId) {
          console.error('No sessionId found in URL params:', window.location.search);
          setError('No session ID provided');
          setLoading(false);
          return;
        }

        // Load Stripe and redirect to checkout
        const stripe = await stripePromise;
        if (!stripe) {
          console.error('Failed to load Stripe. Public key:', import.meta.env.VITE_STRIPE_PUBLIC_KEY?.substring(0, 10) + '...');
          setError('Failed to load Stripe');
          setLoading(false);
          return;
        }
        
        console.log('Stripe loaded successfully, environment mode:', import.meta.env.MODE);

        console.log('Attempting to redirect to Stripe with sessionId:', sessionId);
        
        // Try direct redirect to Stripe Checkout URL as backup
        try {
          // Primary method: redirectToCheckout
          const result = await stripe.redirectToCheckout({
            sessionId: sessionId,
          });
          
          if (result.error) {
            console.error('Stripe checkout error:', result.error);
            // Fallback: direct redirect to Stripe
            window.location.href = `https://checkout.stripe.com/pay/${sessionId}`;
          }
        } catch (redirectError: any) {
          console.error('redirectToCheckout failed, trying direct redirect:', redirectError);
          // Direct redirect as fallback
          window.location.href = `https://checkout.stripe.com/pay/${sessionId}`;
        }
      } catch (err: any) {
        console.error('Checkout error:', err);
        console.error('Error details:', {
          message: err.message,
          stack: err.stack,
          name: err.name,
          type: typeof err
        });
        setError(`An unexpected error occurred: ${err.message || 'Unknown error'}`);
        setLoading(false);
      }
    };

    redirectToCheckout();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <CardTitle>Redirecting to Checkout</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">
              Please wait while we redirect you to secure checkout...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Checkout Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <Button 
              onClick={() => setLocation('/')}
              variant="outline"
              className="w-full"
            >
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}