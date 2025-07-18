import { pgTable, text, serial, integer, boolean, uuid, timestamp } from "drizzle-orm/pg-core";
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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
