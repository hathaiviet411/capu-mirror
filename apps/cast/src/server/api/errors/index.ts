import { TRPCError } from "@trpc/server";

// エラーコード定義
export const ERROR_CODES = {
  // 認証・認可エラー
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  
  // リソースエラー
  NOT_FOUND: "NOT_FOUND",
  ALREADY_EXISTS: "ALREADY_EXISTS",
  RESOURCE_CONFLICT: "CONFLICT",
  
  // バリデーションエラー
  VALIDATION_ERROR: "BAD_REQUEST",
  INVALID_INPUT: "BAD_REQUEST",
  MISSING_REQUIRED_FIELD: "BAD_REQUEST",
  
  // ビジネスロジックエラー
  BOOKING_CONFLICT: "CONFLICT",
  INSUFFICIENT_BALANCE: "BAD_REQUEST",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  CAST_NOT_AVAILABLE: "CONFLICT",
  PAYMENT_FAILED: "BAD_REQUEST",
  
  // サーバーエラー
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  DATABASE_ERROR: "INTERNAL_SERVER_ERROR",
  EXTERNAL_SERVICE_ERROR: "INTERNAL_SERVER_ERROR",
  
  // レート制限
  TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",
} as const;

// エラーメッセージ定義
export const ERROR_MESSAGES = {
  // 認証・認可
  UNAUTHORIZED: "認証が必要です。ログインしてください。",
  FORBIDDEN: "この操作を実行する権限がありません。",
  TOKEN_EXPIRED: "認証トークンが期限切れです。再度ログインしてください。",
  INVALID_CREDENTIALS: "メールアドレスまたはパスワードが正しくありません。",
  
  // ユーザー関連
  USER_NOT_FOUND: "ユーザーが見つかりません。",
  USER_ALREADY_EXISTS: "このメールアドレスは既に登録されています。",
  USER_NOT_ACTIVE: "このアカウントは無効化されています。",
  
  // キャスト関連
  CAST_NOT_FOUND: "キャストが見つかりません。",
  CAST_PROFILE_NOT_FOUND: "キャストプロフィールが見つかりません。",
  CAST_NOT_ACTIVE: "このキャストは現在利用できません。",
  CAST_NOT_AVAILABLE: "指定された日時でキャストは利用できません。",
  
  // ゲスト関連
  GUEST_NOT_FOUND: "ゲストが見つかりません。",
  GUEST_PROFILE_NOT_FOUND: "ゲストプロフィールが見つかりません。",
  
  // 予約関連
  BOOKING_NOT_FOUND: "予約が見つかりません。",
  BOOKING_CONFLICT: "指定された時間は既に予約されています。",
  BOOKING_CANCELLED: "この予約はキャンセルされています。",
  BOOKING_COMPLETED: "この予約は既に完了しています。",
  BOOKING_IN_PAST: "過去の日時で予約はできません。",
  BOOKING_TOO_FAR_AHEAD: "予約は最大3ヶ月先まで可能です。",
  
  // メッセージ関連
  MESSAGE_NOT_FOUND: "メッセージが見つかりません。",
  CHAT_ROOM_NOT_FOUND: "チャットルームが見つかりません。",
  MESSAGE_TOO_LONG: "メッセージが長すぎます。",
  
  // 決済関連
  PAYMENT_NOT_FOUND: "決済情報が見つかりません。",
  PAYMENT_FAILED: "決済処理に失敗しました。カード情報を確認してください。",
  PAYMENT_ALREADY_PROCESSED: "この決済は既に処理されています。",
  INSUFFICIENT_BALANCE: "残高が不足しています。",
  REFUND_NOT_ALLOWED: "この決済は返金できません。",
  REFUND_AMOUNT_INVALID: "返金額が正しくありません。",
  
  // ファイル関連
  FILE_NOT_FOUND: "ファイルが見つかりません。",
  FILE_TOO_LARGE: "ファイルサイズが制限を超えています。",
  UNSUPPORTED_FILE_TYPE: "サポートされていないファイル形式です。",
  UPLOAD_FAILED: "ファイルのアップロードに失敗しました。",
  
  // 通知関連
  NOTIFICATION_NOT_FOUND: "通知が見つかりません。",
  DEVICE_NOT_FOUND: "デバイスが見つかりません。",
  PUSH_NOTIFICATION_FAILED: "プッシュ通知の送信に失敗しました。",
  
  // レビュー関連
  REVIEW_NOT_FOUND: "レビューが見つかりません。",
  REVIEW_ALREADY_EXISTS: "この予約に対するレビューは既に存在します。",
  REVIEW_NOT_ALLOWED: "この予約にはレビューを投稿できません。",
  
  // バリデーション
  VALIDATION_ERROR: "入力データが正しくありません。",
  REQUIRED_FIELD_MISSING: "必須フィールドが入力されていません。",
  INVALID_EMAIL_FORMAT: "正しいメールアドレス形式で入力してください。",
  INVALID_PHONE_FORMAT: "正しい電話番号形式で入力してください。",
  INVALID_DATE_FORMAT: "正しい日付形式で入力してください。",
  INVALID_TIME_FORMAT: "正しい時刻形式で入力してください。",
  
  // システム
  INTERNAL_ERROR: "システムエラーが発生しました。しばらく時間をおいて再度お試しください。",
  DATABASE_ERROR: "データベースエラーが発生しました。",
  EXTERNAL_SERVICE_ERROR: "外部サービスとの通信エラーが発生しました。",
  SERVICE_UNAVAILABLE: "サービスが一時的に利用できません。",
  TOO_MANY_REQUESTS: "リクエストが多すぎます。しばらく時間をおいて再度お試しください。",
} as const;

