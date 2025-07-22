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
});