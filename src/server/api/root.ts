import { postRouter } from "~/server/api/routers/post";
import { createTRPCRouter } from "~/server/api/trpc";
import { userRouter } from "~/server/api/routers/user";
import { castRouter } from "~/server/api/routers/cast";
import { bookingRouter } from "~/server/api/routers/booking";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  user: userRouter,
  cast: castRouter,
  booking: bookingRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter; 