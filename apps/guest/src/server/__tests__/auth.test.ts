import { describe, it, expect, vi } from 'vitest';
import { authOptions } from '../auth';
import { type NextAuthOptions } from 'next-auth';

// Mock modules
vi.mock('~/env', () => ({
  env: {
    NEXTAUTH_SECRET: 'test-secret',
    DISCORD_CLIENT_ID: 'discord-id',
    DISCORD_CLIENT_SECRET: 'discord-secret',
    LINE_CLIENT_ID: 'line-id',
    LINE_CLIENT_SECRET: 'line-secret',
  },
}));

vi.mock('~/server/db', () => ({
  db: {
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('bcryptjs', () => ({
  compare: vi.fn(),
}));

describe('NextAuth Configuration', () => {
  it('should have correct configuration structure', () => {
    expect(authOptions).toBeDefined();
    expect(authOptions.providers).toBeDefined();
    expect(authOptions.session).toBeDefined();
    expect(authOptions.jwt).toBeDefined();
    expect(authOptions.callbacks).toBeDefined();
  });

  it('should have JWT strategy configured', () => {
    expect(authOptions.session?.strategy).toBe('jwt');
    expect(authOptions.session?.maxAge).toBe(30 * 24 * 60 * 60); // 30 days
  });

  it('should have JWT secret configured', () => {
    expect(authOptions.jwt?.secret).toBe('test-secret');
  });

  it('should include correct providers', () => {
    expect(authOptions.providers).toHaveLength(3); // Discord, LINE, Credentials
    
    // Check if providers are correctly configured
    const providerIds = authOptions.providers.map(p => p.id);
    expect(providerIds).toContain('discord');
    expect(providerIds).toContain('line');
    expect(providerIds).toContain('cast-credentials');
  });

  it('should have JWT callback configured', () => {
    expect(authOptions.callbacks?.jwt).toBeDefined();
    expect(typeof authOptions.callbacks?.jwt).toBe('function');
  });

  it('should have session callback configured', () => {
    expect(authOptions.callbacks?.session).toBeDefined();
    expect(typeof authOptions.callbacks?.session).toBe('function');
  });

  it('should have custom signin/signup pages', () => {
    expect(authOptions.pages?.signIn).toBe('/auth/signin');
    expect(authOptions.pages?.signUp).toBe('/auth/signup');
  });
});