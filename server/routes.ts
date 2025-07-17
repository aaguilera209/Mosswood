import type { Express, Request, Response } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import Stripe from "stripe";
import { getVideoById } from "../shared/videoData";
import { createClient } from '@supabase/supabase-js';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Supabase client (optional for testing)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

console.log('Supabase configuration check:', {
  hasUrl: !!supabaseUrl,
  hasServiceKey: !!supabaseServiceKey,
  urlValue: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'missing'
});

const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

// Frontend URL for redirects - use Replit domain or localhost
const FRONTEND_URL = process.env.REPLIT_DOMAIN 
  ? `https://${process.env.REPLIT_DOMAIN}` 
  : 'http://localhost:5000';

export async function registerRoutes(app: Express): Promise<Server> {
  // Stripe Connect Express account creation endpoint
  app.post("/api/create-connect-account", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const user = req.user as any;
      
      if (!supabase) {
        return res.status(500).json({ error: "Database connection not available" });
      }

      // Check if user is a creator
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, stripe_account_id, stripe_onboarding_complete')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      if (profile.role !== 'creator') {
        return res.status(403).json({ error: "Only creators can set up Stripe accounts" });
      }

      let stripeAccountId = profile.stripe_account_id;

      // Create Stripe Express account if it doesn't exist
      if (!stripeAccountId) {
        const account = await stripe.accounts.create({
          type: 'express',
          email: user.email,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
        });

        stripeAccountId = account.id;

        // Store the account ID in Supabase
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ stripe_account_id: stripeAccountId })
          .eq('id', user.id);

        if (updateError) {
          console.error('Failed to store Stripe account ID:', updateError);
          return res.status(500).json({ error: "Failed to store account information" });
        }
      }

      // Create account link for onboarding
      const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: `${FRONTEND_URL}/dashboard?stripe_refresh=true`,
        return_url: `${FRONTEND_URL}/dashboard?stripe_setup=complete`,
        type: 'account_onboarding',
      });

      res.json({ 
        onboarding_url: accountLink.url,
        stripe_account_id: stripeAccountId 
      });

    } catch (error: any) {
      console.error('Stripe Connect account creation error:', error);
      res.status(500).json({ 
        error: "Failed to create Stripe account", 
        details: error.message 
      });
    }
  });

  // Check Stripe Connect account status
  app.get("/api/stripe-account-status", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const user = req.user as any;
      
      if (!supabase) {
        return res.status(500).json({ error: "Database connection not available" });
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('stripe_account_id, stripe_onboarding_complete, stripe_charges_enabled, stripe_payouts_enabled')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      if (!profile.stripe_account_id) {
        return res.json({ 
          has_account: false,
          onboarding_complete: false,
          charges_enabled: false,
          payouts_enabled: false
        });
      }

      // Fetch account details from Stripe
      const account = await stripe.accounts.retrieve(profile.stripe_account_id);

      const accountStatus = {
        has_account: true,
        onboarding_complete: account.details_submitted,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        requirements: account.requirements?.currently_due || [],
        stripe_account_id: profile.stripe_account_id
      };

      // Update local database with current status
      await supabase
        .from('profiles')
        .update({
          stripe_onboarding_complete: accountStatus.onboarding_complete,
          stripe_charges_enabled: accountStatus.charges_enabled,
          stripe_payouts_enabled: accountStatus.payouts_enabled
        })
        .eq('id', user.id);

      res.json(accountStatus);

    } catch (error: any) {
      console.error('Stripe account status error:', error);
      res.status(500).json({ 
        error: "Failed to fetch account status", 
        details: error.message 
      });
    }
  });

  // Stripe webhook endpoint (must be before body parser)
  app.post("/api/webhooks", express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: Stripe.Event;

    if (!webhookSecret) {
      console.error('Missing STRIPE_WEBHOOK_SECRET - bypassing validation for testing');
      // For testing, parse the body as JSON directly
      try {
        const body = JSON.parse(req.body.toString());
        event = body as Stripe.Event;
      } catch (err) {
        console.error('Failed to parse webhook body:', err);
        return res.status(400).send('Invalid webhook body');
      }
    } else {
      try {
        // Construct the event from the webhook payload
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
    }

    try {
      // Construct the event from the webhook payload
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle checkout session completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('Payment successful for session:', session.id);
      
      try {
        // Extract metadata from the session
        const videoId = session.metadata?.videoId;
        const userEmail = session.customer_details?.email;
        const amountTotal = session.amount_total; // Amount in cents
        
        if (!videoId || !userEmail || !amountTotal) {
          console.error('Missing required purchase data:', { videoId, userEmail, amountTotal });
          return res.status(400).json({ error: 'Missing purchase data' });
        }
        
        if (!supabase) {
          console.log('Supabase not configured - purchase recording skipped');
          console.log('Purchase would be recorded:', {
            videoId: parseInt(videoId),
            userEmail,
            amount: amountTotal
          });
          return res.json({ received: true, note: 'Purchase recording skipped - service key needed' });
        }

        console.log('Recording purchase in Supabase:', {
          videoId: parseInt(videoId),
          userEmail,
          amount: amountTotal,
          sessionId: session.id
        });
        
        // Find the user's profile by email
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', userEmail)
          .single();
        
        if (profileError || !profile) {
          console.error('User profile not found:', profileError?.message);
          return res.status(404).json({ error: 'User profile not found' });
        }
        
        // Record the purchase in Supabase
        const { data: purchase, error: purchaseError } = await supabase
          .from('purchases')
          .insert({
            profile_id: profile.id,
            video_id: parseInt(videoId),
            stripe_session_id: session.id,
            amount: amountTotal
          })
          .select()
          .single();
        
        if (purchaseError) {
          console.error('Failed to record purchase:', purchaseError.message);
          return res.status(500).json({ error: 'Failed to record purchase' });
        }
        
        console.log('Purchase recorded successfully:', {
          purchaseId: purchase.id,
          profileId: profile.id,
          videoId: parseInt(videoId),
          amount: amountTotal
        });
        
      } catch (error: any) {
        console.error('Error processing webhook:', error.message);
        return res.status(500).json({ error: 'Webhook processing failed' });
      }
    }

    res.json({ received: true });
  });

  // Create Stripe Checkout session
  app.post("/api/create-checkout-session", async (req: Request, res: Response) => {
    try {
      const { videoId } = req.body;

      if (!videoId) {
        return res.status(400).json({ error: 'videoId is required' });
      }

      // Look up the video to get price and details
      const video = getVideoById(parseInt(videoId));
      if (!video) {
        return res.status(404).json({ error: 'Video not found' });
      }

      if (video.price === 0) {
        return res.status(400).json({ error: 'This video is free' });
      }

      // Get the current domain from the request
      const host = req.get('host');
      // Force HTTPS for Stripe checkout (required by Stripe)
      const protocol = 'https';
      const baseUrl = `${protocol}://${host}`;
      
      console.log('Creating checkout session with baseUrl:', baseUrl);

      // Create Stripe Checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: video.title,
                description: video.description.substring(0, 200), // Truncate description
              },
              unit_amount: Math.round(video.price * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/payment-cancel`,
        metadata: {
          videoId: videoId.toString(),
          videoTitle: video.title.substring(0, 50), // Truncate title
        },
        // Add billing address collection for testing
        billing_address_collection: 'auto',
      });

      console.log('Checkout session created successfully:', {
        sessionId: session.id,
        successUrl: session.success_url,
        cancelUrl: session.cancel_url,
        url: session.url,
        status: session.status,
        paymentStatus: session.payment_status
      });

      // Log the full session object to debug
      console.log('Full session object keys:', Object.keys(session));
      console.log('Session URL present:', !!session.url);

      res.json({ 
        sessionId: session.id,
        url: session.url 
      });
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  });

  // Get user's purchases
  app.get("/api/purchases", async (req: Request, res: Response) => {
    try {
      const { email } = req.query;
      
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }
      
      console.log('Fetching purchases for email:', email);
      
      // Check if we have Supabase service key
      if (!process.env.SUPABASE_SERVICE_KEY || !supabase) {
        console.log('No service key available, returning empty purchases');
        return res.json({ purchases: [] });
      }
      
      // Find the user's profile by email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();
      
      if (profileError || !profile) {
        console.log('Profile not found for email:', email);
        return res.json({ purchases: [] });
      }
      
      // Get purchases for this user
      const { data: purchases, error: purchasesError } = await supabase
        .from('purchases')
        .select('*')
        .eq('profile_id', profile.id)
        .order('purchased_at', { ascending: false });
      
      if (purchasesError) {
        console.error('Error fetching purchases:', purchasesError.message);
        return res.status(500).json({ error: 'Failed to fetch purchases' });
      }
      
      console.log('Found purchases:', purchases?.length || 0);
      res.json({ purchases: purchases || [] });
      
    } catch (error: any) {
      console.error('Error in purchases API:', error.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Test endpoint to manually record a purchase
  app.post("/api/test-purchase", async (req: Request, res: Response) => {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    try {
      const { email, videoId, amount } = req.body;
      
      // Find the user's profile by email, or create one if it doesn't exist
      let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (profileError || !profile) {
        console.log('Profile not found for email:', email, 'Creating new profile...');
        
        // Create a new profile
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            email: email,
            role: 'viewer'
          })
          .select()
          .single();
          
        if (createError) {
          console.error('Error creating profile:', createError);
          return res.status(500).json({ error: 'Failed to create user profile' });
        }
        
        profile = newProfile;
        console.log('Created new profile:', profile);
      }

      // Record the purchase
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          profile_id: profile.id,
          video_id: parseInt(videoId),
          stripe_session_id: `test_${Date.now()}`,
          amount: amount
        })
        .select()
        .single();

      if (purchaseError) {
        console.error('Error recording purchase:', purchaseError);
        return res.status(500).json({ error: 'Failed to record purchase' });
      }

      console.log('Purchase recorded successfully:', purchase);
      res.json({ success: true, purchase });
    } catch (error: any) {
      console.error('Error in test purchase:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get checkout session details
  app.get("/api/checkout-session", async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.query;

      if (!sessionId || typeof sessionId !== 'string') {
        return res.status(400).json({ error: 'sessionId is required' });
      }

      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      res.json({
        status: session.payment_status,
        customerEmail: session.customer_details?.email,
        metadata: session.metadata,
      });
    } catch (error: any) {
      console.error('Error retrieving session:', error);
      res.status(500).json({ error: 'Failed to retrieve session' });
    }
  });
  // Create payment intent for video purchase
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount, videoId, videoTitle } = req.body;
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          videoId: videoId.toString(),
          videoTitle
        }
      });
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Get user's purchases
  app.get("/api/purchases", async (req, res) => {
    try {
      const { email } = req.query;
      
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: 'Email is required' });
      }
      
      if (!supabase) {
        return res.json({ purchases: [] });
      }
      
      // Find user's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();
      
      if (profileError || !profile) {
        return res.status(404).json({ error: 'User profile not found' });
      }
      
      // Get user's purchases
      const { data: purchases, error: purchasesError } = await supabase
        .from('purchases')
        .select('*')
        .eq('profile_id', profile.id)
        .order('purchased_at', { ascending: false });
      
      if (purchasesError) {
        return res.status(500).json({ error: 'Failed to fetch purchases' });
      }
      
      res.json({ purchases });
    } catch (error: any) {
      res.status(500).json({ error: 'Error fetching purchases: ' + error.message });
    }
  });

  // Check if user has purchased a video
  app.post("/api/check-purchase", async (req, res) => {
    try {
      const { email, videoId } = req.body;
      
      if (!email || !videoId) {
        return res.status(400).json({ error: 'Email and videoId are required' });
      }
      
      if (!supabase) {
        return res.json({ hasPurchased: false });
      }
      
      // Find user's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();
      
      if (profileError || !profile) {
        return res.json({ hasPurchased: false });
      }
      
      // Check if user has purchased this video
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .select('id')
        .eq('profile_id', profile.id)
        .eq('video_id', parseInt(videoId))
        .single();
      
      if (purchaseError) {
        return res.json({ hasPurchased: false });
      }
      
      res.json({ hasPurchased: !!purchase });
    } catch (error: any) {
      res.status(500).json({ error: 'Error checking purchase: ' + error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
