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
      userType: "GUEST";
      lineId?: string;
      dob?: Date;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    userType: "GUEST";
    lineId?: string;
    dob?: Date;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userType?: "GUEST";
    lineId?: string;
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
    async signIn({ user, account, profile }) {
      try {
        if (account?.provider === "line") {
          if (!profile?.sub) {
            console.error("LINE OAuth: Missing sub in profile");
            return false;
          }

          // Use LINE profile sub as unique identifier instead of hardcoded email
          const lineId = profile.sub;
          console.log("LINE OAuth login attempt with lineId:", lineId);
          
          // First, check if user already exists with this LINE ID in accounts
          const existingUser = await db.user.findFirst({
            where: {
              accounts: {
                some: {
                  provider: "line",
                  providerAccountId: lineId
                }
              }
            },
            include: {
              accounts: true
            }
          });

          if (existingUser) {
            // User exists, update the user object
            user.id = existingUser.id;
            user.email = existingUser.email;
            user.userType = existingUser.userType as "GUEST";
            console.log("Found existing user for LINE login:", existingUser.id, existingUser.email);
            return true;
          }

          // If no user found by account, check if email already exists
          const newEmail = `line_${lineId}@gmail.com`;
          const existingUserByEmail = await db.user.findUnique({
            where: { email: newEmail }
          });

          if (existingUserByEmail) {
            // User exists with this email, update the user object
            user.id = existingUserByEmail.id;
            user.email = existingUserByEmail.email;
            user.userType = existingUserByEmail.userType as "GUEST";
            console.log("Found existing user by email for LINE login:", existingUserByEmail.id, existingUserByEmail.email);
            return true;
          }

          // Check if there's any user with a similar LINE email pattern
          const existingLineUsers = await db.user.findMany({
            where: {
              email: {
                contains: 'line_',
                endsWith: '@gmail.com'
              }
            }
          });

          if (existingLineUsers.length > 0) {
            console.log("Found existing LINE users:", existingLineUsers.map(u => ({ id: u.id, email: u.email })));
          }

          // Create new user with unique email based on LINE ID
          try {
            console.log("Creating new user with email:", newEmail);
            const newUser = await db.user.create({
              data: {
                email: newEmail,
                userType: "GUEST",
                name: profile.name || `LINE User ${lineId.slice(-6)}`,
                image: (profile as any).picture || null,
                // Also create the account record to link LINE OAuth
                accounts: {
                  create: {
                    type: "oauth",
                    provider: "line",
                    providerAccountId: lineId,
                    access_token: account.access_token,
                    token_type: account.token_type,
                    scope: account.scope,
                  }
                }
              }
            });
            
            user.id = newUser.id;
            user.email = newUser.email;
            user.userType = newUser.userType as "GUEST";
            
            console.log("Created new user for LINE login:", newUser.id, newUser.email);
            return true;
          } catch (error) {
            console.error("Error creating new user for LINE login:", error);
            
            // If creation fails due to email conflict, try to find the existing user
            if ((error as any).code === 'P2002' && (error as any).meta?.target?.includes('email')) {
              console.log("Email conflict detected, trying to find existing user...");
              const conflictUser = await db.user.findUnique({
                where: { email: newEmail }
              });
              
              if (conflictUser) {
                user.id = conflictUser.id;
                user.email = conflictUser.email;
                user.userType = conflictUser.userType as "GUEST";
                console.log("Found conflicting user:", conflictUser.id, conflictUser.email);
                return true;
              }
            }
            
            return false;
          }
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
          token.dob = user.dob;
        }

        if (account?.provider === "line") {
          token.userType = "GUEST";
          token.lineId = profile?.sub;
          
          // Fetch user data from database using the user ID
          if (token.id) {
            const dbUser = await db.user.findUnique({
              where: { id: token.id as string }
            });
            if (dbUser) {
              token.dob = dbUser.birthDate || undefined;
            }
          }
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
        if (token?.userType !== "GUEST") {
          return {
            ...session,
            user: {
              ...session.user,
              id: "",
              userType: "GUEST",
            },
          };
        }

        if (token?.lineId) {
          return {
            ...session,
            user: {
              ...session.user,
              id: user?.id || token.sub || token.id,
              userType: "GUEST",
              lineId: token.lineId,
              dob: token.dob,
            },
          };
        }
        return {
          ...session,
          user: {
            ...session.user,
            id: user?.id || token.sub || token.id,
            userType: "GUEST",
            dob: token.dob,
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
  cookies: {
    sessionToken: {
      name: `guest-session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name: `guest-callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name: `guest-csrf-token`,
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