import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const get = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
  },
});

export const update = mutation({
  args: {
    age: v.union(v.number(), v.null()),
    weight_kg: v.union(v.number(), v.null()),
    height_cm: v.union(v.number(), v.null()),
    sex_assigned: v.union(v.string(), v.null()),
    activity_level: v.union(v.string(), v.null()),
    goal_type: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("No autenticado");

    const payload: any = {};
    if (args.age !== null) payload.age = args.age;
    if (args.weight_kg !== null) payload.weight_kg = args.weight_kg;
    if (args.height_cm !== null) payload.height_cm = args.height_cm;
    if (args.sex_assigned !== null) payload.sex_assigned = args.sex_assigned;
    if (args.activity_level !== null) payload.activity_level = args.activity_level;
    if (args.goal_type !== null && args.goal_type !== undefined) payload.goal_type = args.goal_type;

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return await ctx.db.get(existing._id);
    } else {
      const id = await ctx.db.insert("profiles", { userId, ...payload });
      return await ctx.db.get(id);
    }
  },
});
