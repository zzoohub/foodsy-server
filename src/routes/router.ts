import http from "http";
import url from "url";
import { UserRoutes } from "./userRoutes";
import { PostRoutes } from "./postRoutes";

export class Router {
  private userRoutes: UserRoutes;
  private postRoutes: PostRoutes;

  constructor() {
    this.userRoutes = new UserRoutes();
    this.postRoutes = new PostRoutes();
  }

  async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    try {
      const parsedUrl = url.parse(req.url || "", true);
      const path = parsedUrl.pathname || "/";
      const method = req.method || "GET";
      const pathSegments = path.split("/").filter(segment => segment);

      // 라우팅
      if (path === "/health") {
        this.healthCheck(res);
      } else if (pathSegments[0] === "api") {
        await this.handleApiRoutes(method, pathSegments.slice(1), req, res);
      } else {
        this.notFound(res);
      }
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private async handleApiRoutes(
    method: string,
    pathSegments: string[],
    req: http.IncomingMessage,
    res: http.ServerResponse,
  ): Promise<void> {
    const resource = pathSegments[0];
    const remainingSegments = pathSegments.slice(1);

    switch (resource) {
      case "users":
        await this.userRoutes.handleRequest(method, remainingSegments, req, res);
        break;
      case "posts":
        await this.postRoutes.handleRequest(method, remainingSegments, req, res);
        break;
      default:
        this.notFound(res);
    }
  }

  private healthCheck(res: http.ServerResponse): void {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "OK",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      }),
    );
  }

  private notFound(res: http.ServerResponse): void {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: "Not Found",
        message: "The requested resource was not found",
      }),
    );
  }

  private handleError(error: any, res: http.ServerResponse): void {
    console.error("Server Error:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      }),
    );
  }
}
