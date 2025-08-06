import type { Express, Request, Response } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import Stripe from "stripe";
import { getVideoById } from "../shared/videoData";
import { createClient } from '@supabase/supabase-js';
import { insertVideoSchema, type InsertVideo, updateProfileSchema, type UpdateProfile } from "../shared/schema";
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import fs from 'fs/promises';

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

// Configure FFmpeg
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

// Frontend URL for redirects - use Replit domain or localhost
const FRONTEND_URL = process.env.REPLIT_DOMAIN 
  ? `https://${process.env.REPLIT_DOMAIN}` 
  : 'http://localhost:5000';

// Helper function to generate video thumbnail using FFmpeg
async function generateVideoThumbnail(videoPath: string, videoId: string, videoTitle: string, res: Response): Promise<void> {
  return new Promise(async (resolve, reject) => {
    const outputPath = `/tmp/thumb_${videoId}.jpg`;
    
    try {
      // For Supabase storage URLs, we need to download the file first
      if (videoPath.startsWith('http')) {
        console.log(`Downloading video for thumbnail generation: ${videoPath}`);
        const videoResponse = await fetch(videoPath);
        if (!videoResponse.ok) {
          throw new Error(`Failed to download video: ${videoResponse.status}`);
        }
        
        const videoBuffer = await videoResponse.arrayBuffer();
        const tempVideoPath = `/tmp/video_${videoId}.mp4`;
        await fs.writeFile(tempVideoPath, Buffer.from(videoBuffer));
        
        // Now extract thumbnail from local file
        ffmpeg(tempVideoPath)
          .screenshot({
            timestamps: ['00:00:05'], // Extract frame at 5 seconds
            filename: `thumb_${videoId}.jpg`,
            folder: '/tmp/',
            size: '320x180'
          })
          .on('end', async () => {
            try {
              const buffer = await fs.readFile(outputPath);
              res.setHeader('Content-Type', 'image/jpeg');
              res.setHeader('Cache-Control', 'public, max-age=86400');
              res.send(buffer);
              
              // Clean up temp files
              await fs.unlink(outputPath).catch(() => {});
              await fs.unlink(tempVideoPath).catch(() => {});
              resolve();
            } catch (error) {
              console.error('Error reading thumbnail:', error);
              await generateFallbackThumbnail(videoId, videoTitle, res);
              resolve();
            }
          })
          .on('error', async (error) => {
            console.error('FFmpeg thumbnail generation failed:', error);
            await generateFallbackThumbnail(videoId, videoTitle, res);
            await fs.unlink(tempVideoPath).catch(() => {});
            resolve();
          });
      } else {
        // Handle local file paths
        ffmpeg(videoPath)
          .screenshot({
            timestamps: ['00:00:05'],
            filename: `thumb_${videoId}.jpg`,
            folder: '/tmp/',
            size: '320x180'
          })
          .on('end', async () => {
            try {
              const buffer = await fs.readFile(outputPath);
              res.setHeader('Content-Type', 'image/jpeg');
              res.setHeader('Cache-Control', 'public, max-age=86400');
              res.send(buffer);
              
              await fs.unlink(outputPath).catch(() => {});
              resolve();
            } catch (error) {
              console.error('Error reading thumbnail:', error);
              await generateFallbackThumbnail(videoId, videoTitle, res);
              resolve();
            }
          })
          .on('error', async (error) => {
            console.error('FFmpeg thumbnail generation failed:', error);
            await generateFallbackThumbnail(videoId, videoTitle, res);
            resolve();
          });
      }
    } catch (error) {
      console.error('Video download failed:', error);
      await generateFallbackThumbnail(videoId, videoTitle, res);
      resolve();
    }
  });
}