// カスタムエラークラス
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    statusCode: number = 500,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

// エラーファクトリー関数
export const createError = {
  // 認証・認可エラー
  unauthorized: (message?: string) => 
    new TRPCError({
      code: "UNAUTHORIZED",
      message: message || ERROR_MESSAGES.UNAUTHORIZED,
    }),

  forbidden: (message?: string) =>
    new TRPCError({
      code: "FORBIDDEN", 
      message: message || ERROR_MESSAGES.FORBIDDEN,
    }),

  tokenExpired: () =>
    new TRPCError({
      code: "UNAUTHORIZED",
      message: ERROR_MESSAGES.TOKEN_EXPIRED,
    }),

  invalidCredentials: () =>
    new TRPCError({
      code: "UNAUTHORIZED",
      message: ERROR_MESSAGES.INVALID_CREDENTIALS,
    }),

  // リソースエラー
  notFound: (resource: string = "リソース") =>
    new TRPCError({
      code: "NOT_FOUND",
      message: `${resource}が見つかりません。`,
    }),

  userNotFound: () =>
    new TRPCError({
      code: "NOT_FOUND",
      message: ERROR_MESSAGES.USER_NOT_FOUND,
    }),

  castNotFound: () =>
    new TRPCError({
      code: "NOT_FOUND",
      message: ERROR_MESSAGES.CAST_NOT_FOUND,
    }),

  guestNotFound: () =>
    new TRPCError({
      code: "NOT_FOUND",
      message: ERROR_MESSAGES.GUEST_NOT_FOUND,
    }),

  bookingNotFound: () =>
    new TRPCError({
      code: "NOT_FOUND",
      message: ERROR_MESSAGES.BOOKING_NOT_FOUND,
    }),

  messageNotFound: () =>
    new TRPCError({
      code: "NOT_FOUND",
      message: ERROR_MESSAGES.MESSAGE_NOT_FOUND,
    }),

  paymentNotFound: () =>
    new TRPCError({
      code: "NOT_FOUND",
      message: ERROR_MESSAGES.PAYMENT_NOT_FOUND,
    }),

  fileNotFound: () =>
    new TRPCError({
      code: "NOT_FOUND",
      message: ERROR_MESSAGES.FILE_NOT_FOUND,
    }),

  notificationNotFound: () =>
    new TRPCError({
      code: "NOT_FOUND",
      message: ERROR_MESSAGES.NOTIFICATION_NOT_FOUND,
    }),

  reviewNotFound: () =>
    new TRPCError({
      code: "NOT_FOUND",
      message: ERROR_MESSAGES.REVIEW_NOT_FOUND,
    }),

  // 競合エラー
  conflict: (message: string) =>
    new TRPCError({
      code: "CONFLICT",
      message,
    }),

  userAlreadyExists: () =>
    new TRPCError({
      code: "CONFLICT",
      message: ERROR_MESSAGES.USER_ALREADY_EXISTS,
    }),

  bookingConflict: () =>
    new TRPCError({
      code: "CONFLICT",
      message: ERROR_MESSAGES.BOOKING_CONFLICT,
    }),

  castNotAvailable: () =>
    new TRPCError({
      code: "CONFLICT",
      message: ERROR_MESSAGES.CAST_NOT_AVAILABLE,
    }),

  reviewAlreadyExists: () =>
    new TRPCError({
      code: "CONFLICT",
      message: ERROR_MESSAGES.REVIEW_ALREADY_EXISTS,
    }),

  // バリデーションエラー
  badRequest: (message: string) =>
    new TRPCError({
      code: "BAD_REQUEST",
      message,
    }),

  validationError: (message?: string) =>
    new TRPCError({
      code: "BAD_REQUEST",
      message: message || ERROR_MESSAGES.VALIDATION_ERROR,
    }),

  invalidInput: (field: string) =>
    new TRPCError({
      code: "BAD_REQUEST",
      message: `${field}の形式が正しくありません。`,
    }),

  requiredField: (field: string) =>
    new TRPCError({
      code: "BAD_REQUEST",
      message: `${field}は必須項目です。`,
    }),

  // ビジネスロジックエラー
  bookingInPast: () =>
    new TRPCError({
      code: "BAD_REQUEST",
      message: ERROR_MESSAGES.BOOKING_IN_PAST,
    }),

  bookingTooFarAhead: () =>
    new TRPCError({
      code: "BAD_REQUEST",
      message: ERROR_MESSAGES.BOOKING_TOO_FAR_AHEAD,
    }),

  paymentFailed: (reason?: string) =>
    new TRPCError({
      code: "BAD_REQUEST",
      message: reason || ERROR_MESSAGES.PAYMENT_FAILED,
    }),

  insufficientBalance: () =>
    new TRPCError({
      code: "BAD_REQUEST",
      message: ERROR_MESSAGES.INSUFFICIENT_BALANCE,
    }),

  fileTooLarge: (maxSize: string) =>
    new TRPCError({
      code: "BAD_REQUEST",
      message: `ファイルサイズは${maxSize}以下である必要があります。`,
    }),

  unsupportedFileType: (supportedTypes: string[]) =>
    new TRPCError({
      code: "BAD_REQUEST",
      message: `サポートされているファイル形式: ${supportedTypes.join(", ")}`,
    }),

  // サーバーエラー
  internalError: (message?: string) =>
    new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: message || ERROR_MESSAGES.INTERNAL_ERROR,
    }),

  databaseError: (operation?: string) =>
    new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: operation ? `データベース操作(${operation})でエラーが発生しました。` : ERROR_MESSAGES.DATABASE_ERROR,
    }),

  externalServiceError: (service?: string) =>
    new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: service ? `${service}との通信でエラーが発生しました。` : ERROR_MESSAGES.EXTERNAL_SERVICE_ERROR,
    }),

  // レート制限
  tooManyRequests: () =>
    new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: ERROR_MESSAGES.TOO_MANY_REQUESTS,
    }),
};

