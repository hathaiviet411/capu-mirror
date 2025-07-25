"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "~/utils/api";

interface UseWebSocketOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onReconnect?: () => void;
  onError?: (error: Error) => void;
  retryAttempts?: number;
  retryDelay?: number;
}

export function useWebSocketConnection(options: UseWebSocketOptions = {}) {
  const {
    onConnect,
    onDisconnect,
    onReconnect,
    onError,
    retryAttempts = 3,
    retryDelay = 3000,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<Error | null>(null);

  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const heartbeatIntervalRef = useRef<NodeJS.Timeout>();

  // プレゼンス更新のハートビート
  const updateActivity = api.presence.updateActivity.useMutation();

  // WebSocket接続状態の監視
  useEffect(() => {
    const handleOnline = () => {
      console.log("Network is online, attempting to reconnect...");
      if (!isConnected && retryCount < retryAttempts) {
        attemptReconnect();
      }
    };

    const handleOffline = () => {
      console.log("Network is offline");
      setIsConnected(false);
      if (onDisconnect) onDisconnect();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [isConnected, retryCount, retryAttempts]);

  // ハートビート機能
  useEffect(() => {
    if (isConnected) {
      // 5分ごとにアクティビティを更新
      heartbeatIntervalRef.current = setInterval(() => {
        updateActivity.mutate();
      }, 5 * 60 * 1000);

      return () => {
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }
      };
    }
  }, [isConnected, updateActivity]);

  const attemptReconnect = () => {
    if (retryCount >= retryAttempts) {
      console.log("Max retry attempts reached");
      setIsReconnecting(false);
      return;
    }

    setIsReconnecting(true);
    setRetryCount(prev => prev + 1);

    reconnectTimeoutRef.current = setTimeout(() => {
      console.log(`Reconnection attempt ${retryCount + 1}/${retryAttempts}`);
      
      // 実際の再接続ロジックはtRPCのWebSocketクライアントが自動的に処理する
      // ここでは状態の管理のみ行う
      
      setTimeout(() => {
        // 簡単な接続テスト（実際にはWebSocketの状態を確認）
        if (navigator.onLine) {
          setIsConnected(true);
          setIsReconnecting(false);
          setRetryCount(0);
          setLastError(null);
          if (onReconnect) onReconnect();
        } else {
          setIsReconnecting(false);
          const error = new Error("Network is offline");
          setLastError(error);
          if (onError) onError(error);
        }
      }, 1000);
    }, retryDelay);
  };

  // 手動再接続
  const reconnect = () => {
    setRetryCount(0);
    attemptReconnect();
  };

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, []);

  return {
    isConnected,
    isReconnecting,
    retryCount,
    maxRetries: retryAttempts,
    lastError,
    reconnect,
  };
}

// WebSocketのエラー処理用のhook
export function useWebSocketErrorHandler() {
  const [errors, setErrors] = useState<Error[]>([]);

  const handleError = (error: Error) => {
    console.error("WebSocket error:", error);
    setErrors(prev => [...prev, error]);
  };

  const clearErrors = () => {
    setErrors([]);
  };

  const removeError = (index: number) => {
    setErrors(prev => prev.filter((_, i) => i !== index));
  };

  return {
    errors,
    handleError,
    clearErrors,
    removeError,
  };
}

// コンポーネント用の統合フック
export function useRealtimeConnection(conversationId?: string) {
  const errorHandler = useWebSocketErrorHandler();
  
  const connection = useWebSocketConnection({
    onConnect: () => {
      console.log("WebSocket connected");
      errorHandler.clearErrors();
    },
    onDisconnect: () => {
      console.log("WebSocket disconnected");
    },
    onReconnect: () => {
      console.log("WebSocket reconnected");
      errorHandler.clearErrors();
    },
    onError: errorHandler.handleError,
  });

  // オンライン状態の更新
  const updateStatus = api.presence.updateStatus.useMutation();

  useEffect(() => {
    if (connection.isConnected) {
      updateStatus.mutate({ status: "online" });
    }
  }, [connection.isConnected, updateStatus]);

  // ページを離れる時の処理
  useEffect(() => {
    const handleBeforeUnload = () => {
      updateStatus.mutate({ status: "offline" });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      updateStatus.mutate({ status: "offline" });
    };
  }, [updateStatus]);

  return {
    ...connection,
    ...errorHandler,
  };
}