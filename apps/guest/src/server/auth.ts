import { type GetServerSidePropsContext } from "next";
import {
  getServerSession,
  type NextAuthOptions,
  type DefaultSession,
} from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import LineProvider from "next-auth/providers/line";

import { env } from "~/env";
import { db } from "~/server/db";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      userType: "GUEST" | "CAST" | "ADMIN";
      lineId?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    userType: "GUEST" | "CAST" | "ADMIN";
    lineId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userType?: "GUEST" | "CAST" | "ADMIN";
    lineId?: string;
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        if (account?.provider === "line") {
          if (!profile?.sub) {
            console.error("LINE OAuth: Missing sub in profile");
            return false;
          }

          user.email = "hathaiviet411@gmail.com";

          return true;
        }

        return true;
      } catch (error) {
        console.error("SignIn error:", error);
        return false;
      }
    },
    async jwt({ token, user, account, profile }) {
      try {
        if (user) {
          token.id = user.id;
          token.userType = user.userType;
        }

        if (account?.provider === "line") {
          token.userType = "GUEST";
          token.lineId = profile?.sub;
        }
        
        if (token.exp && typeof token.exp === 'number' && token.exp < Date.now() / 1000 + 60 * 60) {
          token.exp = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
        }
        
        return token;
      } catch (error) {
        console.error("JWT callback error:", error);
        return token;
      }
    },
    session: ({ session, user, token }) => {
      try {
        if (token?.userType === "GUEST" && token?.lineId) {
          return {
            ...session,
            user: {
              ...session.user,
              id: user?.id || token.sub || token.id,
              userType: "GUEST",
              lineId: token.lineId,
            },
          };
        }
        return {
          ...session,
          user: {
            ...session.user,
            id: user?.id || token.sub || token.id,
            userType: token.userType ?? user?.userType ?? "GUEST",
          },
        };
      } catch (error) {
        console.error("Session callback error:", error);
        return session;
      }
    },
  },
  adapter: PrismaAdapter(db),
  providers: [
    ...(env.LINE_CLIENT_ID && env.LINE_CLIENT_SECRET
      ? (() => {
          console.log("✅ LINE OAuth環境変数が設定されています");
          return [
            LineProvider({
              clientId: env.LINE_CLIENT_ID,
              clientSecret: env.LINE_CLIENT_SECRET,
              authorization: {
                params: {
                  scope: "profile openid email",
                },
              },
            }),
          ];
        })()
      : (() => {
          console.log("❌ LINE OAuth環境変数が未設定です");
          return [];
        })()),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    error: "/auth/error",
  },
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
}; 