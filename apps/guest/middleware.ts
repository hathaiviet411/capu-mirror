import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // ログインページへのアクセス（認証済みユーザーはホームへリダイレクト）
    if (pathname === '/' && token) {
      return NextResponse.redirect(new URL('/home', req.url))
    }

    // 保護されたページへのアクセス
    if (pathname.startsWith('/home') || 
        pathname.startsWith('/profile') || 
        pathname.startsWith('/settings') ||
        pathname.startsWith('/messages') ||
        pathname.startsWith('/notifications') ||
        pathname.startsWith('/bookings') ||
        pathname.startsWith('/points') ||
        pathname.startsWith('/payment') ||
        pathname.startsWith('/help')) {
      
      // 未認証ユーザーはログインページへリダイレクト
      if (!token) {
        return NextResponse.redirect(new URL('/', req.url))
      }
      
      // ゲストユーザー以外はアクセス拒否
      if (token.userType !== 'GUEST') {
        return NextResponse.redirect(new URL('/auth/unauthorized', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // ルートページ（ログインページ）は常にアクセス可能
        if (pathname === '/') {
          return true
        }
        
        // その他の保護されたページはトークンが必要
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ]
}