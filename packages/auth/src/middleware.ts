/**
 * Clerk middleware helpers shared across apps.
 * Each app creates its own middleware.ts using these helpers.
 */
export { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
