import { FollowService } from "./followService";
import { UserRepository } from "../user/userRepository";
import { GraphQLContext, PaginationInput } from "../../shared/types";

const followService = new FollowService();
const userRepository = new UserRepository();

export const followResolvers = {
  Query: {
    // 팔로워 목록 조회
    followers: async (_: any, { userId, pagination }: { userId: string; pagination: PaginationInput }) => {
      const result = await followService.getFollowers(userId, pagination);

      // 사용자 정보와 함께 반환
      const followersWithUserInfo = await Promise.all(
        result.data.map(async followerId => {
          const user = await userRepository.findByUsername(followerId);
          return user;
        }),
      );

      return {
        ...result,
        data: followersWithUserInfo.filter(user => user !== null),
      };
    },

    // 팔로잉 목록 조회
    following: async (_: any, { userId, pagination }: { userId: string; pagination: PaginationInput }) => {
      const result = await followService.getFollowing(userId, pagination);

      // 사용자 정보와 함께 반환
      const followingWithUserInfo = await Promise.all(
        result.data.map(async followedId => {
          const user = await userRepository.findByUsername(followedId);
          return user;
        }),
      );

      return {
        ...result,
        data: followingWithUserInfo.filter(user => user !== null),
      };
    },

    // 내 팔로워 목록 조회 (인증 필요)
    myFollowers: async (_: any, { pagination }: { pagination: PaginationInput }, context: GraphQLContext) => {
      if (!context.userId) {
        throw new Error("인증이 필요합니다.");
      }

      const result = await followService.getFollowers(context.userId, pagination);

      const followersWithUserInfo = await Promise.all(
        result.data.map(async followerId => {
          const user = await userRepository.findByUsername(followerId);
          return user;
        }),
      );

      return {
        ...result,
        data: followersWithUserInfo.filter(user => user !== null),
      };
    },

    // 내 팔로잉 목록 조회 (인증 필요)
    myFollowing: async (_: any, { pagination }: { pagination: PaginationInput }, context: GraphQLContext) => {
      if (!context.userId) {
        throw new Error("인증이 필요합니다.");
      }

      const result = await followService.getFollowing(context.userId, pagination);

      const followingWithUserInfo = await Promise.all(
        result.data.map(async followedId => {
          const user = await userRepository.findByUsername(followedId);
          return user;
        }),
      );

      return {
        ...result,
        data: followingWithUserInfo.filter(user => user !== null),
      };
    },

    // 팔로우 통계
    followStats: async (_: any, { userId }: { userId: string }) => {
      return await followService.getFollowStats(userId);
    },

    // 내 팔로우 통계 (인증 필요)
    myFollowStats: async (_: any, __: any, context: GraphQLContext) => {
      if (!context.userId) {
        throw new Error("인증이 필요합니다.");
      }
      return await followService.getFollowStats(context.userId);
    },

    // 상호 팔로우 목록
    mutualFollows: async (_: any, { userId1, userId2 }: { userId1: string; userId2: string }) => {
      const mutualFollowIds = await followService.getMutualFollows(userId1, userId2);

      const mutualFollowUsers = await Promise.all(
        mutualFollowIds.map(async userId => {
          const user = await userRepository.findByUsername(userId);
          return user;
        }),
      );

      return mutualFollowUsers.filter(user => user !== null);
    },

    // 팔로우 추천
    followSuggestions: async (_: any, { limit = 10 }: { limit?: number }, context: GraphQLContext) => {
      if (!context.userId) {
        throw new Error("인증이 필요합니다.");
      }

      const suggestionIds = await followService.getFollowSuggestions(context.userId, limit);

      const suggestionUsers = await Promise.all(
        suggestionIds.map(async userId => {
          const user = await userRepository.findByUsername(userId);
          return user;
        }),
      );

      return suggestionUsers.filter(user => user !== null);
    },

    // 팔로우 여부 확인
    isFollowing: async (
      _: any,
      { followingUserId, followedUserId }: { followingUserId: string; followedUserId: string },
    ) => {
      return await followService.isFollowing(followingUserId, followedUserId);
    },

    // 내가 팔로우하는지 확인 (인증 필요)
    amIFollowing: async (_: any, { userId }: { userId: string }, context: GraphQLContext) => {
      if (!context.userId) {
        return false;
      }
      return await followService.isFollowing(context.userId, userId);
    },
  },

  Mutation: {
    // 팔로우
    followUser: async (_: any, { userId }: { userId: string }, context: GraphQLContext) => {
      if (!context.userId) {
        throw new Error("인증이 필요합니다.");
      }

      const result = await followService.followUser(context.userId, userId);
      return result;
    },

    // 언팔로우
    unfollowUser: async (_: any, { userId }: { userId: string }, context: GraphQLContext) => {
      if (!context.userId) {
        throw new Error("인증이 필요합니다.");
      }

      const result = await followService.unfollowUser(context.userId, userId);
      return result;
    },

    // 팔로워 제거
    removeFollower: async (_: any, { followerId }: { followerId: string }, context: GraphQLContext) => {
      if (!context.userId) {
        throw new Error("인증이 필요합니다.");
      }

      const result = await followService.removeFollower(context.userId, followerId);
      return result;
    },
  },

  // User 타입에 팔로우 관련 필드 추가
  User: {
    // 팔로워 수
    followersCount: async (parent: any) => {
      const stats = await followService.getFollowStats(parent.username);
      return stats.followersCount;
    },

    // 팔로잉 수
    followingCount: async (parent: any) => {
      const stats = await followService.getFollowStats(parent.username);
      return stats.followingCount;
    },

    // 현재 사용자가 이 사용자를 팔로우하는지
    isFollowedByMe: async (parent: any, _: any, context: GraphQLContext) => {
      if (!context.userId) {
        return false;
      }
      return await followService.isFollowing(context.userId, parent.username);
    },

    // 이 사용자가 현재 사용자를 팔로우하는지
    isFollowingMe: async (parent: any, _: any, context: GraphQLContext) => {
      if (!context.userId) {
        return false;
      }
      return await followService.isFollowing(parent.username, context.userId);
    },

    // 상호 팔로우 여부
    isMutualFollow: async (parent: any, _: any, context: GraphQLContext) => {
      if (!context.userId) {
        return false;
      }

      const [isFollowedByMe, isFollowingMe] = await Promise.all([
        followService.isFollowing(context.userId, parent.username),
        followService.isFollowing(parent.username, context.userId),
      ]);

      return isFollowedByMe && isFollowingMe;
    },
  },
};
