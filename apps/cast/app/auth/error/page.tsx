"use client"

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '~/components/ui/button'
import { useEffect, useState } from 'react'

export default function AuthErrorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [errorType, setErrorType] = useState<string>('')

  useEffect(() => {
    const error = searchParams.get('error')
    setErrorType(error || 'Default')
  }, [searchParams])

  const errorMessages: Record<string, { title: string; description: string }> = {
    Configuration: {
      title: 'サーバー設定エラー',
      description: 'サーバー設定に問題があります。管理者にお問い合わせください。'
    },
    AccessDenied: {
      title: 'アクセス拒否',
      description: 'このページにアクセスする権限がありません。'
    },
    Verification: {
      title: 'メール認証エラー',
      description: 'メール認証でエラーが発生しました。再度お試しください。'
    },
    OAuthSignin: {
      title: 'OAuth認証エラー',
      description: 'OAuth認証でエラーが発生しました。再度お試しください。'
    },
    OAuthCallback: {
      title: 'OAuth認証エラー',
      description: 'OAuth認証の処理中にエラーが発生しました。'
    },
    OAuthCreateAccount: {
      title: 'アカウント作成エラー',
      description: 'アカウントの作成中にエラーが発生しました。'
    },
    EmailCreateAccount: {
      title: 'アカウント作成エラー',
      description: 'メールアカウントの作成中にエラーが発生しました。'
    },
    Callback: {
      title: '認証コールバックエラー',
      description: '認証処理中にエラーが発生しました。'
    },
    OAuthAccountNotLinked: {
      title: 'アカウント連携エラー',
      description: 'このOAuthアカウントは既に別のアカウントと連携されています。'
    },
    EmailSignin: {
      title: 'メールログインエラー',
      description: 'メールでのログイン中にエラーが発生しました。'
    },
    CredentialsSignin: {
      title: 'ログインエラー',
      description: 'ログインIDまたはパスワードが正しくありません。'
    },
    Default: {
      title: '認証エラー',
      description: '認証エラーが発生しました。再度お試しください。'
    }
  }

  const currentError = errorMessages[errorType] || errorMessages.Default

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {currentError.title}
          </h1>
          <p className="text-gray-600 mb-6">
            {currentError.description}
          </p>
        </div>
        
        <div className="space-y-4">
          <Button
            onClick={() => router.push('/')}
            className="w-full bg-main-navy-gradient hover:bg-main-blue text-white"
          >
            ログイン画面に戻る
          </Button>
          
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="w-full"
          >
            前のページに戻る
          </Button>
        </div>
      </div>
    </div>
  )
}