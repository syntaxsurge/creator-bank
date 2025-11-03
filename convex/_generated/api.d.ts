/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as chains from "../chains.js";
import type * as comments from "../comments.js";
import type * as courses from "../courses.js";
import type * as groups from "../groups.js";
import type * as invoices from "../invoices.js";
import type * as lessons from "../lessons.js";
import type * as likes from "../likes.js";
import type * as media from "../media.js";
import type * as modules from "../modules.js";
import type * as paylinks from "../paylinks.js";
import type * as payouts from "../payouts.js";
import type * as posts from "../posts.js";
import type * as saveGoals from "../saveGoals.js";
import type * as users from "../users.js";
import type * as utils from "../utils.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  chains: typeof chains;
  comments: typeof comments;
  courses: typeof courses;
  groups: typeof groups;
  invoices: typeof invoices;
  lessons: typeof lessons;
  likes: typeof likes;
  media: typeof media;
  modules: typeof modules;
  paylinks: typeof paylinks;
  payouts: typeof payouts;
  posts: typeof posts;
  saveGoals: typeof saveGoals;
  users: typeof users;
  utils: typeof utils;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
