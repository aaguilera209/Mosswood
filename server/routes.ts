import type { Express, Request, Response } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import Stripe from "stripe";
import { getVideoById } from "../shared/videoData";
import { createClient } from '@supabase/supabase-js';
import { insertVideoSchema, type InsertVideo, updateProfileSchema, type UpdateProfile } from "../shared/schema";

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
  // Backend video file upload endpoint
  app.post("/api/upload-video", async (req: Request, res: Response) => {
    try {
      if (!supabase) {
        return res.status(500).json({ error: "Database connection not available" });
      }

      const { fileName, fileData, contentType, userId } = req.body;
      
      if (!fileName || !fileData || !userId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Convert base64 to buffer
      const buffer = Buffer.from(fileData, 'base64');
      const filePath = `${userId}/${fileName}`;

      console.log('Backend upload attempt:', { fileName, filePath, size: buffer.length });

      const { data, error } = await supabase.storage
        .from('videos')
        .upload(filePath, buffer, {
          contentType,
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Supabase upload error:', error);
        return res.status(500).json({ error: `Upload failed: ${error.message}` });
      }

      const { data: publicUrlData } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath);

      res.json({ 
        success: true, 
        path: data.path,
        publicUrl: publicUrlData.publicUrl 
      });

    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Video metadata upload endpoint
  app.post("/api/videos", async (req: Request, res: Response) => {
    try {
      if (!supabase) {
        return res.status(500).json({ error: "Database connection not available" });
      }

      // Validate request body
      const result = insertVideoSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          error: "Invalid video data", 
          details: result.error.issues 
        });
      }

      const videoData = result.data;

      // Insert video into database
      const { data: video, error } = await supabase
        .from('videos')
        .insert([videoData])
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({ 
          error: "Failed to save video", 
          details: error.message 
        });
      }

      res.json({ 
        message: "Video uploaded successfully", 
        video 
      });
    } catch (error: any) {
      console.error('Video upload error:', error);
      res.status(500).json({ 
        error: "Internal server error", 
        details: error.message 
      });
    }
  });

  // Get a single video by ID
  app.get("/api/video/:id", async (req: Request, res: Response) => {
    try {
      if (!supabase) {
        return res.status(500).json({ error: "Database connection not available" });
      }

      const videoId = parseInt(req.params.id);
      
      if (isNaN(videoId)) {
        return res.status(400).json({ error: "Invalid video ID" });
      }

      const { data: video, error } = await supabase
        .from('videos')
        .select('*')
        .eq('id', videoId)
        .single();

      if (error) {
        console.error('Database error:', error);
        return res.status(404).json({ 
          error: "Video not found", 
          details: error.message 
        });
      }

      // Manually fetch creator profile
      const { data: creatorProfile } = await supabase
        .from('profiles')
        .select('display_name, email')
        .eq('id', video.creator_id)
        .single();

      // Add profile data to video
      const enrichedVideo = {
        ...video,
        profiles: creatorProfile || null
      };

      res.json({ video: enrichedVideo });
    } catch (error: any) {
      console.error('Video fetch error:', error);
      res.status(500).json({ 
        error: "Internal server error", 
        details: error.message 
      });
    }
  });

  // Get videos for a creator
  app.get("/api/videos", async (req: Request, res: Response) => {
    try {
      if (!supabase) {
        return res.status(500).json({ error: "Database connection not available" });
      }

      const creatorId = req.query.creator_id as string;
      
      if (!creatorId) {
        return res.status(400).json({ error: "creator_id parameter required" });
      }

      const { data: videos, error } = await supabase
        .from('videos')
        .select('*')
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({ 
          error: "Failed to fetch videos", 
          details: error.message 
        });
      }

      // Manually fetch creator profile
      const { data: creatorProfile } = await supabase
        .from('profiles')
        .select('display_name, email')
        .eq('id', creatorId)
        .single();

      // Add profile data to all videos
      const enrichedVideos = videos.map(video => ({
        ...video,
        profiles: creatorProfile || null
      }));

      res.json({ videos: enrichedVideos });
    } catch (error: any) {
      console.error('Videos fetch error:', error);
      res.status(500).json({ 
        error: "Internal server error", 
        details: error.message 
      });
    }
  });

  // Track video view endpoint
  app.post("/api/track-view", async (req: Request, res: Response) => {
    try {
      if (!supabase) {
        return res.status(500).json({ error: "Database connection not available" });
      }

      const {
        video_id,
        session_id,
        watch_duration = 0,
        device_type,
        browser,
        viewer_id = null
      } = req.body;

      // Validate required fields
      if (!video_id || !session_id) {
        return res.status(400).json({ error: "video_id and session_id are required" });
      }

      // Check if this is a returning viewer (has viewed any video before)
      let is_returning_viewer = false;
      if (viewer_id) {
        const { data: previousViews } = await supabase
          .from('video_views')
          .select('id')
          .eq('viewer_id', viewer_id)
          .limit(1);
        
        is_returning_viewer = previousViews && previousViews.length > 0;
      }

      // Determine completion and 30-second thresholds
      // First get video duration to calculate completion
      const { data: video } = await supabase
        .from('videos')
        .select('duration')
        .eq('id', video_id)
        .single();

      const completed = video?.duration ? (watch_duration / video.duration) >= 0.9 : false;
      const watched_30_seconds = watch_duration >= 30;

      // Insert or update view record
      const { error } = await supabase
        .from('video_views')
        .upsert({
          video_id,
          viewer_id,
          session_id,
          device_type,
          browser,
          watch_duration,
          completed,
          watched_30_seconds,
          is_returning_viewer
        }, {
          onConflict: 'session_id, video_id'
        });

      if (error) {
        console.error('View tracking error:', error);
        return res.status(500).json({ error: "Failed to track view" });
      }

      // Update daily analytics asynchronously
      const today = new Date().toISOString().split('T')[0];
      await supabase.rpc('update_daily_analytics', {
        p_video_id: video_id,
        p_date: today
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error('Track view error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get analytics data for a creator
  app.get("/api/analytics/:creatorId", async (req: Request, res: Response) => {
    try {
      if (!supabase) {
        return res.status(500).json({ error: "Database connection not available" });
      }

      const creatorId = req.params.creatorId;
      const { timeframe = '30d' } = req.query;

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      if (timeframe === '7d') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (timeframe === '30d') {
        startDate.setDate(startDate.getDate() - 30);
      } else if (timeframe === '90d') {
        startDate.setDate(startDate.getDate() - 90);
      }

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Get creator's videos
      const { data: videos } = await supabase
        .from('videos')
        .select('id, title, price, created_at')
        .eq('creator_id', creatorId);

      if (!videos || videos.length === 0) {
        return res.json({
          overview: {
            totalViews: 0,
            totalRevenue: 0,
            totalPurchases: 0,
            avgCompletionRate: 0,
            avgRevenuePerViewer: 0,
            newViewers: 0,
            returningViewers: 0,
            subscriberConversionRate: 0
          },
          videoPerformance: [],
          deviceBreakdown: { mobile: 0, desktop: 0, tablet: 0 },
          watchTimeTrend: [],
          conversionFunnel: {
            views: 0,
            watched30Sec: 0,
            completed: 0,
            purchased: 0
          }
        });
      }

      const videoIds = videos.map(v => v.id);

      // Get aggregated analytics
      const { data: analytics } = await supabase
        .from('analytics_daily')
        .select('*')
        .in('video_id', videoIds)
        .gte('date', startDateStr)
        .lte('date', endDateStr);

      // Get detailed view data for device breakdown and trends
      const { data: viewData } = await supabase
        .from('video_views')
        .select('device_type, completed, watched_30_seconds, created_at, video_id')
        .in('video_id', videoIds)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Get purchase data
      const { data: purchaseData } = await supabase
        .from('purchases')
        .select('video_id, amount, purchased_at')
        .in('video_id', videoIds)
        .gte('purchased_at', startDate.toISOString())
        .lte('purchased_at', endDate.toISOString());

      // Get subscriber data
      const { data: subscriberData } = await supabase
        .from('email_subscribers')
        .select('video_id, subscribed_at')
        .eq('creator_id', creatorId)
        .gte('subscribed_at', startDate.toISOString())
        .lte('subscribed_at', endDate.toISOString());

      // Calculate overview metrics
      const totalViews = analytics?.reduce((sum, a) => sum + a.total_views, 0) || 0;
      const totalRevenue = analytics?.reduce((sum, a) => sum + a.revenue, 0) || 0;
      const totalPurchases = analytics?.reduce((sum, a) => sum + a.purchases, 0) || 0;
      const totalCompletions = analytics?.reduce((sum, a) => sum + a.completions, 0) || 0;
      const newViewers = analytics?.reduce((sum, a) => sum + a.new_viewers, 0) || 0;
      const returningViewers = analytics?.reduce((sum, a) => sum + a.returning_viewers, 0) || 0;

      const avgCompletionRate = totalViews > 0 ? Math.round((totalCompletions / totalViews) * 100) : 0;
      const avgRevenuePerViewer = totalViews > 0 ? Math.round((totalRevenue / 100) / totalViews * 100) / 100 : 0;
      const subscriberConversionRate = totalViews > 0 ? Math.round(((subscriberData?.length || 0) / totalViews) * 100 * 100) / 100 : 0;

      // Device breakdown
      const deviceBreakdown = {
        mobile: viewData?.filter(v => v.device_type === 'mobile').length || 0,
        desktop: viewData?.filter(v => v.device_type === 'desktop').length || 0,
        tablet: viewData?.filter(v => v.device_type === 'tablet').length || 0
      };

      // Video performance
      const videoPerformance = videos.map(video => {
        const videoAnalytics = analytics?.filter(a => a.video_id === video.id) || [];
        const views = videoAnalytics.reduce((sum, a) => sum + a.total_views, 0);
        const revenue = videoAnalytics.reduce((sum, a) => sum + a.revenue, 0);
        const purchases = videoAnalytics.reduce((sum, a) => sum + a.purchases, 0);
        const completions = videoAnalytics.reduce((sum, a) => sum + a.completions, 0);

        return {
          id: video.id,
          title: video.title,
          views,
          revenue: revenue / 100, // Convert from cents
          purchases,
          completionRate: views > 0 ? Math.round((completions / views) * 100) : 0,
          revenuePerViewer: views > 0 ? Math.round((revenue / 100) / views * 100) / 100 : 0
        };
      });

      // Watch time trend (weekly data for timeframe)
      const watchTimeTrend = [];
      const today = new Date();
      for (let i = timeframe === '7d' ? 7 : timeframe === '30d' ? 4 : 12; i >= 0; i--) {
        const weekStart = new Date(today);
        if (timeframe === '7d') {
          weekStart.setDate(weekStart.getDate() - i);
        } else if (timeframe === '30d') {
          weekStart.setDate(weekStart.getDate() - (i * 7));
        } else {
          weekStart.setDate(weekStart.getDate() - (i * 7));
        }
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + (timeframe === '7d' ? 1 : 7));

        const weekAnalytics = analytics?.filter(a => {
          const aDate = new Date(a.date);
          return aDate >= weekStart && aDate < weekEnd;
        }) || [];

        const weekWatchTime = weekAnalytics.reduce((sum, a) => sum + a.watch_time_total, 0);
        
        watchTimeTrend.push({
          date: weekStart.toISOString().split('T')[0],
          avgWatchTime: weekWatchTime > 0 ? Math.round(weekWatchTime / Math.max(1, weekAnalytics.length)) : 0
        });
      }

      // Conversion funnel
      const watched30Sec = viewData?.filter(v => v.watched_30_seconds).length || 0;
      const completed = viewData?.filter(v => v.completed).length || 0;

      const conversionFunnel = {
        views: totalViews,
        watched30Sec,
        completed,
        purchased: totalPurchases
      };

      res.json({
        overview: {
          totalViews,
          totalRevenue: totalRevenue / 100, // Convert from cents
          totalPurchases,
          avgCompletionRate,
          avgRevenuePerViewer,
          newViewers,
          returningViewers,
          subscriberConversionRate
        },
        videoPerformance: videoPerformance.sort((a, b) => b.revenue - a.revenue),
        deviceBreakdown,
        watchTimeTrend,
        conversionFunnel
      });

    } catch (error: any) {
      console.error('Analytics fetch error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Delete a video
  app.delete("/api/videos/:id", async (req: Request, res: Response) => {
    try {
      if (!supabase) {
        return res.status(500).json({ error: "Database connection not available" });
      }

      const videoId = parseInt(req.params.id);
      
      if (isNaN(videoId)) {
        return res.status(400).json({ error: "Invalid video ID" });
      }

      // First get the video to check if it exists and get the file path
      const { data: video, error: fetchError } = await supabase
        .from('videos')
        .select('*')
        .eq('id', videoId)
        .single();

      if (fetchError) {
        console.error('Database fetch error:', fetchError);
        return res.status(404).json({ 
          error: "Video not found", 
          details: fetchError.message 
        });
      }

      // Delete from database first
      const { error: deleteError } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId);

      if (deleteError) {
        console.error('Database delete error:', deleteError);
        return res.status(500).json({ 
          error: "Failed to delete video", 
          details: deleteError.message 
        });
      }

      // Try to delete the video file from storage (optional - don't fail if this fails)
      if (video.video_url) {
        try {
          const urlParts = video.video_url.split('/');
          const filePath = urlParts.slice(-2).join('/'); // Get "userId/filename"
          
          const { error: storageError } = await supabase.storage
            .from('videos')
            .remove([filePath]);
            
          if (storageError) {
            console.warn('Storage delete warning:', storageError);
            // Don't fail the request if storage delete fails
          }
        } catch (storageError) {
          console.warn('Storage delete error:', storageError);
          // Don't fail the request if storage delete fails
        }
      }

      res.json({ 
        message: "Video deleted successfully",
        deletedVideoId: videoId
      });
    } catch (error: any) {
      console.error('Video delete error:', error);
      res.status(500).json({ 
        error: "Internal server error", 
        details: error.message 
      });
    }
  });

  // Stripe Connect Express account creation endpoint
  app.post("/api/create-connect-account", async (req: Request, res: Response) => {
    try {
      // For testing purposes, we'll bypass authentication and use a hardcoded user
      const testUserEmail = 'aguilera209@gmail.com';
      
      if (!supabase) {
        return res.status(500).json({ error: "Database connection not available" });
      }

      // Check if user is a creator
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, stripe_account_id, stripe_onboarding_complete')
        .eq('email', testUserEmail)
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
          email: testUserEmail,
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
          .eq('id', profile.id);

        if (updateError) {
          console.error('Failed to store Stripe account ID:', updateError);
          return res.status(500).json({ error: "Failed to store account information" });
        }
      }

      // Create account link for onboarding with better return URLs
      const isReplit = FRONTEND_URL.includes('replit.dev') || FRONTEND_URL.includes('replit.app');
      const baseUrl = isReplit ? FRONTEND_URL : FRONTEND_URL;
      
      const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: `${baseUrl}/dashboard?stripe_refresh=true`,
        return_url: `${baseUrl}/dashboard?stripe_setup=complete`,
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
      // For testing purposes, we'll bypass authentication and use a hardcoded user
      // In production, you'd want proper authentication here
      const testUserEmail = 'aguilera209@gmail.com';
      
      if (!supabase) {
        return res.status(500).json({ error: "Database connection not available" });
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, stripe_account_id, stripe_onboarding_complete, stripe_charges_enabled, stripe_payouts_enabled')
        .eq('email', testUserEmail)
        .single();

      if (profileError || !profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      if (!profile.stripe_account_id) {
        return res.json({ 
          has_account: false,
          onboarding_complete: false,
          charges_enabled: false,
          payouts_enabled: false,
          requirements: []
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
        .eq('id', profile.id);

      res.json(accountStatus);

    } catch (error: any) {
      console.error('Stripe account status error:', error);
      res.status(500).json({ 
        error: "Failed to fetch account status", 
        details: error.message 
      });
    }
  });

  // Database migration endpoint for Stripe Connect fields
  app.post("/api/migrate-stripe-fields", async (req: Request, res: Response) => {
    if (!supabase) {
      return res.status(500).json({ error: "Supabase not configured" });
    }

    try {
      // Check if columns already exist by trying to select them
      const { error: checkError } = await supabase
        .from('profiles')
        .select('stripe_account_id, stripe_onboarding_complete, stripe_charges_enabled, stripe_payouts_enabled')
        .limit(1);

      if (!checkError) {
        return res.json({ message: "Migration already completed - Stripe fields exist" });
      }

      // If we get here, the fields don't exist, so we need to add them manually
      // Since we can't run ALTER TABLE directly through the REST API, 
      // we'll inform the user to run it manually
      return res.json({ 
        message: "Migration needed - please run the SQL migration manually",
        sql: `
          ALTER TABLE profiles 
          ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
          ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT FALSE;
          
          CREATE INDEX IF NOT EXISTS idx_profiles_stripe_account_id ON profiles(stripe_account_id);
        `
      });

    } catch (error: any) {
      console.error('Migration check error:', error);
      res.status(500).json({ error: "Migration check failed", details: error.message });
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

  // Get profile by ID or email
  app.get("/api/profile/:identifier", async (req, res) => {
    try {
      const { identifier } = req.params;
      
      if (!supabase) {
        return res.status(500).json({ error: "Database connection not available" });
      }
      
      // Try to find profile by email first, then by ID
      let query = supabase.from('profiles').select('*');
      
      if (identifier.includes('@')) {
        query = query.eq('email', identifier);
      } else {
        query = query.eq('id', identifier);
      }
      
      const { data: profile, error } = await query.single();
      
      if (error || !profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      
      res.json({ profile });
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ error: 'Failed to fetch profile: ' + error.message });
    }
  });

  // Update profile
  app.put("/api/profile/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const profileData = req.body;
      
      // Profile update request received
      
      if (!supabase) {
        return res.status(500).json({ error: "Database connection not available" });
      }
      
      // First check if profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', id)
        .single();
        
      if (fetchError) {
        console.error('Profile fetch error:', fetchError);
        return res.status(404).json({ error: 'Profile not found' });
      }
      
      // Validate the input data
      const validatedData = updateProfileSchema.parse(profileData);
      
      // Update the profile
      const { data, error } = await supabase
        .from('profiles')
        .update(validatedData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Profile update error:', error);
        return res.status(500).json({ error: 'Failed to update profile: ' + error.message });
      }
      
      // Profile updated successfully
      res.json({ success: true, profile: data });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid profile data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to update profile: ' + error.message });
    }
  });

  // Upload avatar image
  app.post("/api/upload-avatar", async (req, res) => {
    try {
      if (!supabase) {
        return res.status(500).json({ error: "Database connection not available" });
      }

      const { fileName, fileData, contentType, userId } = req.body;
      
      if (!fileName || !fileData || !userId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Convert base64 to buffer
      const buffer = Buffer.from(fileData, 'base64');
      const filePath = `avatars/${userId}/${fileName}`;

      console.log('Avatar upload attempt:', { fileName, filePath, size: buffer.length });

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, buffer, {
          contentType,
          cacheControl: '3600',
          upsert: true, // Allow overwriting existing avatars
        });

      if (error) {
        console.error('Supabase avatar upload error:', error);
        return res.status(500).json({ error: `Avatar upload failed: ${error.message}` });
      }

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      res.json({ 
        success: true, 
        path: data.path,
        publicUrl: publicUrlData.publicUrl 
      });

    } catch (error: any) {
      console.error('Avatar upload error:', error);
      res.status(500).json({ error: 'Avatar upload failed: ' + error.message });
    }
  });

  // Update user role (for testing)
  app.post("/api/update-role", async (req, res) => {
    try {
      const { email, role } = req.body;
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('email', email)
        .select()
        .single();

      if (error) throw error;
      
      console.log(`Updated ${email} role to: ${role}`);
      res.json({ success: true, profile: data });
    } catch (error: any) {
      console.error('Role update error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
