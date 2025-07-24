import { postRouter } from "~/server/api/routers/post";
import { createTRPCRouter } from "~/server/api/trpc";
import { authRouter } from "~/server/api/routers/auth";
import { userRouter } from "~/server/api/routers/user";
import { castRouter } from "~/server/api/routers/cast";
import { bookingRouter } from "~/server/api/routers/booking";
import { messageRouter } from "~/server/api/routers/message";
import { contentRouter } from "~/server/api/routers/content";
import { guestRouter } from "~/server/api/routers/guest";
import { fileRouter } from "~/server/api/routers/file";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  auth: authRouter,
  post: postRouter,
  user: userRouter,
  cast: castRouter,
  booking: bookingRouter,
  message: messageRouter,
  content: contentRouter,
  guest: guestRouter,
  file: fileRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter; 