import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Initialize Stripe
const publicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
console.log('Stripe public key check:', {
  exists: !!publicKey,
  isTestKey: publicKey?.startsWith('pk_test_'),
  keyPrefix: publicKey?.substring(0, 15)
});

if (!publicKey) {
  console.error('VITE_STRIPE_PUBLIC_KEY environment variable is missing');
}

const stripePromise = loadStripe(publicKey!);

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
        
        // Open Stripe checkout in new window (fixes iframe security restriction)
        const checkoutUrl = `https://checkout.stripe.com/c/pay/${sessionId}`;
        console.log('Opening Stripe checkout in new window:', checkoutUrl);
        
        // Open in new tab/window to bypass iframe restrictions
        const checkoutWindow = window.open(checkoutUrl, '_blank', 'width=800,height=600');
        
        if (!checkoutWindow) {
          throw new Error('Popup blocked. Please allow popups for this site and try again.');
        }
        
        // Show success message - user will complete payment in new window
        setLoading(false);
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
            <CardTitle>Opening Secure Checkout</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">
              Opening checkout in a new window...
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

  // Success state - checkout opened in new window
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-green-600">✓ Checkout Opened</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Complete your payment in the new window. You'll be redirected back here when done.
          </p>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              After completing payment, you'll be automatically redirected back to the app.
            </p>
            <Button 
              onClick={() => setLocation('/')}
              variant="outline"
              className="w-full"
            >
              Return Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}