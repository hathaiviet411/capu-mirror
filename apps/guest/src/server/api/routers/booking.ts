import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export const bookingRouter = createTRPCRouter({
  getUserBookings: protectedProcedure.query(({ ctx }) => {
    return ctx.db.booking.findMany({
      where: { guestId: ctx.session.user.id },
      include: {
        cast: {
          include: {
            user: {
              select: {
                name: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  create: protectedProcedure
    .input(
      z.object({
        castId: z.string(),
        startTime: z.date(),
        endTime: z.date(),
        location: z.string(),
        message: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      return ctx.db.booking.create({
        data: {
          ...input,
          guestId: ctx.session.user.id,
          totalAmount: 0, // Calculate based on time and rate
        },
      });
    }),
}); 