import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

// TODO: Add Firebase Cloud Messaging implementation
// import { messaging } from "~/server/firebase";

const notificationSchema = z.object({
  userId: z.string(),
  type: z.enum(["BOOKING", "MESSAGE", "PAYMENT", "REVIEW", "SYSTEM"]),
  title: z.string().min(1, "タイトルを入力してください").max(100, "タイトルは100文字以下で入力してください"),
  body: z.string().min(1, "メッセージを入力してください").max(500, "メッセージは500文字以下で入力してください"),
  data: z.record(z.string()).optional(),
  actionUrl: z.string().url("正しいURL形式で入力してください").optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH"]).default("NORMAL"),
  scheduledAt: z.date().optional(),
});

const notificationSettingsSchema = z.object({
  userId: z.string(),
  settings: z.object({
    bookingNotifications: z.boolean().default(true),
    messageNotifications: z.boolean().default(true),
    paymentNotifications: z.boolean().default(true),
    reviewNotifications: z.boolean().default(true),
    systemNotifications: z.boolean().default(true),
    pushNotifications: z.boolean().default(true),
    emailNotifications: z.boolean().default(false),
  }),
});

export const notificationRouter = createTRPCRouter({
  // 通知作成
  create: protectedProcedure
    .input(notificationSchema)
    .mutation(async ({ ctx, input }) => {
      // 管理者のみが他のユーザーの通知を作成可能
      if (ctx.session.user.id !== input.userId && ctx.session.user.userType !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "他のユーザーの通知を作成する権限がありません",
        });
      }

      const notification = await ctx.db.notification.create({
        data: {
          ...input,
          data: input.data ? JSON.stringify(input.data) : null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Push通知送信
      if (input.scheduledAt && input.scheduledAt > new Date()) {
        // スケジュール通知の場合は後で処理
        // TODO: ジョブキューシステムの実装
        console.log("Scheduled notification created:", notification.id);
      } else {
        await this.sendPushNotification(ctx, {
          userId: input.userId,
          title: input.title,
          body: input.body,
          data: input.data,
        });
      }

      return {
        ...notification,
        data: notification.data ? JSON.parse(notification.data as string) : null,
      };
    }),

  // 通知一覧取得
  getNotifications: protectedProcedure
    .input(z.object({
      userId: z.string(),
      type: z.enum(["BOOKING", "MESSAGE", "PAYMENT", "REVIEW", "SYSTEM"]).optional(),
      isRead: z.boolean().optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      // 自分の通知または管理者のみアクセス可能
      if (ctx.session.user.id !== input.userId && ctx.session.user.userType !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "自分の通知のみ閲覧できます",
        });
      }

      const notifications = await ctx.db.notification.findMany({
        where: {
          userId: input.userId,
          ...(input.type && { type: input.type }),
          ...(input.isRead !== undefined && { isRead: input.isRead }),
        },
        orderBy: {
          createdAt: "desc",
        },
        take: input.limit,
        skip: input.offset,
      });

      return notifications.map(notification => ({
        ...notification,
        data: notification.data ? JSON.parse(notification.data as string) : null,
      }));
    }),

  // Push通知送信
  sendPushNotification: protectedProcedure
    .input(z.object({
      userId: z.string(),
      title: z.string().min(1, "タイトルを入力してください").max(100),
      body: z.string().min(1, "メッセージを入力してください").max(500),
      data: z.record(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 管理者のみが他のユーザーにPush通知を送信可能
      if (ctx.session.user.id !== input.userId && ctx.session.user.userType !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "他のユーザーにPush通知を送信する権限がありません",
        });
      }

      // ユーザーのデバイストークンを取得
      const userDevices = await ctx.db.userDevice.findMany({
        where: {
          userId: input.userId,
          isActive: true,
        },
      });

      const results = [];

      // TODO: Firebase Cloud Messaging実装
      for (const device of userDevices) {
        try {
          // const message = {
          //   token: device.fcmToken,
          //   notification: {
          //     title: input.title,
          //     body: input.body,
          //   },
          //   data: input.data,
          //   android: {
          //     priority: 'high' as const,
          //     notification: {
          //       channelId: 'default',
          //       sound: 'default',
          //     },
          //   },
          //   apns: {
          //     payload: {
          //       aps: {
          //         sound: 'default',
          //       },
          //     },
          //   },
          // };

          // const result = await messaging.send(message);
          const result = `mock_result_${Date.now()}`;
          results.push({ deviceId: device.id, result });
          
          console.log(`Push notification sent to device ${device.id}:`, result);
        } catch (error) {
          console.error(`Failed to send notification to device ${device.id}:`, error);
          
          // デバイストークンが無効な場合は削除
          // TODO: 実際のエラーコード確認
          if (error.code === "messaging/registration-token-not-registered") {
            await ctx.db.userDevice.update({
              where: { id: device.id },
              data: { isActive: false },
            });
          }
        }
      }

      return results;
    }),

  // 通知既読
  markAsRead: protectedProcedure
    .input(z.object({
      notificationId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const notification = await ctx.db.notification.findUnique({
        where: { id: input.notificationId },
      });

      if (!notification) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "通知が見つかりません",
        });
      }

      if (notification.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "この通知を既読にする権限がありません",
        });
      }

      return ctx.db.notification.update({
        where: {
          id: input.notificationId,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    }),

  // 全通知既読
  markAllAsRead: protectedProcedure
    .input(z.object({
      userId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.id !== input.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "自分の通知のみ既読にできます",
        });
      }

      return ctx.db.notification.updateMany({
        where: {
          userId: input.userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    }),

  // 通知削除
  deleteNotification: protectedProcedure
    .input(z.object({
      notificationId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const notification = await ctx.db.notification.findUnique({
        where: { id: input.notificationId },
      });

      if (!notification) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "通知が見つかりません",
        });
      }

      if (notification.userId !== ctx.session.user.id && ctx.session.user.userType !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "この通知を削除する権限がありません",
        });
      }

      return ctx.db.notification.delete({
        where: {
          id: input.notificationId,
        },
      });
    }),

  // 通知設定更新
  updateSettings: protectedProcedure
    .input(notificationSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.id !== input.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "自分の通知設定のみ変更できます",
        });
      }

      return ctx.db.notificationSettings.upsert({
        where: {
          userId: input.userId,
        },
        update: {
          settings: JSON.stringify(input.settings),
        },
        create: {
          userId: input.userId,
          settings: JSON.stringify(input.settings),
        },
      });
    }),

  // 通知設定取得
  getSettings: protectedProcedure
    .input(z.object({
      userId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.id !== input.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "自分の通知設定のみ閲覧できます",
        });
      }

      const settings = await ctx.db.notificationSettings.findUnique({
        where: {
          userId: input.userId,
        },
      });

      if (!settings) {
        // デフォルト設定を返す
        return {
          bookingNotifications: true,
          messageNotifications: true,
          paymentNotifications: true,
          reviewNotifications: true,
          systemNotifications: true,
          pushNotifications: true,
          emailNotifications: false,
        };
      }

      return JSON.parse(settings.settings as string);
    }),

  // デバイス登録
  registerDevice: protectedProcedure
    .input(z.object({
      userId: z.string(),
      deviceId: z.string().min(1, "デバイスIDを入力してください"),
      fcmToken: z.string().min(1, "FCMトークンを入力してください"),
      platform: z.enum(["IOS", "ANDROID", "WEB"]),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.id !== input.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "自分のデバイスのみ登録できます",
        });
      }

      return ctx.db.userDevice.upsert({
        where: {
          userId_deviceId: {
            userId: input.userId,
            deviceId: input.deviceId,
          },
        },
        update: {
          fcmToken: input.fcmToken,
          platform: input.platform,
          isActive: true,
          lastActiveAt: new Date(),
        },
        create: {
          userId: input.userId,
          deviceId: input.deviceId,
          fcmToken: input.fcmToken,
          platform: input.platform,
          isActive: true,
          lastActiveAt: new Date(),
        },
      });
    }),

  // デバイス一覧取得
  getUserDevices: protectedProcedure
    .input(z.object({
      userId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.id !== input.userId && ctx.session.user.userType !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "自分のデバイスのみ閲覧できます",
        });
      }

      return ctx.db.userDevice.findMany({
        where: {
          userId: input.userId,
          isActive: true,
        },
        orderBy: {
          lastActiveAt: "desc",
        },
      });
    }),

  // 未読通知数取得
  getUnreadCount: protectedProcedure
    .input(z.object({
      userId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.id !== input.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "自分の未読数のみ取得できます",
        });
      }

      const count = await ctx.db.notification.count({
        where: {
          userId: input.userId,
          isRead: false,
        },
      });

      return { unreadCount: count };
    }),
});