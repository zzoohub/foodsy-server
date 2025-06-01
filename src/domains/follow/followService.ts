import { Follow } from "./Follow";
import { FollowRepository, FollowStats as RepoFollowStats } from "./followRepository";
import { UserRepository } from "../user/userRepository";
import { ServiceResponse, PaginationInput, PaginatedResponse, PaginationOptions } from "../../shared/types";

export interface FollowStats {
  followingCount: number;
  followersCount: number;
  mutualFollowsCount: number;
}

export class FollowService {
  private followRepository: FollowRepository;
  private userRepository: UserRepository;

  constructor() {
    this.followRepository = new FollowRepository();
    this.userRepository = new UserRepository();
  }

  async followUser(followingUserId: string, followedUserId: string): Promise<ServiceResponse<Follow>> {
    try {
      // 자기 자신을 팔로우하는지 확인
      if (followingUserId === followedUserId) {
        return {
          success: false,
          message: "자기 자신을 팔로우할 수 없습니다.",
          data: null,
        };
      }

      // 두 사용자가 모두 존재하는지 확인
      const [followingUser, followedUser] = await Promise.all([
        this.userRepository.findByUsername(followingUserId),
        this.userRepository.findByUsername(followedUserId),
      ]);

      if (!followingUser) {
        return {
          success: false,
          message: "팔로우하는 사용자를 찾을 수 없습니다.",
          data: null,
        };
      }

      if (!followedUser) {
        return {
          success: false,
          message: "팔로우할 사용자를 찾을 수 없습니다.",
          data: null,
        };
      }

      // 이미 팔로우 중인지 확인
      const isAlreadyFollowing = await this.followRepository.isFollowing(followingUserId, followedUserId);
      if (isAlreadyFollowing) {
        return {
          success: false,
          message: "이미 팔로우 중인 사용자입니다.",
          data: null,
        };
      }

      // 팔로우 생성
      const createdFollow = await this.followRepository.create({
        followingUserId,
        followedUserId,
      });

      return {
        success: true,
        message: "성공적으로 팔로우했습니다.",
        data: createdFollow,
      };
    } catch (error) {
      console.error("FollowService.followUser error:", error);
      return {
        success: false,
        message: "팔로우 중 오류가 발생했습니다.",
        data: null,
      };
    }
  }

  async unfollowUser(followingUserId: string, followedUserId: string): Promise<ServiceResponse<boolean>> {
    try {
      // 팔로우 관계가 존재하는지 확인
      const isFollowing = await this.followRepository.isFollowing(followingUserId, followedUserId);
      if (!isFollowing) {
        return {
          success: false,
          message: "팔로우 관계가 존재하지 않습니다.",
          data: false,
        };
      }

      // 언팔로우
      await this.followRepository.delete(followingUserId, followedUserId);

      return {
        success: true,
        message: "성공적으로 언팔로우했습니다.",
        data: true,
      };
    } catch (error) {
      console.error("FollowService.unfollowUser error:", error);
      return {
        success: false,
        message: "언팔로우 중 오류가 발생했습니다.",
        data: false,
      };
    }
  }

  async isFollowing(followingUserId: string, followedUserId: string): Promise<boolean> {
    try {
      return await this.followRepository.isFollowing(followingUserId, followedUserId);
    } catch (error) {
      console.error("FollowService.isFollowing error:", error);
      return false;
    }
  }

  private convertPaginationInput(pagination: PaginationInput): PaginationOptions {
    return {
      page: pagination.page,
      limit: pagination.limit,
    };
  }

  async getFollowers(userId: string, pagination: PaginationInput): Promise<PaginatedResponse<string>> {
    try {
      const options = this.convertPaginationInput(pagination);
      const result = await this.followRepository.getFollowers(userId, options);

      return {
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        hasNext: result.hasNext,
      };
    } catch (error) {
      console.error("FollowService.getFollowers error:", error);
      return {
        data: [],
        total: 0,
        page: pagination.page,
        limit: pagination.limit,
        hasNext: false,
      };
    }
  }

  async getFollowing(userId: string, pagination: PaginationInput): Promise<PaginatedResponse<string>> {
    try {
      const options = this.convertPaginationInput(pagination);
      const result = await this.followRepository.getFollowing(userId, options);

      return {
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        hasNext: result.hasNext,
      };
    } catch (error) {
      console.error("FollowService.getFollowing error:", error);
      return {
        data: [],
        total: 0,
        page: pagination.page,
        limit: pagination.limit,
        hasNext: false,
      };
    }
  }

  async getFollowStats(userId: string): Promise<FollowStats> {
    try {
      const stats = await this.followRepository.getFollowStats(userId);

      return {
        followingCount: stats.followingCount,
        followersCount: stats.followersCount,
        mutualFollowsCount: 0, // getMutualFollows는 두 사용자 간의 상호 팔로우를 확인하는 메서드이므로 여기서는 0으로 설정
      };
    } catch (error) {
      console.error("FollowService.getFollowStats error:", error);
      return {
        followingCount: 0,
        followersCount: 0,
        mutualFollowsCount: 0,
      };
    }
  }

  async getMutualFollows(userId1: string, userId2: string): Promise<string[]> {
    try {
      return await this.followRepository.getMutualFollows(userId1, userId2);
    } catch (error) {
      console.error("FollowService.getMutualFollows error:", error);
      return [];
    }
  }

  async getFollowSuggestions(userId: string, limit: number = 10): Promise<string[]> {
    try {
      // 현재 사용자가 팔로우하는 사람들
      const following = await this.followRepository.getFollowing(userId, { page: 1, limit: 1000 });
      const followingIds = new Set(following.data);

      // 팔로우하는 사람들이 팔로우하는 사람들 중에서 추천
      const suggestions = new Set<string>();

      for (const followedUserId of followingIds) {
        const theirFollowing = await this.followRepository.getFollowing(followedUserId, { page: 1, limit: 100 });

        for (const suggestedUserId of theirFollowing.data) {
          // 자기 자신이 아니고, 이미 팔로우하지 않은 사용자만 추천
          if (suggestedUserId !== userId && !followingIds.has(suggestedUserId)) {
            suggestions.add(suggestedUserId);

            if (suggestions.size >= limit) {
              break;
            }
          }
        }

        if (suggestions.size >= limit) {
          break;
        }
      }

      return Array.from(suggestions).slice(0, limit);
    } catch (error) {
      console.error("FollowService.getFollowSuggestions error:", error);
      return [];
    }
  }

  async removeFollower(userId: string, followerId: string): Promise<ServiceResponse<boolean>> {
    try {
      // 팔로우 관계가 존재하는지 확인
      const isFollowing = await this.followRepository.isFollowing(followerId, userId);
      if (!isFollowing) {
        return {
          success: false,
          message: "팔로우 관계가 존재하지 않습니다.",
          data: false,
        };
      }

      // 팔로워 제거
      await this.followRepository.delete(followerId, userId);

      return {
        success: true,
        message: "성공적으로 팔로워를 제거했습니다.",
        data: true,
      };
    } catch (error) {
      console.error("FollowService.removeFollower error:", error);
      return {
        success: false,
        message: "팔로워 제거 중 오류가 발생했습니다.",
        data: false,
      };
    }
  }
}
