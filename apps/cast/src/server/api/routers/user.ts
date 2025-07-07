import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  getProfile: protectedProcedure.query(({ ctx }) => {
    return ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      include: {
        castProfiles: true,
      },
    });
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        phoneNumber: z.string().optional(),
        prefecture: z.string().optional(),
        city: z.string().optional(),
        selfIntro: z.string().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: input,
      });
    }),

  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.db.user.findMany({
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        userType: true,
        createdAt: true,
      },
    });
  }),
}); 