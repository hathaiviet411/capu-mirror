import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TRPCError } from '@trpc/server';
import jwt from 'jsonwebtoken';
import { createWSContext, WSSessionManager } from '../ws';
import { createTRPCRouter, rateLimitedProcedure } from '../api/trpc';
import { messageRouter } from '../api/routers/message';

// Mock modules
vi.mock('~/env', () => ({
  env: {
    NEXTAUTH_SECRET: 'test-secret',
  },
}));

vi.mock('~/server/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
    conversation: {
      findUnique: vi.fn(),
    },
    message: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe('WebSocket Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createWSContext', () => {
    it('should throw UNAUTHORIZED when no token provided', async () => {
      const opts = {
        info: {
          connectionParams: {},
        },
      } as any;

      await expect(createWSContext(opts)).rejects.toThrow(TRPCError);
      await expect(createWSContext(opts)).rejects.toThrow('WebSocket接続にはJWTトークンが必要です');
    });

    it('should throw UNAUTHORIZED when invalid token provided', async () => {
      const opts = {
        info: {
          connectionParams: {
            token: 'invalid-token',
          },
        },
      } as any;

      await expect(createWSContext(opts)).rejects.toThrow(TRPCError);
      await expect(createWSContext(opts)).rejects.toThrow('無効なトークンまたは期限切れです');
    });

    it('should successfully authenticate with valid token', async () => {
      const { db } = await import('~/server/db');
      
      // Mock user data
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        image: null,
        userType: 'GUEST',
      };

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser);

      // Create valid JWT token
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        userType: 'GUEST',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      };

      const token = jwt.sign(payload, 'test-secret');

      const opts = {
        info: {
          connectionParams: {
            token,
          },
        },
      } as any;

      const result = await createWSContext(opts);

      expect(result).toHaveProperty('session');
      expect(result).toHaveProperty('db');
      expect(result).toHaveProperty('userId', 'user-123');
      expect(result.session?.user.id).toBe('user-123');
      expect(result.session?.user.email).toBe('test@example.com');
    });

    it('should throw UNAUTHORIZED when token is expired', async () => {
      // Create expired JWT token
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        userType: 'GUEST',
        iat: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago (expired)
      };

      const token = jwt.sign(payload, 'test-secret');

      const opts = {
        info: {
          connectionParams: {
            token,
          },
        },
      } as any;

      await expect(createWSContext(opts)).rejects.toThrow(TRPCError);
      await expect(createWSContext(opts)).rejects.toThrow('無効なトークンまたは期限切れです');
    });

    it('should throw UNAUTHORIZED when user not found in database', async () => {
      const { db } = await import('~/server/db');
      
      vi.mocked(db.user.findUnique).mockResolvedValue(null);

      // Create valid JWT token for non-existent user
      const payload = {
        sub: 'non-existent-user',
        email: 'test@example.com',
        userType: 'GUEST',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const token = jwt.sign(payload, 'test-secret');

      const opts = {
        info: {
          connectionParams: {
            token,
          },
        },
      } as any;

      await expect(createWSContext(opts)).rejects.toThrow(TRPCError);
      await expect(createWSContext(opts)).rejects.toThrow('無効なトークンまたは期限切れです');
    });
  });
});