// エラーハンドリングユーティリティ
export const handleDatabaseError = (error: unknown, operation: string = "データベース操作") => {
  console.error(`Database error in ${operation}:`, error);
  
  if (error instanceof Error) {
    // 特定のPrismaエラーを処理
    if (error.message.includes("Unique constraint failed")) {
      throw createError.conflict("既に存在するデータです。");
    }
    
    if (error.message.includes("Foreign key constraint failed")) {
      throw createError.badRequest("関連するデータが見つかりません。");
    }
    
    if (error.message.includes("Record to delete does not exist")) {
      throw createError.notFound();
    }
  }
  
  throw createError.databaseError(operation);
};

export const handleExternalServiceError = (error: unknown, service: string) => {
  console.error(`External service error (${service}):`, error);
  throw createError.externalServiceError(service);
};

// エラーログ関数
export const logError = (error: unknown, context: string) => {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    context,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error,
  };
  
  console.error("Application Error:", JSON.stringify(errorInfo, null, 2));
};

// バリデーションエラーハンドリング
export const handleValidationError = (error: unknown) => {
  if (error && typeof error === 'object' && 'issues' in error) {
    const zodError = error as { issues: Array<{ path: string[]; message: string }> };
    const messages = zodError.issues.map(issue => 
      `${issue.path.join('.')}: ${issue.message}`
    );
    throw createError.validationError(`入力エラー: ${messages.join(', ')}`);
  }
  throw createError.validationError();
};

// 権限チェックヘルパー
export const checkOwnership = (
  resourceUserId: string,
  currentUserId: string,
  userType?: string,
  resourceName: string = "このリソース"
) => {
  if (resourceUserId !== currentUserId && userType !== "ADMIN") {
    throw createError.forbidden(`${resourceName}にアクセスする権限がありません。`);
  }
};

export const checkAdminPermission = (userType?: string) => {
  if (userType !== "ADMIN") {
    throw createError.forbidden("管理者権限が必要です。");
  }
};

// 日付バリデーションヘルパー
export const validateBookingDate = (date: Date) => {
  const now = new Date();
  const maxBookingDate = new Date();
  maxBookingDate.setMonth(now.getMonth() + 3); // 3ヶ月後まで

  if (date < now) {
    throw createError.bookingInPast();
  }

  if (date > maxBookingDate) {
    throw createError.bookingTooFarAhead();
  }
};

// ファイルバリデーションヘルパー
export const validateFileUpload = (
  fileType: string,
  fileSize: number,
  allowedTypes: string[],
  maxSize: number
) => {
  if (!allowedTypes.includes(fileType)) {
    throw createError.unsupportedFileType(allowedTypes);
  }

  if (fileSize > maxSize) {
    const maxSizeStr = maxSize > 1024 * 1024 
      ? `${Math.round(maxSize / (1024 * 1024))}MB`
      : `${Math.round(maxSize / 1024)}KB`;
    throw createError.fileTooLarge(maxSizeStr);
  }
};