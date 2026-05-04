import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

// Get today's water log
export const getToday = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const today = todayStr();
    return await ctx.db
      .query("waterLogs")
      .withIndex("by_userId_date", (q) => q.eq("userId", userId).eq("date", today))
      .first();
  },
});

// Add a glass of water
export const addGlass = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("No autenticado");

    const today = todayStr();
    const existing = await ctx.db
      .query("waterLogs")
      .withIndex("by_userId_date", (q) => q.eq("userId", userId).eq("date", today))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { glasses: existing.glasses + 1 });
    } else {
      await ctx.db.insert("waterLogs", { userId, date: today, glasses: 1 });
    }
  },
});

// Remove a glass of water
export const removeGlass = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("No autenticado");

    const today = todayStr();
    const existing = await ctx.db
      .query("waterLogs")
      .withIndex("by_userId_date", (q) => q.eq("userId", userId).eq("date", today))
      .first();

    if (existing && existing.glasses > 0) {
      await ctx.db.patch(existing._id, { glasses: existing.glasses - 1 });
    }
  },
});

// Set glasses directly
export const setGlasses = mutation({
  args: { glasses: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("No autenticado");

    const today = todayStr();
    const existing = await ctx.db
      .query("waterLogs")
      .withIndex("by_userId_date", (q) => q.eq("userId", userId).eq("date", today))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { glasses: Math.max(0, args.glasses) });
    } else {
      await ctx.db.insert("waterLogs", {
        userId,
        date: today,
        glasses: Math.max(0, args.glasses),
      });
    }
  },
});
