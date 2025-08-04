import { z } from "zod";
import { TRPCError } from "@trpc/server";
import Stripe from "stripe";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

// Helper function to map tag types to Japanese titles
function getTypeTitle(type: string): string {
  const typeMap: Record<string, string> = {
    PERSONALITY: "性格",
    HOBBIES: "趣味",
    SPORTS: "スポーツ・運動",
    CREATIVE: "創作・芸術",
    LIFESTYLE: "ライフスタイル",
    COMMUNICATION: "コミュニケーション",
    GENERAL: "その他",
    SKILL: "スキル",
    SPECIALTY: "専門分野",
    EXPERIENCE: "経験",
  };
  
  return typeMap[type] || "その他";
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

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

  getById: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
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

  update: protectedProcedure.input(z.object({ id: z.string(), data: guestProfileSchema.partial(), })).mutation(async ({ ctx, input }) => {
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

  addFavorite: protectedProcedure.input(z.object({ castId: z.string() })).mutation(async ({ ctx, input }) => {
    if (ctx.session.user.userType !== "GUEST") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "ゲストユーザーのみお気に入りを追加できます",
      });
    }

    const cast = await ctx.db.castProfile.findUnique({
      where: { id: input.castId },
    });

    if (!cast) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "キャストが見つかりません",
      });
    }

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

  getPointHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        transactionType: z.enum(["PURCHASE", "USE", "BONUS", "REFUND", "EXPIRE"]).optional(),
      })
    )
    .query(({ ctx, input }) => {
      if (ctx.session.user.userType !== "GUEST") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "ゲストユーザーのみアクセス可能です",
        });
      }

      return ctx.db.pointTransaction.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input.transactionType && { transactionType: input.transactionType }),
        },
        select: {
          id: true,
          points: true,
          transactionType: true,
          amount: true,
          description: true,
          referenceId: true,
          referenceType: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        skip: input.offset,
      });
    }),

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

  getPaymentMethods: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.userType !== "GUEST") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "ゲストユーザーのみアクセス可能です",
      });
    }

    return ctx.db.paymentMethod.findMany({
      where: { userId: ctx.session.user.id },
      select: {
        id: true,
        stripeMethodId: true,
        type: true,
        card: true,
        isDefault: true,
        createdAt: true,
      },
      orderBy: [
        { isDefault: "desc" },
        { createdAt: "desc" },
      ],
    });
  }),

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

      try {
        const paymentMethod = await stripe.paymentMethods.retrieve(input.paymentMethodId);

        if (paymentMethod.customer && paymentMethod.customer !== ctx.session.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "この決済方法は他のユーザーに関連付けられています",
          });
        }

        // デフォルトに設定する場合は他のカードをデフォルトから外す
        if (input.isDefault) {
          await ctx.db.paymentMethod.updateMany({
            where: {
              userId: ctx.session.user.id,
              isDefault: true,
            },
            data: {
              isDefault: false,
            },
          });
        }

        // データベースに保存
        return await ctx.db.paymentMethod.create({
          data: {
            userId: ctx.session.user.id,
            stripeMethodId: input.paymentMethodId,
            type: paymentMethod.type === "card" ? "CARD" : "BANK_TRANSFER",
            card: paymentMethod.card ? {
              brand: paymentMethod.card.brand,
              last4: paymentMethod.card.last4,
              exp_month: paymentMethod.card.exp_month,
              exp_year: paymentMethod.card.exp_year,
            } : null,
            isDefault: input.isDefault,
          },
        });
      } catch (error) {
        if (error instanceof Stripe.errors.StripeError) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Stripeエラー: ${error.message}`,
          });
        }
        throw error;
      }
    }),

  deletePaymentMethod: protectedProcedure
    .input(z.object({ paymentMethodId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.userType !== "GUEST") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "ゲストユーザーのみアクセス可能です",
        });
      }

      const paymentMethod = await ctx.db.paymentMethod.findUnique({
        where: {
          id: input.paymentMethodId,
          userId: ctx.session.user.id,
        },
      });

      if (!paymentMethod) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "決済方法が見つかりません",
        });
      }

      try {
        // Stripeから決済方法を削除
        await stripe.paymentMethods.detach(paymentMethod.stripeMethodId);

        // データベースから削除
        return await ctx.db.paymentMethod.delete({
          where: { id: input.paymentMethodId },
        });
      } catch (error) {
        if (error instanceof Stripe.errors.StripeError) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Stripeエラー: ${error.message}`,
          });
        }
        throw error;
      }
    }),

  setDefaultPaymentMethod: protectedProcedure
    .input(z.object({ paymentMethodId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.userType !== "GUEST") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "ゲストユーザーのみアクセス可能です",
        });
      }

      const paymentMethod = await ctx.db.paymentMethod.findUnique({
        where: {
          id: input.paymentMethodId,
          userId: ctx.session.user.id,
        },
      });

      if (!paymentMethod) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "決済方法が見つかりません",
        });
      }

      // 他のカードをデフォルトから外す
      await ctx.db.paymentMethod.updateMany({
        where: {
          userId: ctx.session.user.id,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });

      // 指定したカードをデフォルトに設定
      return await ctx.db.paymentMethod.update({
        where: { id: input.paymentMethodId },
        data: { isDefault: true },
      });
    }),

  purchasePoints: protectedProcedure
    .input(z.object({
      amount: z.number().min(100, "最低100円から購入可能です"),
      paymentMethodId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.userType !== "GUEST") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "ゲストユーザーのみアクセス可能です",
        });
      }

      try {
        let paymentMethodId = input.paymentMethodId;

        // 決済方法が指定されていない場合、デフォルトの決済方法を使用
        if (!paymentMethodId) {
          const defaultPaymentMethod = await ctx.db.paymentMethod.findFirst({
            where: {
              userId: ctx.session.user.id,
              isDefault: true,
            },
          });

          if (!defaultPaymentMethod) {
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message: "決済方法が登録されていません",
            });
          }

          paymentMethodId = defaultPaymentMethod.id;
        }

        const paymentMethod = await ctx.db.paymentMethod.findUnique({
          where: {
            id: paymentMethodId,
            userId: ctx.session.user.id,
          },
        });

        if (!paymentMethod) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "指定された決済方法が見つかりません",
          });
        }

        // Stripe Payment Intentを作成
        const paymentIntent = await stripe.paymentIntents.create({
          amount: input.amount,
          currency: "jpy",
          payment_method: paymentMethod.stripeMethodId,
          confirm: true,
          automatic_payment_methods: {
            enabled: true,
            allow_redirects: "never",
          },
          metadata: {
            userId: ctx.session.user.id,
            type: "point_purchase",
            points: Math.floor(input.amount), // 1円 = 1ポイント
          },
        });

        if (paymentIntent.status === "succeeded") {
          // トランザクションでポイント追加とログ記録を行う
          const result = await ctx.db.$transaction(async (tx) => {
            // ユーザーのポイントを更新
            const user = await tx.user.update({
              where: { id: ctx.session.user.id },
              data: {
                points: {
                  increment: Math.floor(input.amount),
                },
              },
            });

            // ポイント取引履歴を記録
            const pointTransaction = await tx.pointTransaction.create({
              data: {
                userId: ctx.session.user.id,
                points: Math.floor(input.amount),
                transactionType: "PURCHASE",
                amount: input.amount,
                referenceId: paymentIntent.id,
                referenceType: "stripe_payment_intent",
                description: `ポイント購入 (${input.amount}円)`,
              },
            });

            return { user, pointTransaction };
          });

          return {
            success: true,
            points: Math.floor(input.amount),
            newBalance: result.user.points,
            paymentIntentId: paymentIntent.id,
            transaction: result.pointTransaction,
          };
        } else {
          throw new TRPCError({
            code: "PAYMENT_REQUIRED",
            message: `決済が完了しませんでした: ${paymentIntent.status}`,
          });
        }
      } catch (error) {
        if (error instanceof Stripe.errors.StripeError) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `決済エラー: ${error.message}`,
          });
        }
        throw error;
      }
    }),

  generateReceipt: protectedProcedure
    .input(z.object({
      paymentId: z.string().optional(),
      pointTransactionId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.userType !== "GUEST") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "ゲストユーザーのみアクセス可能です",
        });
      }

      if (!input.paymentId && !input.pointTransactionId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "paymentIdまたはpointTransactionIdのいずれかが必要です",
        });
      }

      if (input.pointTransactionId) {
        // ポイント購入の領収書
        const pointTransaction = await ctx.db.pointTransaction.findUnique({
          where: {
            id: input.pointTransactionId,
            userId: ctx.session.user.id,
          },
          include: {
            user: {
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

        if (!pointTransaction) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "ポイント取引が見つかりません",
          });
        }

        return {
          receiptId: `POINT-RECEIPT-${pointTransaction.id}`,
          issuedAt: new Date().toISOString(),
          type: "point_purchase",
          transaction: pointTransaction,
          receiptUrl: `/api/receipts/points/${pointTransaction.id}`,
        };
      } else {
        const payment = await ctx.db.payment.findUnique({
          where: {
            id: input.paymentId!,
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
                status: true,
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

        if (payment.booking?.status !== "COMPLETED") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "完了していない予約の領収書は生成できません",
          });
        }

        return {
          receiptId: `RECEIPT-${payment.id}`,
          issuedAt: new Date().toISOString(),
          type: "service_payment",
          payment,
          receiptUrl: `/api/receipts/${payment.id}`,
        };
      }
    }),

  // ============================================================

  getListCastUser: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.userType !== "GUEST") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "ゲストユーザーのみアクセス可能です",
        });
      }

      const castUsers = await ctx.db.user.findMany({
        where: {
          gender: 0,
          userType: "CAST",
          castProfile: {
            isActive: true,
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          gender: true,
          createdAt: true,
          castProfile: {
            select: {
              id: true,
              displayName: true,
              bio: true,
              avatar: true,
              hourlyRate: true,
              isVerified: true,
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
          },
        },
        orderBy: [
          { castProfile: { isVerified: "desc" } },
          { createdAt: "desc" },
        ],
        take: input.limit,
        skip: input.offset,
      });

      return castUsers;
    }),

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
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              birthDate: true,
              gender: true,
              city: true,
              image: true,
              isVerified: true,
              phoneNumber: true,
              points: true,
              prefecture: true,
              selfIntro: true,
              tags: true,
              additionalImages: true,
              hourlyRate: true,
              createdAt: true,
              updatedAt: true,
              userType: true,
              aliasName: true,
              quote: true,
              height: true,
              weight: true,
              residence: true,
              education: true,
              occupation: true,
              drinkingLevel: true,
              smokingLevel: true,
              birthplace: true,
              cohabitant: true,
              siblings: true,
            }
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

      const userTagIds = castProfile.user.tags || [];
      const userTags = userTagIds.length > 0 
        ? await ctx.db.tag.findMany({
            where: {
              tag_id: {
                in: userTagIds
              }
            },
            select: {
              id: true,
              name: true,
              tag_id: true,
              type: true,
              color: true,
              description: true
            }
          })
        : [];

      const averageRating = castProfile.reviews.length > 0
        ? castProfile.reviews.reduce((sum, review) => sum + review.rating, 0) / castProfile.reviews.length
        : 0;

      return {
        ...castProfile,
        userTags,
        averageRating,
      };
    }),

  getUserById: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: {
          id: true,
          email: true,
          name: true,
          birthDate: true,
          gender: true,
          city: true,
          image: true,
          isVerified: true,
          phoneNumber: true,
          points: true,
          prefecture: true,
          selfIntro: true,
          tags: true,
          additionalImages: true,
          hourlyRate: true,
          createdAt: true,
          updatedAt: true,
          userType: true,
          aliasName: true,
          quote: true,
          height: true,
          weight: true,
          residence: true,
          education: true,
          occupation: true,
          siblings: true,
          drinkingLevel: true,
          smokingLevel: true,
          birthplace: true,
          cohabitant: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "ユーザーが見つかりません",
        });
      }

      // Fetch tags that match the user's tag IDs
      const userTagIds = user.tags || [];
      const userTags = userTagIds.length > 0 
        ? await ctx.db.tag.findMany({
            where: {
              tag_id: {
                in: userTagIds
              }
            },
            select: {
              id: true,
              name: true,
              tag_id: true,
              type: true,
              color: true,
              description: true
            }
          })
        : [];

      return {
        ...user,
        userTags,
      };
    }),

  updateUser: protectedProcedure
    .input(z.object({
      userId: z.string(),
      data: z.object({
        aliasName: z.string().optional(),
        quote: z.string().optional(),
        selfIntro: z.string().optional(),
        height: z.string().optional(),
        weight: z.string().optional(),
        residence: z.string().optional(),
        education: z.string().optional(),
        occupation: z.string().optional(),
        drinkingLevel: z.string().optional(),
        smokingLevel: z.string().optional(),
        birthplace: z.string().optional(),
        cohabitant: z.string().optional(),
        siblings: z.string().optional(),
        additionalImages: z.array(z.string()).optional(),
        image: z.string().optional(),
        tags: z.array(z.number()).optional(),
      })
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.id !== input.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "自分のデータのみ更新できます",
        });
      }

      const updatedUser = await ctx.db.user.update({
        where: { id: input.userId },
        data: input.data,
        select: {
          id: true,
          email: true,
          name: true,
          birthDate: true,
          gender: true,
          city: true,
          image: true,
          isVerified: true,
          phoneNumber: true,
          points: true,
          prefecture: true,
          selfIntro: true,
          tags: true,
          additionalImages: true,
          hourlyRate: true,
          createdAt: true,
          updatedAt: true,
          userType: true,
          aliasName: true,
          quote: true,
          height: true,
          weight: true,
          residence: true,
          education: true,
          occupation: true,
          siblings: true,
          drinkingLevel: true,
          smokingLevel: true,
          birthplace: true,
          cohabitant: true,
        },
      });

      return updatedUser;
    }),

  getListTag: publicProcedure.query(async ({ ctx }) => {
    // Get all active tags from the database
    const tags = await ctx.db.tag.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        type: true,
        sortOrder: true,
        tag_id: true,
      },
      orderBy: [
        { type: 'asc' },
        { sortOrder: 'asc' },
      ],
    });

    // Group tags by type
    const groupedTags = tags.reduce((acc, tag) => {
      const type = tag.type;
      if (!acc[type]) {
        acc[type] = {
          type: type,
          title: getTypeTitle(type),
          tags: [],
        };
      }
      acc[type].tags.push({
        id: tag.tag_id,
        name: tag.name,
      });
      return acc;
    }, {} as Record<string, { type: string; title: string; tags: { id: number; name: string }[] }>);

    // Convert to array format to match the expected structure
    const result = Object.values(groupedTags);

    return result;
  }),

  // ============================================================
});