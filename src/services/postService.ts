import { Post, CreatePostDto, UpdatePostDto } from "../models/post";
import { PostRepository } from "../repositories/postRepository";

export class PostService {
  private postRepository: PostRepository;

  constructor() {
    this.postRepository = new PostRepository();
  }

  async getAllPosts(): Promise<Post[]> {
    return await this.postRepository.findAll();
  }

  async getPostById(id: number): Promise<Post | null> {
    if (id <= 0) {
      throw new Error("Invalid Post ID");
    }
    return await this.postRepository.findById(id);
  }

  async createPost(postData: CreatePostDto): Promise<Post> {
    // 비즈니스 로직: 입력 데이터 검증
    if (!postData.name || postData.name.trim().length === 0) {
      throw new Error("post name is required");
    }

    if (!postData.description || postData.description.trim().length === 0) {
      throw new Error("post description is required");
    }

    if (postData.price <= 0) {
      throw new Error("post price must be greater than 0");
    }

    if (!postData.category || postData.category.trim().length === 0) {
      throw new Error("post category is required");
    }

    return await this.postRepository.create(postData);
  }

  async updatePost(id: number, postData: UpdatePostDto): Promise<Post | null> {
    if (id <= 0) {
      throw new Error("Invalid Post ID");
    }

    // 기존 제품 확인
    const existingPost = await this.postRepository.findById(id);
    if (!existingPost) {
      return null;
    }

    // 입력 데이터 검증
    if (postData.name !== undefined && postData.name.trim().length === 0) {
      throw new Error("post name cannot be empty");
    }

    if (postData.description !== undefined && postData.description.trim().length === 0) {
      throw new Error("post description cannot be empty");
    }

    if (postData.price !== undefined && postData.price <= 0) {
      throw new Error("post price must be greater than 0");
    }

    if (postData.category !== undefined && postData.category.trim().length === 0) {
      throw new Error("post category cannot be empty");
    }

    return await this.postRepository.update(id, postData);
  }

  async deletePost(id: number): Promise<boolean> {
    if (id <= 0) {
      throw new Error("Invalid Post ID");
    }

    const Post = await this.postRepository.findById(id);
    if (!Post) {
      return false;
    }

    return await this.postRepository.delete(id);
  }

  async getPostsByCategory(category: string): Promise<Post[]> {
    if (!category || category.trim().length === 0) {
      throw new Error("Category is required");
    }

    return await this.postRepository.findByCategory(category);
  }
}
