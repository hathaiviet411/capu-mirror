import type { z } from "zod";
import type { 
  User, 
  CastProfile, 
  GuestProfile, 
  Booking, 
  Message, 
  Payment, 
  Notification,
  File,
  Review,
  SearchHistory,
  Report,
  ChatRoom,
  UserDevice,
  NotificationSettings
} from "@prisma/client";
import type {
  userCreateSchema,
  userUpdateSchema,
  castProfileSchema,
  guestProfileSchema,
  bookingCreateSchema,
  messageCreateSchema,
  paymentIntentSchema,
  notificationCreateSchema,
  fileUploadSchema,
  searchSchema,
  analyticsBaseSchema,
  reviewCreateSchema,
} from "../schemas";

// 基本型定義
export type ID = string;
export type Timestamp = Date;
export type Email = string;
export type URL = string;

// Zodスキーマから型を生成
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type CastProfileInput = z.infer<typeof castProfileSchema>;
export type GuestProfileInput = z.infer<typeof guestProfileSchema>;
export type BookingCreateInput = z.infer<typeof bookingCreateSchema>;
export type MessageCreateInput = z.infer<typeof messageCreateSchema>;
export type PaymentIntentInput = z.infer<typeof paymentIntentSchema>;
export type NotificationCreateInput = z.infer<typeof notificationCreateSchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type AnalyticsBaseInput = z.infer<typeof analyticsBaseSchema>;
export type ReviewCreateInput = z.infer<typeof reviewCreateSchema>;

// ユーザー関連型
export type UserType = "GUEST" | "CAST" | "ADMIN";

export interface UserWithProfile extends User {
  castProfile?: CastProfile | null;
  guestProfile?: GuestProfile | null;
}

export interface UserSafe {
  id: string;
  name: string | null;
  email: string;
  userType: UserType;
  image: string | null;
  phone: string | null;
  bio: string | null;
  points: number;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}

// キャスト関連型
export interface CastPricing {
  basePrice: number;
  hourlyRate: number;
  packagePrices?: {
    name: string;
    price: number;
    duration: number;
    description?: string;
  }[];
}

export interface CastSchedule {
  timezone: string;
  availableDays: number[];
  availableHours: {
    start: string;
    end: string;
  };
  holidays?: Date[];
}

export interface CastProfileWithDetails extends CastProfile {
  user: UserSafe;
  reviews: Pick<Review, "rating">[];
  _count: {
    reviews: number;
    bookings: number;
  };
  averageRating: number;
  reviewCount: number;
  bookingCount: number;
  pricing: CastPricing;
  schedule: CastSchedule;
}

export interface CastSearchResult {
  id: string;
  displayName: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  location: string;
  age: number;
  pricing: CastPricing;
  images: string[];
  services: string[];
  tags: string[];
  averageRating: number;
  reviewCount: number;
  bookingCount: number;
  isOnline: boolean;
  isActive: boolean;
}

// ゲスト関連型
export interface GuestPreferences {
  ageRange?: {
    min: number;
    max: number;
  };
  maxDistance?: number;
  priceRange?: {
    min: number;
    max: number;
  };
  preferredServices?: string[];
}

export interface GuestProfileWithDetails extends GuestProfile {
  user: UserSafe;
  preferences: GuestPreferences;
}

// 予約関連型
export type BookingStatus = "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface BookingWithDetails extends Booking {
  cast: CastProfileWithDetails;
  guest: UserSafe;
  messages: Message[];
  payment?: Payment | null;
  review?: Review | null;
}

