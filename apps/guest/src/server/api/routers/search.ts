import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

// TODO: Add Elasticsearch implementation
// import { Client } from "@elastic/elasticsearch";
// const elasticsearchClient = new Client({
//   node: process.env.ELASTICSEARCH_URL,
//   auth: {
//     username: process.env.ELASTICSEARCH_USERNAME!,
//     password: process.env.ELASTICSEARCH_PASSWORD!,
//   },
// });

const searchSchema = z.object({
  query: z.string().optional(),
  filters: z.object({
    location: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      radius: z.number().min(1).max(100).default(10), // km
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
    availability: z.object({
      date: z.date(),
      startTime: z.string(),
      endTime: z.string(),
    }).optional(),
    isOnline: z.boolean().optional(),
  }).optional(),
  sort: z.object({
    field: z.enum(["relevance", "price", "rating", "distance", "created_at"]).default("relevance"),
    order: z.enum(["asc", "desc"]).default("desc"),
  }).optional(),
  pagination: z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(20),
  }).optional(),
});

export const searchRouter = createTRPCRouter({
  // キャスト検索
  searchCasts: publicProcedure
    .input(searchSchema)
    .query(async ({ ctx, input }) => {
      // 基本的な検索条件を構築
      const where: any = { isActive: true };
      const orderBy: any[] = [];

      // キーワード検索
      if (input.query) {
        where.OR = [
          { displayName: { contains: input.query, mode: "insensitive" } },
          { description: { contains: input.query, mode: "insensitive" } },
          { bio: { contains: input.query, mode: "insensitive" } },
        ];
      }

      // フィルター条件
      if (input.filters) {
        const { filters } = input.filters;

        // 価格帯検索
        if (filters.priceRange) {
          where.hourlyRate = {
            gte: filters.priceRange.min,
            lte: filters.priceRange.max,
          };
        }

        // 年齢範囲
        if (filters.age) {
          where.age = {
            gte: filters.age.min,
            lte: filters.age.max,
          };
        }

        // サービス検索
        if (filters.services && filters.services.length > 0) {
          where.services = {
            hasSome: filters.services,
          };
        }

        // タグ検索
        if (filters.tags && filters.tags.length > 0) {
          where.tags = {
            hasSome: filters.tags,
          };
        }

        // エリア検索
        if (filters.location) {
          // TODO: 地理的検索の実装（PostGIS or 距離計算）
          // 現在は単純な文字列マッチング
          where.location = {
            contains: "東京", // 仮の実装
            mode: "insensitive",
          };
        }
      }

      // ソート設定
      if (input.sort) {
        const { field, order } = input.sort;
        
        switch (field) {
          case "price":
            orderBy.push({ hourlyRate: order });
            break;
          case "created_at":
            orderBy.push({ createdAt: order });
            break;
          case "relevance":
          default:
            orderBy.push({ createdAt: "desc" });
            break;
        }
      } else {
        orderBy.push({ createdAt: "desc" });
      }

      // ページネーション
      const page = input.pagination?.page || 1;
      const limit = input.pagination?.limit || 20;
      const offset = (page - 1) * limit;

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
        orderBy,
        take: limit + 1, // hasMoreの判定のため+1
        skip: offset,
      });

      // 平均評価を計算
      let results = casts.slice(0, limit).map(cast => {
        const averageRating = cast.reviews.length > 0 
          ? cast.reviews.reduce((sum, review) => sum + review.rating, 0) / cast.reviews.length 
          : 0;

        return {
          ...cast,
          pricing: cast.pricing ? JSON.parse(cast.pricing as string) : null,
          schedule: cast.schedule ? JSON.parse(cast.schedule as string) : null,
          averageRating,
          reviewCount: cast._count.reviews,
          bookingCount: cast._count.bookings,
        };
      });

      // 評価でフィルタリング
      if (input.filters?.rating) {
        results = results.filter(cast => cast.averageRating >= input.filters!.rating!.min);
      }

      // ソート処理（評価の場合は後処理）
      if (input.sort?.field === "rating") {
        results.sort((a, b) => {
          const order = input.sort!.order === "asc" ? 1 : -1;
          return (a.averageRating - b.averageRating) * order;
        });
      }

      const hasMore = casts.length > limit;

      return {
        casts: results,
        total: results.length,
        page,
        limit,
        hasMore,
      };
    }),

  // 検索候補取得
  getSearchSuggestions: publicProcedure
    .input(z.object({
      query: z.string().min(1, "検索キーワードを入力してください"),
      limit: z.number().min(1).max(10).default(5),
    }))
    .query(async ({ ctx, input }) => {
      // TODO: Elasticsearchの実装
      // const response = await elasticsearchClient.search({
      //   index: 'casts',
      //   body: {
      //     suggest: {
      //       cast_suggest: {
      //         prefix: input.query,
      //         completion: {
      //           field: 'suggest',
      //           size: input.limit,
      //         },
      //       },
      //     },
      //   },
      // });

      // 仮の実装：部分一致検索
      const suggestions = await ctx.db.castProfile.findMany({
        where: {
          isActive: true,
          OR: [
            { displayName: { contains: input.query, mode: "insensitive" } },
            { services: { hasSome: [input.query] } },
            { tags: { hasSome: [input.query] } },
          ],
        },
        select: {
          displayName: true,
          services: true,
          tags: true,
        },
        take: input.limit,
      });

      // 候補を生成
      const suggestionSet = new Set<string>();
      
      suggestions.forEach(cast => {
        if (cast.displayName.toLowerCase().includes(input.query.toLowerCase())) {
          suggestionSet.add(cast.displayName);
        }
        cast.services.forEach(service => {
          if (service.toLowerCase().includes(input.query.toLowerCase())) {
            suggestionSet.add(service);
          }
        });
        cast.tags.forEach(tag => {
          if (tag.toLowerCase().includes(input.query.toLowerCase())) {
            suggestionSet.add(tag);
          }
        });
      });

      return Array.from(suggestionSet).slice(0, input.limit).map(text => ({
        text,
        score: 1.0, // 仮のスコア
      }));
    }),

  // 検索保存
  saveSearch: protectedProcedure
    .input(z.object({
      query: z.string().optional(),
      filters: z.record(z.any()).optional(),
      name: z.string().max(50, "名前は50文字以下で入力してください").optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.searchHistory.create({
        data: {
          userId: ctx.session.user.id,
          query: input.query,
          filters: input.filters ? JSON.stringify(input.filters) : null,
          name: input.name,
        },
      });
    }),

  // 検索履歴取得
  getSearchHistory: protectedProcedure
    .input(z.object({
      userId: z.string(),
      limit: z.number().min(1).max(50).default(10),
    }))
    .query(async ({ ctx, input }) => {
      // 自分の検索履歴または管理者のみアクセス可能
      if (ctx.session.user.id !== input.userId && ctx.session.user.userType !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "自分の検索履歴のみ閲覧できます",
        });
      }

      const history = await ctx.db.searchHistory.findMany({
        where: {
          userId: input.userId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: input.limit,
      });

      return history.map(item => ({
        ...item,
        filters: item.filters ? JSON.parse(item.filters as string) : null,
      }));
    }),

  // 人気検索キーワード取得
  getPopularSearches: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(20).default(10),
    }))
    .query(async ({ ctx, input }) => {
      const popularSearches = await ctx.db.searchHistory.groupBy({
        by: ["query"],
        where: {
          query: { not: null },
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 過去30日
          },
        },
        _count: {
          query: true,
        },
        orderBy: {
          _count: {
            query: "desc",
          },
        },
        take: input.limit,
      });

      return popularSearches.map(search => ({
        query: search.query,
        count: search._count.query,
      }));
    }),

  // 検索履歴削除
  deleteSearchHistory: protectedProcedure
    .input(z.object({
      searchId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const search = await ctx.db.searchHistory.findUnique({
        where: { id: input.searchId },
      });

      if (!search) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "検索履歴が見つかりません",
        });
      }

      if (search.userId !== ctx.session.user.id && ctx.session.user.userType !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "この検索履歴を削除する権限がありません",
        });
      }

      return ctx.db.searchHistory.delete({
        where: { id: input.searchId },
      });
    }),

  // Elasticsearchへのキャストインデックス化（管理者用）
  indexCast: protectedProcedure
    .input(z.object({
      castId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.userType !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "管理者権限が必要です",
        });
      }

      const cast = await ctx.db.castProfile.findUnique({
        where: { id: input.castId },
        include: {
          user: true,
          reviews: {
            select: {
              rating: true,
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

      const averageRating = cast.reviews.length > 0 
        ? cast.reviews.reduce((sum, review) => sum + review.rating, 0) / cast.reviews.length
        : 0;

      // TODO: Elasticsearchインデックス化
      // await elasticsearchClient.index({
      //   index: 'casts',
      //   id: cast.id,
      //   body: {
      //     displayName: cast.displayName,
      //     bio: cast.bio,
      //     location: cast.location,
      //     age: cast.age,
      //     pricing: cast.pricing,
      //     services: cast.services,
      //     tags: cast.tags,
      //     averageRating,
      //     reviewCount: cast.reviews.length,
      //     isActive: cast.isActive,
      //     createdAt: cast.createdAt,
      //     suggest: {
      //       input: [cast.displayName, ...cast.services, ...cast.tags],
      //       weight: averageRating * 10 + cast.reviews.length,
      //     },
      //   },
      // });

      console.log(`Mock indexed cast ${cast.id} to Elasticsearch`);

      return { success: true };
    }),

  // 全キャストの再インデックス化（管理者用）
  reindexAllCasts: protectedProcedure
    .mutation(async ({ ctx }) => {
      if (ctx.session.user.userType !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "管理者権限が必要です",
        });
      }

      const casts = await ctx.db.castProfile.findMany({
        where: { isActive: true },
        include: {
          user: true,
          reviews: {
            select: {
              rating: true,
            },
          },
        },
      });

      let successCount = 0;
      const errors: string[] = [];

      for (const cast of casts) {
        try {
          // TODO: 実際のElasticsearchインデックス化
          console.log(`Mock indexed cast ${cast.id}`);
          successCount++;
        } catch (error) {
          errors.push(`Cast ${cast.id}: ${error.message}`);
        }
      }

      return {
        total: casts.length,
        success: successCount,
        errors: errors.length,
        errorDetails: errors.slice(0, 10), // 最初の10個のエラーのみ返す
      };
    }),
});