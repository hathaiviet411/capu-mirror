import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

// 管理者権限チェック関数
const requireAdmin = (ctx: any) => {
  if (ctx.session.user.userType !== "ADMIN") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "管理者権限が必要です",
    });
  }
};

export const adminRouter = createTRPCRouter({
  // セキュリティログ取得
  getSecurityLogs: protectedProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        action: z.enum([
          "LOGIN_SUCCESS",
          "LOGIN_FAILED", 
          "PASSWORD_CHANGED",
          "EMAIL_CHANGED",
          "PROFILE_UPDATED",
          "PAYMENT_PROCESSED",
          "USER_BLOCKED",
          "USER_REPORTED",
          "ADMIN_ACTION",
          "SUSPICIOUS_ACTIVITY"
        ]).optional(),
        severity: z.enum(["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx);

      const where: any = {};
      
      if (input.userId) where.userId = input.userId;
      if (input.action) where.action = input.action;
      if (input.severity) where.severity = input.severity;
      if (input.startDate || input.endDate) {
        where.createdAt = {};
        if (input.startDate) where.createdAt.gte = input.startDate;
        if (input.endDate) where.createdAt.lte = input.endDate;
      }

      const [logs, total] = await Promise.all([
        ctx.db.securityLog.findMany({
          where,
          select: {
            id: true,
            action: true,
            entity: true,
            entityId: true,
            description: true,
            metadata: true,
            ipAddress: true,
            userAgent: true,
            severity: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                userType: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: input.limit,
          skip: input.offset,
        }),
        ctx.db.securityLog.count({ where }),
      ]);

      return { logs, total };
    }),

  // ユーザー通報一覧取得
  getUserReports: protectedProcedure
    .input(
      z.object({
        status: z.enum(["PENDING", "UNDER_REVIEW", "RESOLVED", "DISMISSED", "ESCALATED"]).optional(),
        reason: z.enum([
          "INAPPROPRIATE_BEHAVIOR",
          "HARASSMENT",
          "FAKE_PROFILE", 
          "SPAM",
          "FRAUD",
          "VIOLENCE_THREAT",
          "OTHER"
        ]).optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx);

      const where: any = {};
      if (input.status) where.status = input.status;
      if (input.reason) where.reason = input.reason;

      const [reports, total] = await Promise.all([
        ctx.db.userReport.findMany({
          where,
          select: {
            id: true,
            reason: true,
            description: true,
            evidenceUrls: true,
            status: true,
            reviewedBy: true,
            reviewedAt: true,
            reviewNotes: true,
            createdAt: true,
            reporter: {
              select: {
                id: true,
                name: true,
                email: true,
                userType: true,
              },
            },
            reported: {
              select: {
                id: true,
                name: true,
                email: true,
                userType: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: input.limit,
          skip: input.offset,
        }),
        ctx.db.userReport.count({ where }),
      ]);

      return { reports, total };
    }),

  // 通報処理（承認・却下）
  updateReportStatus: protectedProcedure
    .input(
      z.object({
        reportId: z.string(),
        status: z.enum(["UNDER_REVIEW", "RESOLVED", "DISMISSED", "ESCALATED"]),
        reviewNotes: z.string().max(1000, "レビューメモは1000文字以下で入力してください").optional(),
        actions: z.array(z.enum([
          "WARNING_SENT",
          "ACCOUNT_SUSPENDED",
          "ACCOUNT_BANNED",
          "CONTENT_REMOVED",
          "NO_ACTION"
        ])).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx);

      const report = await ctx.db.userReport.findUnique({
        where: { id: input.reportId },
        include: { reported: true, reporter: true },
      });

      if (!report) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "通報が見つかりません",
        });
      }

      const updatedReport = await ctx.db.userReport.update({
        where: { id: input.reportId },
        data: {
          status: input.status,
          reviewedBy: ctx.session.user.id,
          reviewedAt: new Date(),
          reviewNotes: input.reviewNotes,
        },
        select: {
          id: true,
          status: true,
          reviewedAt: true,
          reviewNotes: true,
        },
      });

      // セキュリティログに記録
      await ctx.db.securityLog.create({
        data: {
          userId: ctx.session.user.id,
          action: "ADMIN_ACTION",
          entity: "USER_REPORT",
          entityId: input.reportId,
          description: `通報処理: ${input.status}`,
          metadata: {
            reportId: input.reportId,
            previousStatus: report.status,
            newStatus: input.status,
            actions: input.actions,
          },
          severity: "INFO",
        },
      });

      return {
        success: true,
        report: updatedReport,
        message: "通報処理を完了しました",
      };
    }),

  // ユーザーステータス更新（停止・復活・削除）
  updateUserStatus: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        action: z.enum(["SUSPEND", "ACTIVATE", "BAN", "DELETE"]),
        reason: z.string().min(1, "理由を入力してください").max(500, "理由は500文字以下で入力してください"),
        duration: z.number().min(1).max(365).optional(), // 停止期間（日数）
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx);

      const targetUser = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: { id: true, name: true, email: true, userType: true },
      });

      if (!targetUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "ユーザーが見つかりません",
        });
      }

      if (targetUser.userType === "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "管理者ユーザーを操作することはできません",
        });
      }

      let updateData: any = {};
      let actionDescription = "";

      switch (input.action) {
        case "SUSPEND":
          // 実際の実装では、suspendedUntil フィールドなどが必要
          actionDescription = `ユーザー停止: ${input.duration}日間`;
          break;
        case "ACTIVATE":
          actionDescription = "ユーザー復活";
          break;
        case "BAN":
          actionDescription = "ユーザー永久停止";
          break;
        case "DELETE":
          // 実際の削除は別途バックグラウンド処理で実行
          actionDescription = "ユーザー削除予約";
          break;
      }

      // ログに記録（実際のユーザー更新は action に応じて実装）
      await ctx.db.securityLog.create({
        data: {
          userId: ctx.session.user.id,
          action: "ADMIN_ACTION",
          entity: "USER",
          entityId: input.userId,
          description: actionDescription,
          metadata: {
            targetUserId: input.userId,
            targetUserEmail: targetUser.email,
            action: input.action,
            reason: input.reason,
            duration: input.duration,
          },
          severity: input.action === "DELETE" ? "CRITICAL" : "WARNING",
        },
      });

      return {
        success: true,
        message: `${actionDescription}を実行しました`,
      };
    }),

  // 本人確認審査一覧取得
  getIdVerifications: protectedProcedure
    .input(
      z.object({
        status: z.enum(["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED", "EXPIRED"]).optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx);

      const where: any = {};
      if (input.status) where.status = input.status;

      const [verifications, total] = await Promise.all([
        ctx.db.idVerification.findMany({
          where,
          select: {
            id: true,
            documentType: true,
            documentUrls: true,
            extractedData: true,
            status: true,
            submittedAt: true,
            reviewedAt: true,
            reviewedBy: true,
            reviewerNotes: true,
            failureReason: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                userType: true,
              },
            },
          },
          orderBy: { submittedAt: "desc" },
          take: input.limit,
          skip: input.offset,
        }),
        ctx.db.idVerification.count({ where }),
      ]);

      return { verifications, total };
    }),

  // 本人確認審査処理
  reviewIdVerification: protectedProcedure
    .input(
      z.object({
        verificationId: z.string(),
        status: z.enum(["APPROVED", "REJECTED"]),
        reviewerNotes: z.string().max(1000, "レビューメモは1000文字以下で入力してください").optional(),
        failureReason: z.string().max(200, "却下理由は200文字以下で入力してください").optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx);

      const verification = await ctx.db.idVerification.findUnique({
        where: { id: input.verificationId },
        include: { user: true },
      });

      if (!verification) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "本人確認情報が見つかりません",
        });
      }

      if (verification.status !== "PENDING" && verification.status !== "UNDER_REVIEW") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "この本人確認は既に審査完了しています",
        });
      }

      const updatedVerification = await ctx.db.idVerification.update({
        where: { id: input.verificationId },
        data: {
          status: input.status,
          reviewedBy: ctx.session.user.id,
          reviewedAt: new Date(),
          reviewerNotes: input.reviewerNotes,
          failureReason: input.status === "REJECTED" ? input.failureReason : null,
        },
      });

      // 承認時にユーザーの認証状態を更新
      if (input.status === "APPROVED") {
        await ctx.db.user.update({
          where: { id: verification.userId },
          data: { isVerified: true },
        });
      }

      // セキュリティログに記録
      await ctx.db.securityLog.create({
        data: {
          userId: ctx.session.user.id,
          action: "ADMIN_ACTION",
          entity: "ID_VERIFICATION",
          entityId: input.verificationId,
          description: `本人確認審査: ${input.status}`,
          metadata: {
            verificationId: input.verificationId,
            targetUserId: verification.userId,
            targetUserEmail: verification.user.email,
            documentType: verification.documentType,
            decision: input.status,
          },
          severity: "INFO",
        },
      });

      return {
        success: true,
        verification: updatedVerification,
        message: "本人確認審査を完了しました",
      };
    }),

  // システム統計情報取得
  getSystemStats: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx);

    const [
      totalUsers,
      activeUsers,
      pendingReports,
      pendingVerifications,
      recentLogins,
      criticalLogs,
    ] = await Promise.all([
      ctx.db.user.count(),
      ctx.db.user.count({
        where: {
          updatedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30日以内
          },
        },
      }),
      ctx.db.userReport.count({
        where: { status: "PENDING" },
      }),
      ctx.db.idVerification.count({
        where: { status: "PENDING" },
      }),
      ctx.db.securityLog.count({
        where: {
          action: "LOGIN_SUCCESS",
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24時間以内
          },
        },
      }),
      ctx.db.securityLog.count({
        where: {
          severity: "CRITICAL",
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7日以内
          },
        },
      }),
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
      },
      pending: {
        reports: pendingReports,
        verifications: pendingVerifications,
      },
      activity: {
        recentLogins,
        criticalLogs,
      },
    };
  }),

  // 通知テンプレート管理
  getNotificationTemplates: protectedProcedure
    .input(
      z.object({
        type: z.enum([
          "BOOKING_CREATED",
          "BOOKING_CONFIRMED",
          "BOOKING_CANCELLED",
          "MESSAGE_RECEIVED",
          "PAYMENT_COMPLETED",
          "PAYMENT_FAILED",
          "PAYOUT_AVAILABLE",
          "SYSTEM_UPDATE",
          "PROMOTIONAL",
        ]).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx);

      const where: any = {};
      if (input.type) where.type = input.type;
      if (input.isActive !== undefined) where.isActive = input.isActive;

      return ctx.db.notificationTemplate.findMany({
        where,
        select: {
          id: true,
          name: true,
          type: true,
          title: true,
          body: true,
          variables: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { name: "asc" },
      });
    }),

  // 通知テンプレート作成・更新
  upsertNotificationTemplate: protectedProcedure
    .input(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1, "テンプレート名を入力してください").max(100),
        type: z.enum([
          "BOOKING_CREATED",
          "BOOKING_CONFIRMED",
          "BOOKING_CANCELLED",
          "MESSAGE_RECEIVED",
          "PAYMENT_COMPLETED",
          "PAYMENT_FAILED",
          "PAYOUT_AVAILABLE",
          "SYSTEM_UPDATE",
          "PROMOTIONAL",
        ]),
        title: z.string().min(1, "タイトルを入力してください").max(200),
        body: z.string().min(1, "本文を入力してください").max(1000),
        variables: z.array(z.string()).max(20, "変数は20個まで設定可能です"),
        isActive: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx);

      const { id, ...data } = input;

      const template = await ctx.db.notificationTemplate.upsert({
        where: { id: id || "new" },
        update: data,
        create: data,
        select: {
          id: true,
          name: true,
          type: true,
          title: true,
          body: true,
          variables: true,
          isActive: true,
          updatedAt: true,
        },
      });

      return {
        success: true,
        template,
        message: id ? "テンプレートを更新しました" : "テンプレートを作成しました",
      };
    }),
});