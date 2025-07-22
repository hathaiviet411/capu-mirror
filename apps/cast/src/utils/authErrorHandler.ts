import { toast } from 'sonner'

export type AuthErrorType = 
  | 'invalid_credentials'
  | 'session_expired'
  | 'unauthorized'
  | 'line_oauth_error'
  | 'server_error'
  | 'network_error'
  | 'validation_error'

export const authErrorMessages: Record<AuthErrorType, string> = {
  invalid_credentials: 'ログインIDまたはパスワードが正しくありません',
  session_expired: 'セッションの有効期限が切れました。再度ログインしてください',
  unauthorized: 'このページにアクセスする権限がありません',
  line_oauth_error: 'LINE認証でエラーが発生しました。再度お試しください',
  server_error: 'サーバーエラーが発生しました。しばらく経ってから再度お試しください',
  network_error: 'ネットワークエラーが発生しました。接続を確認してください',
  validation_error: '入力内容に不備があります。正しい形式で入力してください'
}

export const handleAuthError = (error: AuthErrorType | string, customMessage?: string) => {
  let message: string

  if (typeof error === 'string') {
    message = customMessage || error
  } else {
    message = customMessage || authErrorMessages[error] || authErrorMessages.server_error
  }

  toast.error(message)
  
  // エラーログを記録
  console.error('Auth error:', error, message)
  
  // 必要に応じて分析ツールに送信
  // analytics.track('auth_error', { error, message })
}

export const getErrorTypeFromMessage = (errorMessage: string): AuthErrorType => {
  const message = errorMessage.toLowerCase()
  
  if (message.includes('credentials') || message.includes('password') || message.includes('login')) {
    return 'invalid_credentials'
  }
  
  if (message.includes('session') || message.includes('expire')) {
    return 'session_expired'
  }
  
  if (message.includes('unauthorized') || message.includes('permission')) {
    return 'unauthorized'
  }
  
  if (message.includes('line') || message.includes('oauth')) {
    return 'line_oauth_error'
  }
  
  if (message.includes('network') || message.includes('connection')) {
    return 'network_error'
  }
  
  if (message.includes('validation') || message.includes('invalid')) {
    return 'validation_error'
  }
  
  return 'server_error'
}