import http from "http";
import { PostController } from "./controller/post.controller";
import { Router } from "./controller/router";

function main() {
  const server = new http.Server();

  server.on("request", (req, res) => {
    const router = new Router();
    router.route(req, res);
  });

  server.listen(3000, () => {
    console.log("Server is running on port 3000");
  });
}

main();
