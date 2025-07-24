import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

const guestProfileSchema = z.object({
  displayName: z.string().min(1, "表示名を入力してください").max(100, "表示名は100文字以下で入力してください"),
  bio: z.string().max(500, "自己紹介は500文字以下で入力してください").optional(),
  location: z.string().max(100, "住所は100文字以下で入力してください").optional(),
  age: z.number().int().min(18, "18歳以上である必要があります").max(99, "99歳以下である必要があります").optional(),
  avatar: z.string().url("正しいURL形式で入力してください").optional(),
  preferences: z.object({
    priceRange: z.object({
      min: z.number().min(0, "最小価格は0以上である必要があります"),
      max: z.number().min(0, "最大価格は0以上である必要があります"),
    }).refine(data => data.max >= data.min, "最大価格は最小価格以上である必要があります").optional(),
    preferredServices: z.array(z.string()).optional(),
    preferredTags: z.array(z.string()).optional(),
  }).optional(),
});

export const guestRouter = createTRPCRouter({
  // ゲストプロフィール作成
  create: protectedProcedure
    .input(guestProfileSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.userType !== "GUEST") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "ゲストユーザーのみがプロフィールを作成できます",
        });
      }

      // 既存のプロフィールをチェック
      const existingProfile = await ctx.db.guestProfile.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (existingProfile) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "プロフィールは既に存在します",
        });
      }

      return ctx.db.guestProfile.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
          preferences: input.preferences ? JSON.stringify(input.preferences) : null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });
    }),

  // ゲストプロフィール取得（ID指定）
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const guestProfile = await ctx.db.guestProfile.findUnique({
        where: { id: input.id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          bookings: {
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
            orderBy: {
              createdAt: "desc",
            },
            take: 10,
          },
          reviews: {
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
            orderBy: {
              createdAt: "desc",
            },
            take: 10,
          },
        },
      });

      if (!guestProfile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "ゲストプロフィールが見つかりません",
        });
      }

      return {
        ...guestProfile,
        preferences: guestProfile.preferences ? JSON.parse(guestProfile.preferences as string) : null,
      };
    }),

  // 自分のゲストプロフィール取得
  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.userType !== "GUEST") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "ゲストユーザーのみアクセス可能です",
      });
    }

    const guestProfile = await ctx.db.guestProfile.findUnique({
      where: { userId: ctx.session.user.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            points: true,
          },
        },
      },
    });

    if (!guestProfile) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "ゲストプロフィールが見つかりません",
      });
    }

    return {
      ...guestProfile,
      preferences: guestProfile.preferences ? JSON.parse(guestProfile.preferences as string) : null,
    };
  }),

  // ゲストプロフィール更新
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: guestProfileSchema.partial(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.userType !== "GUEST") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "ゲストユーザーのみプロフィールを更新できます",
        });
      }

      const existingProfile = await ctx.db.guestProfile.findUnique({
        where: { id: input.id },
      });

      if (!existingProfile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "ゲストプロフィールが見つかりません",
        });
      }

      if (existingProfile.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "自分のプロフィールのみ更新できます",
        });
      }

      return ctx.db.guestProfile.update({
        where: { id: input.id },
        data: {
          ...input.data,
          preferences: input.data.preferences ? JSON.stringify(input.data.preferences) : undefined,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });
    }),

  // 予約履歴取得
  getBookings: protectedProcedure
    .input(z.object({
      guestId: z.string(),
      status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]).optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      // 自分の予約または管理者のみ閲覧可能
      if (ctx.session.user.id !== input.guestId && ctx.session.user.userType !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "自分の予約履歴のみ閲覧できます",
        });
      }

      return ctx.db.booking.findMany({
        where: {
          guestId: input.guestId,
          ...(input.status && { status: input.status }),
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
          payment: true,
          review: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: input.limit,
        skip: input.offset,
      });
    }),

  // レビュー履歴取得
  getReviews: protectedProcedure
    .input(z.object({
      guestId: z.string(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      // 自分のレビューまたは管理者のみ閲覧可能
      if (ctx.session.user.id !== input.guestId && ctx.session.user.userType !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "自分のレビュー履歴のみ閲覧できます",
        });
      }

      return ctx.db.review.findMany({
        where: {
          reviewerId: input.guestId,
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
          booking: {
            select: {
              id: true,
              startTime: true,
              endTime: true,
              location: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: input.limit,
        skip: input.offset,
      });
    }),

  // お気に入りキャスト取得
  getFavorites: protectedProcedure
    .input(z.object({
      guestId: z.string(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      // 自分のお気に入りまたは管理者のみ閲覧可能
      if (ctx.session.user.id !== input.guestId && ctx.session.user.userType !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "自分のお気に入りのみ閲覧できます",
        });
      }

      return ctx.db.favorite.findMany({
        where: {
          guestId: input.guestId,
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
        },
        orderBy: {
          createdAt: "desc",
        },
        take: input.limit,
        skip: input.offset,
      });
    }),

  // お気に入り追加
  addFavorite: protectedProcedure
    .input(z.object({ castId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.userType !== "GUEST") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "ゲストユーザーのみお気に入りを追加できます",
        });
      }

      // キャストの存在確認
      const cast = await ctx.db.castProfile.findUnique({
        where: { id: input.castId },
      });

      if (!cast) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "キャストが見つかりません",
        });
      }

      // 既存のお気に入りチェック
      const existingFavorite = await ctx.db.favorite.findUnique({
        where: {
          guestId_castId: {
            guestId: ctx.session.user.id,
            castId: input.castId,
          },
        },
      });

      if (existingFavorite) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "既にお気に入りに追加されています",
        });
      }

      return ctx.db.favorite.create({
        data: {
          guestId: ctx.session.user.id,
          castId: input.castId,
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
        },
      });
    }),

  // お気に入り削除
  removeFavorite: protectedProcedure
    .input(z.object({ castId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.userType !== "GUEST") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "ゲストユーザーのみお気に入りを削除できます",
        });
      }

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
          message: "お気に入りが見つかりません",
        });
      }

      return ctx.db.favorite.delete({
        where: {
          guestId_castId: {
            guestId: ctx.session.user.id,
            castId: input.castId,
          },
        },
      });
    }),

  // おすすめキャスト一覧を取得
  getRecommendedCasts: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(({ ctx, input }) => {
      if (ctx.session.user.userType !== "GUEST") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "ゲストユーザーのみアクセス可能です",
        });
      }

      // 基本的なレコメンデーション: アクティブで認証済みのキャストを返す
      // TODO: よりスマートなレコメンデーション アルゴリズムを実装
      return ctx.db.castProfile.findMany({
        where: {
          isActive: true,
          isVerified: true,
        },
        select: {
          id: true,
          displayName: true,
          bio: true,
          avatar: true,
          hourlyRate: true,
          availability: true,
          specialties: true,
          area: {
            select: {
              id: true,
              name: true,
            },
          },
          tags: {
            select: {
              id: true,
              name: true,
            },
          },
          user: {
            select: {
              id: true,
              userType: true,
            },
          },
          reviews: {
            select: {
              rating: true,
            },
            take: 10,
          },
          _count: {
            select: {
              reviews: true,
              favorites: true,
            },
          },
        },
        orderBy: [
          { isVerified: "desc" },
          { createdAt: "desc" },
        ],
        take: input.limit,
        skip: input.offset,
      });
    }),

  // 条件でキャストを検索
  searchCasts: protectedProcedure
    .input(
      z.object({
        query: z.string().optional(),
        areaId: z.string().optional(),
        categoryId: z.string().optional(),
        tagIds: z.array(z.string()).optional(),
        minRate: z.number().min(0).optional(),
        maxRate: z.number().min(0).optional(),
        isVerified: z.boolean().optional(),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(({ ctx, input }) => {
      if (ctx.session.user.userType !== "GUEST") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "ゲストユーザーのみアクセス可能です",
        });
      }

      const whereConditions: any = {
        isActive: true,
        ...(input.isVerified !== undefined && { isVerified: input.isVerified }),
        ...(input.areaId && { areaId: input.areaId }),
        ...(input.categoryId && { categoryId: input.categoryId }),
        ...(input.minRate && { hourlyRate: { gte: input.minRate } }),
        ...(input.maxRate && { hourlyRate: { ...(input.minRate && { gte: input.minRate }), lte: input.maxRate } }),
        ...(input.tagIds && input.tagIds.length > 0 && {
          tags: {
            some: {
              id: { in: input.tagIds },
            },
          },
        }),
        ...(input.query && {
          OR: [
            { displayName: { contains: input.query, mode: "insensitive" } },
            { bio: { contains: input.query, mode: "insensitive" } },
            { specialties: { has: input.query } },
          ],
        }),
      };

      return ctx.db.castProfile.findMany({
        where: whereConditions,
        select: {
          id: true,
          displayName: true,
          bio: true,
          avatar: true,
          hourlyRate: true,
          availability: true,
          specialties: true,
          area: {
            select: {
              id: true,
              name: true,
            },
          },
          tags: {
            select: {
              id: true,
              name: true,
            },
          },
          user: {
            select: {
              id: true,
              userType: true,
            },
          },
          reviews: {
            select: {
              rating: true,
            },
            take: 10,
          },
          _count: {
            select: {
              reviews: true,
              favorites: true,
            },
          },
        },
        orderBy: [
          { isVerified: "desc" },
          { hourlyRate: "asc" },
        ],
        take: input.limit,
        skip: input.offset,
      });
    }),

  // 特定キャストの詳細情報を取得
  getCastDetail: protectedProcedure
    .input(z.object({ castId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.userType !== "GUEST") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "ゲストユーザーのみアクセス可能です",
        });
      }

      const castProfile = await ctx.db.castProfile.findUnique({
        where: { id: input.castId },
        select: {
          id: true,
          displayName: true,
          bio: true,
          avatar: true,
          coverImage: true,
          hourlyRate: true,
          availability: true,
          specialties: true,
          experience: true,
          portfolio: true,
          isActive: true,
          isVerified: true,
          area: {
            select: {
              id: true,
              name: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          tags: {
            select: {
              id: true,
              name: true,
            },
          },
          user: {
            select: {
              id: true,
              userType: true,
              createdAt: true,
            },
          },
          reviews: {
            select: {
              id: true,
              rating: true,
              comment: true,
              createdAt: true,
              guest: {
                select: {
                  displayName: true,
                  avatar: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 10,
          },
          _count: {
            select: {
              reviews: true,
              favorites: true,
            },
          },
        },
      });

      if (!castProfile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "キャストが見つかりません",
        });
      }

      if (!castProfile.isActive) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "このキャストは現在利用できません",
        });
      }

      // 平均評価を計算
      const averageRating = castProfile.reviews.length > 0
        ? castProfile.reviews.reduce((sum, review) => sum + review.rating, 0) / castProfile.reviews.length
        : 0;

      return {
        ...castProfile,
        averageRating,
      };
    }),

  // キャストに「いいね」を送信（メッセージチャネル作成のトリガー）
  likeCast: protectedProcedure
    .input(z.object({ castId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.userType !== "GUEST") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "ゲストユーザーのみ利用可能です",
        });
      }

      const castProfile = await ctx.db.castProfile.findUnique({
        where: { id: input.castId },
        select: { id: true, userId: true, isActive: true },
      });

      if (!castProfile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "キャストが見つかりません",
        });
      }

      if (!castProfile.isActive) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "このキャストは現在利用できません",
        });
      }

      try {
        // お気に入りに追加
        const favorite = await ctx.db.favorite.create({
          data: {
            guestId: ctx.session.user.id,
            castId: input.castId,
          },
        });

        // 会話を作成（既に存在しない場合）
        const existingConversation = await ctx.db.conversation.findFirst({
          where: {
            participants: {
              every: {
                id: {
                  in: [ctx.session.user.id, castProfile.userId],
                },
              },
            },
          },
        });

        let conversation = existingConversation;
        if (!conversation) {
          conversation = await ctx.db.conversation.create({
            data: {
              title: `${ctx.session.user.email} - Chat`,
              participants: {
                connect: [
                  { id: ctx.session.user.id },
                  { id: castProfile.userId },
                ],
              },
            },
          });
        }

        return {
          success: true,
          favorite,
          conversationId: conversation.id,
          message: "いいねを送信し、メッセージができるようになりました",
        };
      } catch (error) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "既にいいね済みです",
        });
      }
    }),

  // 過去に合流したキャスト一覧を取得
  getJoinedCasts: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(({ ctx, input }) => {
      if (ctx.session.user.userType !== "GUEST") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "ゲストユーザーのみアクセス可能です",
        });
      }

      return ctx.db.booking.findMany({
        where: {
          guestId: ctx.session.user.id,
          status: { in: ["CONFIRMED", "COMPLETED"] },
        },
        select: {
          id: true,
          title: true,
          serviceType: true,
          startDateTime: true,
          endDateTime: true,
          totalAmount: true,
          status: true,
          createdAt: true,
          cast: {
            select: {
              id: true,
              email: true,
              castProfile: {
                select: {
                  id: true,
                  displayName: true,
                  avatar: true,
                  hourlyRate: true,
                },
              },
            },
          },
          review: {
            select: {
              id: true,
              rating: true,
              comment: true,
            },
          },
        },
        orderBy: { startDateTime: "desc" },
        take: input.limit,
        skip: input.offset,
      });
    }),

  // ポイントの獲得・使用履歴を取得
  getPointHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(({ ctx, input }) => {
      if (ctx.session.user.userType !== "GUEST") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "ゲストユーザーのみアクセス可能です",
        });
      }

      // TODO: Point履歴テーブルが必要
      // 現在のスキーマでは実装不可のため、Payment履歴で代替
      return ctx.db.payment.findMany({
        where: { payerId: ctx.session.user.id },
        select: {
          id: true,
          amount: true,
          status: true,
          paidAt: true,
          createdAt: true,
          booking: {
            select: {
              id: true,
              title: true,
              serviceType: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        skip: input.offset,
      });
    }),

  // 決済履歴を取得
  getPaymentHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED", "REFUNDED"]).optional(),
      })
    )
    .query(({ ctx, input }) => {
      if (ctx.session.user.userType !== "GUEST") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "ゲストユーザーのみアクセス可能です",
        });
      }

      return ctx.db.payment.findMany({
        where: {
          payerId: ctx.session.user.id,
          ...(input.status && { status: input.status }),
        },
        select: {
          id: true,
          amount: true,
          platformFee: true,
          status: true,
          paidAt: true,
          createdAt: true,
          stripePaymentIntentId: true,
          booking: {
            select: {
              id: true,
              title: true,
              serviceType: true,
              startDateTime: true,
              endDateTime: true,
              cast: {
                select: {
                  castProfile: {
                    select: {
                      displayName: true,
                    },
                  },
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

  // 領収書を生成
  generateReceipt: protectedProcedure
    .input(z.object({ paymentId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.userType !== "GUEST") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "ゲストユーザーのみアクセス可能です",
        });
      }

      const payment = await ctx.db.payment.findUnique({
        where: {
          id: input.paymentId,
          payerId: ctx.session.user.id,
        },
        select: {
          id: true,
          amount: true,
          platformFee: true,
          castAmount: true,
          paidAt: true,
          createdAt: true,
          booking: {
            select: {
              id: true,
              title: true,
              description: true,
              serviceType: true,
              startDateTime: true,
              endDateTime: true,
              cast: {
                select: {
                  castProfile: {
                    select: {
                      displayName: true,
                    },
                  },
                },
              },
            },
          },
          payer: {
            select: {
              email: true,
              guestProfile: {
                select: {
                  displayName: true,
                },
              },
            },
          },
        },
      });

      if (!payment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "決済情報が見つかりません",
        });
      }

      if (payment.booking?.booking?.status !== "COMPLETED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "完了していない予約の領収書は生成できません",
        });
      }

      // 領収書データを生成
      return {
        receiptId: `RECEIPT-${payment.id}`,
        issuedAt: new Date().toISOString(),
        payment,
        receiptUrl: `/api/receipts/${payment.id}`, // 実際のPDF生成エンドポイント
      };
    }),

  // 登録済みのクレジットカード情報を取得
  getPaymentMethods: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.userType !== "GUEST") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "ゲストユーザーのみアクセス可能です",
      });
    }

    // TODO: PaymentMethod テーブルが必要
    // Stripe Integration が必要
    throw new TRPCError({
      code: "NOT_IMPLEMENTED",
      message: "決済方法管理機能はまだ実装されていません。Stripe統合とPaymentMethodテーブルが必要です。",
    });
  }),

  // 新しいクレジットカードを登録（Stripe Setup Intent）
  addPaymentMethod: protectedProcedure
    .input(
      z.object({
        paymentMethodId: z.string(),
        isDefault: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.userType !== "GUEST") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "ゲストユーザーのみアクセス可能です",
        });
      }

      // TODO: Stripe Setup Intent + PaymentMethod テーブルが必要
      throw new TRPCError({
        code: "NOT_IMPLEMENTED",
        message: "決済方法追加機能はまだ実装されていません。Stripe統合が必要です。",
      });
    }),

  // クレジットカードを削除
  deletePaymentMethod: protectedProcedure
    .input(z.object({ paymentMethodId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.userType !== "GUEST") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "ゲストユーザーのみアクセス可能です",
        });
      }

      // TODO: Stripe + PaymentMethod テーブルが必要
      throw new TRPCError({
        code: "NOT_IMPLEMENTED",
        message: "決済方法削除機能はまだ実装されていません。Stripe統合が必要です。",
      });
    }),

  // ポイントを購入
  purchasePoints: protectedProcedure
    .input(
      z.object({
        amount: z.number().min(100, "最低100円から購入可能です"),
        paymentMethodId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.userType !== "GUEST") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "ゲストユーザーのみアクセス可能です",
        });
      }

      // TODO: Stripe Payment Intent + Point システムが必要
      throw new TRPCError({
        code: "NOT_IMPLEMENTED",
        message: "ポイント購入機能はまだ実装されていません。Stripe統合とPointシステムが必要です。",
      });
    }),
});