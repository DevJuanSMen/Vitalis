import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getWorkouts = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("workouts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const getLogs = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("workoutLogs")
      .withIndex("by_userId_date", (q) => q.eq("userId", userId).eq("date", args.date))
      .collect();
  },
});

export const addWorkout = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    difficulty: v.string(),
    exercises: v.array(
      v.object({
        name: v.string(),
        sets: v.number(),
        reps: v.string(),
        rest: v.optional(v.string()),
        notes: v.optional(v.string()),
        muscleGroup: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not logged in");
    return await ctx.db.insert("workouts", { ...args, userId, created_at: Date.now() });
  },
});

export const logWorkout = mutation({
  args: {
    workoutId: v.id("workouts"),
    date: v.string(),
    duration: v.optional(v.number()),
    performance: v.optional(v.string()),
    notes: v.optional(v.string()),
    status: v.optional(v.string()),
    completedExercises: v.optional(v.array(v.number())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not logged in");
    
    // Check if an in-progress log already exists for this workout today
    const existing = await ctx.db
      .query("workoutLogs")
      .withIndex("by_userId_date", (q) => q.eq("userId", userId).eq("date", args.date))
      .filter((q) => q.eq(q.field("workoutId"), args.workoutId))
      .first();

    if (existing) {
      return await ctx.db.patch(existing._id, { ...args });
    }

    return await ctx.db.insert("workoutLogs", { ...args, userId });
  },
});

export const updateLogProgress = mutation({
  args: {
    logId: v.id("workoutLogs"),
    completedExercises: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not logged in");
    const log = await ctx.db.get(args.logId);
    if (log?.userId !== userId) throw new Error("Unauthorized");
    
    await ctx.db.patch(args.logId, { completedExercises: args.completedExercises });
  },
});

export const deleteWorkout = mutation({
  args: { id: v.id("workouts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not logged in");
    const workout = await ctx.db.get(args.id);
    if (workout?.userId !== userId) throw new Error("Unauthorized");
    await ctx.db.delete(args.id);
  },
});
