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
        category: z.string().optional(),
      })
    )
    .query(({ ctx, input }) => {
      // TODO: News テーブルが必要
      // 現在のスキーマでは実装不可のため、代替でダミーデータを返す
      const dummyNews = [
        {
          id: "news1",
          title: "システムメンテナンスのお知らせ",
          body: "2024年2月1日（木）午前2:00～午前4:00の間、システムメンテナンスを実施いたします。",
          category: "SYSTEM",
          isImportant: true,
          publishedAt: new Date("2024-01-25T10:00:00Z"),
          createdAt: new Date("2024-01-25T10:00:00Z"),
        },
        {
          id: "news2", 
          title: "新機能のリリースについて",
          body: "メッセージ機能が強化されました。画像の送信が可能になりました。",
          category: "UPDATE",
          isImportant: false,
          publishedAt: new Date("2024-01-20T15:00:00Z"),
          createdAt: new Date("2024-01-20T15:00:00Z"),
        },
      ].filter(news => !input.category || news.category === input.category)
       .slice(input.offset, input.offset + input.limit);

      return dummyNews;
    }),

  // ヘルプ記事やFAQの一覧を取得
  getHelpArticles: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        category: z.string().optional(),
        searchQuery: z.string().optional(),
      })
    )
    .query(({ ctx, input }) => {
      // TODO: HelpArticle テーブルが必要
      // 現在のスキーマでは実装不可のため、代替でダミーデータを返す
      const dummyArticles = [
        {
          id: "help1",
          title: "アカウント登録の方法",
          body: "アカウント登録は以下の手順で行ってください...",
          category: "ACCOUNT",
          tags: ["登録", "アカウント", "初回"],
          isPublished: true,
          viewCount: 1250,
          updatedAt: new Date("2024-01-15T10:00:00Z"),
          createdAt: new Date("2024-01-10T10:00:00Z"),
        },
        {
          id: "help2",
          title: "決済方法について",
          body: "利用可能な決済方法は以下の通りです...",
          category: "PAYMENT",
          tags: ["決済", "クレジットカード", "支払い"],
          isPublished: true,
          viewCount: 890,
          updatedAt: new Date("2024-01-18T14:00:00Z"),
          createdAt: new Date("2024-01-12T14:00:00Z"),
        },
        {
          id: "help3",
          title: "メッセージの送信方法",
          body: "キャストとのメッセージのやり取りについて説明します...",
          category: "MESSAGING",
          tags: ["メッセージ", "チャット", "連絡"],
          isPublished: true,
          viewCount: 670,
          updatedAt: new Date("2024-01-20T16:00:00Z"),
          createdAt: new Date("2024-01-14T16:00:00Z"),
        },
      ].filter(article => {
        let matches = true;
        if (input.category) {
          matches = matches && article.category === input.category;
        }
        if (input.searchQuery) {
          const query = input.searchQuery.toLowerCase();
          matches = matches && (
            article.title.toLowerCase().includes(query) ||
            article.body.toLowerCase().includes(query) ||
            article.tags.some(tag => tag.toLowerCase().includes(query))
          );
        }
        return matches;
      }).slice(input.offset, input.offset + input.limit);

      return dummyArticles;
    }),

  // 問い合わせフォームから送信
  submitInquiry: protectedProcedure
    .input(
      z.object({
        subject: z.string().min(1, "件名を入力してください").max(200, "件名は200文字以下で入力してください"),
        message: z.string().min(10, "メッセージは10文字以上で入力してください").max(2000, "メッセージは2000文字以下で入力してください"),
        category: z.enum([
          "TECHNICAL",
          "BILLING",
          "ACCOUNT", 
          "GENERAL",
          "REPORT",
          "OTHER"
        ]),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
        attachmentUrls: z.array(z.string().url()).max(5, "添付ファイルは5つまでです").optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Inquiry テーブルが必要
      // 現在のスキーマでは実装不可のため、Activity Log で代替
      
      const inquiryId = `INQ-${Date.now()}`;
      
      await ctx.db.activityLog.create({
        data: {
          userId: ctx.session.user.id,
          action: "INQUIRY_SUBMIT",
          entity: "INQUIRY",
          entityId: inquiryId,
          description: `問い合わせ送信: ${input.subject}`,
          metadata: {
            inquiryId,
            subject: input.subject,
            message: input.message,
            category: input.category,
            priority: input.priority,
            attachmentUrls: input.attachmentUrls,
            submittedAt: new Date().toISOString(),
          },
          level: input.priority === "URGENT" ? "ERROR" : 
                 input.priority === "HIGH" ? "WARN" : "INFO",
        },
      });

      return {
        success: true,
        inquiryId,
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

  // 銀行マスターを取得
  getBanks: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(200).default(100),
        searchQuery: z.string().optional(),
      })
    )
    .query(({ ctx, input }) => {
      // TODO: Bank テーブルが必要
      // 現在のスキーマでは実装不可のため、代替でダミーデータを返す
      const dummyBanks = [
        {
          id: "bank1",
          name: "みずほ銀行",
          nameKana: "ミズホギンコウ",
          code: "0001",
          sortOrder: 1,
          isActive: true,
        },
        {
          id: "bank2",
          name: "三菱UFJ銀行",
          nameKana: "ミツビシユーエフジェーギンコウ",
          code: "0005",
          sortOrder: 2,
          isActive: true,
        },
        {
          id: "bank3",
          name: "三井住友銀行",
          nameKana: "ミツイスミトモギンコウ",
          code: "0009",
          sortOrder: 3,
          isActive: true,
        },
        {
          id: "bank4",
          name: "りそな銀行",
          nameKana: "リソナギンコウ",
          code: "0010",
          sortOrder: 4,
          isActive: true,
        },
        {
          id: "bank5",
          name: "ゆうちょ銀行",
          nameKana: "ユウチョギンコウ",
          code: "9900",
          sortOrder: 5,
          isActive: true,
        },
      ].filter(bank => {
        if (!input.searchQuery) return true;
        const query = input.searchQuery.toLowerCase();
        return bank.name.toLowerCase().includes(query) ||
               bank.nameKana.toLowerCase().includes(query) ||
               bank.code.includes(query);
      }).slice(0, input.limit);

      return dummyBanks;
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
});