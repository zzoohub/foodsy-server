import { Database } from "../../database/connection";
import { PaginationOptions, PaginatedResult } from "../../shared/types";
import { validatePaginationOptions, calculateOffset, createPaginatedResult } from "../../shared/utils";
import { Follow, CreateFollowInput } from "./Follow";

interface FollowDbRow {
  following_user_id: string;
  followed_user_id: string;
  created_at: string;
}

interface FollowStats {
  followersCount: number;
  followingCount: number;
}

export class FollowRepository {
  private db = Database.getInstance();

  async create(followData: CreateFollowInput): Promise<Follow> {
    const query = `
      INSERT INTO follows (following_user_id, followed_user_id)
      VALUES ($1, $2)
      RETURNING following_user_id, followed_user_id, created_at
    `;

    const values = [followData.followingUserId, followData.followedUserId];

    const result = await this.db.query<FollowDbRow>(query, values);
    return this.mapRowToFollow(result.rows[0]);
  }

  async delete(followingUserId: string, followedUserId: string): Promise<boolean> {
    const query = `
      DELETE FROM follows 
      WHERE following_user_id = $1 AND followed_user_id = $2
    `;
    const result = await this.db.query(query, [followingUserId, followedUserId]);
    return (result.rowCount || 0) > 0;
  }

  async isFollowing(followingUserId: string, followedUserId: string): Promise<boolean> {
    const query = `
      SELECT 1 FROM follows 
      WHERE following_user_id = $1 AND followed_user_id = $2
    `;
    const result = await this.db.query(query, [followingUserId, followedUserId]);
    return result.rows.length > 0;
  }

  async getFollowers(userId: string, options?: PaginationOptions): Promise<PaginatedResult<string>> {
    const validatedOptions = validatePaginationOptions(options);
    const offset = calculateOffset(validatedOptions.page, validatedOptions.limit);

    const countQuery = `
      SELECT COUNT(*) as count FROM follows 
      WHERE followed_user_id = $1
    `;

    const dataQuery = `
      SELECT following_user_id FROM follows 
      WHERE followed_user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const [countResult, dataResult] = await Promise.all([
      this.db.query<{ count: string }>(countQuery, [userId]),
      this.db.query<{ following_user_id: string }>(dataQuery, [userId, validatedOptions.limit, offset]),
    ]);

    const total = parseInt(countResult.rows[0].count, 10);
    const followers = dataResult.rows.map(row => row.following_user_id);

    return createPaginatedResult(followers, total, validatedOptions);
  }

  async getFollowing(userId: string, options?: PaginationOptions): Promise<PaginatedResult<string>> {
    const validatedOptions = validatePaginationOptions(options);
    const offset = calculateOffset(validatedOptions.page, validatedOptions.limit);

    const countQuery = `
      SELECT COUNT(*) as count FROM follows 
      WHERE following_user_id = $1
    `;

    const dataQuery = `
      SELECT followed_user_id FROM follows 
      WHERE following_user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const [countResult, dataResult] = await Promise.all([
      this.db.query<{ count: string }>(countQuery, [userId]),
      this.db.query<{ followed_user_id: string }>(dataQuery, [userId, validatedOptions.limit, offset]),
    ]);

    const total = parseInt(countResult.rows[0].count, 10);
    const following = dataResult.rows.map(row => row.followed_user_id);

    return createPaginatedResult(following, total, validatedOptions);
  }

  async getFollowStats(userId: string): Promise<FollowStats> {
    const followersQuery = `
      SELECT COUNT(*) as count FROM follows 
      WHERE followed_user_id = $1
    `;

    const followingQuery = `
      SELECT COUNT(*) as count FROM follows 
      WHERE following_user_id = $1
    `;

    const [followersResult, followingResult] = await Promise.all([
      this.db.query<{ count: string }>(followersQuery, [userId]),
      this.db.query<{ count: string }>(followingQuery, [userId]),
    ]);

    return {
      followersCount: parseInt(followersResult.rows[0].count, 10),
      followingCount: parseInt(followingResult.rows[0].count, 10),
    };
  }

  async getMutualFollows(userId1: string, userId2: string): Promise<string[]> {
    const query = `
      SELECT f1.followed_user_id as mutual_user
      FROM follows f1
      INNER JOIN follows f2 ON f1.followed_user_id = f2.followed_user_id
      WHERE f1.following_user_id = $1 AND f2.following_user_id = $2
      ORDER BY f1.created_at DESC
    `;

    const result = await this.db.query<{ mutual_user: string }>(query, [userId1, userId2]);
    return result.rows.map(row => row.mutual_user);
  }

  // 데이터베이스 행을 Follow 객체로 변환
  private mapRowToFollow(row: FollowDbRow): Follow {
    return new Follow(row.following_user_id, row.followed_user_id, new Date(row.created_at));
  }
}

export { FollowStats };
