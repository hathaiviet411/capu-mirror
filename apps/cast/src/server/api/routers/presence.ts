import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { filter } from "rxjs";
import {
  createTRPCRouter,
  protectedProcedure,
  subscriptionProcedure,
  emitEvent,
  createObservable,
} from "~/server/api/trpc";

export const presenceRouter = createTRPCRouter({
  // ユーザーのオンライン状態を更新
  updateStatus: protectedProcedure
    .input(z.object({
      status: z.enum(["online", "away", "offline"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // ユーザーのステータスを更新
      await ctx.db.user.update({
        where: { id: userId },
        data: {
          lastSeenAt: new Date(),
          // Note: オンラインステータスフィールドがPrismaスキーマに追加されている場合
          // onlineStatus: input.status,
        },
      });

      // プレゼンス変更イベントを発信
      emitEvent("presence:status", {
        userId,
        status: input.status,
        lastSeenAt: new Date(),
      });

      return { success: true };
    }),

  // ユーザーのアクティビティを更新（ハートビート）
  updateActivity: protectedProcedure
    .mutation(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      const now = new Date();

      await ctx.db.user.update({
        where: { id: userId },
        data: { lastSeenAt: now },
      });

      // アクティビティ更新イベントを発信
      emitEvent("presence:activity", {
        userId,
        lastActivityAt: now,
      });

      return { success: true };
    }),

  // オンラインユーザー一覧を取得
  getOnlineUsers: protectedProcedure
    .input(z.object({
      userIds: z.array(z.string()).optional(), // 特定のユーザーのみチェック
    }))
    .query(async ({ ctx, input }) => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000); // 5分以内をオンラインとみなす

      const whereClause: any = {
        lastSeenAt: {
          gte: fiveMinutesAgo,
        },
      };

      if (input.userIds && input.userIds.length > 0) {
        whereClause.id = { in: input.userIds };
      }

      const onlineUsers = await ctx.db.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          image: true,
          lastSeenAt: true,
          userType: true,
        },
      });

      return onlineUsers.map(user => ({
        ...user,
        isOnline: true,
        lastSeenAt: user.lastSeenAt,
      }));
    }),

  // 特定ユーザーの詳細なプレゼンス情報を取得
  getUserPresence: protectedProcedure
    .input(z.object({
      userId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: {
          id: true,
          name: true,
          image: true,
          lastSeenAt: true,
          userType: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "ユーザーが見つかりません",
        });
      }

      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const isOnline = user.lastSeenAt && user.lastSeenAt >= fiveMinutesAgo;

      return {
        ...user,
        isOnline,
        status: isOnline ? "online" : "offline",
      };
    }),

  // 会話参加者のプレゼンス状態を取得
  getConversationPresence: protectedProcedure
    .input(z.object({
      conversationId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      // 会話の存在確認とアクセス権限チェック
      const conversation = await ctx.db.conversation.findUnique({
        where: { id: input.conversationId },
        include: {
          participants: {
            select: {
              id: true,
              name: true,
              image: true,
              lastSeenAt: true,
              userType: true,
            },
          },
        },
      });

      if (!conversation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "会話が見つかりません",
        });
      }

      const isParticipant = conversation.participants.some(
        p => p.id === ctx.session.user.id
      );

      if (!isParticipant) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "この会話に参加していません",
        });
      }

      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      return conversation.participants.map(user => {
        const isOnline = user.lastSeenAt && user.lastSeenAt >= fiveMinutesAgo;
        return {
          ...user,
          isOnline,
          status: isOnline ? "online" : "offline",
        };
      });
    }),

  // WebSocket Subscriptions
  // ユーザーステータス変更のリアルタイム受信
  onUserStatusChange: subscriptionProcedure
    .input(z.object({
      userIds: z.array(z.string()).optional(), // 監視するユーザーIDリスト
    }))
    .subscription(({ ctx, input }) => {
      return createObservable("presence:status").pipe(
        filter(data => {
          if (!input.userIds || input.userIds.length === 0) {
            return true; // 全ユーザーを監視
          }
          return input.userIds.includes(data.userId);
        })
      );
    }),

  // ユーザーアクティビティ変更のリアルタイム受信
  onUserActivity: subscriptionProcedure
    .input(z.object({
      userIds: z.array(z.string()).optional(),
    }))
    .subscription(({ ctx, input }) => {
      return createObservable("presence:activity").pipe(
        filter(data => {
          if (!input.userIds || input.userIds.length === 0) {
            return true;
          }
          return input.userIds.includes(data.userId);
        })
      );
    }),

  // 会話参加者のプレゼンス変更をリアルタイム受信
  onConversationPresence: subscriptionProcedure
    .input(z.object({
      conversationId: z.string(),
    }))
    .subscription(async ({ ctx, input }) => {
      // アクセス権限チェック
      const conversation = await ctx.db.conversation.findUnique({
        where: { id: input.conversationId },
        include: {
          participants: { select: { id: true } },
        },
      });

      if (!conversation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "会話が見つかりません",
        });
      }

      const isParticipant = conversation.participants.some(
        p => p.id === ctx.session.user.id
      );

      if (!isParticipant) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "この会話に参加していません",
        });
      }

      const participantIds = conversation.participants.map(p => p.id);

      return createObservable("presence:status").pipe(
        filter(data => participantIds.includes(data.userId))
      );
    }),
});