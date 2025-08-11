import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowLeft, Play, Loader } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);
  const [purchaseDetails, setPurchaseDetails] = useState<any>(null);
  const [videoId, setVideoId] = useState<string | null>(null);

  useEffect(() => {
    const processPayment = async () => {
      try {
        // Get session ID from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');

        if (!sessionId) {
          toast({
            title: "Error",
            description: "Payment session not found",
            variant: "destructive",
          });
          setLocation('/');
          return;
        }

        console.log('Processing payment for session:', sessionId);

        // Process the checkout and record the purchase
        const response = await apiRequest('POST', '/api/process-checkout', {
          sessionId
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to process payment');
        }

        const result = await response.json();
        console.log('Payment processed successfully:', result);

        // Get session details for display
        const sessionResponse = await apiRequest('GET', `/api/checkout-session?sessionId=${sessionId}`);
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          setPurchaseDetails(sessionData);
          setVideoId(sessionData.metadata?.videoId);
        }

        toast({
          title: "Payment Successful!",
          description: "Your video purchase has been completed. You can now watch the video.",
        });

      } catch (error: any) {
        console.error('Payment processing error:', error);
        toast({
          title: "Payment Processing Error",
          description: error.message || "There was an issue processing your payment",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    };

    processPayment();
  }, [setLocation, toast]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 text-center">
          <div className="max-w-md mx-auto">
            <Loader className="h-8 w-8 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Processing Payment...</h1>
            <p className="text-muted-foreground">Please wait while we confirm your purchase.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
            
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Payment Successful!
            </h1>
            
            <p className="text-lg text-muted-foreground mb-6">
              Thank you for your purchase. Your video is now available to watch.
            </p>

            {purchaseDetails && (
              <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold mb-2">Purchase Details</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Customer Email:</span>
                    <span>{purchaseDetails.customerEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Status:</span>
                    <span className="capitalize text-green-600 font-medium">
                      {purchaseDetails.status}
                    </span>
                  </div>
                  {purchaseDetails.metadata?.videoTitle && (
                    <div className="flex justify-between">
                      <span>Video:</span>
                      <span>{purchaseDetails.metadata.videoTitle}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {videoId && (
                <Button 
                  onClick={() => setLocation(`/video/${videoId}?purchased=true&videoId=${videoId}`)}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Watch Video Now
                </Button>
              )}
              
              <Button 
                variant="outline" 
                onClick={() => setLocation('/library')}
              >
                View My Library
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={() => setLocation('/')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}