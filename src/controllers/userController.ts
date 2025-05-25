import http from "http";
import { UserService } from "../services/userService";
import { parseRequestBody, sendJsonResponse, sendErrorResponse } from "../utils/httpUtils";

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async getUsers(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    try {
      const users = await this.userService.getAllUsers();
      sendJsonResponse(res, 200, {
        success: true,
        data: users,
        count: users.length,
      });
    } catch (error) {
      console.error("Error getting users:", error);
      sendErrorResponse(res, 500, "Failed to get users");
    }
  }

  async getUserById(req: http.IncomingMessage, res: http.ServerResponse, id: string): Promise<void> {
    try {
      const userId = parseInt(id, 10);

      if (isNaN(userId)) {
        sendErrorResponse(res, 400, "Invalid user ID");
        return;
      }

      const user = await this.userService.getUserById(userId);

      if (!user) {
        sendErrorResponse(res, 404, "User not found");
        return;
      }

      sendJsonResponse(res, 200, {
        success: true,
        data: user,
      });
    } catch (error) {
      console.error("Error getting user by ID:", error);
      if (error instanceof Error) {
        sendErrorResponse(res, 400, error.message);
      } else {
        sendErrorResponse(res, 500, "Failed to get user");
      }
    }
  }

  async createUser(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    try {
      const userData = await parseRequestBody(req);
      const user = await this.userService.createUser(userData);

      sendJsonResponse(res, 201, {
        success: true,
        data: user,
        message: "User created successfully",
      });
    } catch (error) {
      console.error("Error creating user:", error);
      if (error instanceof Error) {
        sendErrorResponse(res, 400, error.message);
      } else {
        sendErrorResponse(res, 500, "Failed to create user");
      }
    }
  }

  async updateUser(req: http.IncomingMessage, res: http.ServerResponse, id: string): Promise<void> {
    try {
      const userId = parseInt(id, 10);

      if (isNaN(userId)) {
        sendErrorResponse(res, 400, "Invalid user ID");
        return;
      }

      const userData = await parseRequestBody(req);
      const user = await this.userService.updateUser(userId, userData);

      if (!user) {
        sendErrorResponse(res, 404, "User not found");
        return;
      }

      sendJsonResponse(res, 200, {
        success: true,
        data: user,
        message: "User updated successfully",
      });
    } catch (error) {
      console.error("Error updating user:", error);
      if (error instanceof Error) {
        sendErrorResponse(res, 400, error.message);
      } else {
        sendErrorResponse(res, 500, "Failed to update user");
      }
    }
  }

  async deleteUser(req: http.IncomingMessage, res: http.ServerResponse, id: string): Promise<void> {
    try {
      const userId = parseInt(id, 10);

      if (isNaN(userId)) {
        sendErrorResponse(res, 400, "Invalid user ID");
        return;
      }

      const deleted = await this.userService.deleteUser(userId);

      if (!deleted) {
        sendErrorResponse(res, 404, "User not found");
        return;
      }

      sendJsonResponse(res, 200, {
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      if (error instanceof Error) {
        sendErrorResponse(res, 400, error.message);
      } else {
        sendErrorResponse(res, 500, "Failed to delete user");
      }
    }
  }
}
