import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, ExternalLink, CreditCard, DollarSign, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface StripeAccountStatus {
  has_account: boolean;
  onboarding_complete: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  requirements: string[];
  stripe_account_id?: string;
}

export function StripeConnectSetup() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);



  // Check URL parameters for onboarding status
  const urlParams = new URLSearchParams(window.location.search);
  const stripeSetupComplete = urlParams.get('stripe_setup') === 'complete';
  const stripeRefresh = urlParams.get('stripe_refresh') === 'true';

  // Fetch Stripe account status
  const { data: accountStatus, isLoading, refetch } = useQuery<StripeAccountStatus>({
    queryKey: ['stripe-account-status'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/stripe-account-status');
      return response.json();
    },
    enabled: !!user && profile?.role === 'creator',
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Refresh status when returning from Stripe onboarding
  useEffect(() => {
    if (stripeSetupComplete || stripeRefresh) {
      refetch();
      // Clean up URL parameters
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [stripeSetupComplete, stripeRefresh, refetch]);

  // Create Stripe Connect account mutation
  const createAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/create-connect-account');
      return response.json();
    },
    onSuccess: (data) => {
      if (data.onboarding_url) {
        // For production: use redirect flow for better UX
        // For development in Replit: use popup to avoid iframe restrictions
        const isReplit = window.location.hostname.includes('replit.dev') || window.location.hostname.includes('replit.app');
        
        if (isReplit) {
          // Development: Use popup to avoid Replit iframe issues
          const newWindow = window.open(data.onboarding_url, '_blank', 'width=800,height=800,scrollbars=yes,resizable=yes');
          
          if (newWindow) {
            toast({
              title: "Opening Stripe Setup",
              description: "Complete your payment setup in the new window, then return here.",
            });
            
            // Check if window was closed (user completed or cancelled)
            const checkClosed = setInterval(() => {
              if (newWindow.closed) {
                clearInterval(checkClosed);
                // Refresh the account status when they return
                queryClient.invalidateQueries({ queryKey: ['stripe-account-status'] });
              }
            }, 1000);
          } else {
            // Fallback if popup was blocked
            toast({
              title: "Popup Blocked",
              description: "Please allow popups and try again.",
              variant: "destructive",
            });
          }
        } else {
          // Production: Use redirect flow for better UX
          toast({
            title: "Redirecting to Stripe",
            description: "You'll be redirected to complete your payment setup.",
          });
          setTimeout(() => {
            window.location.href = data.onboarding_url;
          }, 1000);
        }
      } else {
        toast({
          title: "Setup Complete",
          description: "Your Stripe account is already configured.",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to create Stripe account. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsCreatingAccount(false);
    }
  });

  const handleSetupPayments = () => {
    setIsCreatingAccount(true);
    createAccountMutation.mutate();
  };

  if (profile?.role !== 'creator') {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Setup
          </CardTitle>
          <CardDescription>Checking your payment configuration...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-8 h-8 mx-auto animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </CardContent>
      </Card>
    );
  }

  if (!accountStatus?.has_account) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Set Up Payments
          </CardTitle>
          <CardDescription>
            Connect your Stripe account to start receiving payments from your videos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Payment Setup Required</AlertTitle>
            <AlertDescription>
              You need to set up a Stripe account to receive payments from video purchases. 
              This is quick and secure through Stripe's onboarding process.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <h4 className="font-semibold">What you'll need:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Business or personal information</li>
              <li>• Bank account details for payouts</li>
              <li>• Tax identification information</li>
            </ul>
          </div>

          <Button 
            onClick={handleSetupPayments}
            disabled={isCreatingAccount || createAccountMutation.isPending}
            className="w-full"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            {isCreatingAccount || createAccountMutation.isPending ? "Setting up..." : "Set Up Payments"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = () => {
    if (accountStatus.onboarding_complete && accountStatus.charges_enabled && accountStatus.payouts_enabled) {
      return <Badge className="bg-green-500 text-white">Active</Badge>;
    } else if (accountStatus.onboarding_complete) {
      return <Badge variant="secondary">Pending Approval</Badge>;
    } else {
      return <Badge variant="destructive">Setup Incomplete</Badge>;
    }
  };

  const getStatusMessage = () => {
    if (accountStatus.onboarding_complete && accountStatus.charges_enabled && accountStatus.payouts_enabled) {
      return "Your payment account is fully active and ready to receive payments.";
    } else if (accountStatus.onboarding_complete) {
      return "Your account setup is complete. Stripe is reviewing your information for final approval.";
    } else {
      return "Please complete your Stripe account setup to start receiving payments.";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Account
          </div>
          {getStatusBadge()}
        </CardTitle>
        <CardDescription>
          Manage your Stripe Connect account for receiving payments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            {accountStatus.onboarding_complete ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
            )}
            <span className="text-sm">Setup Complete</span>
          </div>
          
          <div className="flex items-center gap-2">
            {accountStatus.charges_enabled ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
            )}
            <span className="text-sm">Accept Payments</span>
          </div>
          
          <div className="flex items-center gap-2">
            {accountStatus.payouts_enabled ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
            )}
            <span className="text-sm">Receive Payouts</span>
          </div>
        </div>

        <Alert>
          <DollarSign className="h-4 w-4" />
          <AlertTitle>Account Status</AlertTitle>
          <AlertDescription>{getStatusMessage()}</AlertDescription>
        </Alert>

        {!accountStatus.onboarding_complete && (
          <Button 
            onClick={handleSetupPayments}
            disabled={isCreatingAccount || createAccountMutation.isPending}
            className="w-full"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            {isCreatingAccount || createAccountMutation.isPending ? "Opening Stripe..." : "Complete Setup"}
          </Button>
        )}

        {accountStatus.requirements && accountStatus.requirements.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Action Required</AlertTitle>
            <AlertDescription>
              Stripe needs additional information: {accountStatus.requirements.join(', ')}
              <Button 
                variant="link" 
                className="p-0 ml-2 h-auto"
                onClick={handleSetupPayments}
              >
                Complete now
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}