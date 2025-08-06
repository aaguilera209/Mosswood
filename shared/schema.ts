import { pgTable, text, serial, integer, boolean, uuid, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  creator_id: uuid("creator_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  price: integer("price").notNull().default(0), // Price in cents
  is_free: boolean("is_free").notNull().default(false),
  tags: text("tags").array().default([]), // Array of tag strings
  video_url: text("video_url").notNull(),
  file_path: text("file_path"), // Storage path for video file
  thumbnail_url: text("thumbnail_url"),
  file_size: integer("file_size"), // File size in bytes
  duration: integer("duration"), // Duration in seconds
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const purchases = pgTable("purchases", {
  id: uuid("id").primaryKey().defaultRandom(),
  profile_id: uuid("profile_id").notNull(),
  video_id: integer("video_id").notNull(),
  stripe_session_id: text("stripe_session_id").notNull().unique(),
  amount: integer("amount").notNull(), // Amount in cents
  purchased_at: timestamp("purchased_at", { withTimezone: true }).defaultNow(),
});

// Add profiles table with MVP profile fields
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  role: text("role", { enum: ["creator", "viewer"] }).notNull().default("viewer"),
  display_name: text("display_name"),
  tagline: text("tagline"),
  bio: text("bio"),
  location: text("location"),
  timezone: text("timezone"),
  avatar_url: text("avatar_url"),
  website: text("website"),
  social_links: json("social_links").$type<{
    twitter?: string;
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    [key: string]: string | undefined;
  }>(),
  contact_email: text("contact_email"),
  banner_url: text("banner_url"),
  stripe_account_id: text("stripe_account_id"),
  stripe_connect_enabled: boolean("stripe_connect_enabled").default(false),
  stripe_onboarding_complete: boolean("stripe_onboarding_complete").default(false),
  stripe_charges_enabled: boolean("stripe_charges_enabled").default(false),
  stripe_payouts_enabled: boolean("stripe_payouts_enabled").default(false),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Analytics tables for tracking video interactions
export const video_views = pgTable("video_views", {
  id: uuid("id").primaryKey().defaultRandom(),
  video_id: integer("video_id").notNull(),
  viewer_id: uuid("viewer_id"), // null for anonymous views
  session_id: text("session_id").notNull(), // track unique sessions
  device_type: text("device_type", { enum: ["mobile", "desktop", "tablet"] }),
  browser: text("browser"),
  watch_duration: integer("watch_duration").notNull().default(0), // seconds watched
  completed: boolean("completed").notNull().default(false), // watched >90%
  watched_30_seconds: boolean("watched_30_seconds").notNull().default(false),
  is_returning_viewer: boolean("is_returning_viewer").notNull().default(false),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const email_subscribers = pgTable("email_subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  creator_id: uuid("creator_id").notNull(), // which creator they subscribed to
  video_id: integer("video_id"), // video that drove the subscription (nullable)
  subscribed_at: timestamp("subscribed_at", { withTimezone: true }).defaultNow(),
});

export const analytics_daily = pgTable("analytics_daily", {
  id: uuid("id").primaryKey().defaultRandom(),
  video_id: integer("video_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  total_views: integer("total_views").notNull().default(0),
  unique_viewers: integer("unique_viewers").notNull().default(0),
  watch_time_total: integer("watch_time_total").notNull().default(0), // total seconds
  completions: integer("completions").notNull().default(0),
  purchases: integer("purchases").notNull().default(0),
  revenue: integer("revenue").notNull().default(0), // in cents
  new_viewers: integer("new_viewers").notNull().default(0),
  returning_viewers: integer("returning_viewers").notNull().default(0),
  mobile_views: integer("mobile_views").notNull().default(0),
  desktop_views: integer("desktop_views").notNull().default(0),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const followers = pgTable("followers", {
  id: uuid("id").primaryKey().defaultRandom(),
  follower_id: uuid("follower_id").notNull(), // profile id of the follower
  creator_id: uuid("creator_id").notNull(), // profile id of the creator being followed
  followed_at: timestamp("followed_at", { withTimezone: true }).defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertVideoSchema = createInsertSchema(videos).pick({
  creator_id: true,
  title: true,
  description: true,
  price: true,
  is_free: true,
  tags: true,
  video_url: true,
  thumbnail_url: true,
  file_size: true,
  duration: true,
});

export const insertPurchaseSchema = createInsertSchema(purchases).pick({
  profile_id: true,
  video_id: true,
  stripe_session_id: true,
  amount: true,
});

export const insertProfileSchema = createInsertSchema(profiles).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const updateProfileSchema = createInsertSchema(profiles).omit({
  id: true,
  email: true,
  role: true,
  stripe_account_id: true,
  stripe_connect_enabled: true,
  stripe_onboarding_complete: true,
  stripe_charges_enabled: true,
  stripe_payouts_enabled: true,
  created_at: true,
  updated_at: true,
}).partial();

export const insertVideoViewSchema = createInsertSchema(video_views).omit({
  id: true,
  created_at: true,
});

export const insertEmailSubscriberSchema = createInsertSchema(email_subscribers).omit({
  id: true,
  subscribed_at: true,
});

export const insertAnalyticsDailySchema = createInsertSchema(analytics_daily).omit({
  id: true,
  created_at: true,
});

export const insertFollowerSchema = createInsertSchema(followers).omit({
  id: true,
  followed_at: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type VideoView = typeof video_views.$inferSelect;
export type InsertVideoView = z.infer<typeof insertVideoViewSchema>;
export type EmailSubscriber = typeof email_subscribers.$inferSelect;
export type InsertEmailSubscriber = z.infer<typeof insertEmailSubscriberSchema>;
export type AnalyticsDaily = typeof analytics_daily.$inferSelect;
export type InsertAnalyticsDaily = z.infer<typeof insertAnalyticsDailySchema>;
export type Follower = typeof followers.$inferSelect;
export type InsertFollower = z.infer<typeof insertFollowerSchema>;
