import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Loader2, Play } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface SessionDetails {
  status: string;
  customerEmail: string;
  metadata: {
    videoId: string;
    videoTitle: string;
  };
}

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessionDetails = async () => {
      try {
        // Get session ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');

        if (!sessionId) {
          setError('No session ID found');
          setLoading(false);
          return;
        }

        // Fetch session details from backend
        const response = await apiRequest('GET', `/api/checkout-session?sessionId=${sessionId}`);
        const data = await response.json();

        if (response.ok) {
          setSessionDetails(data);
        } else {
          setError(data.error || 'Failed to fetch session details');
        }
      } catch (err: any) {
        console.error('Error fetching session details:', err);
        setError('Failed to verify payment');
      } finally {
        setLoading(false);
      }
    };

    fetchSessionDetails();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-lg mx-4">
          <CardHeader className="text-center">
            <CardTitle>Verifying Payment</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">
              Please wait while we verify your payment...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-lg mx-4">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Payment Verification Failed</CardTitle>
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-full max-w-lg mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-green-600 dark:text-green-400">
            Payment Successful!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {sessionDetails && (
            <>
              <div className="text-center space-y-2">
                <p className="text-muted-foreground">
                  Thank you for your purchase, <strong>{sessionDetails.customerEmail}</strong>
                </p>
                <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300">
                  Payment Status: {sessionDetails.status}
                </Badge>
              </div>

              <div className="bg-muted rounded-lg p-4 space-y-2">
                <h3 className="font-semibold">Purchase Details</h3>
                <p className="text-sm text-muted-foreground">
                  <strong>Video:</strong> {sessionDetails.metadata.videoTitle}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Video ID:</strong> {sessionDetails.metadata.videoId}
                </p>
              </div>

              <div className="space-y-3">
                <Button asChild className="w-full">
                  <Link href={`/video/${sessionDetails.metadata.videoId}`}>
                    <Play className="w-4 h-4 mr-2" />
                    Watch Now
                  </Link>
                </Button>
                
                <Button variant="outline" asChild className="w-full">
                  <Link href="/library">
                    View My Library
                  </Link>
                </Button>
                
                <Button variant="ghost" asChild className="w-full">
                  <Link href="/">
                    Return Home
                  </Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}