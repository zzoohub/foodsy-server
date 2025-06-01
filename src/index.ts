import http from "http";
import { graphql } from "graphql";
import { schema } from "./graphql/schema";
import { Database } from "./database/connection";
import { GraphQLContext } from "./shared/types";
import resolvers from "./graphql/resolvers";

class Server {
  private server: http.Server;

  constructor() {
    this.server = http.createServer(this.handleRequest.bind(this));
  }

  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    // CORS 헤더 설정
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-user-id");

    // OPTIONS 요청 처리
    if (req.method === "OPTIONS") {
      res.writeHead(200);
      res.end();
      return;
    }

    const url = req.url || "";

    try {
      // GraphQL 엔드포인트
      if (url === "/graphql" && req.method === "POST") {
        await this.handleGraphQL(req, res);
        return;
      }

      // Health check
      if (url === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "healthy",
            timestamp: new Date().toISOString(),
            version: "2.0.0 (Domain-Driven)",
          }),
        );
        return;
      }

      // 404
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal server error" }));
    }
  }

  private async handleGraphQL(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    try {
      // 요청 본문 파싱
      const body = await this.parseRequestBody(req);
      const { query, variables, operationName } = JSON.parse(body);

      // 컨텍스트 생성
      const context: GraphQLContext = {
        userId: req.headers["x-user-id"] ? (req.headers["x-user-id"] as string) : undefined,
      };

      // GraphQL 실행
      const result = await graphql({
        schema,
        source: query,
        rootValue: resolvers,
        contextValue: context,
        variableValues: variables,
        operationName,
      });

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
    } catch (error) {
      console.error("GraphQL error:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          errors: [{ message: "Internal server error" }],
        }),
      );
    }
  }

  private parseRequestBody(req: http.IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      let body = "";
      req.on("data", chunk => (body += chunk.toString()));
      req.on("end", () => resolve(body));
      req.on("error", reject);
    });
  }

  public async initialize(): Promise<void> {
    try {
      // 데이터베이스 연결
      const db = Database.getInstance();
      await db.query("SELECT 1"); // 연결 테스트

      console.log("✅ Database connected successfully");
      console.log("✅ Server initialization completed");
    } catch (error) {
      console.error("❌ Failed to initialize server:", error);
      throw error;
    }
  }

  public listen(port: number = 3000): void {
    this.server.listen(port, () => {
      console.log(`🚀 Foodsy Server v2.0 (Domain-Driven) running on port ${port}`);
      console.log(`📊 GraphQL endpoint: http://localhost:${port}/graphql`);
      console.log(`❤️  Health check: http://localhost:${port}/health`);
    });

    // Graceful shutdown
    process.on("SIGTERM", () => this.shutdown());
    process.on("SIGINT", () => this.shutdown());
  }

  private async shutdown(): Promise<void> {
    console.log("Shutting down gracefully...");
    this.server.close(() => {
      Database.getInstance().disconnect();
      process.exit(0);
    });
  }
}

// 서버 시작
async function startServer() {
  try {
    const server = new Server();
    await server.initialize();

    const port = parseInt(process.env.PORT || "3000");
    server.listen(port);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// 환경 변수 로드
if (process.env.NODE_ENV !== "production") {
  try {
    require("dotenv").config();
  } catch (error) {
    console.warn("dotenv not available, using default environment variables");
  }
}

startServer();
