import { z } from "zod";
import type { PrismaClient } from "@prisma/client";

// データベースクエリ最適化ユーティリティ
export class QueryOptimizer {
  private db: PrismaClient;

  constructor(db: PrismaClient) {
    this.db = db;
  }

  // バッチローダー（N+1問題の解決）
  async loadCastsWithReviews(castIds: string[]) {
    const casts = await this.db.castProfile.findMany({
      where: {
        id: { in: castIds }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        },
        reviews: {
          select: {
            rating: true,
          }
        },
        _count: {
          select: {
            reviews: true,
            bookings: true,
          }
        }
      }
    });

    // 平均評価を効率的に計算
    return casts.map(cast => ({
      ...cast,
      averageRating: cast.reviews.length > 0 
        ? cast.reviews.reduce((sum, review) => sum + review.rating, 0) / cast.reviews.length 
        : 0,
      reviewCount: cast._count.reviews,
      bookingCount: cast._count.bookings,
    }));
  }

  // ページネーション最適化
  async getPaginatedResults<T>(
    queryFn: (skip: number, take: number) => Promise<T[]>,
    countFn: () => Promise<number>,
    page: number,
    limit: number
  ) {
    const skip = (page - 1) * limit;
    
    // データと総数を並列取得
    const [results, total] = await Promise.all([
      queryFn(skip, limit + 1), // hasMoreの判定のため+1
      countFn()
    ]);

    const hasMore = Array.isArray(results) && results.length > limit;
    const items = hasMore ? results.slice(0, limit) : results;

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        hasMore,
        totalPages: Math.ceil(total / limit),
      }
    };
  }

  // 統計データのキャッシュ化
  private cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();

  async getCachedResult<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttlSeconds: number = 300 // 5分間のデフォルトTTL
  ): Promise<T> {
    const now = Date.now();
    const cached = this.cache.get(key);

    if (cached && (now - cached.timestamp) < cached.ttl * 1000) {
      return cached.data as T;
    }

    const result = await queryFn();
    this.cache.set(key, {
      data: result,
      timestamp: now,
      ttl: ttlSeconds
    });

    return result;
  }

  // キャッシュクリア
  clearCache(pattern?: string) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }
}

// レスポンス圧縮・最適化
export const optimizeResponse = {
  // 大きなオブジェクトから必要なフィールドのみを選択
  selectFields<T extends Record<string, unknown>>(
    obj: T,
    fields: (keyof T)[]
  ): Partial<T> {
    const result: Partial<T> = {};
    for (const field of fields) {
      if (obj[field] !== undefined) {
        result[field] = obj[field];
      }
    }
    return result;
  },

  // 配列データの最適化
  optimizeArrayResponse<T>(
    items: T[],
    transformer?: (item: T) => unknown
  ) {
    if (!transformer) return items;
    return items.map(transformer);
  },

  // JSONデータの最適化（不要なフィールドの除去）
  cleanupJsonFields<T extends Record<string, unknown>>(obj: T): T {
    const cleaned = { ...obj };
    
    // null、undefined、空文字列の除去
    Object.keys(cleaned).forEach(key => {
      const value = cleaned[key];
      if (value === null || value === undefined || value === '') {
        delete cleaned[key];
      }
    });
    
    return cleaned;
  }
};

// データベース接続プール最適化
export const dbOptimizations = {
  // 読み取り専用クエリの最適化設定
  readOnlyConfig: {
    timeout: 5000, // 5秒タイムアウト
  },

  // バッチ処理最適化
  async batchProcess<T, R>(
    items: T[],
    processor: (batch: T[]) => Promise<R[]>,
    batchSize: number = 100
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await processor(batch);
      results.push(...batchResults);
      
      // バッチ間で少し待機（CPUとDBの負荷軽減）
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    return results;
  }
};

// メモリ使用量最適化
export const memoryOptimizations = {
  // 大きなオブジェクトの部分的な読み込み
  async streamLargeData<T>(
    queryFn: (offset: number, limit: number) => Promise<T[]>,
    processor: (items: T[]) => Promise<void>,
    chunkSize: number = 1000
  ) {
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const chunk = await queryFn(offset, chunkSize);
      hasMore = chunk.length === chunkSize;
      
      if (chunk.length > 0) {
        await processor(chunk);
      }
      
      offset += chunkSize;
    }
  }
};

// レート制限とスロットリング
export class RateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  checkLimit(userId: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(userId);

    if (!userRequests || now > userRequests.resetTime) {
      this.requests.set(userId, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return true;
    }

    if (userRequests.count >= this.maxRequests) {
      return false;
    }

    userRequests.count++;
    return true;
  }

  getRemainingRequests(userId: string): number {
    const userRequests = this.requests.get(userId);
    if (!userRequests) return this.maxRequests;
    
    return Math.max(0, this.maxRequests - userRequests.count);
  }

  getResetTime(userId: string): number {
    const userRequests = this.requests.get(userId);
    return userRequests?.resetTime || 0;
  }
}

// 検索最適化
export const searchOptimizations = {
  // 全文検索インデックスのヒント
  buildSearchQuery: (query: string) => {
    // 特殊文字をエスケープ
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // 部分一致とファジー検索の組み合わせ
    return {
      contains: escaped,
      mode: 'insensitive' as const,
    };
  },

  // 検索結果のスコアリング
  scoreSearchResult: (
    item: { name: string; description?: string },
    query: string
  ): number => {
    let score = 0;
    const lowerQuery = query.toLowerCase();
    const lowerName = item.name.toLowerCase();
    const lowerDesc = item.description?.toLowerCase() || '';

    // 完全一致
    if (lowerName === lowerQuery) score += 100;
    
    // 前方一致
    if (lowerName.startsWith(lowerQuery)) score += 50;
    
    // 部分一致
    if (lowerName.includes(lowerQuery)) score += 20;
    
    // 説明文での一致
    if (lowerDesc.includes(lowerQuery)) score += 10;

    return score;
  }
};

// パフォーマンス監視
export class PerformanceMonitor {
  private metrics = new Map<string, { count: number; totalTime: number; maxTime: number }>();

  startTimer(operation: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.recordMetric(operation, duration);
    };
  }

  private recordMetric(operation: string, duration: number) {
    const existing = this.metrics.get(operation) || { count: 0, totalTime: 0, maxTime: 0 };
    
    this.metrics.set(operation, {
      count: existing.count + 1,
      totalTime: existing.totalTime + duration,
      maxTime: Math.max(existing.maxTime, duration),
    });
  }

  getMetrics() {
    const result: Record<string, {
      count: number;
      avgTime: number;
      maxTime: number;
      totalTime: number;
    }> = {};

    for (const [operation, metrics] of this.metrics.entries()) {
      result[operation] = {
        count: metrics.count,
        avgTime: metrics.totalTime / metrics.count,
        maxTime: metrics.maxTime,
        totalTime: metrics.totalTime,
      };
    }

    return result;
  }

  clearMetrics() {
    this.metrics.clear();
  }
}

// 使用例とインスタンス
export const rateLimiter = new RateLimiter(60000, 100); // 1分間に100リクエスト
export const performanceMonitor = new PerformanceMonitor();