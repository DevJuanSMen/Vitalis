import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getLogs = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("bodyLogs")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const addLog = mutation({
  args: {
    date: v.string(),
    weight: v.optional(v.number()),
    bodyFatPercentage: v.optional(v.number()),
    photoStorageId: v.optional(v.string()),
    description: v.optional(v.string()),
    aiAnalysis: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not logged in");
    
    // Update profile weight if provided
    if (args.weight) {
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .unique();
      if (profile) {
        await ctx.db.patch(profile._id, { weight_kg: args.weight });
      }
    }
    
    return await ctx.db.insert("bodyLogs", { ...args, userId });
  },
});

export const generateUploadUrl = mutation(async (ctx) => {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not logged in");
  return await ctx.storage.generateUploadUrl();
});
