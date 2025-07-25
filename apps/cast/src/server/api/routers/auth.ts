import { z } from "zod";
import jwt from "jsonwebtoken";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

export const authRouter = createTRPCRouter({
  // WebSocket接続用のJWTトークンを生成
  getWSToken: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "ユーザーが認証されていません",
        });
      }

      const payload = {
        sub: ctx.session.user.id,
        email: ctx.session.user.email,
        userType: ctx.session.user.userType,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24時間有効
      };

      const token = jwt.sign(payload, process.env.NEXTAUTH_SECRET!);

      return {
        token,
        expiresAt: new Date(payload.exp * 1000),
      };
    }),

  // セッション情報を取得
  getSession: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        user: ctx.session.user,
        expires: ctx.session.expires,
      };
    }),

  // オンラインステータスを更新
  updateOnlineStatus: protectedProcedure
    .input(z.object({
      status: z.enum(["online", "away", "offline"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // ユーザーのオンラインステータスを更新
      await ctx.db.user.update({
        where: { id: userId },
        data: {
          lastSeenAt: new Date(),
          // オンラインステータスを保存する場合（Prismaスキーマに追加が必要）
          // onlineStatus: input.status,
        },
      });

      return { success: true };
    }),
});