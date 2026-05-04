import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get logs for a specific month
export const getByMonth = query({
  args: { year: v.number(), month: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const allLogs = await ctx.db
      .query("dailyLogs")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    // Filter by year-month
    const prefix = `${args.year}-${String(args.month).padStart(2, "0")}`;
    return allLogs
      .filter((log) => log.date.startsWith(prefix))
      .sort((a, b) => b.date.localeCompare(a.date));
  },
});

// Get logs for a date range
export const getByDateRange = query({
  args: { from: v.string(), to: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const allLogs = await ctx.db
      .query("dailyLogs")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    return allLogs
      .filter((log) => log.date >= args.from && log.date <= args.to)
      .sort((a, b) => a.date.localeCompare(b.date));
  },
});

// Get last 7 days for weekly chart
export const getWeekSummary = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const allLogs = await ctx.db
      .query("dailyLogs")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    // Get last 7 days
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split("T")[0]);
    }

    return days.map((date) => {
      const log = allLogs.find((l) => l.date === date);
      return {
        date,
        totalCalories: log?.totalCalories ?? 0,
        totalProtein: log?.totalProtein ?? 0,
        totalCarbs: log?.totalCarbs ?? 0,
        totalFat: log?.totalFat ?? 0,
        mealsCount: log?.mealsCount ?? 0,
        waterGlasses: log?.waterGlasses ?? 0,
      };
    });
  },
});

// Get total stats (streak, total days logged)
export const getStats = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { streak: 0, totalDays: 0, totalMeals: 0 };

    const allLogs = await ctx.db
      .query("dailyLogs")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const totalDays = allLogs.length;
    const totalMeals = allLogs.reduce((s, l) => s + l.mealsCount, 0);

    // Calculate streak: consecutive days ending yesterday or today
    const dates = allLogs.map((l) => l.date).sort().reverse();
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < dates.length; i++) {
      const expected = new Date(today);
      expected.setDate(expected.getDate() - i);
      const expectedStr = expected.toISOString().split("T")[0];
      
      if (dates.includes(expectedStr)) {
        streak++;
      } else {
        break;
      }
    }

    return { streak, totalDays, totalMeals };
  },
});
