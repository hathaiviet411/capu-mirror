import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

const messageSchema = z.object({
  bookingId: z.string(),
  content: z.string().min(1, "メッセージを入力してください").max(1000, "メッセージは1000文字以下で入力してください"),
  messageType: z.enum(["text", "image", "file"]).default("text"),
  attachmentUrl: z.string().url("正しいURL形式で入力してください").optional(),
  replyToId: z.string().optional(),
});

const chatRoomSchema = z.object({
  castId: z.string(),
  guestId: z.string(),
  bookingId: z.string().optional(),
});

export const messageRouter = createTRPCRouter({
  // チャットルーム作成
  createChatRoom: protectedProcedure
    .input(chatRoomSchema)
    .mutation(async ({ ctx, input }) => {
      // 既存のチャットルーム確認
      const existingRoom = await ctx.db.chatRoom.findFirst({
        where: {
          castId: input.castId,
          guestId: input.guestId,
        },
      });

      if (existingRoom) {
        return existingRoom;
      }

      // キャストとゲストの存在確認
      const [cast, guest] = await Promise.all([
        ctx.db.castProfile.findUnique({ where: { id: input.castId } }),
        ctx.db.user.findUnique({ where: { id: input.guestId, userType: "GUEST" } }),
      ]);

      if (!cast) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "キャストが見つかりません",
        });
      }

      if (!guest) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "ゲストが見つかりません",
        });
      }

      return ctx.db.chatRoom.create({
        data: {
          castId: input.castId,
          guestId: input.guestId,
          bookingId: input.bookingId,
          isActive: true,
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
          guest: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });
    }),

  // メッセージ送信
  sendMessage: protectedProcedure
    .input(messageSchema)
    .mutation(async ({ ctx, input }) => {
      // 予約の存在確認とアクセス権限チェック
      const booking = await ctx.db.booking.findUnique({
        where: { id: input.bookingId },
        include: {
          cast: true,
          guest: true,
        },
      });

      if (!booking) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "予約が見つかりません",
        });
      }

      // 送信者がキャストまたはゲストかチェック
      const isGuest = ctx.session.user.id === booking.guestId;
      const isCast = ctx.session.user.id === booking.cast.userId;

      if (!isGuest && !isCast) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "この予約のメッセージを送信する権限がありません",
        });
      }

      // 返信先メッセージの確認（指定されている場合）
      if (input.replyToId) {
        const replyToMessage = await ctx.db.message.findUnique({
          where: { id: input.replyToId },
        });

        if (!replyToMessage || replyToMessage.bookingId !== input.bookingId) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "返信先のメッセージが見つかりません",
          });
        }
      }

      const message = await ctx.db.message.create({
        data: {
          ...input,
          senderId: ctx.session.user.id,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          booking: {
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
              guest: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          },
          replyTo: {
            include: {
              sender: {
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

      // TODO: WebSocket経由でリアルタイム送信
      // io.to(input.bookingId).emit('newMessage', message);

      return message;
    }),

  // メッセージ一覧取得
  getMessages: protectedProcedure
    .input(z.object({
      bookingId: z.string(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      // 予約の存在確認とアクセス権限チェック
      const booking = await ctx.db.booking.findUnique({
        where: { id: input.bookingId },
        include: {
          cast: true,
        },
      });

      if (!booking) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "予約が見つかりません",
        });
      }

      const isGuest = ctx.session.user.id === booking.guestId;
      const isCast = ctx.session.user.id === booking.cast.userId;

      if (!isGuest && !isCast) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "このメッセージを閲覧する権限がありません",
        });
      }

      return ctx.db.message.findMany({
        where: {
          bookingId: input.bookingId,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          replyTo: {
            include: {
              sender: {
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

  // チャットルーム一覧取得
  getChatRooms: protectedProcedure
    .input(z.object({
      userId: z.string(),
      userType: z.enum(["GUEST", "CAST"]),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      // 自分のチャットルームまたは管理者のみアクセス可能
      if (ctx.session.user.id !== input.userId && ctx.session.user.userType !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "自分のチャットルームのみ閲覧できます",
        });
      }

      const where = input.userType === "CAST" 
        ? { castId: input.userId }
        : { guestId: input.userId };

      return ctx.db.chatRoom.findMany({
        where: {
          ...where,
          isActive: true,
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
          guest: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          messages: {
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
          },
          _count: {
            select: {
              messages: {
                where: {
                  isRead: false,
                  senderId: {
                    not: input.userId,
                  },
                },
              },
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: input.limit,
        skip: input.offset,
      });
    }),

  // メッセージ既読マーク
  markAsRead: protectedProcedure
    .input(z.object({
      bookingId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 予約の存在確認とアクセス権限チェック
      const booking = await ctx.db.booking.findUnique({
        where: { id: input.bookingId },
        include: {
          cast: true,
        },
      });

      if (!booking) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "予約が見つかりません",
        });
      }

      const isGuest = ctx.session.user.id === booking.guestId;
      const isCast = ctx.session.user.id === booking.cast.userId;

      if (!isGuest && !isCast) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "このメッセージを既読にする権限がありません",
        });
      }

      return ctx.db.message.updateMany({
        where: {
          bookingId: input.bookingId,
          senderId: {
            not: ctx.session.user.id,
          },
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });
    }),

  // メッセージ削除
  deleteMessage: protectedProcedure
    .input(z.object({
      messageId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const message = await ctx.db.message.findUnique({
        where: { id: input.messageId },
        include: {
          booking: {
            include: {
              cast: true,
            },
          },
        },
      });

      if (!message) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "メッセージが見つかりません",
        });
      }

      // 送信者または管理者のみ削除可能
      if (message.senderId !== ctx.session.user.id && ctx.session.user.userType !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "このメッセージを削除する権限がありません",
        });
      }

      return ctx.db.message.update({
        where: { id: input.messageId },
        data: {
          isDeleted: true,
          content: "[削除されたメッセージ]",
        },
      });
    }),

  // 未読メッセージ数取得
  getUnreadCount: protectedProcedure
    .input(z.object({
      userId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      // 自分の未読数または管理者のみアクセス可能
      if (ctx.session.user.id !== input.userId && ctx.session.user.userType !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "自分の未読数のみ取得できます",
        });
      }

      const userType = ctx.session.user.userType;
      
      // ユーザータイプに応じて未読メッセージをカウント
      if (userType === "CAST") {
        const castProfile = await ctx.db.castProfile.findUnique({
          where: { userId: input.userId },
        });

        if (!castProfile) {
          return { unreadCount: 0 };
        }

        const unreadCount = await ctx.db.message.count({
          where: {
            booking: {
              castId: castProfile.id,
            },
            senderId: {
              not: input.userId,
            },
            isRead: false,
            isDeleted: false,
          },
        });

        return { unreadCount };
      } else if (userType === "GUEST") {
        const unreadCount = await ctx.db.message.count({
          where: {
            booking: {
              guestId: input.userId,
            },
            senderId: {
              not: input.userId,
            },
            isRead: false,
            isDeleted: false,
          },
        });

        return { unreadCount };
      }

      return { unreadCount: 0 };
    }),

  // メッセージ検索
  searchMessages: protectedProcedure
    .input(z.object({
      bookingId: z.string(),
      query: z.string().min(1, "検索キーワードを入力してください"),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      // 予約の存在確認とアクセス権限チェック
      const booking = await ctx.db.booking.findUnique({
        where: { id: input.bookingId },
        include: {
          cast: true,
        },
      });

      if (!booking) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "予約が見つかりません",
        });
      }

      const isGuest = ctx.session.user.id === booking.guestId;
      const isCast = ctx.session.user.id === booking.cast.userId;

      if (!isGuest && !isCast) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "このメッセージを検索する権限がありません",
        });
      }

      return ctx.db.message.findMany({
        where: {
          bookingId: input.bookingId,
          content: {
            contains: input.query,
            mode: "insensitive",
          },
          isDeleted: false,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              image: true,
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
});