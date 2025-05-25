import http from "http";

export abstract class BaseRoute {
  protected methodNotAllowed(res: http.ServerResponse): void {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: "Method Not Allowed",
        message: "The requested method is not allowed for this resource",
      }),
    );
  }

  protected badRequest(res: http.ServerResponse, message: string): void {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: "Bad Request",
        message,
      }),
    );
  }

  protected notFound(res: http.ServerResponse): void {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: "Not Found",
        message: "The requested resource was not found",
      }),
    );
  }

  protected internalServerError(res: http.ServerResponse, message: string = "An unexpected error occurred"): void {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: "Internal Server Error",
        message,
      }),
    );
  }

  // 각 도메인 라우트에서 구현해야 하는 추상 메서드
  abstract handleRequest(
    method: string,
    pathSegments: string[],
    req: http.IncomingMessage,
    res: http.ServerResponse,
  ): Promise<void>;
}
