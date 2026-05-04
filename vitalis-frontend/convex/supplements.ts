import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get all active supplements for current user
export const getAll = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("supplements")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
  },
});

// Get only active supplements
export const getActive = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const all = await ctx.db
      .query("supplements")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    return all.filter((s) => s.active);
  },
});

// Add a new supplement
export const add = mutation({
  args: {
    name: v.string(),
    category: v.string(),
    dose: v.string(),
    frequency: v.string(),
    time_of_day: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("No autenticado");

    return await ctx.db.insert("supplements", {
      userId,
      name: args.name,
      category: args.category,
      dose: args.dose,
      frequency: args.frequency,
      time_of_day: args.time_of_day,
      notes: args.notes,
      active: true,
      created_at: Date.now(),
    });
  },
});

// Update a supplement
export const update = mutation({
  args: {
    id: v.id("supplements"),
    name: v.optional(v.string()),
    category: v.optional(v.string()),
    dose: v.optional(v.string()),
    frequency: v.optional(v.string()),
    time_of_day: v.optional(v.string()),
    notes: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("No autenticado");

    const supplement = await ctx.db.get(args.id);
    if (supplement?.userId !== userId) throw new Error("No autorizado");

    const { id, ...updates } = args;
    const payload: Record<string, any> = {};
    for (const [key, val] of Object.entries(updates)) {
      if (val !== undefined) payload[key] = val;
    }

    await ctx.db.patch(id, payload);
  },
});

// Delete a supplement
export const remove = mutation({
  args: { id: v.id("supplements") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("No autenticado");

    const supplement = await ctx.db.get(args.id);
    if (supplement?.userId === userId) {
      await ctx.db.delete(args.id);
    }
  },
});

// Toggle supplement active status
export const toggleActive = mutation({
  args: { id: v.id("supplements") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("No autenticado");

    const supplement = await ctx.db.get(args.id);
    if (supplement?.userId === userId) {
      await ctx.db.patch(args.id, { active: !supplement.active });
    }
  },
});

// ---- Supplement Logs (daily check-off) ----

// Get today's supplement logs
export const getTodayLogs = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const today = new Date().toISOString().split("T")[0];
    return await ctx.db
      .query("supplementLogs")
      .withIndex("by_userId_date", (q) => q.eq("userId", userId).eq("date", today))
      .collect();
  },
});

// Log/toggle a supplement intake for today
export const logIntake = mutation({
  args: { supplementId: v.id("supplements") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("No autenticado");

    const today = new Date().toISOString().split("T")[0];

    // Check if already logged today
    const existing = await ctx.db
      .query("supplementLogs")
      .withIndex("by_supplement_date", (q) =>
        q.eq("supplementId", args.supplementId).eq("date", today)
      )
      .first();

    if (existing) {
      // Toggle
      await ctx.db.patch(existing._id, {
        taken: !existing.taken,
        taken_at: !existing.taken ? Date.now() : undefined,
      });
    } else {
      await ctx.db.insert("supplementLogs", {
        userId,
        supplementId: args.supplementId,
        date: today,
        taken: true,
        taken_at: Date.now(),
      });
    }
  },
});
