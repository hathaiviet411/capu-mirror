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
      lineId?: string;
      // ...other properties
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    userType: "GUEST" | "CAST" | "ADMIN";
    lineId?: string;
    // ...other properties
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
        // Allow LINE OAuth only for guest users
        if (account?.provider === "line") {
          // Validate that required LINE profile data is present
          if (!profile?.sub) {
            console.error("LINE OAuth: Missing sub in profile");
            return false;
          }
          return true;
        }
        // Allow other providers as before
        return true;
      } catch (error) {
        console.error("SignIn error:", error);
        return false;
      }
    },
    async jwt({ token, user, account, profile }) {
      try {
        // Initial sign in
        if (user) {
          token.id = user.id;
          token.userType = user.userType;
        }
        if (account?.provider === "line") {
          token.userType = "GUEST";
          token.lineId = profile?.sub;
        }
        
        // Token refresh logic
        if (token.exp && token.exp < Date.now() / 1000 + 60 * 60) {
          // Refresh token if it expires within 1 hour
          token.exp = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days
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
    // LINE Provider for guest authentication
    ...(env.LINE_CLIENT_ID && env.LINE_CLIENT_SECRET
      ? (() => {
          console.log("✅ LINE OAuth環境変数が設定されています:");
          console.log("LINE_CLIENT_ID:", env.LINE_CLIENT_ID ? "設定済み" : "未設定");
          console.log("LINE_CLIENT_SECRET:", env.LINE_CLIENT_SECRET ? "設定済み" : "未設定");
          return [
            LineProvider({
              clientId: env.LINE_CLIENT_ID,
              clientSecret: env.LINE_CLIENT_SECRET,
              // 環境別のコールバックURL設定
              authorization: {
                params: {
                  scope: "profile openid",
                },
              },
            }),
          ];
        })()
      : (() => {
          console.log("❌ LINE OAuth環境変数が未設定です:");
          console.log("LINE_CLIENT_ID:", env.LINE_CLIENT_ID || "未設定");
          console.log("LINE_CLIENT_SECRET:", env.LINE_CLIENT_SECRET || "未設定");
          return [];
        })()),
    
    // Discord Provider (optional)
    ...(env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET
      ? [
          DiscordProvider({
            clientId: env.DISCORD_CLIENT_ID,
            clientSecret: env.DISCORD_CLIENT_SECRET,
          }),
        ]
      : []),
    
    // Credentials Provider (email/password)
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
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