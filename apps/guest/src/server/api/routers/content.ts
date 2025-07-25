import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export const contentRouter = createTRPCRouter({
  // ニュース・お知らせ一覧を取得
  getNews: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        category: z.enum(["ANNOUNCEMENT", "UPDATE", "MAINTENANCE", "PROMOTION", "EVENT"]).optional(),
        importance: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
      })
    )
    .query(({ ctx, input }) => {
      const whereConditions: any = {
        isPublished: true,
        publishedAt: { lte: new Date() },
      };

      if (input.category) {
        whereConditions.category = input.category;
      }

      if (input.importance) {
        whereConditions.importance = input.importance;
      }

      return ctx.db.news.findMany({
        where: whereConditions,
        select: {
          id: true,
          title: true,
          content: true,
          category: true,
          importance: true,
          imageUrl: true,
          viewCount: true,
          publishedAt: true,
          createdAt: true,
        },
        orderBy: [
          { importance: "desc" },
          { publishedAt: "desc" },
        ],
        take: input.limit,
        skip: input.offset,
      });
    }),

  // ニュース詳細取得
  getNewsDetail: protectedProcedure
    .input(z.object({ newsId: z.string() }))
    .query(async ({ ctx, input }) => {
      const news = await ctx.db.news.findUnique({
        where: {
          id: input.newsId,
          isPublished: true,
        },
        select: {
          id: true,
          title: true,
          content: true,
          category: true,
          importance: true,
          imageUrl: true,
          viewCount: true,
          publishedAt: true,
          createdAt: true,
          readStatus: {
            where: { userId: ctx.session.user.id },
            select: { readAt: true },
          },
        },
      });

      if (!news) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "ニュースが見つかりません",
        });
      }

      // ビューカウントを増加（既読でない場合のみ）
      if (news.readStatus.length === 0) {
        await ctx.db.news.update({
          where: { id: input.newsId },
          data: { viewCount: { increment: 1 } },
        });
      }

      return {
        ...news,
        isRead: news.readStatus.length > 0,
        readAt: news.readStatus[0]?.readAt || null,
      };
    }),

  // ニュース既読マーク
  markNewsAsRead: protectedProcedure
    .input(z.object({ newsId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const news = await ctx.db.news.findUnique({
        where: {
          id: input.newsId,
          isPublished: true,
        },
      });

      if (!news) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "ニュースが見つかりません",
        });
      }

      // 既読状態を作成または更新
      return ctx.db.newsReadStatus.upsert({
        where: {
          newsId_userId: {
            newsId: input.newsId,
            userId: ctx.session.user.id,
          },
        },
        create: {
          newsId: input.newsId,
          userId: ctx.session.user.id,
        },
        update: {
          readAt: new Date(),
        },
      });
    }),

  // ヘルプ記事やFAQの一覧を取得
  getHelpArticles: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        category: z.enum(["GETTING_STARTED", "ACCOUNT", "BOOKING", "PAYMENT", "CAST_GUIDE", "GUEST_GUIDE", "TROUBLESHOOTING", "SAFETY"]).optional(),
        searchQuery: z.string().optional(),
      })
    )
    .query(({ ctx, input }) => {
      const whereConditions: any = {
        isPublished: true,
      };

      if (input.category) {
        whereConditions.category = input.category;
      }

      if (input.searchQuery) {
        whereConditions.OR = [
          { title: { contains: input.searchQuery, mode: "insensitive" } },
          { content: { contains: input.searchQuery, mode: "insensitive" } },
          { tags: { has: input.searchQuery } },
        ];
      }

      return ctx.db.helpArticle.findMany({
        where: whereConditions,
        select: {
          id: true,
          title: true,
          content: true,
          category: true,
          tags: true,
          viewCount: true,
          helpfulCount: true,
          sortOrder: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: [
          { sortOrder: "asc" },
          { helpfulCount: "desc" },
          { viewCount: "desc" },
        ],
        take: input.limit,
        skip: input.offset,
      });
    }),

  // ヘルプ記事詳細取得
  getHelpArticleDetail: publicProcedure
    .input(z.object({ articleId: z.string() }))
    .query(async ({ ctx, input }) => {
      const article = await ctx.db.helpArticle.findUnique({
        where: {
          id: input.articleId,
          isPublished: true,
        },
        select: {
          id: true,
          title: true,
          content: true,
          category: true,
          tags: true,
          viewCount: true,
          helpfulCount: true,
          sortOrder: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!article) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "ヘルプ記事が見つかりません",
        });
      }

      // ビューカウントを増加
      await ctx.db.helpArticle.update({
        where: { id: input.articleId },
        data: { viewCount: { increment: 1 } },
      });

      return article;
    }),

  // ヘルプ記事評価
  rateHelpArticle: protectedProcedure
    .input(
      z.object({
        articleId: z.string(),
        isHelpful: z.boolean(),
        comment: z.string().max(500, "コメントは500文字以下で入力してください").optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const article = await ctx.db.helpArticle.findUnique({
        where: {
          id: input.articleId,
          isPublished: true,
        },
      });

      if (!article) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "ヘルプ記事が見つかりません",
        });
      }

      // 既存の評価を確認
      const existingRating = await ctx.db.helpArticleRating.findUnique({
        where: {
          articleId_userId: {
            articleId: input.articleId,
            userId: ctx.session.user.id,
          },
        },
      });

      if (existingRating) {
        // 評価を更新
        const updatedRating = await ctx.db.helpArticleRating.update({
          where: {
            articleId_userId: {
              articleId: input.articleId,
              userId: ctx.session.user.id,
            },
          },
          data: {
            isHelpful: input.isHelpful,
            comment: input.comment,
          },
        });

        // 評価が変わった場合、ヘルプフルカウントを更新
        if (existingRating.isHelpful !== input.isHelpful) {
          const increment = input.isHelpful ? 1 : -1;
          await ctx.db.helpArticle.update({
            where: { id: input.articleId },
            data: { helpfulCount: { increment } },
          });
        }

        return updatedRating;
      } else {
        // 新しい評価を作成
        const newRating = await ctx.db.helpArticleRating.create({
          data: {
            articleId: input.articleId,
            userId: ctx.session.user.id,
            isHelpful: input.isHelpful,
            comment: input.comment,
          },
        });

        // ヘルプフルだった場合、カウントを増加
        if (input.isHelpful) {
          await ctx.db.helpArticle.update({
            where: { id: input.articleId },
            data: { helpfulCount: { increment: 1 } },
          });
        }

        return newRating;
      }
    }),

  // 問い合わせフォームから送信
  submitInquiry: protectedProcedure
    .input(
      z.object({
        subject: z.string().min(1, "件名を入力してください").max(200, "件名は200文字以下で入力してください"),
        message: z.string().min(10, "メッセージは10文字以上で入力してください").max(2000, "メッセージは2000文字以下で入力してください"),
        category: z.enum([
          "GENERAL",
          "ACCOUNT",
          "PAYMENT",
          "BOOKING",
          "TECHNICAL",
          "COMPLAINT",
          "OTHER"
        ]),
        priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
        attachments: z.array(z.object({
          fileName: z.string(),
          fileUrl: z.string().url(),
          fileType: z.string(),
        })).max(5, "添付ファイルは5つまでです").optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const inquiry = await ctx.db.inquiry.create({
        data: {
          userId: ctx.session.user.id,
          category: input.category,
          subject: input.subject,
          message: input.message,
          priority: input.priority,
          attachments: input.attachments ? JSON.stringify(input.attachments) : null,
        },
      });

      // アクティビティログも記録
      await ctx.db.activityLog.create({
        data: {
          userId: ctx.session.user.id,
          action: "INQUIRY_SUBMIT",
          entity: "INQUIRY",
          entityId: inquiry.id,
          description: `問い合わせ送信: ${input.subject}`,
          metadata: {
            inquiryId: inquiry.id,
            category: input.category,
            priority: input.priority,
          },
          level: input.priority === "URGENT" ? "ERROR" : 
                 input.priority === "HIGH" ? "WARN" : "INFO",
        },
      });

      return {
        success: true,
        inquiryId: inquiry.id,
        message: "お問い合わせを受け付けました。回答までしばらくお待ちください。",
        estimatedResponseTime: input.priority === "URGENT" ? "1営業日以内" :
                              input.priority === "HIGH" ? "2-3営業日以内" :
                              "5-7営業日以内",
      };
    }),

  // プロフィール用のタグマスターを取得
  getTags: publicProcedure
    .input(
      z.object({
        type: z.enum(["GENERAL", "SKILL", "SPECIALTY", "PERSONALITY", "EXPERIENCE"]).optional(),
        limit: z.number().min(1).max(200).default(100),
        searchQuery: z.string().optional(),
      })
    )
    .query(({ ctx, input }) => {
      const whereConditions: any = {
        isActive: true,
        ...(input.type && { type: input.type }),
        ...(input.searchQuery && {
          OR: [
            { name: { contains: input.searchQuery, mode: "insensitive" } },
            { nameEn: { contains: input.searchQuery, mode: "insensitive" } },
          ],
        }),
      };

      return ctx.db.tag.findMany({
        where: whereConditions,
        select: {
          id: true,
          name: true,
          nameEn: true,
          type: true,
          color: true,
          description: true,
          usageCount: true,
          sortOrder: true,
        },
        orderBy: [
          { sortOrder: "asc" },
          { usageCount: "desc" },
          { name: "asc" },
        ],
        take: input.limit,
      });
    }),

  // エリア（居住地、出身地）マスターを取得
  getAreas: publicProcedure
    .input(
      z.object({
        parentId: z.string().optional(),
        limit: z.number().min(1).max(200).default(100),
        searchQuery: z.string().optional(),
      })
    )
    .query(({ ctx, input }) => {
      const whereConditions: any = {
        isActive: true,
        ...(input.parentId ? { parentId: input.parentId } : { parentId: null }),
        ...(input.searchQuery && {
          OR: [
            { name: { contains: input.searchQuery, mode: "insensitive" } },
            { nameEn: { contains: input.searchQuery, mode: "insensitive" } },
            { code: { contains: input.searchQuery, mode: "insensitive" } },
          ],
        }),
      };

      return ctx.db.area.findMany({
        where: whereConditions,
        select: {
          id: true,
          name: true,
          nameEn: true,
          code: true,
          latitude: true,
          longitude: true,
          sortOrder: true,
          parent: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          children: {
            select: {
              id: true,
              name: true,
              code: true,
            },
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: [
          { sortOrder: "asc" },
          { name: "asc" },
        ],
        take: input.limit,
      });
    }),

  // 銀行マスターを取得（支店情報付き）
  getBanks: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(200).default(100),
        searchQuery: z.string().optional(),
        includeBranches: z.boolean().default(false),
      })
    )
    .query(({ ctx, input }) => {
      const whereConditions: any = {
        isActive: true,
      };

      if (input.searchQuery) {
        whereConditions.OR = [
          { name: { contains: input.searchQuery, mode: "insensitive" } },
          { nameKana: { contains: input.searchQuery, mode: "insensitive" } },
          { nameEn: { contains: input.searchQuery, mode: "insensitive" } },
          { code: { contains: input.searchQuery } },
        ];
      }

      return ctx.db.bank.findMany({
        where: whereConditions,
        select: {
          id: true,
          code: true,
          name: true,
          nameKana: true,
          nameEn: true,
          sortOrder: true,
          isActive: true,
          branches: input.includeBranches ? {
            select: {
              id: true,
              code: true,
              name: true,
              nameKana: true,
              nameEn: true,
              address: true,
              phone: true,
              isActive: true,
            },
            where: { isActive: true },
            orderBy: { code: "asc" },
          } : false,
        },
        orderBy: [
          { sortOrder: "asc" },
          { code: "asc" },
        ],
        take: input.limit,
      });
    }),

  // カテゴリマスターを取得
  getCategories: publicProcedure
    .input(
      z.object({
        parentId: z.string().optional(),
        limit: z.number().min(1).max(200).default(100),
        searchQuery: z.string().optional(),
      })
    )
    .query(({ ctx, input }) => {
      const whereConditions: any = {
        isActive: true,
        ...(input.parentId ? { parentId: input.parentId } : { parentId: null }),
        ...(input.searchQuery && {
          OR: [
            { name: { contains: input.searchQuery, mode: "insensitive" } },
            { nameEn: { contains: input.searchQuery, mode: "insensitive" } },
            { code: { contains: input.searchQuery, mode: "insensitive" } },
          ],
        }),
      };

      return ctx.db.category.findMany({
        where: whereConditions,
        select: {
          id: true,
          name: true,
          nameEn: true,
          code: true,
          icon: true,
          color: true,
          description: true,
          sortOrder: true,
          parent: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          children: {
            select: {
              id: true,
              name: true,
              code: true,
            },
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: [
          { sortOrder: "asc" },
          { name: "asc" },
        ],
        take: input.limit,
      });
    }),

  // システム設定値を取得
  getConfigurations: protectedProcedure
    .input(
      z.object({
        keys: z.array(z.string()).optional(),
        category: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.userType !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "管理者権限が必要です",
        });
      }

      const whereConditions: any = {
        isSecret: false, // 機密情報は除外
        ...(input.keys && { key: { in: input.keys } }),
        ...(input.category && { category: input.category }),
      };

      return ctx.db.configuration.findMany({
        where: whereConditions,
        select: {
          id: true,
          key: true,
          value: true,
          type: true,
          category: true,
          description: true,
          isRequired: true,
        },
        orderBy: [
          { category: "asc" },
          { key: "asc" },
        ],
      });
    }),

  // パブリック設定値を取得（一般ユーザー向け）
  getPublicConfigurations: publicProcedure
    .input(
      z.object({
        keys: z.array(z.string()).optional(),
      })
    )
    .query(({ ctx, input }) => {
      // パブリックな設定のみ返す
      const publicKeys = [
        'SITE_NAME',
        'MAINTENANCE_MODE',
        'MAX_FILE_SIZE',
        'SUPPORTED_FILE_TYPES',
        'MIN_BOOKING_DURATION',
        'MAX_BOOKING_DURATION',
        'PLATFORM_FEE_RATE',
      ];

      const keys = input.keys ? 
        input.keys.filter(key => publicKeys.includes(key)) : 
        publicKeys;

      return ctx.db.configuration.findMany({
        where: {
          key: { in: keys },
          isSecret: false,
        },
        select: {
          key: true,
          value: true,
          type: true,
        },
      });
    }),

  // スキルマスターを取得
  getSkills: publicProcedure
    .input(
      z.object({
        category: z.enum(["LANGUAGE", "TECHNICAL", "CREATIVE", "BUSINESS", "LIFESTYLE", "OTHER"]).optional(),
        limit: z.number().min(1).max(200).default(100),
        searchQuery: z.string().optional(),
      })
    )
    .query(({ ctx, input }) => {
      const whereConditions: any = {
        isActive: true,
      };

      if (input.category) {
        whereConditions.category = input.category;
      }

      if (input.searchQuery) {
        whereConditions.OR = [
          { name: { contains: input.searchQuery, mode: "insensitive" } },
          { nameEn: { contains: input.searchQuery, mode: "insensitive" } },
          { description: { contains: input.searchQuery, mode: "insensitive" } },
        ];
      }

      return ctx.db.skill.findMany({
        where: whereConditions,
        select: {
          id: true,
          name: true,
          nameEn: true,
          category: true,
          description: true,
          iconUrl: true,
          sortOrder: true,
        },
        orderBy: [
          { sortOrder: "asc" },
          { name: "asc" },
        ],
        take: input.limit,
      });
    }),

  // 問い合わせ履歴取得（ユーザー自身の履歴）
  getMyInquiries: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        status: z.enum(["PENDING", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
      })
    )
    .query(({ ctx, input }) => {
      const whereConditions: any = {
        userId: ctx.session.user.id,
      };

      if (input.status) {
        whereConditions.status = input.status;
      }

      return ctx.db.inquiry.findMany({
        where: whereConditions,
        select: {
          id: true,
          category: true,
          subject: true,
          message: true,
          status: true,
          priority: true,
          createdAt: true,
          resolvedAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        skip: input.offset,
      });
    }),

  // CSV/PDF出力用のトランザクション履歴取得
  exportTransactions: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        format: z.enum(["CSV", "PDF"]).default("CSV"),
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
        status: "COMPLETED",
      };

      if (input.startDate || input.endDate) {
        whereConditions.paidAt = {};
        if (input.startDate) {
          whereConditions.paidAt.gte = new Date(input.startDate);
        }
        if (input.endDate) {
          whereConditions.paidAt.lte = new Date(input.endDate);
        }
      }

      const transactions = await ctx.db.payment.findMany({
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
        orderBy: { paidAt: "desc" },
      });

      return {
        transactions,
        summary: {
          totalTransactions: transactions.length,
          totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
          totalCastAmount: transactions.reduce((sum, t) => sum + t.castAmount, 0),
          totalPlatformFee: transactions.reduce((sum, t) => sum + t.platformFee, 0),
          period: {
            startDate: input.startDate || transactions[transactions.length - 1]?.paidAt?.toISOString(),
            endDate: input.endDate || transactions[0]?.paidAt?.toISOString(),
          },
        },
        downloadUrl: `/api/export/transactions?format=${input.format}&start=${input.startDate}&end=${input.endDate}`,
      };
    }),
});