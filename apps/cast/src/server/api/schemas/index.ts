import { z } from "zod";

// 基本的なバリデーション
export const idSchema = z.string().cuid("正しいIDフォーマットを入力してください");
export const emailSchema = z.string().email("正しいメールアドレスを入力してください");
export const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, "正しい電話番号を入力してください");
export const urlSchema = z.string().url("正しいURL形式を入力してください");

// 共通ペジネーション
export const paginationSchema = z.object({
  page: z.number().int().min(1, "ページ番号は1以上である必要があります").default(1),
  limit: z.number().int().min(1, "表示件数は1以上である必要があります").max(100, "表示件数は100以下である必要があります").default(20),
});

// 共通ソート
export const sortSchema = z.object({
  field: z.string().min(1, "ソートフィールドを指定してください"),
  order: z.enum(["asc", "desc"], { invalid_type_error: "ソート順序はascまたはdescである必要があります" }).default("desc"),
});

// 日付範囲
export const dateRangeSchema = z.object({
  startDate: z.date({ invalid_type_error: "開始日は正しい日付である必要があります" }),
  endDate: z.date({ invalid_type_error: "終了日は正しい日付である必要があります" }),
}).refine(
  (data) => data.endDate >= data.startDate,
  { message: "終了日は開始日以降である必要があります", path: ["endDate"] }
);

// ユーザー関連スキーマ
export const userCreateSchema = z.object({
  name: z.string().min(1, "名前を入力してください").max(100, "名前は100文字以下で入力してください"),
  email: emailSchema,
  password: z.string().min(8, "パスワードは8文字以上で入力してください").max(128, "パスワードは128文字以下で入力してください"),
  userType: z.enum(["GUEST", "CAST", "ADMIN"], { invalid_type_error: "ユーザータイプが正しくありません" }),
  phone: phoneSchema.optional(),
  image: urlSchema.optional(),
});

export const userUpdateSchema = z.object({
  name: z.string().min(1, "名前を入力してください").max(100, "名前は100文字以下で入力してください").optional(),
  phone: phoneSchema.optional(),
  image: urlSchema.optional(),
  bio: z.string().max(1000, "自己紹介は1000文字以下で入力してください").optional(),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "現在のパスワードを入力してください"),
  newPassword: z.string().min(8, "新しいパスワードは8文字以上で入力してください").max(128, "新しいパスワードは128文字以下で入力してください"),
  confirmPassword: z.string().min(1, "確認パスワードを入力してください"),
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  { message: "新しいパスワードと確認パスワードが一致しません", path: ["confirmPassword"] }
);

