import http from "http";

export function parseRequestBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", chunk => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        if (body.trim() === "") {
          resolve({});
        } else {
          resolve(JSON.parse(body));
        }
      } catch (error) {
        reject(new Error("Invalid JSON"));
      }
    });

    req.on("error", error => {
      reject(error);
    });
  });
}

export function sendJsonResponse(res: http.ServerResponse, statusCode: number, data: any): void {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

export function sendErrorResponse(res: http.ServerResponse, statusCode: number, message: string): void {
  sendJsonResponse(res, statusCode, {
    error: true,
    message,
    timestamp: new Date().toISOString(),
  });
}
