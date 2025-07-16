import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle, ArrowLeft, CreditCard } from 'lucide-react';

export default function PaymentCancel() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-full max-w-lg mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mb-4">
            <XCircle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          </div>
          <CardTitle className="text-orange-600 dark:text-orange-400">
            Payment Cancelled
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              Your payment was cancelled. No charges were made to your account.
            </p>
            <p className="text-sm text-muted-foreground">
              You can try again anytime or continue browsing our content.
            </p>
          </div>

          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="javascript:history.back()">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Try Again
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link href="/explore">
                <CreditCard className="w-4 h-4 mr-2" />
                Browse More Videos
              </Link>
            </Button>
            
            <Button variant="ghost" asChild className="w-full">
              <Link href="/">
                Return Home
              </Link>
            </Button>
          </div>

          <div className="bg-muted rounded-lg p-4">
            <h3 className="font-semibold mb-2">Need Help?</h3>
            <p className="text-sm text-muted-foreground">
              If you're experiencing issues with payment, please check your payment method 
              or contact our support team.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}