/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as bodyLogs from "../bodyLogs.js";
import type * as chat from "../chat.js";
import type * as dailyLogs from "../dailyLogs.js";
import type * as http from "../http.js";
import type * as meals from "../meals.js";
import type * as profile from "../profile.js";
import type * as supplements from "../supplements.js";
import type * as users from "../users.js";
import type * as waterLogs from "../waterLogs.js";
import type * as workouts from "../workouts.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  bodyLogs: typeof bodyLogs;
  chat: typeof chat;
  dailyLogs: typeof dailyLogs;
  http: typeof http;
  meals: typeof meals;
  profile: typeof profile;
  supplements: typeof supplements;
  users: typeof users;
  waterLogs: typeof waterLogs;
  workouts: typeof workouts;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
