"use client"

import { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '~/components/ui/button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class AuthErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Authentication error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full text-center p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                認証エラーが発生しました
              </h2>
              <p className="text-gray-600 mb-6">
                {this.state.error?.message || '予期しないエラーが発生しました'}
              </p>
            </div>
            
            <div className="space-y-4">
              <Button
                onClick={() => window.location.href = '/'}
                className="w-full bg-main-navy-gradient hover:bg-main-blue text-white"
              >
                ホームに戻る
              </Button>
              
              <Button
                onClick={() => this.setState({ hasError: false, error: null })}
                variant="outline"
                className="w-full"
              >
                再試行
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}