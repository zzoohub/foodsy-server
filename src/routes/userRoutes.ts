import http from "http";
import { UserController } from "../controllers/userController";
import { BaseRoute } from "./baseRoute";

export class UserRoutes extends BaseRoute {
  private userController: UserController;

  constructor() {
    super();
    this.userController = new UserController();
  }

  async handleRequest(
    method: string,
    pathSegments: string[],
    req: http.IncomingMessage,
    res: http.ServerResponse,
  ): Promise<void> {
    const id = pathSegments[0]; // /api/users/:id에서 id 부분

    switch (method) {
      case "GET":
        if (id) {
          await this.userController.getUserById(req, res, id);
        } else {
          await this.userController.getUsers(req, res);
        }
        break;
      case "POST":
        if (id) {
          this.methodNotAllowed(res);
        } else {
          await this.userController.createUser(req, res);
        }
        break;
      case "PUT":
        if (id) {
          await this.userController.updateUser(req, res, id);
        } else {
          this.badRequest(res, "User ID is required for update");
        }
        break;
      case "DELETE":
        if (id) {
          await this.userController.deleteUser(req, res, id);
        } else {
          this.badRequest(res, "User ID is required for delete");
        }
        break;
      default:
        this.methodNotAllowed(res);
    }
  }
}
