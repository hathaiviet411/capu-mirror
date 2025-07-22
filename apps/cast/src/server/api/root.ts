import { createTRPCRouter } from "~/server/api/trpc";
import { userRouter } from "~/server/api/routers/user";
import { castRouter } from "~/server/api/routers/cast";
import { guestRouter } from "~/server/api/routers/guest";
import { messageRouter } from "~/server/api/routers/message";
import { bookingRouter } from "~/server/api/routers/booking";
import { paymentRouter } from "~/server/api/routers/payment";
import { notificationRouter } from "~/server/api/routers/notification";
import { fileRouter } from "~/server/api/routers/file";
import { searchRouter } from "~/server/api/routers/search";
import { analyticsRouter } from "~/server/api/routers/analytics";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  user: userRouter,
  cast: castRouter,
  guest: guestRouter,
  message: messageRouter,
  booking: bookingRouter,
  payment: paymentRouter,
  notification: notificationRouter,
  file: fileRouter,
  search: searchRouter,
  analytics: analyticsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter; 