export interface BookingSummary {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  totalAmount: number;
  cast: {
    id: string;
    displayName: string;
    user: {
      name: string | null;
      image: string | null;
    };
  };
  guest: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

// メッセージ関連型
export type MessageType = "TEXT" | "IMAGE" | "FILE" | "SYSTEM";

export interface MessageWithSender extends Message {
  sender: UserSafe;
  booking: {
    id: string;
    cast: {
      user: UserSafe;
    };
    guest: UserSafe;
  };
}

export interface ChatRoomWithDetails extends ChatRoom {
  booking: BookingWithDetails;
  messages: MessageWithSender[];
  lastMessage: MessageWithSender | null;
  unreadCount: number;
}

// 決済関連型
export type PaymentStatus = "PENDING" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "CANCELLED" | "REFUNDED";
export type PaymentMethod = "CARD" | "BANK_TRANSFER" | "WALLET";

export interface PaymentWithDetails extends Payment {
  booking: BookingWithDetails;
}

export interface PaymentSummary {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  createdAt: Date;
  booking: {
    id: string;
    date: Date;
    cast: {
      displayName: string;
    };
  };
}

// 通知関連型
export type NotificationType = "BOOKING" | "MESSAGE" | "PAYMENT" | "REVIEW" | "SYSTEM";
export type NotificationPriority = "LOW" | "NORMAL" | "HIGH";
export type DevicePlatform = "IOS" | "ANDROID" | "WEB";

export interface NotificationWithUser extends Notification {
  user: UserSafe;
  data: Record<string, string> | null;
}

export interface NotificationSettings {
  bookingNotifications: boolean;
  messageNotifications: boolean;
  paymentNotifications: boolean;
  reviewNotifications: boolean;
  systemNotifications: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
}

// ファイル関連型
export type FileCategory = "PROFILE" | "SERVICE" | "MESSAGE" | "DOCUMENT";
export type FileStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface FileWithUser extends File {
  user: UserSafe;
}

export interface FileUploadResponse {
  uploadUrl: string;
  fileKey: string;
  fileId: string;
}

export interface FileProcessingResult {
  originalKey: string;
  processedKey: string;
  processedUrl: string;
}

// 検索関連型
export interface SearchFilters {
  location?: {
    lat: number;
    lng: number;
    radius: number;
  };
  priceRange?: {
    min: number;
    max: number;
  };
  age?: {
    min: number;
    max: number;
  };
  services?: string[];
  tags?: string[];
  rating?: {
    min: number;
  };
  availability?: {
    date: Date;
    startTime: string;
    endTime: string;
  };
  isOnline?: boolean;
}

export interface SearchSort {
  field: "relevance" | "price" | "rating" | "distance" | "created_at";
  order: "asc" | "desc";
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface SearchSuggestion {
  text: string;
  score: number;
}

// アナリティクス関連型
export type ReportType = "REVENUE" | "USER_ACTIVITY" | "BOOKING_ANALYSIS";
export type ReportFormat = "JSON" | "CSV" | "PDF";
export type Granularity = "day" | "week" | "month";

export interface RevenuePeriod {
  period: string;
  totalRevenue: number;
  platformFee: number;
  netRevenue: number;
  bookingCount: number;
}

export interface RevenueSummary {
  totalRevenue: number;
  totalPlatformFee: number;
  totalNetRevenue: number;
  totalBookings: number;
  averageBookingValue: number;
}

export interface CastRevenueAnalytics {
  summary: RevenueSummary;
  data: RevenuePeriod[];
}

export interface PlatformStats {
  overview: {
    totalUsers: number;
    totalCasts: number;
    totalGuests: number;
    totalBookings: number;
    totalRevenue: number;
    platformRevenue: number;
    newUsers: number;
    activeUsers: number;
  };
  growth: {
    bookingGrowth: number;
    revenueGrowth: number;
  };
}

export interface BookingStats {
  summary: {
    totalBookings: number;
    statusBreakdown: Record<string, number>;
  };
  hourlyDistribution: Array<{
    hour: number;
    count: number;
  }>;
  dailyDistribution: Array<{
    day: number;
    count: number;
  }>;
  recentBookings: BookingSummary[];
}

export interface ReportWithUser extends Report {
  user: UserSafe;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  data?: unknown;
}

// レビュー関連型
export interface ReviewWithDetails extends Review {
  booking: {
    id: string;
    date: Date;
    cast: {
      displayName: string;
    };
  };
  guest: UserSafe;
}

// API レスポンス型
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    timestamp: string;
    version: string;
    requestId: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// エラー型
export interface AppError {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

// セッション関連型
export interface SessionUser {
  id: string;
  name: string | null;
  email: string;
  userType: UserType;
  image: string | null;
  isVerified: boolean;
  isActive: boolean;
  points: number;
}

export interface AuthSession {
  user: SessionUser;
  expires: string;
}

// データベースコンテキスト型
export interface DatabaseContext {
  user: User;
  castProfile?: CastProfile;
  guestProfile?: GuestProfile;
}

// パフォーマンス監視型
export interface PerformanceMetrics {
  [operation: string]: {
    count: number;
    avgTime: number;
    maxTime: number;
    totalTime: number;
  };
}

// レート制限型
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

// 汎用ユーティリティ型
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type Partial<T> = { [P in keyof T]?: T[P] };
export type Required<T> = { [P in keyof T]-?: T[P] };
export type NonNullable<T> = T extends null | undefined ? never : T;

// 条件付き型
export type WithRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// 配列型ヘルパー
export type ArrayElement<ArrayType extends readonly unknown[]> = 
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

// JSON型
export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
export interface JsonObject { [key: string]: JsonValue; }
export interface JsonArray extends Array<JsonValue> {}

// 日付範囲型
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

// 位置情報型
export interface Location {
  lat: number;
  lng: number;
  address?: string;
  city?: string;
  country?: string;
}

// ソート型
export interface SortOption {
  field: string;
  order: "asc" | "desc";
}

// フィルター型
export interface FilterOption {
  field: string;
  operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "nin" | "contains";
  value: unknown;
}