import { createTRPCRouter } from "~/server/api/trpc";
import { adminRouter } from "~/server/api/routers/admin";
import { authRouter } from "~/server/api/routers/auth";
import { userRouter } from "~/server/api/routers/user";
import { castRouter } from "~/server/api/routers/cast";
import { guestRouter } from "~/server/api/routers/guest";
import { messageRouter } from "~/server/api/routers/message";
import { bookingRouter } from "~/server/api/routers/booking";
import { paymentRouter } from "~/server/api/routers/payment";
import { notificationRouter } from "~/server/api/routers/notification";
import { presenceRouter } from "~/server/api/routers/presence";
import { fileRouter } from "~/server/api/routers/file";
import { searchRouter } from "~/server/api/routers/search";
import { analyticsRouter } from "~/server/api/routers/analytics";
import { contentRouter } from "~/server/api/routers/content";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  admin: adminRouter,
  analytics: analyticsRouter,
  auth: authRouter,
  booking: bookingRouter,
  cast: castRouter,
  content: contentRouter,
  file: fileRouter,
  guest: guestRouter,
  message: messageRouter,
  notification: notificationRouter,
  payment: paymentRouter,
  presence: presenceRouter,
  search: searchRouter,
  user: userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter; 