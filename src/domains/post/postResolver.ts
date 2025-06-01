import { PostService, CreatePostData, UpdatePostData, PostFilters } from "./postService";
import { UserRepository } from "../user/userRepository";
import { GraphQLContext, PaginationInput } from "../../shared/types";

const postService = new PostService();
const userRepository = new UserRepository();

export const postResolvers = {
  Query: {
    // 포스트 단일 조회
    post: async (_: any, { id }: { id: number }) => {
      const result = await postService.getPostById(id);
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },

    // 포스트 목록 조회
    posts: async (_: any, { pagination, filters }: { pagination: PaginationInput; filters?: PostFilters }) => {
      return await postService.getPosts(pagination, filters);
    },

    // 사용자별 포스트 조회
    userPosts: async (_: any, { userId, pagination }: { userId: string; pagination: PaginationInput }) => {
      return await postService.getUserPosts(userId, pagination);
    },

    // 건강한 음식 포스트 조회
    healthyPosts: async (_: any, { pagination }: { pagination: PaginationInput }) => {
      return await postService.getHealthyPosts(pagination);
    },

    // 내 포스트 조회 (인증 필요)
    myPosts: async (_: any, { pagination }: { pagination: PaginationInput }, context: GraphQLContext) => {
      if (!context.userId) {
        throw new Error("인증이 필요합니다.");
      }
      return await postService.getUserPosts(context.userId, pagination);
    },
  },

  Mutation: {
    // 포스트 생성
    createPost: async (_: any, { postData }: { postData: CreatePostData }, context: GraphQLContext) => {
      if (!context.userId) {
        throw new Error("인증이 필요합니다.");
      }

      const result = await postService.createPost(context.userId, postData);
      return result;
    },

    // 포스트 수정
    updatePost: async (_: any, { id, postData }: { id: number; postData: UpdatePostData }, context: GraphQLContext) => {
      if (!context.userId) {
        throw new Error("인증이 필요합니다.");
      }

      const result = await postService.updatePost(id, context.userId, postData);
      return result;
    },

    // 포스트 삭제
    deletePost: async (_: any, { id }: { id: number }, context: GraphQLContext) => {
      if (!context.userId) {
        throw new Error("인증이 필요합니다.");
      }

      const result = await postService.deletePost(id, context.userId);
      return result;
    },
  },

  // Post 타입 리졸버
  Post: {
    // 작성자 정보 조회
    author: async (parent: any) => {
      const user = await userRepository.findByUsername(parent.userId);
      return user;
    },

    // 좋아요 수 조회
    likeCount: async (parent: any) => {
      // TODO: LikeRepository 구현 후 실제 좋아요 수 조회
      return 0;
    },

    // 현재 사용자의 좋아요 여부
    isLikedByMe: async (parent: any, _: any, context: GraphQLContext) => {
      if (!context.userId) {
        return false;
      }
      // TODO: LikeRepository 구현 후 실제 좋아요 여부 확인
      return false;
    },

    // 댓글 수 조회
    commentCount: async (parent: any) => {
      // TODO: CommentRepository 구현 후 실제 댓글 수 조회
      return 0;
    },

    // 미디어 개수
    mediaCount: async (parent: any) => {
      return parent.medias ? parent.medias.length : 0;
    },

    // 건강한 음식 여부
    isHealthy: async (parent: any) => {
      // 칼로리 기준으로 건강한 음식 판단 (500칼로리 이하)
      if (parent.calorie && parent.calorie <= 500) {
        return true;
      }

      // 키워드 기준으로 건강한 음식 판단
      const healthyKeywords = ["샐러드", "야채", "과일", "닭가슴살", "현미", "퀴노아", "아보카도", "견과류"];
      const content = (parent.title || "") + " " + (parent.content || "");

      return healthyKeywords.some(keyword => content.includes(keyword));
    },

    // 칼로리 레벨 (낮음/보통/높음)
    calorieLevel: async (parent: any) => {
      if (!parent.calorie) return "UNKNOWN";

      if (parent.calorie <= 300) return "LOW";
      if (parent.calorie <= 600) return "MEDIUM";
      return "HIGH";
    },

    // 포스트 요약 (첫 100자)
    summary: async (parent: any) => {
      if (!parent.content) return "";
      return parent.content.length > 100 ? parent.content.substring(0, 100) + "..." : parent.content;
    },

    // 작성일로부터 경과 시간
    timeAgo: async (parent: any) => {
      const now = new Date();
      const createdAt = new Date(parent.createdAt);
      const diffInMinutes = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60));

      if (diffInMinutes < 1) return "방금 전";
      if (diffInMinutes < 60) return `${diffInMinutes}분 전`;

      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours}시간 전`;

      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `${diffInDays}일 전`;

      const diffInWeeks = Math.floor(diffInDays / 7);
      if (diffInWeeks < 4) return `${diffInWeeks}주 전`;

      const diffInMonths = Math.floor(diffInDays / 30);
      return `${diffInMonths}개월 전`;
    },
  },
};
