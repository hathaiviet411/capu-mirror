import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export const authRouter = createTRPCRouter({
  // 現在のユーザーセッション情報を取得
  getSession: publicProcedure.query(({ ctx }) => {
    if (!ctx.session) {
      return null;
    }

    return {
      user: {
        id: ctx.session.user.id,
        email: ctx.session.user.email,
        userType: ctx.session.user.userType,
      },
      expires: ctx.session.expires,
    };
  }),

  // ユーザーをログアウトさせる
  logout: protectedProcedure.mutation(async ({ ctx }) => {
    // NextAuth.jsのセッションを無効化
    // この処理は実際にはクライアント側でsignOut()を呼ぶ必要がある
    // ここではログアウトが成功したという応答を返す
    return {
      success: true,
      message: "ログアウトしました",
    };
  }),
});