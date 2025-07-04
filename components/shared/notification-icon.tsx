"use client"

import { Bell } from "lucide-react"

interface NotificationIconProps {
  onClick: () => void
  hasNotifications?: boolean
}

export default function NotificationIcon({ onClick, hasNotifications = false }: NotificationIconProps) {
  return (
    <button onClick={onClick} className="p-1 relative">
      <Bell className="w-6 h-6 text-white" />
      {hasNotifications && <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full shadow-sm"></div>}
    </button>
  )
}
