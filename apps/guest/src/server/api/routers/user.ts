import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

// Validation schemas
const userCreateSchema = z.object({
  email: z.string().email("正しいメールアドレスを入力してください"),
  name: z.string().min(1, "名前を入力してください").max(50, "名前は50文字以下で入力してください"),
  userType: z.enum(["GUEST", "CAST", "ADMIN"]),
  phoneNumber: z.string().regex(/^[0-9-+()\\s]+$/, "正しい電話番号を入力してください").optional(),
  birthDate: z.date().optional(),
  prefecture: z.string().max(20, "都道府県は20文字以下で入力してください").optional(),
  city: z.string().max(50, "市区町村は50文字以下で入力してください").optional(),
  selfIntro: z.string().max(500, "自己紹介は500文字以下で入力してください").optional(),
  tags: z.array(z.string()).max(10, "タグは10個まで設定可能です").optional(),
});

const userUpdateSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  phoneNumber: z.string().regex(/^[0-9-+()\\s]+$/, "正しい電話番号を入力してください").optional(),
  birthDate: z.date().optional(),
  prefecture: z.string().max(20).optional(),
  city: z.string().max(50).optional(),
  selfIntro: z.string().max(500).optional(),
  tags: z.array(z.string()).max(10).optional(),
  image: z.string().url().optional(),
});

