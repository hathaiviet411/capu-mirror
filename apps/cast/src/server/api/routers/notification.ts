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

export const notificationRouter = createTRPCRouter({
  // 通知一覧を取得
  getNotifications: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
      unreadOnly: z.boolean().default(false),
    }))
    .query(async ({ ctx, input }) => {
      const whereClause: any = {
        userId: ctx.session.user.id,
      };

      if (input.unreadOnly) {
        whereClause.isRead = false;
      }

      const notifications = await ctx.db.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        take: input.limit,
        skip: input.offset,
      });

      return notifications;
    }),

  // 未読通知数を取得
  getUnreadCount: protectedProcedure
    .query(async ({ ctx }) => {
      const count = await ctx.db.notification.count({
        where: {
          userId: ctx.session.user.id,
          isRead: false,
        },
      });

      return { count };
    }),

  // 通知を既読にする
  markAsRead: protectedProcedure
    .input(z.object({
      notificationIds: z.array(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      // 通知の所有者チェック
      const notifications = await ctx.db.notification.findMany({
        where: {
          id: { in: input.notificationIds },
          userId: ctx.session.user.id,
        },
      });

      if (notifications.length !== input.notificationIds.length) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "一部の通知にアクセスする権限がありません",
        });
      }

      await ctx.db.notification.updateMany({
        where: {
          id: { in: input.notificationIds },
          userId: ctx.session.user.id,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      // 未読数を再計算して通知
      const unreadCount = await ctx.db.notification.count({
        where: {
          userId: ctx.session.user.id,
          isRead: false,
        },
      });

      emitEvent("notification:unread", {
        userId: ctx.session.user.id,
        count: unreadCount,
      });

      return { success: true, updatedCount: input.notificationIds.length };
    }),

  // 全ての通知を既読にする
  markAllAsRead: protectedProcedure
    .mutation(async ({ ctx }) => {
      const result = await ctx.db.notification.updateMany({
        where: {
          userId: ctx.session.user.id,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      // 未読数を0で通知
      emitEvent("notification:unread", {
        userId: ctx.session.user.id,
        count: 0,
      });

      return { success: true, updatedCount: result.count };
    }),

  // 通知を削除
  deleteNotifications: protectedProcedure
    .input(z.object({
      notificationIds: z.array(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      // 通知の所有者チェック
      const notifications = await ctx.db.notification.findMany({
        where: {
          id: { in: input.notificationIds },
          userId: ctx.session.user.id,
        },
      });

      if (notifications.length !== input.notificationIds.length) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "一部の通知にアクセスする権限がありません",
        });
      }

      await ctx.db.notification.deleteMany({
        where: {
          id: { in: input.notificationIds },
          userId: ctx.session.user.id,
        },
      });

      return { success: true, deletedCount: input.notificationIds.length };
    }),

  // 通知設定を取得
  getSettings: protectedProcedure
    .query(async ({ ctx }) => {
      const settings = await ctx.db.notificationPreference.findUnique({
        where: { userId: ctx.session.user.id },
      });

      // デフォルト設定を返す
      if (!settings) {
        return {
          emailNotifications: true,
          pushNotifications: true,
          messageNotifications: true,
          bookingNotifications: true,
          marketingNotifications: false,
        };
      }

      return {
        emailNotifications: settings.emailNotifications,
        pushNotifications: settings.pushNotifications,
        messageNotifications: settings.messageNotifications,
        bookingNotifications: settings.bookingNotifications,
        marketingNotifications: settings.marketingNotifications,
      };
    }),

  // 通知設定を更新
  updateSettings: protectedProcedure
    .input(z.object({
      emailNotifications: z.boolean().optional(),
      pushNotifications: z.boolean().optional(),
      messageNotifications: z.boolean().optional(),
      bookingNotifications: z.boolean().optional(),
      marketingNotifications: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.notificationPreference.upsert({
        where: { userId: ctx.session.user.id },
        create: {
          userId: ctx.session.user.id,
          ...input,
        },
        update: input,
      });

      return { success: true };
    }),

  // 通知を作成（内部使用）
  create: protectedProcedure
    .input(z.object({
      userId: z.string(),
      type: z.string(),
      title: z.string(),
      message: z.string(),
      data: z.record(z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 管理者または自分の通知のみ作成可能
      if (ctx.session.user.userType !== "ADMIN" && input.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "他のユーザーの通知を作成する権限がありません",
        });
      }

      const notification = await ctx.db.notification.create({
        data: {
          userId: input.userId,
          type: input.type,
          title: input.title,
          message: input.message,
          data: input.data ? JSON.stringify(input.data) : null,
        },
      });

      // リアルタイム通知イベントを発信
      emitEvent("notification:new", {
        notificationId: notification.id,
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
      });

      // 未読数を更新
      const unreadCount = await ctx.db.notification.count({
        where: {
          userId: input.userId,
          isRead: false,
        },
      });

      emitEvent("notification:unread", {
        userId: input.userId,
        count: unreadCount,
      });

      return notification;
    }),

  // WebSocket Subscriptions
  // 新規通知のリアルタイム受信
  onNewNotification: subscriptionProcedure
    .subscription(({ ctx }) => {
      const userId = ctx.session.user.id;

      return createObservable("notification:new").pipe(
        filter(data => data.userId === userId)
      );
    }),

  // 未読数変更のリアルタイム受信
  onUnreadCountChange: subscriptionProcedure
    .subscription(({ ctx }) => {
      const userId = ctx.session.user.id;

      return createObservable("notification:unread").pipe(
        filter(data => data.userId === userId)
      );
    }),
});