// キャスト関連スキーマ
export const castProfileSchema = z.object({
  displayName: z.string().min(1, "表示名を入力してください").max(100, "表示名は100文字以下で入力してください"),
  bio: z.string().max(2000, "自己紹介は2000文字以下で入力してください").optional(),
  location: z.string().min(1, "所在地を入力してください").max(200, "所在地は200文字以下で入力してください"),
  age: z.number().int().min(18, "年齢は18歳以上である必要があります").max(99, "年齢は99歳以下で入力してください"),
  height: z.number().int().min(140, "身長は140cm以上で入力してください").max(200, "身長は200cm以下で入力してください").optional(),
  weight: z.number().int().min(30, "体重は30kg以上で入力してください").max(150, "体重は150kg以下で入力してください").optional(),
  languages: z.array(z.string().min(1, "言語名を入力してください")).max(10, "言語は10個まで登録できます").default([]),
  services: z.array(z.string().min(1, "サービス名を入力してください")).min(1, "最低1つのサービスを登録してください").max(20, "サービスは20個まで登録できます"),
  tags: z.array(z.string().min(1, "タグを入力してください")).max(30, "タグは30個まで登録できます").default([]),
  pricing: z.object({
    basePrice: z.number().min(0, "基本料金は0以上である必要があります").max(1000000, "基本料金は100万円以下で入力してください"),
    hourlyRate: z.number().min(0, "時間料金は0以上である必要があります").max(100000, "時間料金は10万円以下で入力してください"),
    packagePrices: z.array(z.object({
      name: z.string().min(1, "パッケージ名を入力してください").max(50, "パッケージ名は50文字以下で入力してください"),
      price: z.number().min(0, "価格は0以上である必要があります").max(1000000, "価格は100万円以下で入力してください"),
      duration: z.number().int().min(1, "時間は1分以上である必要があります").max(1440, "時間は24時間以下で入力してください"), // 分単位
      description: z.string().max(500, "説明は500文字以下で入力してください").optional(),
    })).max(5, "パッケージは5個まで登録できます").optional(),
  }),
  schedule: z.object({
    timezone: z.string().min(1, "タイムゾーンを指定してください").default("Asia/Tokyo"),
    availableDays: z.array(z.number().int().min(0, "曜日は0-6の範囲で指定してください").max(6, "曜日は0-6の範囲で指定してください")).min(1, "最低1日は利用可能日を設定してください"),
    availableHours: z.object({
      start: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "正しい時刻フォーマット(HH:MM)を入力してください"),
      end: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "正しい時刻フォーマット(HH:MM)を入力してください"),
    }),
    holidays: z.array(z.date()).optional(),
  }),
  images: z.array(z.string().url("正しいURL形式を入力してください")).max(10, "画像は10枚まで登録できます").default([]),
  isOnline: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const castSearchFiltersSchema = z.object({
  location: z.object({
    lat: z.number().min(-90, "緯度は-90以上である必要があります").max(90, "緯度は90以下である必要があります"),
    lng: z.number().min(-180, "経度は-180以上である必要があります").max(180, "経度は180以下である必要があります"),
    radius: z.number().min(1, "検索範囲は1km以上である必要があります").max(100, "検索範囲は100km以下である必要があります").default(10),
  }).optional(),
  priceRange: z.object({
    min: z.number().min(0, "最小価格は0以上である必要があります"),
    max: z.number().min(0, "最大価格は0以上である必要があります"),
  }).refine(data => data.max >= data.min, { message: "最大価格は最小価格以上である必要があります" }).optional(),
  age: z.object({
    min: z.number().int().min(18, "最小年齢は18歳以上である必要があります"),
    max: z.number().int().max(99, "最大年齢は99歳以下である必要があります"),
  }).refine(data => data.max >= data.min, { message: "最大年齢は最小年齢以上である必要があります" }).optional(),
  services: z.array(z.string().min(1, "サービス名を入力してください")).max(10, "サービスは10個まで選択できます").optional(),
  tags: z.array(z.string().min(1, "タグを入力してください")).max(10, "タグは10個まで選択できます").optional(),
  rating: z.object({
    min: z.number().min(1, "評価は1以上である必要があります").max(5, "評価は5以下である必要があります"),
  }).optional(),
  availability: z.object({
    date: z.date(),
    startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "正しい時刻フォーマット(HH:MM)を入力してください"),
    endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "正しい時刻フォーマット(HH:MM)を入力してください"),
  }).optional(),
  isOnline: z.boolean().optional(),
});

// ゲスト関連スキーマ
export const guestProfileSchema = z.object({
  displayName: z.string().min(1, "表示名を入力してください").max(100, "表示名は100文字以下で入力してください").optional(),
  bio: z.string().max(1000, "自己紹介は1000文字以下で入力してください").optional(),
  age: z.number().int().min(18, "年齢は18歳以上である必要があります").max(99, "年齢は99歳以下で入力してください").optional(),
  location: z.string().max(200, "所在地は200文字以下で入力してください").optional(),
  interests: z.array(z.string().min(1, "興味を入力してください")).max(20, "興味は20個まで登録できます").default([]),
  preferences: z.object({
    ageRange: z.object({
      min: z.number().int().min(18, "最小年齢は18歳以上である必要があります"),
      max: z.number().int().max(99, "最大年齢は99歳以下である必要があります"),
    }).refine(data => data.max >= data.min, { message: "最大年齢は最小年齢以上である必要があります" }).optional(),
    maxDistance: z.number().min(1, "最大距離は1km以上である必要があります").max(100, "最大距離は100km以下である必要があります").optional(),
    priceRange: z.object({
      min: z.number().min(0, "最小価格は0以上である必要があります"),
      max: z.number().min(0, "最大価格は0以上である必要があります"),
    }).refine(data => data.max >= data.min, { message: "最大価格は最小価格以上である必要があります" }).optional(),
    preferredServices: z.array(z.string().min(1, "サービス名を入力してください")).max(10, "サービスは10個まで選択できます").optional(),
  }).optional(),
  isVerified: z.boolean().default(false),
});

