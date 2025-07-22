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
});