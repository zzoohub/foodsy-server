import { UserService } from "./userService";
import { UserRepository } from "./userRepository";
import { GraphQLContext } from "../../shared/types";
import { parseId, createSuccessResponse, createErrorResponse } from "../../shared/utils";

// 의존성 주입
const userRepository = new UserRepository();
const userService = new UserService(userRepository);

export const userResolvers = {
  Query: {
    // 현재 사용자 정보
    me: async (_: any, __: any, context: GraphQLContext) => {
      if (!context.userId) {
        throw new Error("Authentication required");
      }

      const user = await userService.getUserByUsername(context.userId);
      if (!user) {
        throw new Error("User not found");
      }

      return user;
    },

    // 사용자 조회 (username)
    user: async (_: any, { username }: { username: string }) => {
      const user = await userService.getUserByUsername(username);

      if (!user) {
        throw new Error("User not found");
      }

      return user.toPublicJSON();
    },

    // 사용자 목록
    users: async (_: any, { pagination }: { pagination?: any }) => {
      return userService.getAllUsers(pagination);
    },

    // 사용자 검색
    searchUsers: async (_: any, { query, pagination }: { query: string; pagination?: any }) => {
      const result = await userService.searchUsers(query, pagination);
      return {
        ...result,
        data: result.data.map(user => user.toPublicJSON()),
      };
    },

    // 이메일 사용 가능 여부
    checkEmailAvailability: async (_: any, { email, excludeUsername }: { email: string; excludeUsername?: string }) => {
      return userService.checkEmailAvailability(email, excludeUsername);
    },

    // 사용자명 사용 가능 여부
    checkUsernameAvailability: async (_: any, { username }: { username: string }) => {
      return userService.checkUsernameAvailability(username);
    },

    // 전화번호 사용 가능 여부
    checkPhoneAvailability: async (
      _: any,
      { phoneNumber, excludeUsername }: { phoneNumber: string; excludeUsername?: string },
    ) => {
      return userService.checkPhoneAvailability(phoneNumber, excludeUsername);
    },

    // 사용자 데이터 검증
    validateUserData: async (_: any, { userData }: { userData: any }) => {
      return userService.validateUserData(userData);
    },
  },

  Mutation: {
    // 사용자 생성
    createUser: async (_: any, { userData }: { userData: any }) => {
      try {
        const user = await userService.createUser(userData);
        return createSuccessResponse(user, "User created successfully");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to create user";
        return createErrorResponse(message);
      }
    },

    // 사용자 정보 업데이트
    updateUser: async (_: any, { username, updates }: { username: string; updates: any }) => {
      try {
        const user = await userService.updateUser(username, updates);

        if (!user) {
          return createErrorResponse("User not found", 404);
        }

        return createSuccessResponse(user, "User updated successfully");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to update user";
        return createErrorResponse(message);
      }
    },

    // 프로필 업데이트 (인증된 사용자)
    updateProfile: async (_: any, { updates }: { updates: any }, context: GraphQLContext) => {
      try {
        if (!context.userId) {
          return createErrorResponse("Authentication required", 401);
        }

        const user = await userService.updateUser(context.userId, updates);

        if (!user) {
          return createErrorResponse("User not found", 404);
        }

        return createSuccessResponse(user, "Profile updated successfully");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to update profile";
        return createErrorResponse(message);
      }
    },

    // 사용자 삭제
    deleteUser: async (_: any, { username }: { username: string }) => {
      try {
        const success = await userService.deleteUser(username);

        if (!success) {
          return createErrorResponse("User not found", 404);
        }

        return createSuccessResponse(null, "User deleted successfully");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to delete user";
        return createErrorResponse(message);
      }
    },
  },

  // 필드 리졸버
  User: {
    fullName: (user: any) => user.fullName,
    age: (user: any) => user.age,
    isAdult: (user: any) => user.isAdult,
  },
};

// 타입 정의 (GraphQL 스키마용)
export const userTypeDefs = `
  enum GenderType {
    male
    female
    unknown
  }

  input CreateUserInput {
    username: String!
    email: String!
    password: String!
    phoneNumber: String
    firstName: String
    lastName: String
    bio: String
    profilePicture: String
    gender: GenderType
    dateOfBirth: String
  }

  input UpdateUserInput {
    email: String
    phoneNumber: String
    firstName: String
    lastName: String
    bio: String
    profilePicture: String
    gender: GenderType
    dateOfBirth: String
  }

  type User {
    username: String!
    email: String!
    phoneNumber: String
    firstName: String
    lastName: String
    fullName: String!
    bio: String
    profilePicture: String
    gender: GenderType!
    dateOfBirth: String
    age: Int
    isAdult: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type PublicUser {
    username: String!
    phoneNumber: String
    firstName: String
    lastName: String
    fullName: String!
    bio: String
    profilePicture: String
    gender: GenderType!
    age: Int
    isAdult: Boolean!
    createdAt: String!
  }

  type PaginatedUsers {
    data: [PublicUser!]!
    total: Int!
    page: Int!
    limit: Int!
    totalPages: Int!
    hasNext: Boolean!
    hasPrev: Boolean!
  }

  type UserResponse {
    success: Boolean!
    message: String!
    data: User
    statusCode: Int
    timestamp: String!
  }

  type ValidationResponse {
    isValid: Boolean!
    errors: [String!]!
  }

  extend type Query {
    me: User
    user(username: String!): PublicUser
    users(pagination: PaginationInput): PaginatedUsers!
    searchUsers(query: String!, pagination: PaginationInput): PaginatedUsers!
    checkEmailAvailability(email: String!, excludeUsername: String): Boolean!
    checkUsernameAvailability(username: String!): Boolean!
    checkPhoneAvailability(phoneNumber: String!, excludeUsername: String): Boolean!
    validateUserData(userData: CreateUserInput!): ValidationResponse!
  }

  extend type Mutation {
    createUser(userData: CreateUserInput!): UserResponse!
    updateUser(username: String!, updates: UpdateUserInput!): UserResponse!
    updateProfile(updates: UpdateUserInput!): UserResponse!
    deleteUser(username: String!): UserResponse!
  }
`;
