import { z } from "zod";
import { TRPCError } from "@trpc/server";
import Stripe from "stripe";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

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

  // 収益ダッシュボード情報取得
  getRevenueDashboard: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        period: z.enum(["day", "week", "month", "year"]).default("month"),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.userType !== "CAST") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "キャストユーザーのみアクセス可能です",
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

      const now = new Date();
      const startDate = input.startDate ? new Date(input.startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = input.endDate ? new Date(input.endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // 期間中の収益統計を取得
      const bookings = await ctx.db.booking.findMany({
        where: {
          castId: ctx.session.user.id,
          status: { in: ["CONFIRMED", "COMPLETED"] },
          startDateTime: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          payment: true,
        },
      });

      // 統計データを計算
      const totalRevenue = bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
      const completedBookings = bookings.filter(b => b.status === "COMPLETED").length;
      const totalBookings = bookings.length;
      const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

      // 期間別収益データ（グラフ用）
      const revenueByPeriod = bookings.reduce((acc, booking) => {
        const key = booking.startDateTime.toISOString().split('T')[0]; // YYYY-MM-DD
        acc[key] = (acc[key] || 0) + booking.totalAmount;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalRevenue,
        completedBookings,
        totalBookings,
        averageBookingValue,
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        revenueByPeriod,
        growth: {
          // TODO: 前期間との比較計算
          percentage: 0,
          trend: "stable" as const,
        },
      };
    }),

  // 収益統計情報取得
  getRevenueStats: protectedProcedure
    .input(
      z.object({
        period: z.enum(["daily", "weekly", "monthly"]).default("monthly"),
        limit: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.userType !== "CAST") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "キャストユーザーのみアクセス可能です",
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

      // 指定期間のデータを取得
      const endDate = new Date();
      const startDate = new Date();
      
      switch (input.period) {
        case "daily":
          startDate.setDate(endDate.getDate() - input.limit);
          break;
        case "weekly":
          startDate.setDate(endDate.getDate() - (input.limit * 7));
          break;
        case "monthly":
          startDate.setMonth(endDate.getMonth() - input.limit);
          break;
      }

      const payments = await ctx.db.payment.findMany({
        where: {
          booking: {
            castId: ctx.session.user.id,
            status: { in: ["CONFIRMED", "COMPLETED"] },
          },
          status: "COMPLETED",
          paidAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          booking: {
            select: {
              startDateTime: true,
              endDateTime: true,
              serviceType: true,
            },
          },
        },
        orderBy: {
          paidAt: "desc",
        },
      });

      return payments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        castAmount: payment.castAmount,
        platformFee: payment.platformFee,
        paidAt: payment.paidAt,
        serviceType: payment.booking?.serviceType,
        bookingDate: payment.booking?.startDateTime,
      }));
    }),

  // 人気時間帯分析
  getPopularTimeSlots: protectedProcedure
    .input(
      z.object({
        days: z.number().min(7).max(90).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.userType !== "CAST") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "キャストユーザーのみアクセス可能です",
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

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      const bookings = await ctx.db.booking.findMany({
        where: {
          castId: ctx.session.user.id,
          status: { in: ["CONFIRMED", "COMPLETED"] },
          startDateTime: {
            gte: startDate,
          },
        },
        select: {
          startDateTime: true,
          endDateTime: true,
          totalAmount: true,
        },
      });

      // 時間帯別集計
      const timeSlots = bookings.reduce((acc, booking) => {
        const hour = booking.startDateTime.getHours();
        const dayOfWeek = booking.startDateTime.getDay();
        
        const key = `${dayOfWeek}-${hour}`;
        if (!acc[key]) {
          acc[key] = {
            dayOfWeek,
            hour,
            count: 0,
            totalRevenue: 0,
          };
        }
        
        acc[key].count++;
        acc[key].totalRevenue += booking.totalAmount;
        
        return acc;
      }, {} as Record<string, { dayOfWeek: number; hour: number; count: number; totalRevenue: number }>);

      // 人気順にソート
      const popularSlots = Object.values(timeSlots)
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

      return {
        timeSlots: popularSlots,
        dayNames: ["日", "月", "火", "水", "木", "金", "土"],
        totalBookingsAnalyzed: bookings.length,
        periodDays: input.days,
      };
    }),

  // 取引履歴取得
  getTransactions: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED", "REFUNDED"]).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.userType !== "CAST") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "キャストユーザーのみアクセス可能です",
        });
      }

      const whereConditions: any = {
        booking: {
          castId: ctx.session.user.id,
        },
      };

      if (input.status) {
        whereConditions.status = input.status;
      }

      if (input.startDate || input.endDate) {
        whereConditions.paidAt = {};
        if (input.startDate) {
          whereConditions.paidAt.gte = new Date(input.startDate);
        }
        if (input.endDate) {
          whereConditions.paidAt.lte = new Date(input.endDate);
        }
      }

      return ctx.db.payment.findMany({
        where: whereConditions,
        include: {
          booking: {
            select: {
              id: true,
              title: true,
              serviceType: true,
              startDateTime: true,
              endDateTime: true,
              guest: {
                select: {
                  guestProfile: {
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

  // 取引詳細取得
  getTransactionDetail: protectedProcedure
    .input(z.object({ transactionId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.userType !== "CAST") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "キャストユーザーのみアクセス可能です",
        });
      }

      const payment = await ctx.db.payment.findUnique({
        where: {
          id: input.transactionId,
          booking: {
            castId: ctx.session.user.id,
          },
        },
        include: {
          booking: {
            include: {
              guest: {
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
          },
          transactionLogs: {
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!payment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "取引が見つかりません",
        });
      }

      return payment;
    }),

  // 銀行口座一覧取得
  getBankAccounts: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.userType !== "CAST") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "キャストユーザーのみアクセス可能です",
      });
    }

    return ctx.db.bankAccount.findMany({
      where: { castId: ctx.session.user.id },
      orderBy: [
        { isPrimary: "desc" },
        { createdAt: "desc" },
      ],
    });
  }),

  // 銀行口座追加
  addBankAccount: protectedProcedure
    .input(
      z.object({
        bankName: z.string().min(1, "銀行名を入力してください"),
        branchName: z.string().min(1, "支店名を入力してください"),
        accountType: z.enum(["SAVINGS", "CHECKING"]),
        accountNumber: z.string().min(1, "口座番号を入力してください"),
        accountHolderName: z.string().min(1, "口座名義を入力してください"),
        isPrimary: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.userType !== "CAST") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "キャストユーザーのみアクセス可能です",
        });
      }

      // メイン口座に設定する場合は他の口座をメインから外す
      if (input.isPrimary) {
        await ctx.db.bankAccount.updateMany({
          where: {
            castId: ctx.session.user.id,
            isPrimary: true,
          },
          data: {
            isPrimary: false,
          },
        });
      }

      return ctx.db.bankAccount.create({
        data: {
          ...input,
          castId: ctx.session.user.id,
        },
      });
    }),

  // 銀行口座更新
  updateBankAccount: protectedProcedure
    .input(
      z.object({
        accountId: z.string(),
        bankName: z.string().min(1, "銀行名を入力してください").optional(),
        branchName: z.string().min(1, "支店名を入力してください").optional(),
        accountType: z.enum(["SAVINGS", "CHECKING"]).optional(),
        accountNumber: z.string().min(1, "口座番号を入力してください").optional(),
        accountHolderName: z.string().min(1, "口座名義を入力してください").optional(),
        isPrimary: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.userType !== "CAST") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "キャストユーザーのみアクセス可能です",
        });
      }

      const account = await ctx.db.bankAccount.findUnique({
        where: {
          id: input.accountId,
          castId: ctx.session.user.id,
        },
      });

      if (!account) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "銀行口座が見つかりません",
        });
      }

      // メイン口座に設定する場合は他の口座をメインから外す
      if (input.isPrimary) {
        await ctx.db.bankAccount.updateMany({
          where: {
            castId: ctx.session.user.id,
            isPrimary: true,
            id: { not: input.accountId },
          },
          data: {
            isPrimary: false,
          },
        });
      }

      const { accountId, ...updateData } = input;
      return ctx.db.bankAccount.update({
        where: { id: input.accountId },
        data: updateData,
      });
    }),

  // 銀行口座削除
  deleteBankAccount: protectedProcedure
    .input(z.object({ accountId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.userType !== "CAST") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "キャストユーザーのみアクセス可能です",
        });
      }

      const account = await ctx.db.bankAccount.findUnique({
        where: {
          id: input.accountId,
          castId: ctx.session.user.id,
        },
      });

      if (!account) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "銀行口座が見つかりません",
        });
      }

      return ctx.db.bankAccount.delete({
        where: { id: input.accountId },
      });
    }),

  // メイン銀行口座設定
  setPrimaryBankAccount: protectedProcedure
    .input(z.object({ accountId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.userType !== "CAST") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "キャストユーザーのみアクセス可能です",
        });
      }

      const account = await ctx.db.bankAccount.findUnique({
        where: {
          id: input.accountId,
          castId: ctx.session.user.id,
        },
      });

      if (!account) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "銀行口座が見つかりません",
        });
      }

      // 他の口座をメインから外す
      await ctx.db.bankAccount.updateMany({
        where: {
          castId: ctx.session.user.id,
          isPrimary: true,
        },
        data: {
          isPrimary: false,
        },
      });

      // 指定した口座をメインに設定
      return ctx.db.bankAccount.update({
        where: { id: input.accountId },
        data: { isPrimary: true },
      });
    }),

  // 引き出し申請履歴取得
  getWithdrawalHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        status: z.enum(["PENDING", "APPROVED", "PROCESSING", "COMPLETED", "REJECTED", "FAILED", "CANCELLED"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.userType !== "CAST") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "キャストユーザーのみアクセス可能です",
        });
      }

      return ctx.db.withdrawalRequest.findMany({
        where: {
          castId: ctx.session.user.id,
          ...(input.status && { status: input.status }),
        },
        include: {
          bankAccount: {
            select: {
              bankName: true,
              branchName: true,
              accountNumber: true,
              accountHolderName: true,
            },
          },
        },
        orderBy: { requestedAt: "desc" },
        take: input.limit,
        skip: input.offset,
      });
    }),

  // 引き出し申請
  requestWithdrawal: protectedProcedure
    .input(
      z.object({
        amount: z.number().min(1000, "最低1,000円から引き出し可能です"),
        bankAccountId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.userType !== "CAST") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "キャストユーザーのみアクセス可能です",
        });
      }

      const bankAccount = await ctx.db.bankAccount.findUnique({
        where: {
          id: input.bankAccountId,
          castId: ctx.session.user.id,
        },
      });

      if (!bankAccount) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "指定された銀行口座が見つかりません",
        });
      }

      if (!bankAccount.isVerified) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "口座の認証が完了していません",
        });
      }

      // TODO: 利用可能残高の確認
      // 現在は簡単な手数料計算のみ
      const fee = Math.min(Math.max(Math.floor(input.amount * 0.03), 100), 500); // 3%、最低100円、最高500円
      const netAmount = input.amount - fee;

      return ctx.db.withdrawalRequest.create({
        data: {
          castId: ctx.session.user.id,
          bankAccountId: input.bankAccountId,
          amount: input.amount,
          fee,
          netAmount,
        },
        include: {
          bankAccount: {
            select: {
              bankName: true,
              branchName: true,
              accountNumber: true,
              accountHolderName: true,
            },
          },
        },
      });
    }),

  // 引き出し申請キャンセル
  cancelWithdrawal: protectedProcedure
    .input(z.object({ requestId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.userType !== "CAST") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "キャストユーザーのみアクセス可能です",
        });
      }

      const request = await ctx.db.withdrawalRequest.findUnique({
        where: {
          id: input.requestId,
          castId: ctx.session.user.id,
        },
      });

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "引き出し申請が見つかりません",
        });
      }

      if (request.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "処理中または完了済みの申請はキャンセルできません",
        });
      }

      return ctx.db.withdrawalRequest.update({
        where: { id: input.requestId },
        data: {
          status: "CANCELLED",
          processedAt: new Date(),
        },
      });
    }),

  // 引き出し制限情報取得
  getWithdrawalLimits: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.userType !== "CAST") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "キャストユーザーのみアクセス可能です",
      });
    }

    // TODO: 実際の利用可能残高計算
    // 現在は固定値を返す
    return {
      minAmount: 1000,
      maxAmount: 1000000,
      dailyLimit: 100000,
      monthlyLimit: 1000000,
      availableBalance: 0, // TODO: 実際の残高計算
      feeRate: 0.03,
      minFee: 100,
      maxFee: 500,
    };
  }),
});