// 予約関連スキーマ
export const bookingCreateSchema = z.object({
  castId: idSchema,
  date: z.date({ invalid_type_error: "予約日は正しい日付である必要があります" }),
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "正しい時刻フォーマット(HH:MM)を入力してください"),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "正しい時刻フォーマット(HH:MM)を入力してください"),
  packageId: z.string().optional(),
  customPrice: z.number().min(0, "カスタム価格は0以上である必要があります").max(1000000, "カスタム価格は100万円以下で入力してください").optional(),
  notes: z.string().max(1000, "メモは1000文字以下で入力してください").optional(),
  location: z.string().max(500, "場所は500文字以下で入力してください").optional(),
  isOnline: z.boolean().default(false),
});

export const bookingUpdateSchema = z.object({
  date: z.date().optional(),
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "正しい時刻フォーマット(HH:MM)を入力してください").optional(),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "正しい時刻フォーマット(HH:MM)を入力してください").optional(),
  notes: z.string().max(1000, "メモは1000文字以下で入力してください").optional(),
  location: z.string().max(500, "場所は500文字以下で入力してください").optional(),
  status: z.enum(["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"], {
    invalid_type_error: "正しいステータスを選択してください"
  }).optional(),
});

// メッセージ関連スキーマ
export const messageCreateSchema = z.object({
  bookingId: idSchema,
  content: z.string().min(1, "メッセージを入力してください").max(2000, "メッセージは2000文字以下で入力してください"),
  messageType: z.enum(["TEXT", "IMAGE", "FILE", "SYSTEM"], {
    invalid_type_error: "正しいメッセージタイプを選択してください"
  }).default("TEXT"),
  attachmentUrl: urlSchema.optional(),
});

// 決済関連スキーマ
export const paymentIntentSchema = z.object({
  bookingId: idSchema,
  amount: z.number().int().min(100, "金額は100円以上である必要があります").max(1000000, "金額は100万円以下である必要があります"),
  currency: z.string().length(3, "通貨コードは3文字である必要があります").default("jpy"),
  description: z.string().max(500, "説明は500文字以下で入力してください").optional(),
});

export const refundRequestSchema = z.object({
  paymentId: idSchema,
  amount: z.number().int().min(100, "返金額は100円以上である必要があります"),
  reason: z.string().min(1, "返金理由を入力してください").max(1000, "返金理由は1000文字以下で入力してください"),
});

// 通知関連スキーマ
export const notificationCreateSchema = z.object({
  userId: idSchema,
  type: z.enum(["BOOKING", "MESSAGE", "PAYMENT", "REVIEW", "SYSTEM"], {
    invalid_type_error: "正しい通知タイプを選択してください"
  }),
  title: z.string().min(1, "タイトルを入力してください").max(100, "タイトルは100文字以下で入力してください"),
  body: z.string().min(1, "メッセージを入力してください").max(500, "メッセージは500文字以下で入力してください"),
  data: z.record(z.string()).optional(),
  actionUrl: urlSchema.optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH"], {
    invalid_type_error: "正しい優先度を選択してください"
  }).default("NORMAL"),
  scheduledAt: z.date().optional(),
});

export const deviceRegistrationSchema = z.object({
  userId: idSchema,
  deviceId: z.string().min(1, "デバイスIDを入力してください").max(255, "デバイスIDは255文字以下で入力してください"),
  fcmToken: z.string().min(1, "FCMトークンを入力してください").max(1000, "FCMトークンは1000文字以下で入力してください"),
  platform: z.enum(["IOS", "ANDROID", "WEB"], {
    invalid_type_error: "正しいプラットフォームを選択してください"
  }),
});

// ファイル関連スキーマ
export const fileUploadSchema = z.object({
  fileName: z.string().min(1, "ファイル名を入力してください").max(255, "ファイル名は255文字以下で入力してください"),
  fileType: z.string().min(1, "ファイル形式を指定してください").max(100, "ファイル形式は100文字以下で入力してください"),
  fileSize: z.number().int().min(1, "ファイルサイズは1バイト以上である必要があります").max(10 * 1024 * 1024, "ファイルサイズは10MB以下である必要があります"),
  category: z.enum(["PROFILE", "SERVICE", "MESSAGE", "DOCUMENT"], {
    invalid_type_error: "正しいカテゴリを選択してください"
  }),
  isPublic: z.boolean().default(false),
});