export const userRouter = createTRPCRouter({
  // ユーザー作成 (管理者のみ)
  create: protectedProcedure
    .input(userCreateSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.userType !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "管理者権限が必要です",
        });
      }

      const existingUser = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "このメールアドレスは既に使用されています",
        });
      }

      return ctx.db.user.create({
        data: input,
        select: {
          id: true,
          name: true,
          email: true,
          userType: true,
          phoneNumber: true,
          prefecture: true,
          city: true,
          selfIntro: true,
          tags: true,
          isVerified: true,
          createdAt: true,
        },
      });
    }),

  // 現在のユーザー情報取得
  getProfile: protectedProcedure.query(({ ctx }) => {
    return ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        userType: true,
        phoneNumber: true,
        birthDate: true,
        prefecture: true,
        city: true,
        selfIntro: true,
        tags: true,
        image: true,
        isVerified: true,
        points: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }),

  // ユーザーID指定取得
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          name: true,
          email: true,
          userType: true,
          phoneNumber: true,
          prefecture: true,
          city: true,
          selfIntro: true,
          tags: true,
          image: true,
          isVerified: true,
          points: true,
          createdAt: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "ユーザーが見つかりません",
        });
      }

      return user;
    }),

  // プロフィール更新
  updateProfile: protectedProcedure
    .input(userUpdateSchema)
    .mutation(({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: input,
        select: {
          id: true,
          name: true,
          email: true,
          userType: true,
          phoneNumber: true,
          birthDate: true,
          prefecture: true,
          city: true,
          selfIntro: true,
          tags: true,
          image: true,
          isVerified: true,
          points: true,
          updatedAt: true,
        },
      });
    }),

  // ユーザー削除 (自分のアカウントまたは管理者)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const isOwner = ctx.session.user.id === input.id;
      const isAdmin = ctx.session.user.userType === "ADMIN";

      if (!isOwner && !isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "このアカウントを削除する権限がありません",
        });
      }

      const user = await ctx.db.user.findUnique({
        where: { id: input.id },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "ユーザーが見つかりません",
        });
      }

      return ctx.db.user.delete({
        where: { id: input.id },
      });
    }),

  // ポイント残高更新 (管理者のみ)
  updatePoints: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        points: z.number().min(0, "ポイントは0以上である必要があります"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.userType !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "管理者権限が必要です",
        });
      }

      return ctx.db.user.update({
        where: { id: input.userId },
        data: { points: input.points },
        select: {
          id: true,
          name: true,
          points: true,
        },
      });
    }),

  // ユーザー一覧取得 (管理者のみ)
  getAll: protectedProcedure
    .input(
      z.object({
        userType: z.enum(["GUEST", "CAST", "ADMIN"]).optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.userType !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "管理者権限が必要です",
        });
      }

      return ctx.db.user.findMany({
        where: input.userType ? { userType: input.userType } : undefined,
        select: {
          id: true,
          name: true,
          email: true,
          userType: true,
          prefecture: true,
          city: true,
          isVerified: true,
          points: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        skip: input.offset,
      });
    }),

  // アカウント確認
  verifyAccount: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        isVerified: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.userType !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "管理者権限が必要です",
        });
      }

      return ctx.db.user.update({
        where: { id: input.userId },
        data: { isVerified: input.isVerified },
        select: {
          id: true,
          name: true,
          isVerified: true,
        },
      });
    }),

  // プロフィール画像を削除
  deleteProfileImage: protectedProcedure.mutation(async ({ ctx }) => {
    const userType = ctx.session.user.userType;
    
    if (userType === "CAST") {
      return ctx.db.castProfile.update({
        where: { userId: ctx.session.user.id },
        data: { avatar: null },
        select: {
          id: true,
          avatar: true,
          updatedAt: true,
        },
      });
    } else if (userType === "GUEST") {
      return ctx.db.guestProfile.update({
        where: { userId: ctx.session.user.id },
        data: { avatar: null },
        select: {
          id: true,
          avatar: true,
          updatedAt: true,
        },
      });
    } else {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "プロフィール画像を削除する権限がありません",
      });
    }
  }),

  // 通知設定を更新
  updateNotificationSettings: protectedProcedure
    .input(
      z.object({
        notificationType: z.enum([
          "BOOKING_CREATED",
          "BOOKING_CONFIRMED", 
          "BOOKING_CANCELLED",
          "MESSAGE_RECEIVED",
          "PAYMENT_COMPLETED",
          "PAYMENT_FAILED",
          "PAYOUT_AVAILABLE",
          "SYSTEM_UPDATE",
          "PROMOTIONAL"
        ]),
        pushEnabled: z.boolean(),
        emailEnabled: z.boolean(),
        smsEnabled: z.boolean().optional().default(false),
        quietHoursStart: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        quietHoursEnd: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.notificationSetting.upsert({
        where: {
          userId_notificationType: {
            userId: ctx.session.user.id,
            notificationType: input.notificationType,
          },
        },
        update: {
          pushEnabled: input.pushEnabled,
          emailEnabled: input.emailEnabled,
          smsEnabled: input.smsEnabled,
          quietHoursStart: input.quietHoursStart,
          quietHoursEnd: input.quietHoursEnd,
        },
        create: {
          userId: ctx.session.user.id,
          notificationType: input.notificationType,
          pushEnabled: input.pushEnabled,
          emailEnabled: input.emailEnabled,
          smsEnabled: input.smsEnabled,
          quietHoursStart: input.quietHoursStart,
          quietHoursEnd: input.quietHoursEnd,
        },
        select: {
          id: true,
          notificationType: true,
          pushEnabled: true,
          emailEnabled: true,
          smsEnabled: true,
          quietHoursStart: true,
          quietHoursEnd: true,
          updatedAt: true,
        },
      });
    }),

  // アカウント設定情報を取得
  getAccountSettings: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        email: true,
        userType: true,
        createdAt: true,
        updatedAt: true,
        notificationSettings: {
          select: {
            notificationType: true,
            pushEnabled: true,
            emailEnabled: true,
            smsEnabled: true,
            quietHoursStart: true,
            quietHoursEnd: true,
          },
        },
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "ユーザーが見つかりません",
      });
    }

    return user;
  }),

  // 通知一覧を取得（ページネーション対応）
  getNotifications: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        isRead: z.boolean().optional(),
      })
    )
    .query(({ ctx, input }) => {
      return ctx.db.notification.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input.isRead !== undefined && { isRead: input.isRead }),
        },
        select: {
          id: true,
          title: true,
          body: true,
          data: true,
          type: true,
          channel: true,
          priority: true,
          isRead: true,
          readAt: true,
          isDelivered: true,
          deliveredAt: true,
          relatedId: true,
          relatedType: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        skip: input.offset,
      });
    }),

  // 未読通知数を取得
  getUnreadNotificationCount: protectedProcedure.query(({ ctx }) => {
    return ctx.db.notification.count({
      where: {
        userId: ctx.session.user.id,
        isRead: false,
      },
    });
  }),

  // 通知を既読にする
  markNotificationsAsRead: protectedProcedure
    .input(
      z.object({
        notificationIds: z.array(z.string()).optional(),
        markAll: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updateData = {
        isRead: true,
        readAt: new Date(),
      };

      if (input.markAll) {
        return ctx.db.notification.updateMany({
          where: {
            userId: ctx.session.user.id,
            isRead: false,
          },
          data: updateData,
        });
      } else if (input.notificationIds && input.notificationIds.length > 0) {
        return ctx.db.notification.updateMany({
          where: {
            id: { in: input.notificationIds },
            userId: ctx.session.user.id,
          },
          data: updateData,
        });
      } else {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "通知IDまたはmarkAllフラグが必要です",
        });
      }
    }),

  // お気に入りユーザー一覧を取得
  getFavorites: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(({ ctx, input }) => {
      return ctx.db.favorite.findMany({
        where: { guestId: ctx.session.user.id },
        select: {
          id: true,
          createdAt: true,
          cast: {
            select: {
              id: true,
              displayName: true,
              bio: true,
              avatar: true,
              hourlyRate: true,
              isActive: true,
              isVerified: true,
              user: {
                select: {
                  id: true,
                  userType: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        skip: input.offset,
      });
    }),

  // ユーザーをお気に入りに追加
  addFavorite: protectedProcedure
    .input(z.object({ castId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.userType !== "GUEST") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "ゲストユーザーのみお気に入り登録が可能です",
        });
      }

      const castProfile = await ctx.db.castProfile.findUnique({
        where: { id: input.castId },
      });

      if (!castProfile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "キャストが見つかりません",
        });
      }

      try {
        return await ctx.db.favorite.create({
          data: {
            guestId: ctx.session.user.id,
            castId: input.castId,
          },
          select: {
            id: true,
            createdAt: true,
          },
        });
      } catch (error) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "既にお気に入りに登録済みです",
        });
      }
    }),

  // ユーザーをお気に入りから削除
  removeFavorite: protectedProcedure
    .input(z.object({ castId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const favorite = await ctx.db.favorite.findUnique({
        where: {
          guestId_castId: {
            guestId: ctx.session.user.id,
            castId: input.castId,
          },
        },
      });

      if (!favorite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "お気に入り情報が見つかりません",
        });
      }

      return ctx.db.favorite.delete({
        where: { id: favorite.id },
      });
    }),

  // アカウント削除申請（自分のアカウント）
  deleteAccount: protectedProcedure
    .input(
      z.object({
        reason: z.string().min(1, "削除理由を入力してください").max(500, "削除理由は500文字以下で入力してください"),
        password: z.string().min(1, "パスワードを入力してください"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: パスワード検証を実装
      // 実際の削除処理ではなく、削除申請として記録
      // 管理者による承認後に実際の削除を行う設計
      
      // ログを記録
      await ctx.db.activityLog.create({
        data: {
          userId: ctx.session.user.id,
          action: "ACCOUNT_DELETE_REQUEST",
          entity: "USER",
          entityId: ctx.session.user.id,
          description: `アカウント削除申請: ${input.reason}`,
          metadata: {
            reason: input.reason,
            requestedAt: new Date().toISOString(),
          },
          level: "INFO",
        },
      });

      return {
        success: true,
        message: "アカウント削除申請を受け付けました。管理者による確認後、削除処理が実行されます。",
      };
    }),

  // 足あと機能 - 自分のプロフィールを閲覧したユーザーを取得
  getFootprints: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(({ ctx, input }) => {
      return ctx.db.profileView.findMany({
        where: { viewedId: ctx.session.user.id },
        select: {
          id: true,
          viewedAt: true,
          viewer: {
            select: {
              id: true,
              name: true,
              image: true,
              userType: true,
              castProfile: {
                select: {
                  id: true,
                  displayName: true,
                  avatar: true,
                  hourlyRate: true,
                },
              },
              guestProfile: {
                select: {
                  id: true,
                  displayName: true,
                  avatar: true,
                },
              },
            },
          },
        },
        orderBy: { viewedAt: "desc" },
        take: input.limit,
        skip: input.offset,
      });
    }),

  // プロフィール閲覧を記録
  recordProfileView: protectedProcedure
    .input(z.object({ viewedUserId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.id === input.viewedUserId) {
        return { success: false, message: "自分のプロフィールの閲覧は記録されません" };
      }

      const targetUser = await ctx.db.user.findUnique({
        where: { id: input.viewedUserId },
        select: { id: true, privacySettings: { select: { showFootprints: true } } },
      });

      if (!targetUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "ユーザーが見つかりません",
        });
      }

      // プライバシー設定で足あとを無効にしている場合は記録しない
      if (!targetUser.privacySettings?.showFootprints) {
        return { success: false, message: "プライバシー設定により記録されません" };
      }

      // 今日の同じユーザーからの閲覧は重複記録しない
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const existingView = await ctx.db.profileView.findFirst({
        where: {
          viewerId: ctx.session.user.id,
          viewedId: input.viewedUserId,
          viewedAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      });

      if (existingView) {
        return { success: false, message: "本日既に記録済みです" };
      }

      await ctx.db.profileView.create({
        data: {
          viewerId: ctx.session.user.id,
          viewedId: input.viewedUserId,
        },
      });

      return { success: true, message: "プロフィール閲覧を記録しました" };
    }),

  // 他ユーザーを運営に通報
  reportUser: protectedProcedure
    .input(
      z.object({
        reportedUserId: z.string(),
        reason: z.enum([
          "INAPPROPRIATE_BEHAVIOR",
          "HARASSMENT",
          "FAKE_PROFILE",
          "SPAM",
          "FRAUD",
          "VIOLENCE_THREAT",
          "OTHER"
        ]),
        description: z.string().min(1, "詳細を入力してください").max(1000, "詳細は1000文字以下で入力してください"),
        evidenceUrls: z.array(z.string().url()).max(5, "証拠画像は5枚まで添付可能です").optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const targetUser = await ctx.db.user.findUnique({
        where: { id: input.reportedUserId },
        select: { id: true, email: true },
      });

      if (!targetUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "対象ユーザーが見つかりません",
        });
      }

      if (targetUser.id === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "自分自身を通報することはできません",
        });
      }

      // 既に同じユーザーを通報済みかチェック
      const existingReport = await ctx.db.userReport.findFirst({
        where: {
          reporterId: ctx.session.user.id,
          reportedId: input.reportedUserId,
          status: { in: ["PENDING", "UNDER_REVIEW"] },
        },
      });

      if (existingReport) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "このユーザーは既に通報済みです",
        });
      }

      const report = await ctx.db.userReport.create({
        data: {
          reporterId: ctx.session.user.id,
          reportedId: input.reportedUserId,
          reason: input.reason,
          description: input.description,
          evidenceUrls: input.evidenceUrls || [],
        },
        select: {
          id: true,
          reason: true,
          status: true,
          createdAt: true,
        },
      });

      // セキュリティログに記録
      await ctx.db.securityLog.create({
        data: {
          userId: ctx.session.user.id,
          action: "USER_REPORTED",
          entity: "USER",
          entityId: input.reportedUserId,
          description: `ユーザー通報: ${input.reason}`,
          metadata: {
            reportId: report.id,
            reason: input.reason,
            evidenceCount: input.evidenceUrls?.length || 0,
          },
          severity: "WARNING",
        },
      });

      return {
        success: true,
        reportId: report.id,
        message: "通報を受け付けました。運営チームが確認いたします。",
      };
    }),

  // 他ユーザーをブロック
  blockUser: protectedProcedure
    .input(
      z.object({
        blockedUserId: z.string(),
        reason: z.string().max(200, "理由は200文字以下で入力してください").optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const targetUser = await ctx.db.user.findUnique({
        where: { id: input.blockedUserId },
        select: { id: true, name: true },
      });

      if (!targetUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "対象ユーザーが見つかりません",
        });
      }

      if (targetUser.id === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "自分自身をブロックすることはできません",
        });
      }

      // 既にブロック済みかチェック
      const existingBlock = await ctx.db.userBlock.findUnique({
        where: {
          blockerId_blockedId: {
            blockerId: ctx.session.user.id,
            blockedId: input.blockedUserId,
          },
        },
      });

      if (existingBlock) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "このユーザーは既にブロック済みです",
        });
      }

      const block = await ctx.db.userBlock.create({
        data: {
          blockerId: ctx.session.user.id,
          blockedId: input.blockedUserId,
          reason: input.reason,
        },
        select: {
          id: true,
          createdAt: true,
          blocked: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      // セキュリティログに記録
      await ctx.db.securityLog.create({
        data: {
          userId: ctx.session.user.id,
          action: "USER_BLOCKED",
          entity: "USER",
          entityId: input.blockedUserId,
          description: `ユーザーブロック: ${targetUser.name}`,
          metadata: {
            blockId: block.id,
            reason: input.reason,
          },
          severity: "INFO",
        },
      });

      return {
        success: true,
        blockId: block.id,
        message: "ユーザーをブロックしました",
      };
    }),

  // ブロック中のユーザー一覧取得
  getBlockedUsers: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(({ ctx, input }) => {
      return ctx.db.userBlock.findMany({
        where: { blockerId: ctx.session.user.id },
        select: {
          id: true,
          reason: true,
          createdAt: true,
          blocked: {
            select: {
              id: true,
              name: true,
              image: true,
              userType: true,
              castProfile: {
                select: {
                  displayName: true,
                  avatar: true,
                },
              },
              guestProfile: {
                select: {
                  displayName: true,
                  avatar: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        skip: input.offset,
      });
    }),

  // ユーザーのブロック解除
  unblockUser: protectedProcedure
    .input(z.object({ blockedUserId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const block = await ctx.db.userBlock.findUnique({
        where: {
          blockerId_blockedId: {
            blockerId: ctx.session.user.id,
            blockedId: input.blockedUserId,
          },
        },
        include: {
          blocked: {
            select: { name: true },
          },
        },
      });

      if (!block) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "ブロック情報が見つかりません",
        });
      }

      await ctx.db.userBlock.delete({
        where: { id: block.id },
      });

      // セキュリティログに記録
      await ctx.db.securityLog.create({
        data: {
          userId: ctx.session.user.id,
          action: "USER_BLOCKED",
          entity: "USER",
          entityId: input.blockedUserId,
          description: `ユーザーブロック解除: ${block.blocked.name}`,
          metadata: {
            previousBlockId: block.id,
          },
          severity: "INFO",
        },
      });

      return {
        success: true,
        message: "ユーザーのブロックを解除しました",
      };
    }),

  // 本人確認書類を提出
  submitIdVerification: protectedProcedure
    .input(
      z.object({
        documentType: z.enum(["DRIVERS_LICENSE", "PASSPORT", "NATIONAL_ID", "RESIDENCE_CARD"]),
        documentUrls: z.array(z.string().url("正しいURL形式で入力してください")).min(1, "書類画像を1枚以上添付してください").max(3, "書類画像は3枚まで添付可能です"),
        extractedData: z.object({
          fullName: z.string().optional(),
          birthDate: z.string().optional(),
          documentNumber: z.string().optional(),
          address: z.string().optional(),
        }).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 既に審査中または承認済みの本人確認があるかチェック
      const existingVerification = await ctx.db.idVerification.findFirst({
        where: {
          userId: ctx.session.user.id,
          status: { in: ["PENDING", "UNDER_REVIEW", "APPROVED"] },
        },
      });

      if (existingVerification) {
        if (existingVerification.status === "APPROVED") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "本人確認は既に完了しています",
          });
        } else {
          throw new TRPCError({
            code: "CONFLICT",
            message: "既に本人確認書類を提出済みです。審査結果をお待ちください",
          });
        }
      }

      const verification = await ctx.db.idVerification.create({
        data: {
          userId: ctx.session.user.id,
          documentType: input.documentType,
          documentUrls: input.documentUrls,
          extractedData: input.extractedData,
        },
        select: {
          id: true,
          status: true,
          submittedAt: true,
        },
      });

      // セキュリティログに記録
      await ctx.db.securityLog.create({
        data: {
          userId: ctx.session.user.id,
          action: "USER_REPORTED",
          entity: "USER",
          entityId: ctx.session.user.id,
          description: `本人確認書類提出: ${input.documentType}`,
          metadata: {
            verificationId: verification.id,
            documentType: input.documentType,
            documentCount: input.documentUrls.length,
          },
          severity: "INFO",
        },
      });

      return {
        success: true,
        verificationId: verification.id,
        message: "本人確認書類を提出しました。審査完了までお待ちください。",
      };
    }),

  // 本人確認ステータス取得
  getIdVerificationStatus: protectedProcedure.query(async ({ ctx }) => {
    const verification = await ctx.db.idVerification.findFirst({
      where: { userId: ctx.session.user.id },
      select: {
        id: true,
        documentType: true,
        status: true,
        submittedAt: true,
        reviewedAt: true,
        reviewerNotes: true,
        failureReason: true,
      },
      orderBy: { submittedAt: "desc" },
    });

    return verification;
  }),

  // 本人確認書類の再提出
  resubmitIdVerification: protectedProcedure
    .input(
      z.object({
        documentType: z.enum(["DRIVERS_LICENSE", "PASSPORT", "NATIONAL_ID", "RESIDENCE_CARD"]),
        documentUrls: z.array(z.string().url()).min(1).max(3),
        extractedData: z.object({
          fullName: z.string().optional(),
          birthDate: z.string().optional(),
          documentNumber: z.string().optional(),
          address: z.string().optional(),
        }).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 最新の本人確認を取得
      const latestVerification = await ctx.db.idVerification.findFirst({
        where: { userId: ctx.session.user.id },
        orderBy: { submittedAt: "desc" },
      });

      if (!latestVerification || latestVerification.status !== "REJECTED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "再提出可能な本人確認書類がありません",
        });
      }

      const newVerification = await ctx.db.idVerification.create({
        data: {
          userId: ctx.session.user.id,
          documentType: input.documentType,
          documentUrls: input.documentUrls,
          extractedData: input.extractedData,
        },
        select: {
          id: true,
          status: true,
          submittedAt: true,
        },
      });

      return {
        success: true,
        verificationId: newVerification.id,
        message: "本人確認書類を再提出しました。",
      };
    }),

  // プライバシー設定更新
  updatePrivacySettings: protectedProcedure
    .input(
      z.object({
        showFootprints: z.boolean().optional(),
        allowSearch: z.boolean().optional(),
        showOnlineStatus: z.boolean().optional(),
        allowDirectMessages: z.boolean().optional(),
        showLastActiveTime: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const settings = await ctx.db.privacySetting.upsert({
        where: { userId: ctx.session.user.id },
        update: input,
        create: {
          userId: ctx.session.user.id,
          ...input,
        },
        select: {
          id: true,
          showFootprints: true,
          allowSearch: true,
          showOnlineStatus: true,
          allowDirectMessages: true,
          showLastActiveTime: true,
          updatedAt: true,
        },
      });

      return {
        success: true,
        settings,
        message: "プライバシー設定を更新しました",
      };
    }),

  // プライバシー設定取得
  getPrivacySettings: protectedProcedure.query(async ({ ctx }) => {
    let settings = await ctx.db.privacySetting.findUnique({
      where: { userId: ctx.session.user.id },
      select: {
        id: true,
        showFootprints: true,
        allowSearch: true,
        showOnlineStatus: true,
        allowDirectMessages: true,
        showLastActiveTime: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // デフォルト設定で初期化
    if (!settings) {
      settings = await ctx.db.privacySetting.create({
        data: {
          userId: ctx.session.user.id,
          showFootprints: true,
          allowSearch: true,
          showOnlineStatus: true,
          allowDirectMessages: true,
          showLastActiveTime: true,
        },
        select: {
          id: true,
          showFootprints: true,
          allowSearch: true,
          showOnlineStatus: true,
          allowDirectMessages: true,
          showLastActiveTime: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    }

    return settings;
  }),
});