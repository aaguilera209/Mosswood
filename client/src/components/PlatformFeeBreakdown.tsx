import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface PlatformFeeBreakdownProps {
  price: number; // Price in dollars
  className?: string;
}

export function PlatformFeeBreakdown({ price, className }: PlatformFeeBreakdownProps) {
  const priceInCents = Math.round(price * 100);
  const PLATFORM_FEE_BPS = 1000; // 10%
  const MINIMUM_FEE_CENTS = 10; // $0.10 minimum

  const platformFeeAmount = Math.max(
    MINIMUM_FEE_CENTS,
    Math.round(priceInCents * PLATFORM_FEE_BPS / 10000)
  );

  const creatorAmount = priceInCents - platformFeeAmount;
  const platformFeePercent = (platformFeeAmount / priceInCents * 100).toFixed(1);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Payment Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm">Video Price</span>
          <span className="font-semibold">${price.toFixed(2)}</span>
        </div>
        
        <Separator />
        
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">
            Platform Fee ({platformFeePercent}%)
          </span>
          <span className="text-muted-foreground">
            ${(platformFeeAmount / 100).toFixed(2)}
          </span>
        </div>
        
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Creator Gets</span>
          <span className="text-muted-foreground">
            ${(creatorAmount / 100).toFixed(2)}
          </span>
        </div>
        
        <Separator />
        
        <div className="flex justify-between items-center font-semibold">
          <span>You Pay</span>
          <span>${price.toFixed(2)}</span>
        </div>

        <div className="mt-3 p-2 bg-muted rounded-md">
          <p className="text-xs text-muted-foreground">
            The platform fee supports creator tools, hosting, and platform development. 
            Creators receive {((creatorAmount / priceInCents) * 100).toFixed(0)}% of your payment.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}