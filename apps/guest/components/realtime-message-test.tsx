"use client";

import { useState, useEffect } from "react";
import { api } from "~/utils/api";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Badge } from "~/components/ui/badge";

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: Date;
  sender: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface RealtimeMessageTestProps {
  conversationId: string;
}

export function RealtimeMessageTest({ conversationId }: RealtimeMessageTestProps) {
  const [newMessage, setNewMessage] = useState("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  // メッセージ取得
  const { data: messagesData, refetch: refetchMessages } = api.message.getMessages.useQuery({
    conversationId,
    limit: 50,
  });

  // メッセージ送信
  const sendMessage = api.message.sendMessage.useMutation({
    onSuccess: () => {
      setNewMessage("");
      refetchMessages();
    },
  });

  // タイピング送信
  const sendTyping = api.message.sendTyping.useMutation();

  // WebSocket Subscriptions
  // 新規メッセージのリアルタイム受信
  api.message.onNewMessage.useSubscription(
    { conversationId },
    {
      onData: (data) => {
        console.log("New message received:", data);
        refetchMessages();
      },
      onError: (error) => {
        console.error("Message subscription error:", error);
      },
    }
  );

  // タイピングインジケーターのリアルタイム受信
  api.message.onTyping.useSubscription(
    { conversationId },
    {
      onData: (data) => {
        console.log("Typing received:", data);
        if (data.isTyping) {
          setTypingUsers(prev => [...new Set([...prev, data.userId])]);
        } else {
          setTypingUsers(prev => prev.filter(id => id !== data.userId));
        }
      },
      onError: (error) => {
        console.error("Typing subscription error:", error);
      },
    }
  );

  // 既読状態のリアルタイム受信
  api.message.onReadStatus.useSubscription(
    { conversationId },
    {
      onData: (data) => {
        console.log("Read status received:", data);
        // 既読状態を更新する処理
      },
      onError: (error) => {
        console.error("Read status subscription error:", error);
      },
    }
  );

  // リアクションのリアルタイム受信
  api.message.onReaction.useSubscription(
    { conversationId },
    {
      onData: (data) => {
        console.log("Reaction received:", data);
        refetchMessages();
      },
      onError: (error) => {
        console.error("Reaction subscription error:", error);
      },
    }
  );

  // タイピング状態管理
  useEffect(() => {
    if (newMessage.length > 0 && !isTyping) {
      setIsTyping(true);
      sendTyping.mutate({
        conversationId,
        isTyping: true,
      });
    } else if (newMessage.length === 0 && isTyping) {
      setIsTyping(false);
      sendTyping.mutate({
        conversationId,
        isTyping: false,
      });
    }
  }, [newMessage, isTyping, conversationId, sendTyping]);

  // タイピング停止のデバウンス
  useEffect(() => {
    if (isTyping) {
      const timer = setTimeout(() => {
        setIsTyping(false);
        sendTyping.mutate({
          conversationId,
          isTyping: false,
        });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [newMessage, isTyping, conversationId, sendTyping]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      sendMessage.mutate({
        conversationId,
        content: newMessage.trim(),
        messageType: "TEXT",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReaction = (messageId: string, emoji: string) => {
    api.message.setMessageReaction.useMutation({
      onSuccess: () => {
        refetchMessages();
      },
    }).mutate({
      messageId,
      emoji,
    });
  };

  const messages = messagesData?.messages || [];

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle>リアルタイムメッセージテスト</CardTitle>
        <p className="text-sm text-muted-foreground">
          Conversation ID: {conversationId}
        </p>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-4">
        {/* メッセージ一覧 */}
        <ScrollArea className="flex-1 border rounded-md p-4">
          <div className="space-y-3">
            {messages.map((message: Message) => (
              <div
                key={message.id}
                className="flex flex-col gap-1 p-3 border rounded-lg"
              >
                <div className="flex items-center gap-2 text-sm">
                  <strong>{message.sender.name}</strong>
                  <span className="text-muted-foreground">
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <p>{message.content}</p>
                
                {/* リアクションボタン */}
                <div className="flex gap-1 mt-2">
                  {["👍", "❤️", "😊", "😮"].map((emoji) => (
                    <Button
                      key={emoji}
                      size="sm"
                      variant="outline"
                      onClick={() => handleReaction(message.id, emoji)}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* タイピングインジケーター */}
        {typingUsers.length > 0 && (
          <div className="text-sm text-muted-foreground">
            <Badge variant="secondary">
              {typingUsers.length === 1 
                ? "誰かがタイピング中..." 
                : `${typingUsers.length}人がタイピング中...`}
            </Badge>
          </div>
        )}

        {/* メッセージ入力 */}
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="メッセージを入力..."
            disabled={sendMessage.isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sendMessage.isLoading}
          >
            送信
          </Button>
        </div>

        {/* デバッグ情報 */}
        <div className="text-xs text-muted-foreground border-t pt-2">
          <p>送信中: {sendMessage.isLoading ? "Yes" : "No"}</p>
          <p>タイピング中: {isTyping ? "Yes" : "No"}</p>
          <p>タイピングユーザー: {typingUsers.join(", ") || "なし"}</p>
        </div>
      </CardContent>
    </Card>
  );
}