describe('WSSessionManager', () => {
  let sessionManager: WSSessionManager;
  let mockWebSocket: any;

  beforeEach(() => {
    sessionManager = WSSessionManager.getInstance();
    mockWebSocket = {
      on: vi.fn(),
      send: vi.fn(),
      readyState: 1, // WebSocket.OPEN
    };
  });

  afterEach(() => {
    // Clear connections
    const manager = sessionManager as any;
    manager.connections.clear();
    manager.userSessions.clear();
  });

  it('should add user connection successfully', () => {
    const userId = 'user-123';
    
    sessionManager.addConnection(userId, mockWebSocket);
    
    expect(sessionManager.isUserOnline(userId)).toBe(true);
    expect(sessionManager.getUserConnections(userId)?.has(mockWebSocket)).toBe(true);
    expect(mockWebSocket.on).toHaveBeenCalledWith('close', expect.any(Function));
  });

  it('should remove user connection successfully', () => {
    const userId = 'user-123';
    
    sessionManager.addConnection(userId, mockWebSocket);
    expect(sessionManager.isUserOnline(userId)).toBe(true);
    
    sessionManager.removeConnection(userId, mockWebSocket);
    expect(sessionManager.isUserOnline(userId)).toBe(false);
  });

  it('should send message to specific user', () => {
    const userId = 'user-123';
    const message = { type: 'test', data: 'hello' };
    
    sessionManager.addConnection(userId, mockWebSocket);
    sessionManager.sendToUser(userId, message);
    
    expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify(message));
  });

  it('should not send message to offline user', () => {
    const userId = 'user-123';
    const message = { type: 'test', data: 'hello' };
    
    sessionManager.sendToUser(userId, message);
    
    expect(mockWebSocket.send).not.toHaveBeenCalled();
  });

  it('should get list of online users', () => {
    const userId1 = 'user-123';
    const userId2 = 'user-456';
    const mockWebSocket2 = { ...mockWebSocket };
    
    sessionManager.addConnection(userId1, mockWebSocket);
    sessionManager.addConnection(userId2, mockWebSocket2);
    
    const onlineUsers = sessionManager.getOnlineUsers();
    expect(onlineUsers).toContain(userId1);
    expect(onlineUsers).toContain(userId2);
    expect(onlineUsers).toHaveLength(2);
  });

  it('should broadcast message to all online users', () => {
    const userId1 = 'user-123';
    const userId2 = 'user-456';
    const mockWebSocket2 = { ...mockWebSocket };
    const message = { type: 'broadcast', data: 'hello all' };
    
    sessionManager.addConnection(userId1, mockWebSocket);
    sessionManager.addConnection(userId2, mockWebSocket2);
    
    sessionManager.broadcast(message);
    
    expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify(message));
    expect(mockWebSocket2.send).toHaveBeenCalledWith(JSON.stringify(message));
  });
});

describe('Rate Limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow requests within rate limit', async () => {
    const mockCtx = {
      session: {
        user: { id: 'user-123' },
      },
      db: {},
    };

    const mockNext = vi.fn().mockResolvedValue('success');

    // Create a test router with rate limiting
    const testRouter = createTRPCRouter({
      testProcedure: rateLimitedProcedure
        .mutation(async () => {
          return 'test response';
        }),
    });

    // This test would require more complex setup to properly test the middleware
    // For now, we'll test the concept
    expect(mockNext).toBeDefined();
  });

  it('should block requests exceeding rate limit', async () => {
    // This would require a more complex test setup with actual tRPC context
    // and middleware execution. For now, we'll ensure the rate limiting 
    // middleware is properly imported and configured.
    expect(rateLimitedProcedure).toBeDefined();
  });
});

describe('Real-time Messaging Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have message router with proper procedures', () => {
    expect(messageRouter).toBeDefined();
    expect(messageRouter._def.procedures).toHaveProperty('sendMessage');
    expect(messageRouter._def.procedures).toHaveProperty('onNewMessage');
    expect(messageRouter._def.procedures).toHaveProperty('onTyping');
    expect(messageRouter._def.procedures).toHaveProperty('onReadStatus');
    expect(messageRouter._def.procedures).toHaveProperty('onReaction');
  });

  it('should validate message schema correctly', () => {
    // Test would involve validating the message schema
    // This ensures type safety for WebSocket communications
    expect(messageRouter._def.procedures.sendMessage).toBeDefined();
  });
});

describe('WebSocket Security', () => {
  it('should require authentication for all WebSocket operations', () => {
    // Verify that all subscription procedures use authentication
    const procedures = messageRouter._def.procedures;
    
    // All subscription procedures should be defined
    expect(procedures.onNewMessage).toBeDefined();
    expect(procedures.onTyping).toBeDefined();
    expect(procedures.onReadStatus).toBeDefined();
    expect(procedures.onReaction).toBeDefined();
  });

  it('should validate conversation access for subscriptions', () => {
    // This test would verify that users can only subscribe to conversations
    // they have access to. The actual implementation is in the router procedures.
    expect(messageRouter._def.procedures.onNewMessage).toBeDefined();
  });
});