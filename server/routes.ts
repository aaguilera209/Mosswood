import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// In-memory purchase store
const purchases: { [email: string]: string[] } = {};

export async function registerRoutes(app: Express): Promise<Server> {
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

  // Record successful purchase
  app.post("/api/record-purchase", async (req, res) => {
    try {
      const { email, videoId, paymentIntentId } = req.body;
      
      // Verify payment was successful
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded') {
        // Add to purchases
        if (!purchases[email]) {
          purchases[email] = [];
        }
        if (!purchases[email].includes(videoId)) {
          purchases[email].push(videoId);
        }
        
        res.json({ success: true, message: "Purchase recorded successfully" });
      } else {
        res.status(400).json({ success: false, message: "Payment not completed" });
      }
    } catch (error: any) {
      res.status(500).json({ message: "Error recording purchase: " + error.message });
    }
  });

  // Check if user has purchased a video
  app.post("/api/check-purchase", async (req, res) => {
    try {
      const { email, videoId } = req.body;
      
      const hasPurchased = purchases[email]?.includes(videoId.toString()) || false;
      
      res.json({ hasPurchased });
    } catch (error: any) {
      res.status(500).json({ message: "Error checking purchase: " + error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
