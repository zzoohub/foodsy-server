import { Post, CreatePostInput } from "./Post";
import { PostRepository } from "./postRepository";
import { UserRepository } from "../user/userRepository";
import { ServiceResponse, PaginationInput, PaginatedResponse, PaginationOptions } from "../../shared/types";

export interface CreatePostData {
  title?: string;
  content: string;
  medias?: string[];
  calorie?: number;
}

export interface UpdatePostData {
  title?: string;
  content?: string;
  medias?: string[];
  calorie?: number;
}

export interface PostFilters {
  userId?: string;
  hasMedia?: boolean;
  minCalorie?: number;
  maxCalorie?: number;
  isHealthy?: boolean;
}

export class PostService {
  private postRepository: PostRepository;
  private userRepository: UserRepository;

  constructor() {
    this.postRepository = new PostRepository();
    this.userRepository = new UserRepository();
  }

  async createPost(userId: string, postData: CreatePostData): Promise<ServiceResponse<Post>> {
    try {
      // 사용자 존재 확인
      const user = await this.userRepository.findByUsername(userId);
      if (!user) {
        return {
          success: false,
          message: "사용자를 찾을 수 없습니다.",
          data: null,
        };
      }

      // 입력 검증
      const validation = this.validatePostData(postData);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.message,
          data: null,
        };
      }

      // CreatePostInput 형태로 변환
      const createInput: CreatePostInput = {
        userId,
        title: postData.title,
        content: postData.content,
        medias: postData.medias || [],
        calorie: postData.calorie,
      };

      const createdPost = await this.postRepository.create(createInput);

