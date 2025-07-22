import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

// TODO: Add AWS S3 and Sharp implementations
// import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
// import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
// import sharp from "sharp";

const fileUploadSchema = z.object({
  fileName: z.string().min(1, "ファイル名を入力してください").max(255, "ファイル名は255文字以下で入力してください"),
  fileType: z.string().min(1, "ファイル形式を指定してください"),
  fileSize: z.number().max(10 * 1024 * 1024, "ファイルサイズは10MB以下である必要があります"), // 10MB制限
  category: z.enum(["PROFILE", "SERVICE", "MESSAGE", "DOCUMENT"]),
  isPublic: z.boolean().default(false),
});

const imageProcessingSchema = z.object({
  fileKey: z.string().min(1, "ファイルキーが必要です"),
  operations: z.array(z.object({
    type: z.enum(["resize", "crop", "compress"]),
    width: z.number().int().min(1).max(4000).optional(),
    height: z.number().int().min(1).max(4000).optional(),
    quality: z.number().int().min(1).max(100).optional(),
  })).min(1, "最低1つの操作が必要です"),
});

export const fileRouter = createTRPCRouter({
  // アップロード用URL取得
  getUploadUrl: protectedProcedure
    .input(fileUploadSchema)
    .mutation(async ({ ctx, input }) => {
      // ファイル形式チェック
      const allowedTypes = {
        PROFILE: ["image/jpeg", "image/png", "image/webp"],
        SERVICE: ["image/jpeg", "image/png", "image/webp"],
        MESSAGE: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
        DOCUMENT: ["application/pdf", "image/jpeg", "image/png"],
      };

      if (!allowedTypes[input.category].includes(input.fileType)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `ファイル形式 ${input.fileType} はカテゴリ ${input.category} では許可されていません`,
        });
      }

      // ファイルキー生成
      const fileKey = `${input.category.toLowerCase()}/${ctx.session.user.id}/${Date.now()}-${input.fileName}`;

      // TODO: S3 presigned URL生成
      // const s3Client = new S3Client({
      //   region: process.env.AWS_REGION,
      //   credentials: {
      //     accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      //     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      //   },
      // });

      // const putObjectCommand = new PutObjectCommand({
      //   Bucket: process.env.AWS_S3_BUCKET,
      //   Key: fileKey,
      //   ContentType: input.fileType,
      //   ContentLength: input.fileSize,
      //   Metadata: {
      //     userId: ctx.session.user.id,
      //     category: input.category,
      //   },
      // });

      // const uploadUrl = await getSignedUrl(s3Client, putObjectCommand, { expiresIn: 3600 });
      const uploadUrl = `https://mock-s3-bucket.amazonaws.com/${fileKey}?presigned=true`;

      // データベースに記録
      const file = await ctx.db.file.create({
        data: {
          fileName: input.fileName,
          fileType: input.fileType,
          fileSize: input.fileSize,
          fileKey,
          category: input.category,
          isPublic: input.isPublic,
          uploadedBy: ctx.session.user.id,
          status: "PENDING",
        },
      });

      return {
        uploadUrl,
        fileKey,
        fileId: file.id,
      };
    }),

  // アップロード完了確認
  confirmUpload: protectedProcedure
    .input(z.object({
      fileId: z.string(),
      fileKey: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const file = await ctx.db.file.findUnique({
        where: { id: input.fileId },
      });

      if (!file || file.uploadedBy !== ctx.session.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "ファイルが見つかりません",
        });
      }

      const updatedFile = await ctx.db.file.update({
        where: {
          id: input.fileId,
        },
        data: {
          status: "COMPLETED",
          uploadedAt: new Date(),
        },
      });

      // 画像の場合、サムネイル生成
      if (file.fileType.startsWith("image/")) {
        try {
          await this.generateThumbnail(ctx, {
            fileKey: input.fileKey,
            width: 150,
            height: 150,
          });
        } catch (error) {
          console.error("Thumbnail generation failed:", error);
        }
      }

      return updatedFile;
    }),

  // 複数ファイルアップロード
  uploadMultiple: protectedProcedure
    .input(z.object({
      files: z.array(fileUploadSchema).max(10, "一度にアップロードできるファイルは10個までです"),
    }))
    .mutation(async ({ ctx, input }) => {
      const results = [];

      for (const fileData of input.files) {
        const result = await this.getUploadUrl(ctx, { input: fileData });
        results.push(result);
      }

      return results;
    }),

  // 画像処理
  processImage: protectedProcedure
    .input(imageProcessingSchema)
    .mutation(async ({ ctx, input }) => {
      const file = await ctx.db.file.findFirst({
        where: {
          fileKey: input.fileKey,
          uploadedBy: ctx.session.user.id,
        },
      });

      if (!file) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "ファイルが見つかりません",
        });
      }

      if (!file.fileType.startsWith("image/")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "画像ファイルのみ処理可能です",
        });
      }

      // TODO: Sharp画像処理実装
      // const response = await fetch(`https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${input.fileKey}`);
      // const imageBuffer = await response.arrayBuffer();

      // let processedImage = sharp(Buffer.from(imageBuffer));

      // // 画像処理操作を適用
      // for (const operation of input.operations) {
      //   switch (operation.type) {
      //     case 'resize':
      //       processedImage = processedImage.resize(operation.width, operation.height);
      //       break;
      //     case 'crop':
      //       processedImage = processedImage.extract({
      //         left: 0,
      //         top: 0,
      //         width: operation.width!,
      //         height: operation.height!,
      //       });
      //       break;
      //     case 'compress':
      //       processedImage = processedImage.jpeg({ quality: operation.quality || 80 });
      //       break;
      //   }
      // }

      // const processedBuffer = await processedImage.toBuffer();

      // 処理済み画像をS3にアップロード
      const processedKey = `processed/${input.fileKey}`;
      // const putCommand = new PutObjectCommand({
      //   Bucket: process.env.AWS_S3_BUCKET,
      //   Key: processedKey,
      //   Body: processedBuffer,
      //   ContentType: file.fileType,
      // });

      // await s3Client.send(putCommand);

      return {
        originalKey: input.fileKey,
        processedKey,
        processedUrl: `https://mock-s3-bucket.amazonaws.com/${processedKey}`,
      };
    }),

  // サムネイル生成
  generateThumbnail: protectedProcedure
    .input(z.object({
      fileKey: z.string().min(1, "ファイルキーが必要です"),
      width: z.number().int().min(1).max(500).default(150),
      height: z.number().int().min(1).max(500).default(150),
    }))
    .mutation(async ({ ctx, input }) => {
      const file = await ctx.db.file.findFirst({
        where: {
          fileKey: input.fileKey,
          uploadedBy: ctx.session.user.id,
        },
      });

      if (!file || !file.fileType.startsWith("image/")) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "画像ファイルが見つかりません",
        });
      }

      // TODO: Sharp サムネイル生成実装
      // const response = await fetch(`https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${input.fileKey}`);
      // const imageBuffer = await response.arrayBuffer();

      // // サムネイル生成
      // const thumbnailBuffer = await sharp(Buffer.from(imageBuffer))
      //   .resize(input.width, input.height, { fit: 'cover' })
      //   .jpeg({ quality: 70 })
      //   .toBuffer();

      // サムネイルをS3にアップロード
      const thumbnailKey = `thumbnails/${input.fileKey}`;
      // const putCommand = new PutObjectCommand({
      //   Bucket: process.env.AWS_S3_BUCKET,
      //   Key: thumbnailKey,
      //   Body: thumbnailBuffer,
      //   ContentType: 'image/jpeg',
      // });

      // await s3Client.send(putCommand);

      // データベース更新
      await ctx.db.file.update({
        where: { id: file.id },
        data: {
          thumbnailKey,
          hasThumbnail: true,
        },
      });

      return {
        thumbnailKey,
        thumbnailUrl: `https://mock-s3-bucket.amazonaws.com/${thumbnailKey}`,
      };
    }),

  // ファイル削除
  deleteFile: protectedProcedure
    .input(z.object({
      fileId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const file = await ctx.db.file.findFirst({
        where: {
          id: input.fileId,
          uploadedBy: ctx.session.user.id,
        },
      });

      if (!file) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "ファイルが見つかりません",
        });
      }

      // TODO: S3からファイル削除
      // const deleteCommand = new DeleteObjectCommand({
      //   Bucket: process.env.AWS_S3_BUCKET,
      //   Key: file.fileKey,
      // });

      // await s3Client.send(deleteCommand);

      // // サムネイルも削除
      // if (file.thumbnailKey) {
      //   const deleteThumbnailCommand = new DeleteObjectCommand({
      //     Bucket: process.env.AWS_S3_BUCKET,
      //     Key: file.thumbnailKey,
      //   });
      //   await s3Client.send(deleteThumbnailCommand);
      // }

      // データベースから削除
      await ctx.db.file.delete({
        where: { id: input.fileId },
      });

      return { success: true };
    }),

  // ファイル情報取得
  getFileInfo: protectedProcedure
    .input(z.object({
      fileKey: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.db.file.findFirst({
        where: {
          fileKey: input.fileKey,
          OR: [
            { uploadedBy: ctx.session.user.id },
            { isPublic: true },
          ],
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    }),

  // ユーザーファイル一覧取得
  getUserFiles: protectedProcedure
    .input(z.object({
      userId: z.string(),
      category: z.enum(["PROFILE", "SERVICE", "MESSAGE", "DOCUMENT"]).optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      // 自分のファイルまたは管理者のみアクセス可能
      if (ctx.session.user.id !== input.userId && ctx.session.user.userType !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "自分のファイルのみ閲覧できます",
        });
      }

      return ctx.db.file.findMany({
        where: {
          uploadedBy: input.userId,
          ...(input.category && { category: input.category }),
          status: "COMPLETED",
        },
        orderBy: {
          uploadedAt: "desc",
        },
        take: input.limit,
        skip: input.offset,
      });
    }),

  // ファイルURL取得
  getFileUrl: protectedProcedure
    .input(z.object({
      fileKey: z.string(),
      expiresIn: z.number().min(300).max(86400).default(3600), // 5分から24時間
    }))
    .query(async ({ ctx, input }) => {
      const file = await ctx.db.file.findFirst({
        where: {
          fileKey: input.fileKey,
          OR: [
            { uploadedBy: ctx.session.user.id },
            { isPublic: true },
          ],
        },
      });

      if (!file) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "ファイルが見つかりません",
        });
      }

      // TODO: S3 Presigned URL生成
      // const getCommand = new GetObjectCommand({
      //   Bucket: process.env.AWS_S3_BUCKET,
      //   Key: input.fileKey,
      // });

      // const url = await getSignedUrl(s3Client, getCommand, { expiresIn: input.expiresIn });
      const url = `https://mock-s3-bucket.amazonaws.com/${input.fileKey}?expires=${input.expiresIn}`;

      return {
        url,
        expiresAt: new Date(Date.now() + input.expiresIn * 1000),
      };
    }),

  // ファイル統計取得
  getFileStats: protectedProcedure
    .input(z.object({
      userId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      // 自分の統計または管理者のみアクセス可能
      if (ctx.session.user.id !== input.userId && ctx.session.user.userType !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "自分のファイル統計のみ閲覧できます",
        });
      }

      const stats = await ctx.db.file.groupBy({
        by: ["category"],
        where: {
          uploadedBy: input.userId,
          status: "COMPLETED",
        },
        _count: {
          id: true,
        },
        _sum: {
          fileSize: true,
        },
      });

      return stats.map(stat => ({
        category: stat.category,
        count: stat._count.id,
        totalSize: stat._sum.fileSize || 0,
      }));
    }),
});