// Fallback SVG thumbnail generator
async function generateFallbackThumbnail(videoId: string, videoTitle: string, res: Response): Promise<void> {
  const colors = [
    '#007B82', '#0d1b2a', '#ff914d', '#1DA1F2', '#00bfa6',
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b'
  ];
  const color = colors[parseInt(videoId) % colors.length];
  
  const svg = `<svg width="320" height="180" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad${videoId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${color}99;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="320" height="180" fill="url(#grad${videoId})" />
  <circle cx="160" cy="90" r="25" fill="white" opacity="0.95"/>
  <polygon points="153,80 153,100 172,90" fill="${color}"/>
  <text x="160" y="160" font-family="Inter, system-ui, sans-serif" font-size="14" font-weight="500" text-anchor="middle" fill="white" opacity="0.9">${videoTitle}</text>
</svg>`;
  
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(svg);
}

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

  // Debug endpoint to check video views data
  app.get("/api/debug-views/:creatorId", async (req: Request, res: Response) => {
    try {
      if (!supabase) {
        return res.status(500).json({ error: "Database connection not available" });
      }
      
      const creatorId = req.params.creatorId;
      
      // Get creator's videos
      const { data: videos } = await supabase
        .from('videos')
        .select('id, title')
        .eq('creator_id', creatorId);
      
      const videoIds = videos?.map(v => v.id) || [];
      
      // Get all views for these videos
      const { data: allViews, error: viewsError } = await supabase
        .from('video_views')
        .select('*')
        .in('video_id', videoIds);
      
      // Get recent views (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: recentViews, error: recentError } = await supabase
        .from('video_views')
        .select('*')
        .in('video_id', videoIds)
        .gte('created_at', thirtyDaysAgo.toISOString());
      
      return res.json({
        creatorId,
        videoIds,
        totalVideos: videos?.length || 0,
        allViewsCount: allViews?.length || 0,
        recentViewsCount: recentViews?.length || 0,
        allViews: allViews || [],
        recentViews: recentViews || [],
        viewsError: viewsError?.message,
        recentError: recentError?.message
      });
      
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Test endpoint to check video_views table existence
  app.get("/api/test-analytics", async (req: Request, res: Response) => {
    try {
      if (!supabase) {
        return res.status(500).json({ error: "Database connection not available" });
      }
      
      // Test if video_views table exists by trying to query it
      const { data, error } = await supabase
        .from('video_views')
        .select('*')
        .limit(1);
      
      if (error) {
        return res.json({ 
          tableExists: false, 
          error: error.message,
          needsMigration: true 
        });
      }
      
      return res.json({ 
        tableExists: true, 
        rowCount: data?.length || 0,
        message: "Analytics table ready"
      });
      
    } catch (error: any) {
      res.status(500).json({ error: error.message });
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

      // Insert view record (each session is unique)
      const { error } = await supabase
        .from('video_views')
        .insert({
          video_id,
          viewer_id,
          session_id,
          device_type,
          browser,
          watch_duration,
          completed,
          watched_30_seconds,
          is_returning_viewer
        });

      if (error) {
        console.error('View tracking error details:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        return res.status(500).json({ 
          error: "Failed to track view",
          details: error.message || 'Unknown database error'
        });
      }

      // Note: Daily analytics aggregation can be implemented later if needed
      // For now, we'll rely on real-time queries of the video_views table

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

      // Get detailed view data for all calculations (no analytics_daily needed for Phase 1)
      const { data: viewData } = await supabase
        .from('video_views')
        .select('device_type, completed, watched_30_seconds, created_at, video_id, watch_duration, is_returning_viewer, session_id')
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

      // Calculate overview metrics from real-time view data
      const totalViews = viewData?.length || 0;
      const totalRevenue = purchaseData?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const totalPurchases = purchaseData?.length || 0;
      const totalCompletions = viewData?.filter(v => v.completed).length || 0;
      const newViewers = viewData?.filter(v => !v.is_returning_viewer).length || 0;
      const returningViewers = viewData?.filter(v => v.is_returning_viewer).length || 0;

      const avgCompletionRate = totalViews > 0 ? Math.round((totalCompletions / totalViews) * 100) : 0;
      const avgRevenuePerViewer = totalViews > 0 ? Math.round((totalRevenue / 100) / totalViews * 100) / 100 : 0;
      const subscriberConversionRate = totalViews > 0 ? Math.round(((subscriberData?.length || 0) / totalViews) * 100 * 100) / 100 : 0;

      // Device breakdown
      const totalViewsForDevices = viewData?.length || 1; // Prevent division by zero
      const deviceBreakdown = {
        mobile: Math.round(((viewData?.filter(v => v.device_type === 'mobile').length || 0) / totalViewsForDevices) * 100),
        desktop: Math.round(((viewData?.filter(v => v.device_type === 'desktop').length || 0) / totalViewsForDevices) * 100), 
        tablet: Math.round(((viewData?.filter(v => v.device_type === 'tablet').length || 0) / totalViewsForDevices) * 100)
      };

      // Video performance
      const videoPerformance = videos.map(video => {
        const videoViews = viewData?.filter(v => v.video_id === video.id) || [];
        const videoPurchases = purchaseData?.filter(p => p.video_id === video.id) || [];
        const views = videoViews.length;
        const revenue = videoPurchases.reduce((sum, p) => sum + p.amount, 0);
        const purchases = videoPurchases.length;
        const completions = videoViews.filter(v => v.completed).length;

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

        const weekViews = viewData?.filter(v => {
          const vDate = new Date(v.created_at);
          return vDate >= weekStart && vDate < weekEnd;
        }) || [];

        const weekWatchTime = weekViews.reduce((sum, v) => sum + (v.watch_duration || 0), 0);
        
        watchTimeTrend.push({
          date: weekStart.toISOString().split('T')[0],
          avgWatchTime: weekViews.length > 0 ? Math.round(weekWatchTime / weekViews.length) : 0
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
      
      // Decode URL encoding first
      const decodedIdentifier = decodeURIComponent(identifier);
      
      // Try to find profile by email first, then by ID, then by display_name
      let profile = null;
      
      if (decodedIdentifier.includes('@')) {
        // Email lookup
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', decodedIdentifier)
          .single();
        profile = data;
      } else {
        // Try ID first
        const { data: profileById } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', decodedIdentifier)
          .single();
          
        if (profileById) {
          profile = profileById;
        } else {
          // Try display_name
          const { data: profileByName } = await supabase
            .from('profiles')
            .select('*')
            .eq('display_name', decodedIdentifier)
            .single();
          profile = profileByName;
          
          // If still not found, try to match by URL-friendly username
          if (!profile) {
            const { data: allProfiles } = await supabase
              .from('profiles')
              .select('*');
            
            // Find profile where URL-friendly version of display_name matches
            profile = allProfiles?.find(p => {
              const urlFriendlyName = (p.display_name || p.email?.split('@')[0] || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
              return urlFriendlyName === decodedIdentifier;
            }) || null;
          }
        }
      }
      
      if (!profile) {
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

  // Remove duplicate explore-creators endpoint

  // Get all creators for explore page - fixed version
  app.get("/api/creators", async (req, res) => {
    try {
      if (!supabase) {
        return res.status(500).json({ error: "Database connection not available" });
      }

      const { data: creators, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'creator');

      if (error) {
        console.error('Error fetching creators:', error);
        return res.status(500).json({ error: 'Failed to fetch creators' });
      }

      // Get video counts for all creators
      const { data: videos, error: videosError } = await supabase
        .from('videos')
        .select('creator_id');

      if (videosError) {
        console.error('Error fetching video counts:', videosError);
      }

      // Count videos per creator
      const videoCounts = (videos || []).reduce((acc: Record<string, number>, video: any) => {
        acc[video.creator_id] = (acc[video.creator_id] || 0) + 1;
        return acc;
      }, {});

      // Transform for frontend using exact same pattern as profile endpoint
      const formattedCreators = (creators || []).map(creator => ({
        id: creator.id,
        username: (creator.display_name || creator.email?.split('@')[0] || 'creator').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        display_name: creator.display_name || creator.email?.split('@')[0] || 'Creator',
        bio: creator.bio || 'Content creator on Mosswood',
        avatar_url: creator.avatar_url,
        banner_url: creator.banner_url,
        email: creator.email,
        video_count: videoCounts[creator.id] || 0,
        rating: null, // Will be calculated from actual reviews when available
        follower_count: null, // Will be calculated from actual followers when available
        category: 'Creator',
        price_range: 'Various prices',
        is_verified: false,
        social_links: creator.social_links || {},
        created_at: creator.created_at
      }));

      res.json(formattedCreators);
    } catch (error: any) {
      console.error('Error in creators API:', error);
      res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
  });

  // Get creator statistics (followers, views, videos count)
  app.get("/api/creator-stats/:creatorId", async (req: Request, res: Response) => {
    try {
      if (!supabase) {
        return res.status(500).json({ error: "Database connection not available" });
      }

      const creatorId = req.params.creatorId;

      // Get follower count
      const { data: followersData, error: followersError } = await supabase
        .from('followers')
        .select('*')
        .eq('creator_id', creatorId);

      // Get creator's video IDs first
      const { data: creatorVideos, error: creatorVideosError } = await supabase
        .from('videos')
        .select('id')
        .eq('creator_id', creatorId);

      let viewsData = [];
      let viewsError = null;
      
      // Only query views if creator has videos
      if (creatorVideos && creatorVideos.length > 0) {
        const videoIds = creatorVideos.map(video => video.id);
        const result = await supabase
          .from('video_views')
          .select('video_id')
          .in('video_id', videoIds || []);
        
        viewsData = result.data;
        viewsError = result.error;
      }

      if (followersError) {
        console.error('Error fetching followers:', followersError);
      }
      if (viewsError) {
        console.error('Error fetching views:', viewsError);
      }
      if (creatorVideosError) {
        console.error('Error fetching videos:', creatorVideosError);
      }

      const stats = {
        followers: followersData?.length || 0,
        total_views: viewsData?.length || 0,
        video_count: creatorVideos?.length || 0
      };

      res.json(stats);
    } catch (error: any) {
      console.error('Error fetching creator stats:', error);
      res.status(500).json({ error: 'Failed to fetch creator statistics' });
    }
  });

  // Follow/unfollow a creator
  app.post("/api/follow/:creatorId", async (req: Request, res: Response) => {
    try {
      if (!supabase) {
        return res.status(500).json({ error: "Database connection not available" });
      }

      const creatorId = req.params.creatorId;
      const { followerId, action } = req.body; // action: 'follow' or 'unfollow'

      if (!followerId) {
        return res.status(400).json({ error: "Follower ID is required" });
      }

      if (action === 'follow') {
        const { error } = await supabase
          .from('followers')
          .insert({ follower_id: followerId, creator_id: creatorId });

        if (error) {
          console.error('Error following creator:', error);
          return res.status(500).json({ error: 'Failed to follow creator' });
        }
      } else if (action === 'unfollow') {
        const { error } = await supabase
          .from('followers')
          .delete()
          .eq('follower_id', followerId)
          .eq('creator_id', creatorId);

        if (error) {
          console.error('Error unfollowing creator:', error);
          return res.status(500).json({ error: 'Failed to unfollow creator' });
        }
      } else {
        return res.status(400).json({ error: "Invalid action. Use 'follow' or 'unfollow'" });
      }

      res.json({ success: true, action });
    } catch (error: any) {
      console.error('Error managing follow:', error);
      res.status(500).json({ error: 'Failed to process follow request' });
    }
  });

  // Upload banner image for creator
  app.post("/api/upload-banner", async (req: Request, res: Response) => {
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
      const filePath = `banners/${userId}/${fileName}`;

      console.log('Banner upload attempt:', { fileName, filePath, size: buffer.length });

      const { data, error } = await supabase.storage
        .from('avatars') // Using avatars bucket for banner images
        .upload(filePath, buffer, {
          contentType,
          cacheControl: '3600',
          upsert: true, // Allow replacing existing banners
        });

      if (error) {
        console.error('Supabase banner upload error:', error);
        return res.status(500).json({ error: `Banner upload failed: ${error.message}` });
      }

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with banner URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ banner_url: publicUrlData.publicUrl })
        .eq('id', userId);

      if (updateError) {
        console.error('Failed to update profile banner URL:', updateError);
        return res.status(500).json({ error: 'Failed to save banner URL' });
      }

      res.json({ 
        success: true, 
        path: data.path,
        publicUrl: publicUrlData.publicUrl 
      });

    } catch (error: any) {
      console.error('Banner upload error:', error);
      res.status(500).json({ error: 'Failed to upload banner' });
    }
  });



  // Serve video thumbnails with real frame extraction
  app.get("/api/video-thumbnail/:filename", async (req: Request, res: Response) => {
    try {
      const filename = req.params.filename;
      const videoId = filename.replace('.jpg', '');
      
      if (!supabase) {
        return res.status(500).json({ error: "Database connection not available" });
      }

      // Get video data including file path
      const { data: video, error: videoError } = await supabase
        .from('videos')
        .select('title, video_url, thumbnail_url')
        .eq('id', videoId)
        .single();

      if (videoError || !video) {
        console.error('Video not found:', videoError);
        return res.status(404).json({ error: 'Video not found' });
      }

      // If thumbnail already exists, serve it
      if (video.thumbnail_url) {
        try {
          const thumbnailResponse = await fetch(video.thumbnail_url);
          if (thumbnailResponse.ok) {
            const buffer = await thumbnailResponse.arrayBuffer();
            res.setHeader('Content-Type', 'image/jpeg');
            res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
            return res.send(Buffer.from(buffer));
          }
        } catch (fetchError) {
          console.log('Existing thumbnail fetch failed, generating new one:', fetchError);
        }
      }

      // Generate real video thumbnail using FFmpeg
      if (video.video_url) {
        console.log(`Generating real video thumbnail for ${videoId}: ${video.title} from ${video.video_url}`);
        await generateVideoThumbnail(video.video_url, videoId, video.title, res);
      } else {
        console.log(`No video file available for ${videoId}, using fallback thumbnail`);
        await generateFallbackThumbnail(videoId, video.title, res);
      }
      
    } catch (error: any) {
      console.error('Thumbnail serving error:', error);
      res.status(500).json({ error: 'Failed to serve thumbnail' });
    }
  });

  // Track video views
  app.post("/api/track-view/:videoId", async (req: Request, res: Response) => {
    try {
      if (!supabase) {
        return res.status(500).json({ error: "Database connection not available" });
      }

      const videoId = parseInt(req.params.videoId);
      const { viewerId } = req.body;
      
      if (isNaN(videoId)) {
        return res.status(400).json({ error: "Invalid video ID" });
      }

      // Insert view record
      const { error } = await supabase
        .from('video_views')
        .insert([{
          video_id: videoId,
          viewer_id: viewerId || null,
          ip_address: req.ip,
          user_agent: req.get('User-Agent')
        }]);

      if (error) {
        console.error('Failed to track video view:', error);
        return res.status(500).json({ error: 'Failed to track view' });
      }

      res.json({ success: true });

    } catch (error: any) {
      console.error('View tracking error:', error);
      res.status(500).json({ error: 'Failed to track view' });
    }
  });

  // Create necessary database tables if they don't exist
  app.post("/api/setup-database", async (req: Request, res: Response) => {
    try {
      if (!supabase) {
        return res.status(500).json({ error: "Database connection not available" });
      }

      // Check if followers table exists
      const { error: followersError } = await supabase
        .from('followers')
        .select('id')
        .limit(1);

      // Check if video_views table exists
      const { error: viewsError } = await supabase
        .from('video_views')
        .select('id')
        .limit(1);

      let tablesNeeded = [];
      if (followersError) tablesNeeded.push('followers');
      if (viewsError) tablesNeeded.push('video_views');

      if (tablesNeeded.length > 0) {
        return res.json({
          tablesNeeded,
          message: "Database setup needed",
          sql: `
            -- Create followers table
            CREATE TABLE IF NOT EXISTS followers (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
              creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
              followed_at TIMESTAMPTZ DEFAULT NOW(),
              UNIQUE(follower_id, creator_id)
            );

            -- Create video_views table
            CREATE TABLE IF NOT EXISTS video_views (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
              viewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
              viewed_at TIMESTAMPTZ DEFAULT NOW(),
              ip_address INET,
              user_agent TEXT
            );

            -- Add banner_url to profiles if not exists
            ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;
            
            -- Create indexes for performance
            CREATE INDEX IF NOT EXISTS idx_followers_creator ON followers(creator_id);
            CREATE INDEX IF NOT EXISTS idx_followers_follower ON followers(follower_id);
            CREATE INDEX IF NOT EXISTS idx_video_views_video ON video_views(video_id);
            CREATE INDEX IF NOT EXISTS idx_video_views_viewer ON video_views(viewer_id);
          `
        });
      }

      res.json({ message: "Database is properly set up" });

    } catch (error: any) {
      console.error('Database setup check error:', error);
      res.status(500).json({ error: "Database setup check failed", details: error.message });
    }
  });

  // Generate video thumbnail from video frame
  app.post("/api/generate-thumbnail/:videoId", async (req: Request, res: Response) => {
    try {
      if (!supabase) {
        return res.status(500).json({ error: "Database connection not available" });
      }

      const videoId = parseInt(req.params.videoId);
      
      if (isNaN(videoId)) {
        return res.status(400).json({ error: "Invalid video ID" });
      }

      // Get video info
      const { data: video, error: videoError } = await supabase
        .from('videos')
        .select('*')
        .eq('id', videoId)
        .single();

      if (videoError || !video) {
        return res.status(404).json({ error: "Video not found" });
      }

      // Create a better thumbnail URL using video ID for consistent thumbnails
      const thumbnailUrl = `/api/video-thumbnail/${videoId}.jpg`;

      // Update video with thumbnail URL
      const { error: updateError } = await supabase
        .from('videos')
        .update({ thumbnail_url: thumbnailUrl })
        .eq('id', videoId);

      if (updateError) {
        console.error('Failed to update video thumbnail:', updateError);
        return res.status(500).json({ error: 'Failed to save thumbnail URL' });
      }

      res.json({ 
        success: true, 
        thumbnailUrl: thumbnailUrl 
      });

    } catch (error: any) {
      console.error('Thumbnail generation error:', error);
      res.status(500).json({ error: 'Failed to generate thumbnail' });
    }
  });

  // Setup Supabase storage buckets
  app.post("/api/setup-storage", async (req: Request, res: Response) => {
    try {
      if (!supabase) {
        return res.status(500).json({ error: "Database connection not available" });
      }

      // Create avatars bucket
      const { error: avatarBucketError } = await supabase.storage.createBucket('avatars', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
      });

      // Create banners bucket  
      const { error: bannerBucketError } = await supabase.storage.createBucket('banners', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
      });

      const created = [];
      if (!avatarBucketError || avatarBucketError.message.includes('already exists')) {
        created.push('avatars');
      }
      if (!bannerBucketError || bannerBucketError.message.includes('already exists')) {
        created.push('banners');
      }

      res.json({
        success: true,
        message: 'Storage buckets setup complete',
        created,
        avatarBucketError: avatarBucketError?.message,
        bannerBucketError: bannerBucketError?.message
      });

    } catch (error: any) {
      console.error('Storage setup error:', error);
      res.status(500).json({ error: 'Failed to setup storage' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
