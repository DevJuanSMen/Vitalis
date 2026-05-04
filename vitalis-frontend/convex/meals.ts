import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Helper: get today's date string in YYYY-MM-DD
function todayStr() {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

// Get meals for current day only
export const getToday = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    
    const today = todayStr();
    return await ctx.db
      .query("meals")
      .withIndex("by_userId_date", (q) => q.eq("userId", userId).eq("date", today))
      .collect();
  },
});

// Get all meals (for backward compat — will migrate to getToday)
export const get = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    
    return await ctx.db
      .query("meals")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
  },
});

// Add a meal with optional macros
export const add = mutation({
  args: {
    name: v.string(),
    calories: v.number(),
    protein: v.optional(v.number()),
    carbs: v.optional(v.number()),
    fat: v.optional(v.number()),
    mealType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("No autenticado");

    return await ctx.db.insert("meals", {
      userId,
      name: args.name,
      calories: args.calories,
      protein: args.protein ?? 0,
      carbs: args.carbs ?? 0,
      fat: args.fat ?? 0,
      mealType: args.mealType ?? "snack",
      consumed_at: Date.now(),
      date: todayStr(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("meals") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("No autenticado");

    const meal = await ctx.db.get(args.id);
    if (meal?.userId === userId) {
      await ctx.db.delete(meal._id);
    }
  },
});

// Reset day: archives meals to dailyLogs, then deletes them
export const resetDay = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("No autenticado");

    const today = todayStr();
    
    // Get today's meals
    const meals = await ctx.db
      .query("meals")
      .withIndex("by_userId_date", (q) => q.eq("userId", userId).eq("date", today))
      .collect();

    if (meals.length > 0) {
      // Check if a daily log already exists for today
      const existingLog = await ctx.db
        .query("dailyLogs")
        .withIndex("by_userId_date", (q) => q.eq("userId", userId).eq("date", today))
        .first();

      // Get today's water intake
      const waterLog = await ctx.db
        .query("waterLogs")
        .withIndex("by_userId_date", (q) => q.eq("userId", userId).eq("date", today))
        .first();

      const totalCalories = meals.reduce((s, m) => s + (m.calories || 0), 0);
      const totalProtein = meals.reduce((s, m) => s + (m.protein || 0), 0);
      const totalCarbs = meals.reduce((s, m) => s + (m.carbs || 0), 0);
      const totalFat = meals.reduce((s, m) => s + (m.fat || 0), 0);

      const logPayload = {
        userId,
        date: today,
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
        mealsCount: meals.length,
        meals: meals.map((m) => ({
          name: m.name,
          calories: m.calories || 0,
          protein: m.protein || 0,
          carbs: m.carbs || 0,
          fat: m.fat || 0,
          mealType: m.mealType || "snack",
          consumed_at: m.consumed_at,
        })),
        waterGlasses: waterLog?.glasses ?? 0,
      };

      if (existingLog) {
        await ctx.db.patch(existingLog._id, logPayload);
      } else {
        await ctx.db.insert("dailyLogs", logPayload);
      }
    }

    // Delete all meals for today
    for (const meal of meals) {
      await ctx.db.delete(meal._id);
    }

    return { archived: meals.length };
  },
});

// Legacy reset (delete all, backward compat)
export const reset = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("No autenticado");

    const meals = await ctx.db
      .query("meals")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
      
    for (const meal of meals) {
      await ctx.db.delete(meal._id);
    }
  },
});
