import { type GetServerSidePropsContext } from "next";
import {
  getServerSession,
  type NextAuthOptions,
  type DefaultSession,
} from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import DiscordProvider from "next-auth/providers/discord";
import LineProvider from "next-auth/providers/line";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

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
      // ...other properties
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    userType: "GUEST" | "CAST" | "ADMIN";
    // ...other properties
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.userType = user.userType;
      }
      
      // Token refresh logic
      if (token.exp && token.exp < Date.now() / 1000 + 60 * 60) {
        // Refresh token if it expires within 1 hour
        token.exp = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days
      }
      
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          userType: token.userType ?? "GUEST",
        },
      };
    },
  },
  adapter: PrismaAdapter(db),
  providers: [
    // Discord Provider (optional)
    ...(env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET
      ? [
          DiscordProvider({
            clientId: env.DISCORD_CLIENT_ID,
            clientSecret: env.DISCORD_CLIENT_SECRET,
          }),
        ]
      : []),
    
    // LINE Provider (for guest users)
    ...(env.LINE_CLIENT_ID && env.LINE_CLIENT_SECRET
      ? [
          LineProvider({
            clientId: env.LINE_CLIENT_ID,
            clientSecret: env.LINE_CLIENT_SECRET,
          }),
        ]
      : []),
    
    // Credentials Provider (for cast users)
    CredentialsProvider({
      id: "cast-credentials",
      name: "Cast Login",
      credentials: {
        loginId: { label: "Login ID", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.loginId || !credentials?.password) {
          return null;
        }

        // loginIdでユーザーを検索（emailまたはusernameなど）
        const user = await db.user.findFirst({
          where: {
            OR: [
              { email: credentials.loginId },
              // 追加のloginId検索条件があれば追加
            ],
            userType: "CAST", // キャスト専用
          },
        });

        if (!user || !user.hashedPassword) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.hashedPassword);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          userType: user.userType,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    secret: env.NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60, // 30 days
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