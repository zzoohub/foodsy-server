import http from "http";
import { PostService } from "../services/postService";
import { parseRequestBody, sendJsonResponse, sendErrorResponse } from "../utils/httpUtils";

export class PostController {
  private postService: PostService;

  constructor() {
    this.postService = new PostService();
  }

  async getPosts(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    try {
      const posts = await this.postService.getAllPosts();
      sendJsonResponse(res, 200, {
        success: true,
        data: posts,
        count: posts.length,
      });
    } catch (error) {
      console.error("Error getting posts:", error);
      sendErrorResponse(res, 500, "Failed to get posts");
    }
  }

  async getPostById(req: http.IncomingMessage, res: http.ServerResponse, id: string): Promise<void> {
    try {
      const postId = parseInt(id, 10);

      if (isNaN(postId)) {
        sendErrorResponse(res, 400, "Invalid post ID");
        return;
      }

      const post = await this.postService.getPostById(postId);

      if (!post) {
        sendErrorResponse(res, 404, "post not found");
        return;
      }

      sendJsonResponse(res, 200, {
        success: true,
        data: post,
      });
    } catch (error) {
      console.error("Error getting post by ID:", error);
      if (error instanceof Error) {
        sendErrorResponse(res, 400, error.message);
      } else {
        sendErrorResponse(res, 500, "Failed to get post");
      }
    }
  }

  async createPost(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    try {
      const postData = await parseRequestBody(req);
      const post = await this.postService.createPost(postData);

      sendJsonResponse(res, 201, {
        success: true,
        data: post,
        message: "post created successfully",
      });
    } catch (error) {
      console.error("Error creating post:", error);
      if (error instanceof Error) {
        sendErrorResponse(res, 400, error.message);
      } else {
        sendErrorResponse(res, 500, "Failed to create post");
      }
    }
  }

  async updatePost(req: http.IncomingMessage, res: http.ServerResponse, id: string): Promise<void> {
    try {
      const postId = parseInt(id, 10);

      if (isNaN(postId)) {
        sendErrorResponse(res, 400, "Invalid post ID");
        return;
      }

      const postData = await parseRequestBody(req);
      const post = await this.postService.updatePost(postId, postData);

      if (!post) {
        sendErrorResponse(res, 404, "post not found");
        return;
      }

      sendJsonResponse(res, 200, {
        success: true,
        data: post,
        message: "post updated successfully",
      });
    } catch (error) {
      console.error("Error updating post:", error);
      if (error instanceof Error) {
        sendErrorResponse(res, 400, error.message);
      } else {
        sendErrorResponse(res, 500, "Failed to update post");
      }
    }
  }

  async deletePost(req: http.IncomingMessage, res: http.ServerResponse, id: string): Promise<void> {
    try {
      const postId = parseInt(id, 10);

      if (isNaN(postId)) {
        sendErrorResponse(res, 400, "Invalid post ID");
        return;
      }

      const deleted = await this.postService.deletePost(postId);

      if (!deleted) {
        sendErrorResponse(res, 404, "post not found");
        return;
      }

      sendJsonResponse(res, 200, {
        success: true,
        message: "post deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting post:", error);
      if (error instanceof Error) {
        sendErrorResponse(res, 400, error.message);
      } else {
        sendErrorResponse(res, 500, "Failed to delete post");
      }
    }
  }
}
