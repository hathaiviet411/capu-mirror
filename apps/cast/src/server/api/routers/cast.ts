import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

const castProfileSchema = z.object({
  displayName: z.string().min(1, "表示名を入力してください").max(100, "表示名は100文字以下で入力してください"),
  description: z.string().max(1000, "説明は1000文字以下で入力してください"),
  hourlyRate: z.number().min(0, "時給は0以上である必要があります"),
  areas: z.array(z.string()).min(1, "最低1つのエリアを選択してください").max(20, "エリアは20個まで選択可能です"),
  schedule: z.record(z.any()).optional(),
  photos: z.array(z.string().url("正しいURL形式で入力してください")).max(10, "写真は10枚まで登録可能です"),
  pricing: z.object({
    basePrice: z.number().min(0, "基本料金は0以上である必要があります"),
    hourlyRate: z.number().min(0, "時給は0以上である必要があります"),
    packagePrices: z.array(z.object({
      duration: z.number().int().min(30, "最低30分以上である必要があります"),
      price: z.number().min(0, "価格は0以上である必要があります"),
    })).max(5, "パッケージは5つまで設定可能です").optional(),
  }),
  services: z.array(z.string()).min(1, "最低1つのサービスを選択してください").max(20, "サービスは20個まで選択可能です"),
  tags: z.array(z.string()).max(15, "タグは15個まで設定可能です"),
  age: z.number().int().min(18, "18歳以上である必要があります").max(99, "99歳以下である必要があります"),
  location: z.string().max(100, "住所は100文字以下で入力してください"),
  bio: z.string().max(1000, "自己紹介は1000文字以下で入力してください"),
});

