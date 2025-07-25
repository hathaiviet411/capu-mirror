import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { WebSocketServer } from "ws";
import { applyWSSHandler } from "@trpc/server/adapters/ws";
import { appRouter } from "./src/server/api/root";
import { createWSContext } from "./src/server/ws";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

// Next.jsアプリケーションを初期化
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // HTTPサーバーを作成
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  // WebSocketサーバーを作成
  const wss = new WebSocketServer({
    server,
    path: "/api/ws",
  });

  // tRPC WebSocketハンドラーを適用
  const handler = applyWSSHandler({
    wss,
    router: appRouter,
    createContext: createWSContext,
    // エラーハンドリング
    onError: ({ path, error }) => {
      console.error(`❌ tRPC failed on ${path}: ${error.message}`);
    },
  });

  // サーバー起動
  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> WebSocket server ready on ws://${hostname}:${port}/api/ws`);
  });

  // Graceful shutdown
  process.on("SIGTERM", () => {
    console.log("SIGTERM signal received.");
    console.log("Closing HTTP server.");
    handler.broadcastReconnectNotification();
    server.close(() => {
      console.log("HTTP server closed.");
    });
  });
});