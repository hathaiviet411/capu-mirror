"use client"

import { useLogout } from '~/hooks/useLogout'
import { Button } from '~/components/ui/button'
import { LogOut, Loader2 } from 'lucide-react'

interface LogoutButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  showIcon?: boolean
  children?: React.ReactNode
}

export const LogoutButton = ({ 
  variant = 'destructive', 
  size = 'default', 
  className,
  showIcon = true,
  children
}: LogoutButtonProps) => {
  const { logout, isLoading } = useLogout()

  return (
    <Button
      onClick={logout}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ログアウト中...
        </>
      ) : (
        <>
          {showIcon && <LogOut className="mr-2 h-4 w-4" />}
          {children || 'ログアウト'}
        </>
      )}
    </Button>
  )
}