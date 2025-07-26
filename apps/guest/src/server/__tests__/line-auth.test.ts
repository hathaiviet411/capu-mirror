import { describe, it, expect, vi } from 'vitest'
import { authOptions } from '../auth'

describe('LINE OAuth Authentication', () => {
  it('should have LINE provider configured when environment variables are set', () => {
    // 環境変数をモック
    vi.stubEnv('LINE_CLIENT_ID', 'test-line-client-id')
    vi.stubEnv('LINE_CLIENT_SECRET', 'test-line-client-secret')
    
    // LINE プロバイダーの存在を確認
    const lineProvider = authOptions.providers.find(
      (provider) => provider.id === 'line'
    )
    
    expect(lineProvider).toBeDefined()
    expect(lineProvider?.type).toBe('oauth')
  })

  it('should handle LINE authentication callback correctly', async () => {
    const callbacks = authOptions.callbacks!
    
    // LINE OAuth プロファイルをモック
    const mockProfile = {
      sub: 'U1234567890abcdef',
      name: 'Test User',
      picture: 'https://profile.line-scdn.net/xxx'
    }
    
    const mockAccount = {
      provider: 'line',
      type: 'oauth' as const,
      providerAccountId: 'U1234567890abcdef',
      access_token: 'test-access-token',
      token_type: 'Bearer',
      scope: 'profile openid'
    }
    
    const mockUser = {
      id: '1',
      email: null,
      name: 'Test User',
      userType: 'GUEST' as const
    }
    
    // signIn コールバックのテスト
    const signInResult = await callbacks.signIn!({
      user: mockUser,
      account: mockAccount,
      profile: mockProfile,
      email: undefined,
      credentials: undefined
    })
    
    expect(signInResult).toBe(true)
  })

  it('should set userType to GUEST for LINE authentication', async () => {
    const callbacks = authOptions.callbacks!
    
    // JWT コールバックのテスト
    const token = await callbacks.jwt!({
      token: { sub: '1' },
      user: undefined,
      account: {
        provider: 'line',
        type: 'oauth' as const,
        providerAccountId: 'U1234567890abcdef'
      },
      profile: { sub: 'U1234567890abcdef' },
      trigger: 'signIn',
      isNewUser: false,
      session: undefined
    })
    
    expect(token.userType).toBe('GUEST')
    expect(token.lineId).toBe('U1234567890abcdef')
  })

  it('should reject LINE authentication without profile sub', async () => {
    const callbacks = authOptions.callbacks!
    
    // 不完全なプロファイルでのテスト
    const signInResult = await callbacks.signIn!({
      user: { id: '1', userType: 'GUEST' },
      account: {
        provider: 'line',
        type: 'oauth' as const,
        providerAccountId: ''
      },
      profile: {}, // sub が欠けている
      email: undefined,
      credentials: undefined
    })
    
    expect(signInResult).toBe(false)
  })
})