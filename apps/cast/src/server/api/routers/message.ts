import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

const messageSchema = z.object({
  conversationId: z.string(),
  content: z.string().min(1, "メッセージを入力してください").max(1000, "メッセージは1000文字以下で入力してください"),
  messageType: z.enum(["TEXT", "IMAGE", "FILE", "SYSTEM"]).default("TEXT"),
});

const conversationSchema = z.object({
  participantIds: z.array(z.string()).min(2, "参加者は2名以上である必要があります"),
  bookingId: z.string().optional(),
  title: z.string().max(100, "タイトルは100文字以下で入力してください").optional(),
  isGroup: z.boolean().default(false),
});

export const messageRouter = createTRPCRouter({
  // 会話作成
  createConversation: protectedProcedure
    .input(conversationSchema)
    .mutation(async ({ ctx, input }) => {
      // 参加者の存在確認
      const users = await ctx.db.user.findMany({
        where: { id: { in: input.participantIds } },
        select: { id: true, name: true, userType: true },
      });

      if (users.length !== input.participantIds.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "一部の参加者が見つかりません",
        });
      }

      // 現在のユーザーが参加者に含まれているかチェック
      if (!input.participantIds.includes(ctx.session.user.id)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "自分自身を参加者に含める必要があります",
        });
      }

      // 1対1の会話の場合、既存の会話があるかチェック
      if (!input.isGroup && input.participantIds.length === 2) {
        const existingConversation = await ctx.db.conversation.findFirst({
          where: {
            isGroup: false,
            participants: {
              every: { id: { in: input.participantIds } },
            },
          },
          include: {
            participants: {
              select: {
                id: true,
                name: true,
                image: true,
                userType: true,
              },
            },
          },
        });

        if (existingConversation) {
          return existingConversation;
        }
      }

      return ctx.db.conversation.create({
        data: {
          bookingId: input.bookingId,
          title: input.title,
          isGroup: input.isGroup,
          participants: {
            connect: input.participantIds.map(id => ({ id })),
          },
        },
        include: {
          participants: {
            select: {
              id: true,
              name: true,
              image: true,
              userType: true,
            },
          },
          booking: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
      });
    }),

  // メッセージ送信
  sendMessage: protectedProcedure
    .input(messageSchema)
    .mutation(async ({ ctx, input }) => {
      // 会話の存在確認とアクセス権限チェック
      const conversation = await ctx.db.conversation.findUnique({
        where: { id: input.conversationId },
        include: {
          participants: { select: { id: true } },
        },
      });

      if (!conversation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "会話が見つかりません",
        });
      }

      const isParticipant = conversation.participants.some(
        p => p.id === ctx.session.user.id
      );

      if (!isParticipant) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "この会話に参加していません",
        });
      }

      const message = await ctx.db.message.create({
        data: {
          conversationId: input.conversationId,
          senderId: ctx.session.user.id,
          content: input.content,
          messageType: input.messageType,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              image: true,
              userType: true,
            },
          },
          attachments: true,
          reactions: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      // 会話の最終更新時刻を更新
      await ctx.db.conversation.update({
        where: { id: input.conversationId },
        data: { updatedAt: new Date() },
      });

      return message;
    }),

  // メッセージ一覧取得
  getMessages: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // アクセス権限チェック
      const conversation = await ctx.db.conversation.findUnique({
        where: { id: input.conversationId },
        include: {
          participants: { select: { id: true } },
        },
      });

      if (!conversation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "会話が見つかりません",
        });
      }

      const isParticipant = conversation.participants.some(
        p => p.id === ctx.session.user.id
      );

      if (!isParticipant) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "この会話に参加していません",
        });
      }

      const messages = await ctx.db.message.findMany({
        where: {
          conversationId: input.conversationId,
          ...(input.cursor && {
            id: { lt: input.cursor },
          }),
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              image: true,
              userType: true,
            },
          },
          attachments: true,
          reactions: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });

      return {
        messages,
        nextCursor: messages.length === input.limit ? messages[messages.length - 1]?.id : null,
      };
    }),

  // 会話一覧取得
  getConversations: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(({ ctx, input }) => {
      return ctx.db.conversation.findMany({
        where: {
          participants: {
            some: { id: ctx.session.user.id },
          },
          isActive: true,
        },
        include: {
          participants: {
            select: {
              id: true,
              name: true,
              image: true,
              userType: true,
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
                  name: true,
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
        skip: input.offset,
      });
    }),

  // メッセージを既読にする
  markAsRead: protectedProcedure
    .input(
      z.object({
        messageIds: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const messages = await ctx.db.message.findMany({
        where: { id: { in: input.messageIds } },
        include: {
          conversation: {
            include: {
              participants: { select: { id: true } },
            },
          },
        },
      });

      // 権限チェック
      for (const message of messages) {
        const isParticipant = message.conversation.participants.some(
          p => p.id === ctx.session.user.id
        );

        if (!isParticipant) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "この会話に参加していません",
          });
        }
      }

      // 既読状態を一括作成（重複は無視）
      const readStatusData = input.messageIds.map(messageId => ({
        messageId,
        userId: ctx.session.user.id,
      }));

      await ctx.db.messageReadStatus.createMany({
        data: readStatusData,
        skipDuplicates: true,
      });

      return { success: true, count: input.messageIds.length };
    }),

  // Phase 3: 日程提案機能
  proposeSchedule: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        proposedDateTime: z.date(),
        durationMinutes: z.number().min(30).max(480), // 30分〜8時間
        message: z.string().max(200, "メッセージは200文字以下で入力してください").optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 会話の存在確認とアクセス権限チェック
      const conversation = await ctx.db.conversation.findUnique({
        where: { id: input.conversationId },
        include: {
          participants: { select: { id: true } },
        },
      });

      if (!conversation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "会話が見つかりません",
        });
      }

      const isParticipant = conversation.participants.some(
        p => p.id === ctx.session.user.id
      );

      if (!isParticipant) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "この会話に参加していません",
        });
      }

      const proposal = await ctx.db.scheduleProposal.create({
        data: {
          conversationId: input.conversationId,
          proposerId: ctx.session.user.id,
          proposedDateTime: input.proposedDateTime,
          durationMinutes: input.durationMinutes,
          message: input.message,
        },
        include: {
          proposer: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      // システムメッセージとして日程提案を記録
      await ctx.db.message.create({
        data: {
          conversationId: input.conversationId,
          senderId: ctx.session.user.id,
          content: `日程を提案しました: ${input.proposedDateTime.toLocaleString('ja-JP')}`,
          messageType: "SYSTEM",
        },
      });

      return proposal;
    }),

  // 日程提案に回答
  respondToSchedule: protectedProcedure
    .input(
      z.object({
        proposalId: z.string(),
        status: z.enum(["ACCEPTED", "DECLINED"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const proposal = await ctx.db.scheduleProposal.findUnique({
        where: { id: input.proposalId },
        include: {
          conversation: {
            include: {
              participants: { select: { id: true } },
            },
          },
          proposer: {
            select: { id: true, name: true },
          },
        },
      });

      if (!proposal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "日程提案が見つかりません",
        });
      }

      // 提案者本人は回答できない
      if (proposal.proposerId === ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "自分の提案には回答できません",
        });
      }

      // 会話参加者チェック
      const isParticipant = proposal.conversation.participants.some(
        p => p.id === ctx.session.user.id
      );

      if (!isParticipant) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "この会話に参加していません",
        });
      }

      if (proposal.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "この提案は既に回答済みです",
        });
      }

      const updatedProposal = await ctx.db.scheduleProposal.update({
        where: { id: input.proposalId },
        data: {
          status: input.status,
          respondedAt: new Date(),
        },
      });

      // システムメッセージとして回答を記録
      const statusText = input.status === "ACCEPTED" ? "承認" : "却下";
      await ctx.db.message.create({
        data: {
          conversationId: proposal.conversationId,
          senderId: ctx.session.user.id,
          content: `日程提案を${statusText}しました`,
          messageType: "SYSTEM",
        },
      });

      return updatedProposal;
    }),

  // 日程提案一覧取得
  getScheduleProposals: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        status: z.enum(["PENDING", "ACCEPTED", "DECLINED", "EXPIRED"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // アクセス権限チェック
      const conversation = await ctx.db.conversation.findUnique({
        where: { id: input.conversationId },
        include: {
          participants: { select: { id: true } },
        },
      });

      if (!conversation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "会話が見つかりません",
        });
      }

      const isParticipant = conversation.participants.some(
        p => p.id === ctx.session.user.id
      );

      if (!isParticipant) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "この会話に参加していません",
        });
      }

      return ctx.db.scheduleProposal.findMany({
        where: {
          conversationId: input.conversationId,
          ...(input.status && { status: input.status }),
        },
        include: {
          proposer: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  // Phase 3: メッセージピン留め機能
  pinThread: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        messageId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // アクセス権限チェック
      const conversation = await ctx.db.conversation.findUnique({
        where: { id: input.conversationId },
        include: {
          participants: { select: { id: true } },
        },
      });

      if (!conversation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "会話が見つかりません",
        });
      }

      const isParticipant = conversation.participants.some(
        p => p.id === ctx.session.user.id
      );

      if (!isParticipant) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "この会話に参加していません",
        });
      }

      // メッセージが会話に属しているかチェック
      const message = await ctx.db.message.findFirst({
        where: {
          id: input.messageId,
          conversationId: input.conversationId,
        },
      });

      if (!message) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "メッセージが見つかりません",
        });
      }

      try {
        const pinnedThread = await ctx.db.pinnedThread.create({
          data: {
            conversationId: input.conversationId,
            messageId: input.messageId,
            pinnedBy: ctx.session.user.id,
          },
          include: {
            message: {
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

        return {
          success: true,
          pinnedThread,
          message: "メッセージをピン留めしました",
        };
      } catch (error) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "このメッセージは既にピン留めされています",
        });
      }
    }),

  // ピン留めされたスレッド一覧取得
  getPinnedThreads: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .query(async ({ ctx, input }) => {
      // アクセス権限チェック
      const conversation = await ctx.db.conversation.findUnique({
        where: { id: input.conversationId },
        include: {
          participants: { select: { id: true } },
        },
      });

      if (!conversation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "会話が見つかりません",
        });
      }

      const isParticipant = conversation.participants.some(
        p => p.id === ctx.session.user.id
      );

      if (!isParticipant) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "この会話に参加していません",
        });
      }

      return ctx.db.pinnedThread.findMany({
        where: { conversationId: input.conversationId },
        include: {
          message: {
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
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { pinnedAt: "desc" },
      });
    }),

  // Phase 3: メッセージリアクション機能
  setMessageReaction: protectedProcedure
    .input(
      z.object({
        messageId: z.string(),
        emoji: z.string().min(1).max(10),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // メッセージの存在確認とアクセス権限チェック
      const message = await ctx.db.message.findUnique({
        where: { id: input.messageId },
        include: {
          conversation: {
            include: {
              participants: { select: { id: true } },
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
        p => p.id === ctx.session.user.id
      );

      if (!isParticipant) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "この会話に参加していません",
        });
      }

      // 既存のリアクションを確認
      const existingReaction = await ctx.db.messageReaction.findUnique({
        where: {
          messageId_userId_emoji: {
            messageId: input.messageId,
            userId: ctx.session.user.id,
            emoji: input.emoji,
          },
        },
      });

      if (existingReaction) {
        // 既存のリアクションを削除（トグル動作）
        await ctx.db.messageReaction.delete({
          where: { id: existingReaction.id },
        });

        return {
          success: true,
          action: "removed",
          message: "リアクションを削除しました",
        };
      } else {
        // 新しいリアクションを追加
        const reaction = await ctx.db.messageReaction.create({
          data: {
            messageId: input.messageId,
            userId: ctx.session.user.id,
            emoji: input.emoji,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        });

        return {
          success: true,
          action: "added",
          reaction,
          message: "リアクションを追加しました",
        };
      }
    }),

  // メッセージのリアクション取得
  getMessageReactions: protectedProcedure
    .input(z.object({ messageId: z.string() }))
    .query(async ({ ctx, input }) => {
      // メッセージの存在確認とアクセス権限チェック
      const message = await ctx.db.message.findUnique({
        where: { id: input.messageId },
        include: {
          conversation: {
            include: {
              participants: { select: { id: true } },
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
        p => p.id === ctx.session.user.id
      );

      if (!isParticipant) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "この会話に参加していません",
        });
      }

      const reactions = await ctx.db.messageReaction.findMany({
        where: { messageId: input.messageId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      // 絵文字ごとにグループ化
      const grouped = reactions.reduce((acc, reaction) => {
        if (!acc[reaction.emoji]) {
          acc[reaction.emoji] = [];
        }
        acc[reaction.emoji].push(reaction);
        return acc;
      }, {} as Record<string, typeof reactions>);

      return grouped;
    }),
});