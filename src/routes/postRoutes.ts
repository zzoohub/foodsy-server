import http from "http";
import { PostController } from "../controllers/postController";
import { BaseRoute } from "./baseRoute";

export class PostRoutes extends BaseRoute {
  private postController: PostController;

  constructor() {
    super();
    this.postController = new PostController();
  }

  async handleRequest(
    method: string,
    pathSegments: string[],
    req: http.IncomingMessage,
    res: http.ServerResponse,
  ): Promise<void> {
    const id = pathSegments[0]; // /api/posts/:id에서 id 부분

    switch (method) {
      case "GET":
        if (id) {
          await this.postController.getPostById(req, res, id);
        } else {
          await this.postController.getPosts(req, res);
        }
        break;
      case "POST":
        if (id) {
          this.methodNotAllowed(res);
        } else {
          await this.postController.createPost(req, res);
        }
        break;
      case "PUT":
        if (id) {
          await this.postController.updatePost(req, res, id);
        } else {
          this.badRequest(res, "Post ID is required for update");
        }
        break;
      case "DELETE":
        if (id) {
          await this.postController.deletePost(req, res, id);
        } else {
          this.badRequest(res, "Post ID is required for delete");
        }
        break;
      default:
        this.methodNotAllowed(res);
    }
  }
}
