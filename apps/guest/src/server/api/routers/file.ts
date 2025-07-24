import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import sharp from "sharp";
import { env } from "~/env";

// Cloudflare R2 Client設定
const r2Client = new S3Client({
  region: "auto", // Cloudflare R2では "auto" を使用
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID!,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
  },
});

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

      try {
        // Cloudflare R2 presigned URL生成
        const putObjectCommand = new PutObjectCommand({
          Bucket: env.R2_BUCKET_NAME,
          Key: fileKey,
          ContentType: input.fileType,
          ContentLength: input.fileSize,
          Metadata: {
            userId: ctx.session.user.id,
            category: input.category,
          },
        });

        const uploadUrl = await getSignedUrl(r2Client, putObjectCommand, { expiresIn: 3600 });

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
      } catch (error) {
        console.error("R2 upload URL generation failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "アップロードURLの生成に失敗しました",
        });
      }
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
          await ctx.db.$transaction(async (db) => {
            const router = fileRouter.createCaller(ctx);
            await router.generateThumbnail({
              fileKey: input.fileKey,
              width: 150,
              height: 150,
            });
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
        try {
          const router = fileRouter.createCaller(ctx);
          const result = await router.getUploadUrl(fileData);
          results.push(result);
        } catch (error) {
          console.error("Multiple upload failed for file:", fileData.fileName, error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `ファイル ${fileData.fileName} のアップロードに失敗しました`,
          });
        }
      }

      return results;
    }),

  // 画像処理（省略）
  processImage: protectedProcedure
    .input(imageProcessingSchema)
    .mutation(async ({ ctx, input }) => {
      // 実装は同じなので省略
      throw new TRPCError({
        code: "NOT_IMPLEMENTED",
        message: "画像処理機能は実装予定です",
      });
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

      try {
        // Cloudflare R2から画像を取得
        const getObjectCommand = new GetObjectCommand({
          Bucket: env.R2_BUCKET_NAME,
          Key: input.fileKey,
        });

        const response = await r2Client.send(getObjectCommand);
        const imageBuffer = await response.Body?.transformToByteArray();

        if (!imageBuffer) {
          throw new Error("画像データの取得に失敗しました");
        }

        // サムネイル生成
        const thumbnailBuffer = await sharp(Buffer.from(imageBuffer))
          .resize(input.width, input.height, { fit: 'cover' })
          .jpeg({ quality: 70 })
          .toBuffer();

        // サムネイルをCloudflare R2にアップロード
        const thumbnailKey = `thumbnails/${input.fileKey}`;
        const putCommand = new PutObjectCommand({
          Bucket: env.R2_BUCKET_NAME,
          Key: thumbnailKey,
          Body: thumbnailBuffer,
          ContentType: 'image/jpeg',
        });

        await r2Client.send(putCommand);

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
          thumbnailUrl: `${env.R2_PUBLIC_URL}/${thumbnailKey}`,
        };
      } catch (error) {
        console.error("Thumbnail generation failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "サムネイル生成に失敗しました",
        });
      }
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

      try {
        // Cloudflare R2からファイル削除
        const deleteCommand = new DeleteObjectCommand({
          Bucket: env.R2_BUCKET_NAME,
          Key: file.fileKey,
        });

        await r2Client.send(deleteCommand);

        // サムネイルも削除
        if (file.thumbnailKey) {
          const deleteThumbnailCommand = new DeleteObjectCommand({
            Bucket: env.R2_BUCKET_NAME,
            Key: file.thumbnailKey,
          });
          await r2Client.send(deleteThumbnailCommand);
        }

        // データベースから削除
        await ctx.db.file.delete({
          where: { id: input.fileId },
        });

        return { success: true };
      } catch (error) {
        console.error("File deletion failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "ファイル削除に失敗しました",
        });
      }
    }),

  // ファイルURL取得（その他のメソッドも省略）
  getFileUrl: protectedProcedure
    .input(z.object({
      fileKey: z.string(),
      expiresIn: z.number().min(300).max(86400).default(3600),
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

      try {
        // Cloudflare R2 Presigned URL生成
        const getCommand = new GetObjectCommand({
          Bucket: env.R2_BUCKET_NAME,
          Key: input.fileKey,
        });

        const url = await getSignedUrl(r2Client, getCommand, { expiresIn: input.expiresIn });

        return {
          url,
          expiresAt: new Date(Date.now() + input.expiresIn * 1000),
        };
      } catch (error) {
        console.error("Presigned URL generation failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "ファイルURLの生成に失敗しました",
        });
      }
    }),
}); 