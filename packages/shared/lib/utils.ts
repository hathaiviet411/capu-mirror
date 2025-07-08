// 共通ユーティリティ関数をここに定義

/**
 * クラス名を結合するユーティリティ関数
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * 日付をフォーマットするユーティリティ関数
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('ja-JP');
}

/**
 * 文字列が空かどうかをチェックするユーティリティ関数
 */
export function isEmpty(str: string | null | undefined): boolean {
  return !str || str.trim().length === 0;
} 