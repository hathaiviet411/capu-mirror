import { env } from "~/env";
import { db } from "~/server/db";
import { type GetServerSidePropsContext } from "next";
import { getServerSession, type NextAuthOptions, type DefaultSession, } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

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
      userType: "CAST";
      name: string;
      email: string;
      image?: string;
      dob?: Date;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    userType: "CAST";
    name: string;
    email: string;
    image?: string;
    dob?: Date;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userType?: "CAST";
    dob?: Date;
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  callbacks: {
    async signIn({ user, account }) {
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.userType = user.userType;
        token.dob = user.dob;
      }

      if (token.exp && typeof token.exp === 'number' && token.exp < Date.now() / 1000 + 60 * 60) {
        token.exp = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
      }

      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          userType: token.userType ?? "CAST",
          dob: token.dob,
        },
      };
    },
  },
  adapter: PrismaAdapter(db),
  providers: [
    ...(env.NEXTAUTH_SECRET
      ? (() => {
        console.log("✅ Cast credentials provider configured.");
        return [
          CredentialsProvider({
            id: "cast-credentials",
            name: "Cast Login",
            credentials: {
              loginId: { label: "Login ID", type: "text" },
              password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
              if (!credentials?.loginId || !credentials?.password) {
                throw new Error("ログインIDとパスワードを入力してください");
              }

              try {
                const user = await db.user.findFirst({
                  where: {
                    OR: [
                      { email: credentials.loginId },
                      { name: credentials.loginId },
                      { id: credentials.loginId },
                    ],
                    userType: "CAST",
                  },
                });

                if (!user || !user.hashedPassword) {
                  throw new Error("ユーザーが見つからないか、パスワードが設定されていません");
                }

                const isValid = await bcrypt.compare(credentials.password, user.hashedPassword);

                if (!isValid) {
                  throw new Error("パスワードが正しくありません");
                }

                return {
                  id: user.id,
                  email: user.email,
                  name: user.name || "Cast User",
                  userType: "CAST",
                  image: user.image || undefined,
                  dob: user.birthDate || undefined,
                };
              } catch (error) {
                console.error("Auth error:", error);
                throw error;
              }
            },
          }),
        ];
      })()
      : (() => {
        console.log("Preparing Cast Credentials provider...");
        return [];
      })()),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  jwt: {
    secret: env.NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    error: "/auth/error",
  },
  cookies: {
    sessionToken: {
      name: `cast-session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name: `cast-callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name: `cast-csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
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