      return {
        success: true,
        message: "포스트가 성공적으로 생성되었습니다.",
        data: createdPost,
      };
    } catch (error) {
      console.error("PostService.createPost error:", error);
      return {
        success: false,
        message: "포스트 생성 중 오류가 발생했습니다.",
        data: null,
      };
    }
  }

  async getPostById(postId: number): Promise<ServiceResponse<Post>> {
    try {
      const post = await this.postRepository.findById(postId);

      if (!post) {
        return {
          success: false,
          message: "포스트를 찾을 수 없습니다.",
          data: null,
        };
      }

      return {
        success: true,
        message: "포스트를 성공적으로 조회했습니다.",
        data: post,
      };
    } catch (error) {
      console.error("PostService.getPostById error:", error);
      return {
        success: false,
        message: "포스트 조회 중 오류가 발생했습니다.",
        data: null,
      };
    }
  }

  async updatePost(postId: number, userId: string, updateData: UpdatePostData): Promise<ServiceResponse<Post>> {
    try {
      // 포스트 존재 및 권한 확인
      const existingPost = await this.postRepository.findById(postId);
      if (!existingPost) {
        return {
          success: false,
          message: "포스트를 찾을 수 없습니다.",
          data: null,
        };
      }

      if (existingPost.userId !== userId) {
        return {
          success: false,
          message: "포스트를 수정할 권한이 없습니다.",
          data: null,
        };
      }

      // 입력 검증
      const validation = this.validateUpdateData(updateData);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.message,
          data: null,
        };
      }

      // 포스트 업데이트
      const updatedPost = await this.postRepository.update(postId, updateData);

      if (!updatedPost) {
        return {
          success: false,
          message: "포스트 업데이트에 실패했습니다.",
          data: null,
        };
      }

      return {
        success: true,
        message: "포스트가 성공적으로 수정되었습니다.",
        data: updatedPost,
      };
    } catch (error) {
      console.error("PostService.updatePost error:", error);
      return {
        success: false,
        message: "포스트 수정 중 오류가 발생했습니다.",
        data: null,
      };
    }
  }

  async deletePost(postId: number, userId: string): Promise<ServiceResponse<boolean>> {
    try {
      // 포스트 존재 및 권한 확인
      const existingPost = await this.postRepository.findById(postId);
      if (!existingPost) {
        return {
          success: false,
          message: "포스트를 찾을 수 없습니다.",
          data: false,
        };
      }

      if (existingPost.userId !== userId) {
        return {
          success: false,
          message: "포스트를 삭제할 권한이 없습니다.",
          data: false,
        };
      }

      // 포스트 삭제
      const deleted = await this.postRepository.delete(postId);

      return {
        success: deleted,
        message: deleted ? "포스트가 성공적으로 삭제되었습니다." : "포스트 삭제에 실패했습니다.",
        data: deleted,
      };
    } catch (error) {
      console.error("PostService.deletePost error:", error);
      return {
        success: false,
        message: "포스트 삭제 중 오류가 발생했습니다.",
        data: false,
      };
    }
  }

  private convertPaginationInput(pagination: PaginationInput): PaginationOptions {
    return {
      page: pagination.page,
      limit: pagination.limit,
    };
  }

  async getPosts(pagination: PaginationInput, filters?: PostFilters): Promise<PaginatedResponse<Post>> {
    try {
      const options = this.convertPaginationInput(pagination);

      // 필터에 따라 다른 메서드 호출
      if (filters?.userId) {
        const result = await this.postRepository.findByUserId(filters.userId, options);
        return {
          data: result.data,
          total: result.total,
          page: result.page,
          limit: result.limit,
          hasNext: result.hasNext,
        };
      }

      if (filters?.isHealthy) {
        const result = await this.postRepository.findHealthyPosts(options);
        return {
          data: result.data,
          total: result.total,
          page: result.page,
          limit: result.limit,
          hasNext: result.hasNext,
        };
      }

      // 기본적으로 모든 포스트 조회
      const result = await this.postRepository.findAll(options);
      return {
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        hasNext: result.hasNext,
      };
    } catch (error) {
      console.error("PostService.getPosts error:", error);
      return {
        data: [],
        total: 0,
        page: pagination.page,
        limit: pagination.limit,
        hasNext: false,
      };
    }
  }

  async getUserPosts(userId: string, pagination: PaginationInput): Promise<PaginatedResponse<Post>> {
    try {
      const options = this.convertPaginationInput(pagination);
      const result = await this.postRepository.findByUserId(userId, options);

      return {
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        hasNext: result.hasNext,
      };
    } catch (error) {
      console.error("PostService.getUserPosts error:", error);
      return {
        data: [],
        total: 0,
        page: pagination.page,
        limit: pagination.limit,
        hasNext: false,
      };
    }
  }

  async getHealthyPosts(pagination: PaginationInput): Promise<PaginatedResponse<Post>> {
    try {
      const options = this.convertPaginationInput(pagination);
      const result = await this.postRepository.findHealthyPosts(options);

      return {
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        hasNext: result.hasNext,
      };
    } catch (error) {
      console.error("PostService.getHealthyPosts error:", error);
      return {
        data: [],
        total: 0,
        page: pagination.page,
        limit: pagination.limit,
        hasNext: false,
      };
    }
  }

  private validatePostData(data: CreatePostData): { isValid: boolean; message: string } {
    if (!data.content || data.content.trim().length === 0) {
      return { isValid: false, message: "포스트 내용은 필수입니다." };
    }

    if (data.content.length > 2000) {
      return { isValid: false, message: "포스트 내용은 2000자를 초과할 수 없습니다." };
    }

    if (data.title && data.title.length > 200) {
      return { isValid: false, message: "포스트 제목은 200자를 초과할 수 없습니다." };
    }

    if (data.calorie !== undefined && data.calorie < 0) {
      return { isValid: false, message: "칼로리는 0 이상이어야 합니다." };
    }

    if (data.medias && data.medias.length > 10) {
      return { isValid: false, message: "미디어는 최대 10개까지 첨부할 수 있습니다." };
    }

    return { isValid: true, message: "" };
  }

  private validateUpdateData(data: UpdatePostData): { isValid: boolean; message: string } {
    if (data.content !== undefined && data.content.trim().length === 0) {
      return { isValid: false, message: "포스트 내용은 비워둘 수 없습니다." };
    }

    if (data.content && data.content.length > 2000) {
      return { isValid: false, message: "포스트 내용은 2000자를 초과할 수 없습니다." };
    }

    if (data.title && data.title.length > 200) {
      return { isValid: false, message: "포스트 제목은 200자를 초과할 수 없습니다." };
    }

    if (data.calorie !== undefined && data.calorie < 0) {
      return { isValid: false, message: "칼로리는 0 이상이어야 합니다." };
    }

    if (data.medias && data.medias.length > 10) {
      return { isValid: false, message: "미디어는 최대 10개까지 첨부할 수 있습니다." };
    }

    return { isValid: true, message: "" };
  }
}
