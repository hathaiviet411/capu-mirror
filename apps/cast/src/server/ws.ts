import type { CreateWSSContextFnOptions } from "@trpc/server/adapters/ws";
import type { Session } from "next-auth";
import jwt from "jsonwebtoken";
import { TRPCError } from "@trpc/server";
import { db } from "./db";
import { env } from "~/env";

interface WSContext {
  session: Session | null;
  db: typeof db;
  userId?: string;
}

// JWT トークンからユーザー情報を抽出
const extractTokenFromConnection = (opts: CreateWSSContextFnOptions): string | null => {
  const { info } = opts;
  if (!info.connectionParams) return null;
  
  // URL パラメータからトークンを取得
  const params = info.connectionParams as Record<string, unknown>;
  const token = params.token as string | undefined;
  
  if (!token || typeof token !== 'string') return null;
  return token;
};

// JWT トークンを検証してセッション情報を取得
const validateJWTToken = async (token: string): Promise<Session | null> => {
  try {
    const decoded = jwt.verify(token, env.NEXTAUTH_SECRET) as {
      sub: string;
      email: string;
      userType: string;
      iat: number;
      exp: number;
    };

    // トークンの有効期限をチェック
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp < now) {
      return null;
    }

    // データベースからユーザー情報を取得
    const user = await db.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        userType: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      user: {
        id: user.id,
        email: user.email ?? '',
        name: user.name ?? '',
        image: user.image ?? null,
        userType: user.userType,
      },
      expires: new Date(decoded.exp * 1000).toISOString(),
    };
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
};

export const createWSContext = async (opts: CreateWSSContextFnOptions): Promise<WSContext> => {
  const token = extractTokenFromConnection(opts);
  
  if (!token) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "WebSocket接続にはJWTトークンが必要です",
    });
  }

  const session = await validateJWTToken(token);
  
  if (!session) {
    throw new TRPCError({
      code: "UNAUTHORIZED", 
      message: "無効なトークンまたは期限切れです",
    });
  }

  return {
    session,
    db,
    userId: session.user.id,
  };
};

// WebSocket接続のセッション管理
export class WSSessionManager {
  private static instance: WSSessionManager;
  private connections = new Map<string, Set<WebSocket>>();
  private userSessions = new Map<string, { userId: string; lastSeen: Date }>();

  static getInstance(): WSSessionManager {
    if (!WSSessionManager.instance) {
      WSSessionManager.instance = new WSSessionManager();
    }
    return WSSessionManager.instance;
  }

  // ユーザーの接続を追加
  addConnection(userId: string, ws: WebSocket): void {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    this.connections.get(userId)!.add(ws);
    
    this.userSessions.set(userId, {
      userId,
      lastSeen: new Date(),
    });

    // 接続終了時のクリーンアップ
    ws.on("close", () => {
      this.removeConnection(userId, ws);
    });
  }

  // ユーザーの接続を削除
  removeConnection(userId: string, ws: WebSocket): void {
    const userConnections = this.connections.get(userId);
    if (userConnections) {
      userConnections.delete(ws);
      if (userConnections.size === 0) {
        this.connections.delete(userId);
        this.userSessions.delete(userId);
      }
    }
  }

  // ユーザーがオンラインかどうかを確認
  isUserOnline(userId: string): boolean {
    return this.connections.has(userId) && this.connections.get(userId)!.size > 0;
  }

  // ユーザーの接続一覧を取得
  getUserConnections(userId: string): Set<WebSocket> | undefined {
    return this.connections.get(userId);
  }

  // オンラインユーザー一覧を取得
  getOnlineUsers(): string[] {
    return Array.from(this.connections.keys());
  }

  // 特定ユーザーにメッセージを送信
  sendToUser(userId: string, message: any): void {
    const connections = this.connections.get(userId);
    if (connections) {
      const messageStr = JSON.stringify(message);
      connections.forEach((ws) => {
        if (ws.readyState === 1) { // WebSocket.OPEN
          ws.send(messageStr);
        }
      });
    }
  }

  // 複数ユーザーにメッセージを送信
  sendToUsers(userIds: string[], message: any): void {
    userIds.forEach((userId) => {
      this.sendToUser(userId, message);
    });
  }

  // 全てのオンラインユーザーにブロードキャスト
  broadcast(message: any): void {
    const messageStr = JSON.stringify(message);
    this.connections.forEach((connections) => {
      connections.forEach((ws) => {
        if (ws.readyState === 1) { // WebSocket.OPEN
          ws.send(messageStr);
        }
      });
    });
  }
}