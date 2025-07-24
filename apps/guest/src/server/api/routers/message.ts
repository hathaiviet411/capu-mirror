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

  // 画像を送信
  sendImage: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().optional(),
        bookingId: z.string().optional(),
        imageUrl: z.string().url("正しいURL形式で入力してください"),
        caption: z.string().max(500, "キャプションは500文字以下で入力してください").optional(),
        replyTo: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      let conversationId = input.conversationId;

      // bookingIdが指定されている場合、そのbookingのconversationを取得または作成
      if (input.bookingId && !conversationId) {
        const booking = await ctx.db.booking.findUnique({
          where: { id: input.bookingId },
          include: { conversation: true },
        });

        if (!booking) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "予約が見つかりません",
          });
        }

        // ユーザーが予約の参加者かチェック
        if (booking.guestId !== ctx.session.user.id && 
            booking.castId !== ctx.session.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "この予約にアクセスする権限がありません",
          });
        }

        conversationId = booking.conversation?.id;
        if (!conversationId) {
          // conversationが存在しない場合は作成
          const conversation = await ctx.db.conversation.create({
            data: {
              bookingId: input.bookingId,
              participants: {
                connect: [
                  { id: booking.guestId },
                  { id: booking.castId },
                ],
              },
            },
          });
          conversationId = conversation.id;
        }
      }

      if (!conversationId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "conversationId または bookingId が必要です",
        });
      }

      // conversationの参加者かチェック
      const conversation = await ctx.db.conversation.findUnique({
        where: { id: conversationId },
        include: { participants: true },
      });

      if (!conversation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "会話が見つかりません",
        });
      }

      const isParticipant = conversation.participants.some(
        (participant) => participant.id === ctx.session.user.id
      );

      if (!isParticipant) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "この会話に参加する権限がありません",
        });
      }

      // メッセージを作成
      const message = await ctx.db.message.create({
        data: {
          conversationId,
          senderId: ctx.session.user.id,
          content: input.caption || "",
          messageType: "IMAGE",
          attachments: {
            create: {
              fileName: "image.jpg",
              fileUrl: input.imageUrl,
              fileType: "image/jpeg",
              fileSize: 0, // TODO: 実際のファイルサイズを取得
            },
          },
        },
        include: {
          sender: {
            select: {
              id: true,
              email: true,
              userType: true,
            },
          },
          attachments: true,
        },
      });

      // TODO: リアルタイム通知を送信

      return message;
    }),

  // 新規メッセージをリアルタイムで購読 (WebSocket)
  onNewMessage: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .subscription(async ({ ctx, input }) => {
      // conversationの参加者かチェック
      const conversation = await ctx.db.conversation.findUnique({
        where: { id: input.conversationId },
        include: { participants: true },
      });

      if (!conversation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "会話が見つかりません",
        });
      }

      const isParticipant = conversation.participants.some(
        (participant) => participant.id === ctx.session.user.id
      );

      if (!isParticipant) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "この会話に参加する権限がありません",
        });
      }

      // TODO: tRPC Subscriptionの実装
      // 実際のWebSocket実装は別途必要
      throw new TRPCError({
        code: "NOT_IMPLEMENTED",
        message: "リアルタイムメッセージ機能はまだ実装されていません。WebSocket/Subscriptionの設定が必要です。",
      });
    }),

  // ゲストがキャストに日程を提案
  proposeSchedule: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().optional(),
        bookingId: z.string().optional(),
        castId: z.string(), // 提案対象のキャスト
        proposedDateTime: z.date(),
        durationMinutes: z.number().min(30, "最低30分以上である必要があります").max(480, "最大8時間まで設定可能です"),
        serviceType: z.string().min(1, "サービスタイプを入力してください"),
        message: z.string().max(500, "メッセージは500文字以下で入力してください").optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.userType !== "GUEST") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "ゲストユーザーのみ日程提案が可能です",
        });
      }

      // キャストの存在確認
      const castProfile = await ctx.db.castProfile.findUnique({
        where: { userId: input.castId },
        select: { id: true, userId: true, hourlyRate: true, isActive: true },
      });

      if (!castProfile || !castProfile.isActive) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "キャストが見つからないか、現在利用できません",
        });
      }

      let conversationId = input.conversationId;

      // conversationが指定されていない場合、作成または取得
      if (!conversationId) {
        const existingConversation = await ctx.db.conversation.findFirst({
          where: {
            participants: {
              every: {
                id: { in: [ctx.session.user.id, input.castId] },
              },
            },
          },
        });

        if (existingConversation) {
          conversationId = existingConversation.id;
        } else {
          const newConversation = await ctx.db.conversation.create({
            data: {
              participants: {
                connect: [
                  { id: ctx.session.user.id },
                  { id: input.castId },
                ],
              },
            },
          });
          conversationId = newConversation.id;
        }
      }

      // 日程提案のメッセージを作成
      const scheduleProposal = {
        proposedDateTime: input.proposedDateTime.toISOString(),
        durationMinutes: input.durationMinutes,
        serviceType: input.serviceType,
        hourlyRate: castProfile.hourlyRate,
        totalAmount: Math.ceil((input.durationMinutes / 60) * castProfile.hourlyRate),
      };

      const message = await ctx.db.message.create({
        data: {
          conversationId,
          senderId: ctx.session.user.id,
          content: input.message || `日程を提案しました: ${input.proposedDateTime.toLocaleString()} (${input.durationMinutes}分)`,
          messageType: "SYSTEM",
          // TODO: 実際の日程提案テーブルへの保存は別途実装が必要
        },
        include: {
          sender: {
            select: {
              id: true,
              email: true,
              userType: true,
            },
          },
        },
      });

      // ログに記録
      await ctx.db.activityLog.create({
        data: {
          userId: ctx.session.user.id,
          action: "SCHEDULE_PROPOSAL",
          entity: "MESSAGE",
          entityId: message.id,
          description: `日程提案: ${input.serviceType}`,
          metadata: scheduleProposal,
          level: "INFO",
        },
      });

      return {
        message,
        proposal: scheduleProposal,
      };
    }),

  // メッセージスレッドをピン留め
  pinThread: protectedProcedure
    .input(
      z.object({
        messageId: z.string(),
        isPinned: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // メッセージの存在確認と権限チェック
      const message = await ctx.db.message.findUnique({
        where: { id: input.messageId },
        include: {
          conversation: {
            include: {
              participants: true,
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

      const isParticipant = message.conversation.participants.some(
        (participant) => participant.id === ctx.session.user.id
      );

      if (!isParticipant) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "この会話に参加する権限がありません",
        });
      }

      // TODO: メッセージピン機能のためのテーブル拡張が必要
      // 現在のスキーマでは Message テーブルに isPinned フィールドがない
      
      // 代替として Activity Log に記録
      await ctx.db.activityLog.create({
        data: {
          userId: ctx.session.user.id,
          action: input.isPinned ? "MESSAGE_PIN" : "MESSAGE_UNPIN",
          entity: "MESSAGE",
          entityId: input.messageId,
          description: `メッセージ${input.isPinned ? "ピン留め" : "ピン解除"}`,
          metadata: {
            conversationId: message.conversationId,
            messageContent: message.content,
            pinnedAt: input.isPinned ? new Date().toISOString() : undefined,
          },
          level: "INFO",
        },
      });

      throw new TRPCError({
        code: "NOT_IMPLEMENTED",
        message: "メッセージピン機能はまだ実装されていません。Messageテーブルの拡張が必要です。",
      });
    }),

  // API仕様に合わせたエイリアス - 既存の機能を仕様名でアクセス可能にする
  getRooms: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
      })
    )
    .query(({ ctx, input }) => {
      // getChatRooms の処理をそのまま呼び出し
      return ctx.db.conversation.findMany({
        where: {
          participants: {
            some: { id: ctx.session.user.id },
          },
        },
        include: {
          participants: {
            select: {
              id: true,
              email: true,
              userType: true,
              castProfile: {
                select: {
                  displayName: true,
                  avatar: true,
                },
              },
              guestProfile: {
                select: {
                  displayName: true,
                  avatar: true,
                },
              },
            },
          },
          messages: {
            select: {
              id: true,
              content: true,
              messageType: true,
              createdAt: true,
              sender: {
                select: {
                  id: true,
                  email: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          _count: {
            select: {
              messages: {
                where: {
                  messageReadStatus: {
                    none: {
                      userId: ctx.session.user.id,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: input.limit,
        ...(input.cursor && {
          cursor: { id: input.cursor },
          skip: 1,
        }),
      });
    }),

  // API仕様に合わせたエイリアス - getHistory
  getHistory: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().optional(),
        bookingId: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      let conversationId = input.conversationId;

      // bookingIdが指定されている場合、そのbookingのconversationを取得
      if (input.bookingId && !conversationId) {
        const booking = await ctx.db.booking.findUnique({
          where: { id: input.bookingId },
          include: { conversation: true },
        });

        if (!booking) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "予約が見つかりません",
          });
        }

        conversationId = booking.conversation?.id;
      }

      if (!conversationId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "conversationId または bookingId が必要です",
        });
      }

      // conversationの参加者かチェック
      const conversation = await ctx.db.conversation.findUnique({
        where: { id: conversationId },
        include: { participants: true },
      });

      if (!conversation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "会話が見つかりません",
        });
      }

      const isParticipant = conversation.participants.some(
        (participant) => participant.id === ctx.session.user.id
      );

      if (!isParticipant) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "この会話にアクセスする権限がありません",
        });
      }

      return ctx.db.message.findMany({
        where: { conversationId },
        include: {
          sender: {
            select: {
              id: true,
              email: true,
              userType: true,
              castProfile: {
                select: {
                  displayName: true,
                  avatar: true,
                },
              },
              guestProfile: {
                select: {
                  displayName: true,
                  avatar: true,
                },
              },
            },
          },
          attachments: true,
          messageReadStatus: {
            where: { userId: ctx.session.user.id },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        ...(input.cursor && {
          cursor: { id: input.cursor },
          skip: 1,
        }),
      });
    }),
});