import React, { createContext, useContext } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface StripeContextType {
  stripePromise: Promise<import('@stripe/stripe-js').Stripe | null>;
}

const StripeContext = createContext<StripeContextType | undefined>(undefined);

export function StripeProvider({ children }: { children: React.ReactNode }) {
  const value = {
    stripePromise,
  };

  return (
    <StripeContext.Provider value={value}>
      <Elements stripe={stripePromise}>
        {children}
      </Elements>
    </StripeContext.Provider>
  );
}

export function useStripeContext() {
  const context = useContext(StripeContext);
  if (context === undefined) {
    throw new Error('useStripeContext must be used within a StripeProvider');
  }
  return context;
}