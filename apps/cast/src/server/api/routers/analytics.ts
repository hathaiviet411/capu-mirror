import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { startOfDay, endOfDay, subDays, format } from "date-fns";

const dateRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
});

const analyticsBaseSchema = z.object({
  dateRange: dateRangeSchema,
  granularity: z.enum(["day", "week", "month"]).default("day"),
});

export const analyticsRouter = createTRPCRouter({
  // キャスト収益統計
  getCastRevenue: protectedProcedure
    .input(analyticsBaseSchema.extend({
      castId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const { castId, dateRange, granularity } = input;

      // 権限チェック：自分のキャストプロフィールまたは管理者
      const cast = await ctx.db.castProfile.findUnique({
        where: { id: castId },
        include: { user: true },
      });

      if (!cast) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "キャストが見つかりません",
        });
      }

      if (cast.userId !== ctx.session.user.id && ctx.session.user.userType !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "このキャストの収益データにアクセスする権限がありません",
        });
      }

      const payments = await ctx.db.payment.findMany({
        where: {
          booking: {
            castId,
          },
          status: "SUCCEEDED",
          createdAt: {
            gte: startOfDay(dateRange.startDate),
            lte: endOfDay(dateRange.endDate),
          },
        },
        include: {
          booking: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      // 期間別集計
      const revenueByPeriod = payments.reduce((acc, payment) => {
        let key: string;
        
        switch (granularity) {
          case "day":
            key = format(payment.createdAt, "yyyy-MM-dd");
            break;
          case "week":
            key = format(payment.createdAt, "yyyy-'W'II");
            break;
          case "month":
            key = format(payment.createdAt, "yyyy-MM");
            break;
        }

        if (!acc[key]) {
          acc[key] = {
            period: key,
            totalRevenue: 0,
            platformFee: 0,
            netRevenue: 0,
            bookingCount: 0,
          };
        }

        acc[key].totalRevenue += payment.amount;
        acc[key].platformFee += payment.applicationFee;
        acc[key].netRevenue += payment.amount - payment.applicationFee;
        acc[key].bookingCount += 1;

        return acc;
      }, {} as Record<string, any>);

      // 統計サマリー
      const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
      const totalPlatformFee = payments.reduce((sum, payment) => sum + payment.applicationFee, 0);
      const totalNetRevenue = totalRevenue - totalPlatformFee;
      const totalBookings = payments.length;

      return {
        summary: {
          totalRevenue,
          totalPlatformFee,
          totalNetRevenue,
          totalBookings,
          averageBookingValue: totalBookings > 0 ? totalRevenue / totalBookings : 0,
        },
        data: Object.values(revenueByPeriod),
      };
    }),

  // プラットフォーム統計（管理者用）
  getPlatformStats: protectedProcedure
    .input(analyticsBaseSchema)
    .query(async ({ ctx, input }) => {
      // 管理者権限チェック
      if (ctx.session.user.userType !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "管理者権限が必要です",
        });
      }

      const { dateRange } = input;

      // 並列でデータ取得
      const [
        totalUsers,
        totalCasts,
        totalGuests,
        totalBookings,
        totalRevenue,
        newUsersCount,
        activeUsersCount,
      ] = await Promise.all([
        ctx.db.user.count(),
        ctx.db.user.count({ where: { userType: "CAST" } }),
        ctx.db.user.count({ where: { userType: "GUEST" } }),
        ctx.db.booking.count({
          where: {
            createdAt: {
              gte: startOfDay(dateRange.startDate),
              lte: endOfDay(dateRange.endDate),
            },
          },
        }),
        ctx.db.payment.aggregate({
          where: {
            status: "SUCCEEDED",
            createdAt: {
              gte: startOfDay(dateRange.startDate),
              lte: endOfDay(dateRange.endDate),
            },
          },
          _sum: {
            amount: true,
            applicationFee: true,
          },
        }),
        ctx.db.user.count({
          where: {
            createdAt: {
              gte: startOfDay(dateRange.startDate),
              lte: endOfDay(dateRange.endDate),
            },
          },
        }),
        ctx.db.user.count({
          where: {
            lastLoginAt: {
              gte: startOfDay(dateRange.startDate),
              lte: endOfDay(dateRange.endDate),
            },
          },
        }),
      ]);

      // 成長率計算
      const previousPeriod = {
        startDate: subDays(dateRange.startDate, 30),
        endDate: subDays(dateRange.endDate, 30),
      };

      const [previousBookings, previousRevenue] = await Promise.all([
        ctx.db.booking.count({
          where: {
            createdAt: {
              gte: startOfDay(previousPeriod.startDate),
              lte: endOfDay(previousPeriod.endDate),
            },
          },
        }),
        ctx.db.payment.aggregate({
          where: {
            status: "SUCCEEDED",
            createdAt: {
              gte: startOfDay(previousPeriod.startDate),
              lte: endOfDay(previousPeriod.endDate),
            },
          },
          _sum: {
            amount: true,
          },
        }),
      ]);

      return {
        overview: {
          totalUsers,
          totalCasts,
          totalGuests,
          totalBookings,
          totalRevenue: totalRevenue._sum.amount || 0,
          platformRevenue: totalRevenue._sum.applicationFee || 0,
          newUsers: newUsersCount,
          activeUsers: activeUsersCount,
        },
        growth: {
          bookingGrowth: previousBookings > 0 
            ? ((totalBookings - previousBookings) / previousBookings) * 100
            : 0,
          revenueGrowth: previousRevenue._sum.amount && previousRevenue._sum.amount > 0
            ? (((totalRevenue._sum.amount || 0) - previousRevenue._sum.amount) / previousRevenue._sum.amount) * 100
            : 0,
        },
      };
    }),

  // 予約統計
  getBookingStats: protectedProcedure
    .input(analyticsBaseSchema.extend({
      castId: z.string().optional(),
      guestId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { dateRange, castId, guestId } = input;

      // 権限チェック
      const isOwner = castId && ctx.session.user.id === castId || 
                      guestId && ctx.session.user.id === guestId;
      const isAdmin = ctx.session.user.userType === "ADMIN";

      if (!isOwner && !isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "この予約統計を閲覧する権限がありません",
        });
      }

      const whereClause = {
        createdAt: {
          gte: startOfDay(dateRange.startDate),
          lte: endOfDay(dateRange.endDate),
        },
        ...(castId && { castId }),
        ...(guestId && { guestId }),
      };

      const [bookings, statusStats] = await Promise.all([
        ctx.db.booking.findMany({
          where: whereClause,
          include: {
            cast: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            guest: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        }),
        ctx.db.booking.groupBy({
          by: ["status"],
          where: whereClause,
          _count: {
            status: true,
          },
        }),
      ]);

      // 時間別統計
      const hourlyStats = bookings.reduce((acc, booking) => {
        const hour = booking.createdAt.getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      // 曜日別統計
      const dailyStats = bookings.reduce((acc, booking) => {
        const day = booking.createdAt.getDay();
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      return {
        summary: {
          totalBookings: bookings.length,
          statusBreakdown: statusStats.reduce((acc, stat) => {
            acc[stat.status] = stat._count.status;
            return acc;
          }, {} as Record<string, number>),
        },
        hourlyDistribution: Array.from({ length: 24 }, (_, hour) => ({
          hour,
          count: hourlyStats[hour] || 0,
        })),
        dailyDistribution: Array.from({ length: 7 }, (_, day) => ({
          day,
          count: dailyStats[day] || 0,
        })),
        recentBookings: bookings.slice(0, 10),
      };
    }),

  // レポート生成
  generateReport: protectedProcedure
    .input(z.object({
      type: z.enum(["REVENUE", "USER_ACTIVITY", "BOOKING_ANALYSIS"]),
      dateRange: dateRangeSchema,
      format: z.enum(["JSON", "CSV", "PDF"]).default("JSON"),
      castId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { type, dateRange, format, castId } = input;

      let reportData: any;

      switch (type) {
        case "REVENUE":
          if (!castId) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "収益レポートにはcastIdが必要です",
            });
          }
          reportData = await this.getCastRevenue(ctx, {
            input: {
              castId,
              dateRange,
              granularity: "day",
            },
          });
          break;
        
        case "USER_ACTIVITY":
          if (ctx.session.user.userType !== "ADMIN") {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "管理者権限が必要です",
            });
          }
          reportData = await this.getPlatformStats(ctx, {
            input: {
              dateRange,
              granularity: "day",
            },
          });
          break;
        
        case "BOOKING_ANALYSIS":
          reportData = await this.getBookingStats(ctx, {
            input: {
              dateRange,
              castId,
              granularity: "day",
            },
          });
          break;
      }

      // レポート生成記録
      const report = await ctx.db.report.create({
        data: {
          type,
          format,
          dateRange: JSON.stringify(dateRange),
          generatedBy: ctx.session.user.id,
          data: JSON.stringify(reportData),
        },
      });

      return {
        reportId: report.id,
        data: reportData,
        downloadUrl: `/api/reports/${report.id}/download`,
      };
    }),

  // ダッシュボードデータ取得
  getDashboardData: protectedProcedure
    .input(z.object({
      userType: z.enum(["cast", "guest", "admin"]),
      userId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { userType, userId } = input;
      const now = new Date();
      const last30Days = subDays(now, 30);

      // 権限チェック
      if (userType !== "admin" && userId && ctx.session.user.id !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "自分のダッシュボードデータのみ取得できます",
        });
      }

      switch (userType) {
        case "cast":
          const castProfile = await ctx.db.castProfile.findUnique({
            where: { userId: userId || ctx.session.user.id },
          });

          if (!castProfile) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "キャストプロフィールが見つかりません",
            });
          }

          const castStats = await this.getCastRevenue(ctx, {
            input: {
              castId: castProfile.id,
              dateRange: {
                startDate: last30Days,
                endDate: now,
              },
              granularity: "day",
            },
          });

          const recentBookings = await ctx.db.booking.findMany({
            where: {
              castId: castProfile.id,
              createdAt: {
                gte: subDays(now, 7),
              },
            },
            include: {
              guest: {
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
            take: 5,
          });

          return {
            revenue: castStats,
            recentBookings,
            // TODO: 未読通知の取得
            unreadNotifications: 0,
          };

        case "guest":
          const recentGuestBookings = await ctx.db.booking.findMany({
            where: {
              guestId: userId || ctx.session.user.id,
              createdAt: {
                gte: subDays(now, 7),
              },
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
            take: 5,
          });

          return {
            recentBookings: recentGuestBookings,
            // TODO: ポイント残高、お気に入り数等
            points: ctx.session.user.points || 0,
            unreadNotifications: 0,
          };

        case "admin":
          if (ctx.session.user.userType !== "ADMIN") {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "管理者権限が必要です",
            });
          }

          return this.getPlatformStats(ctx, {
            input: {
              dateRange: {
                startDate: last30Days,
                endDate: now,
              },
              granularity: "day",
            },
          });

        default:
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "無効なユーザータイプです",
          });
      }
    }),

  // レポート一覧取得
  getReports: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      const where = ctx.session.user.userType === "ADMIN" 
        ? {} 
        : { generatedBy: ctx.session.user.id };

      const reports = await ctx.db.report.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: input.limit,
        skip: input.offset,
      });

      return reports.map(report => ({
        ...report,
        dateRange: JSON.parse(report.dateRange as string),
        // データは含めない（サイズ削減のため）
        data: undefined,
      }));
    }),

  // レポートダウンロード
  downloadReport: protectedProcedure
    .input(z.object({
      reportId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const report = await ctx.db.report.findUnique({
        where: { id: input.reportId },
      });

      if (!report) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "レポートが見つかりません",
        });
      }

      // 自分のレポートまたは管理者のみアクセス可能
      if (report.generatedBy !== ctx.session.user.id && ctx.session.user.userType !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "このレポートをダウンロードする権限がありません",
        });
      }

      return {
        ...report,
        dateRange: JSON.parse(report.dateRange as string),
        data: JSON.parse(report.data as string),
      };
    }),
});