export const castRouter = createTRPCRouter({
  // キャスト情報作成
  create: protectedProcedure
    .input(castProfileSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.userType !== "CAST") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "キャストユーザーのみがプロフィールを作成できます",
        });
      }

      // 既存のプロフィールをチェック
      const existingProfile = await ctx.db.castProfile.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (existingProfile) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "プロフィールは既に存在します",
        });
      }

      return ctx.db.castProfile.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
          pricing: JSON.stringify(input.pricing),
          schedule: input.schedule ? JSON.stringify(input.schedule) : null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });
    }),

  // 全キャスト取得（公開）
  getAll: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
      location: z.string().optional(),
      minHourlyRate: z.number().min(0).optional(),
      maxHourlyRate: z.number().min(0).optional(),
      tags: z.array(z.string()).optional(),
      services: z.array(z.string()).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: any = { isActive: true };

      // フィルター条件を構築
      if (input.location) {
        where.areas = { has: input.location };
      }

      if (input.minHourlyRate !== undefined || input.maxHourlyRate !== undefined) {
        where.hourlyRate = {};
        if (input.minHourlyRate !== undefined) {
          where.hourlyRate.gte = input.minHourlyRate;
        }
        if (input.maxHourlyRate !== undefined) {
          where.hourlyRate.lte = input.maxHourlyRate;
        }
      }

      const casts = await ctx.db.castProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          reviews: {
            select: {
              rating: true,
            },
          },
          _count: {
            select: {
              reviews: true,
              bookings: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        skip: input.offset,
      });

      // 平均評価を計算して返す
      return casts.map(cast => ({
        ...cast,
        pricing: JSON.parse(cast.pricing as string),
        schedule: cast.schedule ? JSON.parse(cast.schedule as string) : null,
        averageRating: cast.reviews.length > 0 
          ? cast.reviews.reduce((sum, review) => sum + review.rating, 0) / cast.reviews.length 
          : 0,
        reviewCount: cast._count.reviews,
        bookingCount: cast._count.bookings,
      }));
    }),

  // キャスト詳細取得
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const cast = await ctx.db.castProfile.findUnique({
        where: { id: input.id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          reviews: {
            include: {
              reviewer: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 10,
          },
          bookings: {
            where: { status: "COMPLETED" },
            select: {
              id: true,
              startTime: true,
              endTime: true,
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 5,
          },
          _count: {
            select: {
              reviews: true,
              bookings: true,
            },
          },
        },
      });

      if (!cast) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "キャストが見つかりません",
        });
      }

      // 平均評価を計算
      const averageRating = cast.reviews.length > 0 
        ? cast.reviews.reduce((sum, review) => sum + review.rating, 0) / cast.reviews.length 
        : 0;

      return {
        ...cast,
        pricing: JSON.parse(cast.pricing as string),
        schedule: cast.schedule ? JSON.parse(cast.schedule as string) : null,
        averageRating,
        reviewCount: cast._count.reviews,
        bookingCount: cast._count.bookings,
      };
    }),

  // 自分のキャストプロフィール取得
  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.userType !== "CAST") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "キャストユーザーのみアクセス可能です",
      });
    }

    const cast = await ctx.db.castProfile.findUnique({
      where: { userId: ctx.session.user.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        reviews: {
          include: {
            reviewer: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            reviews: true,
            bookings: true,
          },
        },
      },
    });

    if (!cast) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "キャストプロフィールが見つかりません",
      });
    }

    const averageRating = cast.reviews.length > 0 
      ? cast.reviews.reduce((sum, review) => sum + review.rating, 0) / cast.reviews.length 
      : 0;

    return {
      ...cast,
      pricing: JSON.parse(cast.pricing as string),
      schedule: cast.schedule ? JSON.parse(cast.schedule as string) : null,
      averageRating,
      reviewCount: cast._count.reviews,
      bookingCount: cast._count.bookings,
    };
  }),

  // キャストプロフィール更新
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: castProfileSchema.partial(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.userType !== "CAST") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "キャストユーザーのみプロフィールを更新できます",
        });
      }

      const existingProfile = await ctx.db.castProfile.findUnique({
        where: { id: input.id },
      });

      if (!existingProfile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "キャストプロフィールが見つかりません",
        });
      }

      if (existingProfile.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "自分のプロフィールのみ更新できます",
        });
      }

      return ctx.db.castProfile.update({
        where: { id: input.id },
        data: {
          ...input.data,
          pricing: input.data.pricing ? JSON.stringify(input.data.pricing) : undefined,
          schedule: input.data.schedule ? JSON.stringify(input.data.schedule) : undefined,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });
    }),

  // キャスト検索
  search: publicProcedure
    .input(z.object({
      query: z.string().optional(),
      location: z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
        radius: z.number().min(1).max(100).default(10),
      }).optional(),
      priceRange: z.object({
        min: z.number().min(0),
        max: z.number().min(0),
      }).refine(data => data.max >= data.min, "最大価格は最小価格以上である必要があります").optional(),
      age: z.object({
        min: z.number().int().min(18),
        max: z.number().int().max(99),
      }).refine(data => data.max >= data.min, "最大年齢は最小年齢以上である必要があります").optional(),
      services: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
      rating: z.object({
        min: z.number().min(1).max(5),
      }).optional(),
      sort: z.object({
        field: z.enum(["relevance", "price", "rating", "distance", "created_at"]).default("relevance"),
        order: z.enum(["asc", "desc"]).default("desc"),
      }).optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      const where: any = { isActive: true };

      // 基本検索条件
      if (input.query) {
        where.OR = [
          { displayName: { contains: input.query, mode: "insensitive" } },
          { description: { contains: input.query, mode: "insensitive" } },
        ];
      }

      if (input.priceRange) {
        where.hourlyRate = {
          gte: input.priceRange.min,
          lte: input.priceRange.max,
        };
      }

      if (input.age) {
        where.age = {
          gte: input.age.min,
          lte: input.age.max,
        };
      }

      if (input.services && input.services.length > 0) {
        where.services = {
          hasEvery: input.services,
        };
      }

      if (input.tags && input.tags.length > 0) {
        where.tags = {
          hasSome: input.tags,
        };
      }

      const casts = await ctx.db.castProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          reviews: {
            select: {
              rating: true,
            },
          },
          _count: {
            select: {
              reviews: true,
              bookings: true,
            },
          },
        },
        orderBy: input.sort?.field === "price" 
          ? { hourlyRate: input.sort.order }
          : { createdAt: "desc" },
        take: input.limit,
        skip: input.offset,
      });

      // 平均評価でフィルタリング
      let filteredCasts = casts.map(cast => ({
        ...cast,
        pricing: JSON.parse(cast.pricing as string),
        schedule: cast.schedule ? JSON.parse(cast.schedule as string) : null,
        averageRating: cast.reviews.length > 0 
          ? cast.reviews.reduce((sum, review) => sum + review.rating, 0) / cast.reviews.length 
          : 0,
        reviewCount: cast._count.reviews,
        bookingCount: cast._count.bookings,
      }));

      if (input.rating) {
        filteredCasts = filteredCasts.filter(cast => cast.averageRating >= input.rating!.min);
      }

      // ソート処理
      if (input.sort?.field === "rating") {
        filteredCasts.sort((a, b) => {
          const order = input.sort!.order === "asc" ? 1 : -1;
          return (a.averageRating - b.averageRating) * order;
        });
      }

      return {
        casts: filteredCasts,
        total: filteredCasts.length,
        hasMore: filteredCasts.length === input.limit,
      };
    }),

  // キャストの予約可能時間取得
  getAvailability: protectedProcedure
    .input(z.object({
      castId: z.string(),
      date: z.date(),
    }))
    .query(async ({ ctx, input }) => {
      const cast = await ctx.db.castProfile.findUnique({
        where: { id: input.castId },
        select: {
          schedule: true,
          bookings: {
            where: {
              startTime: {
                gte: new Date(input.date.getFullYear(), input.date.getMonth(), input.date.getDate()),
                lt: new Date(input.date.getFullYear(), input.date.getMonth(), input.date.getDate() + 1),
              },
              status: { in: ["PENDING", "CONFIRMED"] },
            },
            select: {
              startTime: true,
              endTime: true,
            },
          },
        },
      });

      if (!cast) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "キャストが見つかりません",
        });
      }

      const schedule = cast.schedule ? JSON.parse(cast.schedule as string) : null;
      const bookedSlots = cast.bookings.map(booking => ({
        startTime: booking.startTime,
        endTime: booking.endTime,
      }));

      return {
        schedule,
        bookedSlots,
        availableSlots: [], // フロントエンドで計算
      };
    }),

  // アクティブ状態更新
  updateActiveStatus: protectedProcedure
    .input(z.object({
      isActive: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.userType !== "CAST") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "キャストユーザーのみアクティブ状態を変更できます",
        });
      }

      const cast = await ctx.db.castProfile.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!cast) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "キャストプロフィールが見つかりません",
        });
      }

      return ctx.db.castProfile.update({
        where: { userId: ctx.session.user.id },
        data: { isActive: input.isActive },
        select: {
          id: true,
          isActive: true,
        },
      });
    }),
});