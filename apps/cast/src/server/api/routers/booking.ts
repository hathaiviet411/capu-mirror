import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { filter } from "rxjs";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  subscriptionProcedure,
  emitEvent,
  createObservable,
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
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.db.booking.create({
        data: {
          ...input,
          guestId: ctx.session.user.id,
          totalAmount: 0, // Calculate based on time and rate
        },
        include: {
          cast: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          },
          guest: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      // 予約状態変更イベントを発信
      emitEvent("booking:status", {
        bookingId: booking.id,
        status: booking.status,
        userId: booking.cast.userId, // キャストに通知
      });

      return booking;
    }),

  // 予約ステータスを更新
  updateStatus: protectedProcedure
    .input(
      z.object({
        bookingId: z.string(),
        status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 予約の存在確認と権限チェック
      const booking = await ctx.db.booking.findUnique({
        where: { id: input.bookingId },
        include: {
          cast: {
            include: {
              user: { select: { id: true } },
            },
          },
          guest: { select: { id: true } },
        },
      });

      if (!booking) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "予約が見つかりません",
        });
      }

      // キャストまたはゲスト、または管理者のみ更新可能
      const isOwner = 
        booking.cast.userId === ctx.session.user.id ||
        booking.guestId === ctx.session.user.id;
      const isAdmin = ctx.session.user.userType === "ADMIN";

      if (!isOwner && !isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "この予約を更新する権限がありません",
        });
      }

      const updatedBooking = await ctx.db.booking.update({
        where: { id: input.bookingId },
        data: {
          status: input.status,
          ...(input.reason && { notes: input.reason }),
        },
      });

      // 関係者全員に予約状態変更を通知
      emitEvent("booking:status", {
        bookingId: updatedBooking.id,
        status: input.status,
        userId: booking.cast.userId, // キャストに通知
      });

      emitEvent("booking:status", {
        bookingId: updatedBooking.id,
        status: input.status,
        userId: booking.guestId, // ゲストに通知
      });

      return updatedBooking;
    }),

  // 日程提案の更新（messageルーターから移動した機能との統合）
  updateScheduleProposal: protectedProcedure
    .input(
      z.object({
        proposalId: z.string(),
        status: z.enum(["PENDING", "ACCEPTED", "DECLINED", "EXPIRED"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const proposal = await ctx.db.scheduleProposal.findUnique({
        where: { id: input.proposalId },
        include: {
          conversation: {
            include: {
              participants: { select: { id: true } },
            },
          },
        },
      });

      if (!proposal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "日程提案が見つかりません",
        });
      }

      // 会話参加者チェック
      const isParticipant = proposal.conversation.participants.some(
        p => p.id === ctx.session.user.id
      );

      if (!isParticipant) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "この提案を更新する権限がありません",
        });
      }

      const updatedProposal = await ctx.db.scheduleProposal.update({
        where: { id: input.proposalId },
        data: {
          status: input.status,
          respondedAt: input.status !== "PENDING" ? new Date() : null,
        },
      });

      // 日程提案更新イベントを発信
      emitEvent("booking:proposal", {
        proposalId: updatedProposal.id,
        conversationId: proposal.conversationId,
        fromUserId: proposal.proposerId,
        toUserId: proposal.conversation.participants.find(p => p.id !== proposal.proposerId)?.id || "",
      });

      return updatedProposal;
    }),

  // WebSocket Subscriptions
  // 予約状態変更のリアルタイム受信
  onBookingStatusChange: subscriptionProcedure
    .subscription(({ ctx }) => {
      const userId = ctx.session.user.id;

      return createObservable("booking:status").pipe(
        filter(data => data.userId === userId)
      );
    }),

  // 日程提案更新のリアルタイム受信
  onScheduleProposalUpdate: subscriptionProcedure
    .subscription(({ ctx }) => {
      const userId = ctx.session.user.id;

      return createObservable("booking:proposal").pipe(
        filter(data => data.fromUserId === userId || data.toUserId === userId)
      );
    }),
}); 