/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */
import { initTRPC, TRPCError } from "@trpc/server";
import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import { type Session } from "next-auth";
import superjson from "superjson";
import { ZodError } from "zod";
import { EventEmitter } from "events";
import { observable } from "@trpc/server/observable";

import { getServerAuthSession } from "~/server/auth";
import { db } from "~/server/db";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 */

interface CreateContextOptions {
  session: Session | null;
}

/**
 * This helper generates the "internals" for a tRPC context. If you need to use it, you can export
 * it from here.
 *
 * Examples of things you may need it for:
 * - testing, so we don't have to mock Next.js' req/res
 * - tRPC's `createSSGHelpers`, where we don't have req/res
 *
 * @see https://create.t3.gg/en/usage/trpc#-serverapitrpcts
 */
const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    session: opts.session,
    db,
  };
};

/**
 * This is the actual context you will use in your router. It will be used to process every request
 * that goes through your tRPC endpoint.
 *
 * @see https://trpc.io/docs/context
 */
export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  const { req, res } = opts;

  // Get the session from the server using the getServerAuthSession wrapper function
  const session = await getServerAuthSession({ req, res });

  return createInnerTRPCContext({
    session,
  });
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure;

/**
 * Reusable middleware that enforces users are logged in before running the procedure.
 */
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      // infers the `session` as non-nullable
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

/**
 * Rate limiting middleware to prevent spam and DoS attacks
 */
interface RateLimitConfig {
  max: number;     // Maximum requests
  window: string;  // Time window (e.g., "1m", "1h")
}

// In-memory rate limit store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const createRateLimitMiddleware = (config: RateLimitConfig) => {
  const windowMs = parseTimeString(config.window);
  
  return t.middleware(({ ctx, next }) => {
    if (!ctx.session?.user?.id) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const userId = ctx.session.user.id;
    const now = Date.now();
    const key = `${userId}:${config.max}:${config.window}`;
    
    const current = rateLimitStore.get(key);
    
    if (!current || now > current.resetTime) {
      // Reset or initialize rate limit
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }
    
    if (current.count >= config.max) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `レート制限に達しました。${Math.ceil((current.resetTime - now) / 1000)}秒後に再試行してください。`,
      });
    }
    
    current.count++;
    return next();
  });
};

// Time string parser (e.g., "1m" -> 60000ms)
function parseTimeString(timeStr: string): number {
  const match = timeStr.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid time format: ${timeStr}`);
  
  const value = parseInt(match[1]!);
  const unit = match[2]!;
  
  const multipliers = {
    s: 1000,      // seconds
    m: 60 * 1000, // minutes
    h: 60 * 60 * 1000, // hours
    d: 24 * 60 * 60 * 1000, // days
  };
  
  return value * multipliers[unit as keyof typeof multipliers];
}

/**
 * Rate-limited protected procedure for messaging
 */
export const rateLimitedProcedure = protectedProcedure
  .use(createRateLimitMiddleware({ max: 10, window: "1m" }));

/**
 * Subscription procedure for real-time communication
 */
export const subscriptionProcedure = t.procedure.use(enforceUserIsAuthed);

// Global event emitter for real-time events
export const ee = new EventEmitter();

// Event types for type safety
export interface EventMap {
  "message:new": { messageId: string; conversationId: string; senderId: string; content: string; timestamp: Date };
  "message:typing": { conversationId: string; userId: string; isTyping: boolean };
  "message:read": { messageId: string; conversationId: string; userId: string; readAt: Date };
  "message:reaction": { messageId: string; conversationId: string; userId: string; reaction: string; action: "add" | "remove" };
  "presence:status": { userId: string; status: "online" | "offline" | "away"; lastSeenAt: Date };
  "presence:activity": { userId: string; lastActivityAt: Date };
  "notification:new": { notificationId: string; userId: string; type: string; title: string; message: string };
  "notification:unread": { userId: string; count: number };
  "booking:proposal": { proposalId: string; conversationId: string; fromUserId: string; toUserId: string };
  "booking:status": { bookingId: string; status: string; userId: string };
}

// Type-safe event emitter functions
export const emitEvent = <T extends keyof EventMap>(event: T, data: EventMap[T]) => {
  ee.emit(event, data);
};

export const createObservable = <T extends keyof EventMap>(event: T) => {
  return observable<EventMap[T]>((emit) => {
    const listener = (data: EventMap[T]) => {
      emit.next(data);
    };
    
    ee.on(event, listener);
    
    return () => {
      ee.off(event, listener);
    };
  });
}; 