export const imageProcessingSchema = z.object({
  fileKey: z.string().min(1, "ファイルキーが必要です").max(500, "ファイルキーは500文字以下で入力してください"),
  operations: z.array(z.object({
    type: z.enum(["resize", "crop", "compress"], {
      invalid_type_error: "正しい操作タイプを選択してください"
    }),
    width: z.number().int().min(1, "幅は1以上である必要があります").max(4000, "幅は4000以下である必要があります").optional(),
    height: z.number().int().min(1, "高さは1以上である必要があります").max(4000, "高さは4000以下である必要があります").optional(),
    quality: z.number().int().min(1, "品質は1以上である必要があります").max(100, "品質は100以下である必要があります").optional(),
  })).min(1, "最低1つの操作が必要です").max(10, "操作は10個まで指定できます"),
});

// 検索関連スキーマ
export const searchSchema = z.object({
  query: z.string().max(200, "検索キーワードは200文字以下で入力してください").optional(),
  filters: z.object({
    location: z.object({
      lat: z.number().min(-90, "緯度は-90以上である必要があります").max(90, "緯度は90以下である必要があります"),
      lng: z.number().min(-180, "経度は-180以上である必要があります").max(180, "経度は180以下である必要があります"),
      radius: z.number().min(1, "検索範囲は1km以上である必要があります").max(100, "検索範囲は100km以下である必要があります").default(10),
    }).optional(),
    priceRange: z.object({
      min: z.number().min(0, "最小価格は0以上である必要があります"),
      max: z.number().min(0, "最大価格は0以上である必要があります"),
    }).refine(data => data.max >= data.min, { message: "最大価格は最小価格以上である必要があります" }).optional(),
    age: z.object({
      min: z.number().int().min(18, "最小年齢は18歳以上である必要があります"),
      max: z.number().int().max(99, "最大年齢は99歳以下である必要があります"),
    }).refine(data => data.max >= data.min, { message: "最大年齢は最小年齢以上である必要があります" }).optional(),
    services: z.array(z.string().min(1, "サービス名を入力してください")).max(10, "サービスは10個まで選択できます").optional(),
    tags: z.array(z.string().min(1, "タグを入力してください")).max(10, "タグは10個まで選択できます").optional(),
    rating: z.object({
      min: z.number().min(1, "評価は1以上である必要があります").max(5, "評価は5以下である必要があります"),
    }).optional(),
    availability: z.object({
      date: z.date(),
      startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "正しい時刻フォーマット(HH:MM)を入力してください"),
      endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "正しい時刻フォーマット(HH:MM)を入力してください"),
    }).optional(),
    isOnline: z.boolean().optional(),
  }).optional(),
  sort: z.object({
    field: z.enum(["relevance", "price", "rating", "distance", "created_at"], {
      invalid_type_error: "正しいソートフィールドを選択してください"
    }).default("relevance"),
    order: z.enum(["asc", "desc"], {
      invalid_type_error: "正しいソート順序を選択してください"
    }).default("desc"),
  }).optional(),
  pagination: paginationSchema.optional(),
});

// アナリティクス関連スキーマ
export const analyticsBaseSchema = z.object({
  dateRange: dateRangeSchema,
  granularity: z.enum(["day", "week", "month"], {
    invalid_type_error: "正しい粒度を選択してください"
  }).default("day"),
});

export const reportGenerateSchema = z.object({
  type: z.enum(["REVENUE", "USER_ACTIVITY", "BOOKING_ANALYSIS"], {
    invalid_type_error: "正しいレポートタイプを選択してください"
  }),
  dateRange: dateRangeSchema,
  format: z.enum(["JSON", "CSV", "PDF"], {
    invalid_type_error: "正しいフォーマットを選択してください"
  }).default("JSON"),
  castId: idSchema.optional(),
});

// レビュー関連スキーマ
export const reviewCreateSchema = z.object({
  bookingId: idSchema,
  rating: z.number().int().min(1, "評価は1以上である必要があります").max(5, "評価は5以下である必要があります"),
  comment: z.string().min(1, "コメントを入力してください").max(2000, "コメントは2000文字以下で入力してください"),
  isAnonymous: z.boolean().default(false),
});

export const reviewUpdateSchema = z.object({
  rating: z.number().int().min(1, "評価は1以上である必要があります").max(5, "評価は5以下である必要があります").optional(),
  comment: z.string().min(1, "コメントを入力してください").max(2000, "コメントは2000文字以下で入力してください").optional(),
  isAnonymous: z.boolean().optional(),
});