import { userResolvers } from "../domains/user/userResolver";
import { postResolvers } from "../domains/post/postResolver";
import { followResolvers } from "../domains/follow/followResolver";

// 모든 도메인의 리졸버를 통합
const resolvers = {
  Query: {
    // User queries
    ...userResolvers.Query,

    // Post queries
    ...postResolvers.Query,

    // Follow queries
    ...followResolvers.Query,
  },

  Mutation: {
    // User mutations
    ...userResolvers.Mutation,

    // Post mutations
    ...postResolvers.Mutation,

    // Follow mutations
    ...followResolvers.Mutation,
  },

  // Type resolvers
  User: {
    // User 타입의 기본 리졸버
    ...userResolvers.User,

    // Follow 관련 필드들
    ...followResolvers.User,
  },

  Post: {
    // Post 타입 리졸버
    ...postResolvers.Post,
  },
};

export default resolvers;
