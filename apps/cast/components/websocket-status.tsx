"use client";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { useRealtimeConnection } from "~/hooks/use-websocket";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

export function WebSocketStatus() {
  const {
    isConnected,
    isReconnecting,
    retryCount,
    maxRetries,
    lastError,
    errors,
    reconnect,
    clearErrors,
  } = useRealtimeConnection();

  const getStatusColor = () => {
    if (isReconnecting) return "yellow";
    if (isConnected) return "green";
    return "red";
  };

  const getStatusText = () => {
    if (isReconnecting) return `再接続中... (${retryCount}/${maxRetries})`;
    if (isConnected) return "接続済み";
    return "切断中";
  };

  const getStatusIcon = () => {
    if (isReconnecting) return <RefreshCw className="h-3 w-3 animate-spin" />;
    if (isConnected) return <Wifi className="h-3 w-3" />;
    return <WifiOff className="h-3 w-3" />;
  };

  return (
    <div className="space-y-2">
      {/* ステータスバッジ */}
      <div className="flex items-center gap-2">
        <Badge 
          variant={isConnected ? "default" : "destructive"}
          className={`${
            isReconnecting 
              ? "bg-yellow-500 hover:bg-yellow-600" 
              : isConnected 
              ? "bg-green-500 hover:bg-green-600" 
              : "bg-red-500 hover:bg-red-600"
          } text-white`}
        >
          {getStatusIcon()}
          <span className="ml-1">{getStatusText()}</span>
        </Badge>

        {!isConnected && !isReconnecting && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={reconnect}
            className="h-6 px-2 text-xs"
          >
            再接続
          </Button>
        )}
      </div>

      {/* エラー表示 */}
      {lastError && (
        <Alert variant="destructive" className="text-xs">
          <AlertDescription>
            接続エラー: {lastError.message}
          </AlertDescription>
        </Alert>
      )}

      {/* エラー履歴 */}
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.slice(-3).map((error, index) => (
            <Alert key={index} variant="destructive" className="text-xs py-1">
              <AlertDescription>
                {error.message}
              </AlertDescription>
            </Alert>
          ))}
          {errors.length > 3 && (
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={clearErrors}
              className="h-5 px-1 text-xs"
            >
              エラーをクリア
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// よりシンプルなステータス表示用
export function SimpleWebSocketStatus() {
  const { isConnected, isReconnecting } = useRealtimeConnection();

  return (
    <div className="flex items-center gap-1">
      <div 
        className={`w-2 h-2 rounded-full ${
          isReconnecting 
            ? "bg-yellow-500 animate-pulse" 
            : isConnected 
            ? "bg-green-500" 
            : "bg-red-500"
        }`}
      />
      <span className="text-xs text-muted-foreground">
        {isReconnecting ? "再接続中" : isConnected ? "オンライン" : "オフライン"}
      </span>
    </div>
  );
}