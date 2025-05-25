import http from "http";
import { Router } from "./routes/router";

class Server {
  private server: http.Server;
  private router: Router;

  constructor() {
    this.router = new Router();
    this.server = http.createServer(this.handleRequest.bind(this));
  }

  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    // CORS 헤더 설정
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    // OPTIONS 요청 처리
    if (req.method === "OPTIONS") {
      res.writeHead(200);
      res.end();
      return;
    }

    // 라우터에 요청 위임
    await this.router.handleRequest(req, res);
  }

  public listen(port: number = 3000): void {
    this.server.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
    });
  }
}

// 서버 시작
const server = new Server();
server.listen(3000);
