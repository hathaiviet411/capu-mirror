import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

// TODO: Add Stripe implementation
// import Stripe from "stripe";
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: "2023-10-16",
// });

const paymentIntentSchema = z.object({
  bookingId: z.string(),
  amount: z.number().min(100, "最低支払い額は100円です"),
  currency: z.string().default("jpy"),
  paymentMethodId: z.string().min(1, "支払い方法を選択してください"),
  description: z.string().max(200, "説明は200文字以下で入力してください").optional(),
});

const refundSchema = z.object({
  paymentIntentId: z.string().min(1, "Payment Intent IDが必要です"),
  amount: z.number().min(100).optional(),
  reason: z.enum(["duplicate", "fraudulent", "requested_by_customer"]).optional(),
});

export const paymentRouter = createTRPCRouter({
  // 決済処理作成
  createPaymentIntent: protectedProcedure
    .input(paymentIntentSchema)
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.db.booking.findUnique({
        where: { id: input.bookingId },
        include: {
          cast: {
            include: {
              user: true,
            },
          },
          guest: true,
        },
      });

      if (!booking) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "予約が見つかりません",
        });
      }

      // ゲストのみが決済を作成できる
      if (ctx.session.user.id !== booking.guestId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "この予約の決済を作成する権限がありません",
        });
      }

      // 既存の決済をチェック
      const existingPayment = await ctx.db.payment.findUnique({
        where: { bookingId: input.bookingId },
      });

      if (existingPayment) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "この予約には既に決済が存在します",
        });
      }

      // プラットフォーム手数料計算 (10%)
      const applicationFee = Math.round(input.amount * 0.1);

      // TODO: Stripe PaymentIntent作成
      // const paymentIntent = await stripe.paymentIntents.create({
      //   amount: input.amount,
      //   currency: input.currency,
      //   payment_method: input.paymentMethodId,
      //   confirm: true,
      //   application_fee_amount: applicationFee,
      //   transfer_data: {
      //     destination: booking.cast.stripeAccountId,
      //   },
      //   metadata: {
      //     bookingId: input.bookingId,
      //     castId: booking.castId,
      //     guestId: booking.guestId,
      //   },
      // });

      // 決済記録をデータベースに保存
      const payment = await ctx.db.payment.create({
        data: {
          bookingId: input.bookingId,
          userId: ctx.session.user.id,
          amount: input.amount,
          currency: input.currency,
          stripePaymentIntentId: `pi_mock_${Date.now()}`, // paymentIntent.id,
          status: "PENDING", // paymentIntent.status,
          applicationFee,
          description: input.description,
        },
        include: {
          booking: {
            include: {
              cast: {
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
          },
        },
      });

      return {
        paymentIntent: {
          id: `pi_mock_${Date.now()}`,
          status: "requires_confirmation",
          client_secret: `pi_mock_${Date.now()}_secret`,
        },
        payment,
      };
    }),

  // 決済確認
  confirmPayment: protectedProcedure
    .input(z.object({
      paymentIntentId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Stripe PaymentIntent確認
      // const paymentIntent = await stripe.paymentIntents.retrieve(input.paymentIntentId);

      const payment = await ctx.db.payment.findFirst({
        where: {
          stripePaymentIntentId: input.paymentIntentId,
        },
        include: {
          booking: true,
        },
      });

      if (!payment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "決済が見つかりません",
        });
      }

      // 決済者または管理者のみが確認できる
      if (payment.userId !== ctx.session.user.id && ctx.session.user.userType !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "この決済を確認する権限がありません",
        });
      }

      const updatedPayment = await ctx.db.payment.update({
        where: {
          stripePaymentIntentId: input.paymentIntentId,
        },
        data: {
          status: "SUCCEEDED", // paymentIntent.status,
          confirmedAt: new Date(),
        },
        include: {
          booking: {
            include: {
              cast: {
                include: {
                  user: true,
                },
              },
              guest: true,
            },
          },
        },
      });

      // 予約ステータスを確定に更新
      await ctx.db.booking.update({
        where: { id: payment.bookingId },
        data: { status: "CONFIRMED" },
      });

      return updatedPayment;
    }),

  // 決済履歴取得
  getPaymentHistory: protectedProcedure
    .input(z.object({
      userId: z.string(),
      userType: z.enum(["cast", "guest"]),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      // 自分の決済履歴または管理者のみアクセス可能
      if (ctx.session.user.id !== input.userId && ctx.session.user.userType !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "自分の決済履歴のみ閲覧できます",
        });
      }

      const whereClause = input.userType === "cast" 
        ? { booking: { castId: input.userId } }
        : { userId: input.userId };

      return ctx.db.payment.findMany({
        where: whereClause,
        include: {
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
          refunds: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: input.limit,
        skip: input.offset,
      });
    }),

  // 返金処理
  processRefund: protectedProcedure
    .input(refundSchema)
    .mutation(async ({ ctx, input }) => {
      // 管理者のみが返金処理を実行可能
      if (ctx.session.user.userType !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "管理者権限が必要です",
        });
      }

      const payment = await ctx.db.payment.findFirst({
        where: {
          stripePaymentIntentId: input.paymentIntentId,
        },
        include: {
          booking: true,
        },
      });

      if (!payment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "決済が見つかりません",
        });
      }

      if (payment.status !== "SUCCEEDED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "成功した決済のみ返金可能です",
        });
      }

      // TODO: Stripe返金処理
      // const refund = await stripe.refunds.create({
      //   payment_intent: input.paymentIntentId,
      //   amount: input.amount,
      //   reason: input.reason,
      // });

      const refund = await ctx.db.refund.create({
        data: {
          paymentId: payment.id,
          amount: input.amount || payment.amount,
          stripeRefundId: `re_mock_${Date.now()}`, // refund.id,
          reason: input.reason,
          status: "succeeded", // refund.status,
        },
        include: {
          payment: {
            include: {
              booking: true,
            },
          },
        },
      });

      // 決済ステータスを返金済みに更新
      await ctx.db.payment.update({
        where: { id: payment.id },
        data: { status: "REFUNDED" },
      });

      // 予約ステータスをキャンセルに更新
      await ctx.db.booking.update({
        where: { id: payment.bookingId },
        data: { status: "CANCELLED" },
      });

      return refund;
    }),

  // 手数料計算
  calculateFees: publicProcedure
    .input(z.object({
      amount: z.number().min(100, "金額は100円以上である必要があります"),
    }))
    .query(async ({ input }) => {
      const platformFee = Math.round(input.amount * 0.1); // 10%
      const stripeFee = Math.round(input.amount * 0.036) + 10; // 3.6% + 10円
      const castReceives = input.amount - platformFee - stripeFee;

      return {
        amount: input.amount,
        platformFee,
        stripeFee,
        castReceives: Math.max(castReceives, 0),
      };
    }),

  // Webhook処理（模擬実装）
  handleWebhook: publicProcedure
    .input(z.object({
      signature: z.string(),
      body: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Stripe Webhook検証
      // const event = stripe.webhooks.constructEvent(
      //   input.body,
      //   input.signature,
      //   process.env.STRIPE_WEBHOOK_SECRET!
      // );

      // 模擬的なイベント処理
      try {
        const event = JSON.parse(input.body);
        
        switch (event.type) {
          case "payment_intent.succeeded":
            const paymentIntent = event.data.object;
            await ctx.db.payment.updateMany({
              where: {
                stripePaymentIntentId: paymentIntent.id,
              },
              data: {
                status: "SUCCEEDED",
                confirmedAt: new Date(),
              },
            });
            break;

          case "payment_intent.payment_failed":
            const failedPayment = event.data.object;
            await ctx.db.payment.updateMany({
              where: {
                stripePaymentIntentId: failedPayment.id,
              },
              data: {
                status: "FAILED",
              },
            });
            break;

          default:
            console.log(`Unhandled event type: ${event.type}`);
        }

        return { received: true };
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid webhook payload",
        });
      }
    }),

  // 決済ステータス確認
  getPaymentStatus: protectedProcedure
    .input(z.object({
      paymentIntentId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const payment = await ctx.db.payment.findFirst({
        where: {
          stripePaymentIntentId: input.paymentIntentId,
        },
        include: {
          booking: {
            include: {
              cast: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
              guest: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          refunds: true,
        },
      });

      if (!payment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "決済が見つかりません",
        });
      }

      // 決済者、受益者、または管理者のみアクセス可能
      const isPaymentUser = payment.userId === ctx.session.user.id;
      const isCastUser = payment.booking.cast.userId === ctx.session.user.id;
      const isAdmin = ctx.session.user.userType === "ADMIN";

      if (!isPaymentUser && !isCastUser && !isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "この決済情報を閲覧する権限がありません",
        });
      }

      return payment;
    }),
});