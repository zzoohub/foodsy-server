import { Database } from "../../database/connection";
import { PaginationOptions, PaginatedResult } from "../../shared/types";
import { validatePaginationOptions, calculateOffset, createPaginatedResult } from "../../shared/utils";
import { Post, CreatePostInput } from "./Post";

interface PostDbRow {
  id: number;
  user_id: string;
  title?: string;
  content?: string;
  medias?: string[];
  calorie?: number;
  created_at: string;
  updated_at: string;
}

export class PostRepository {
  private db = Database.getInstance();

  async findById(id: number): Promise<Post | null> {
    const query = `
      SELECT id, user_id, title, content, medias, calorie, created_at, updated_at
      FROM posts WHERE id = $1
    `;

    const result = await this.db.query<PostDbRow>(query, [id]);
    return result.rows.length > 0 ? this.mapRowToPost(result.rows[0]) : null;
  }

  async findByUserId(userId: string, options?: PaginationOptions): Promise<PaginatedResult<Post>> {
    const validatedOptions = validatePaginationOptions(options);
    const offset = calculateOffset(validatedOptions.page, validatedOptions.limit);

    const countQuery = `SELECT COUNT(*) as count FROM posts WHERE user_id = $1`;
    const dataQuery = `
      SELECT id, user_id, title, content, medias, calorie, created_at, updated_at
      FROM posts 
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const [countResult, dataResult] = await Promise.all([
      this.db.query<{ count: string }>(countQuery, [userId]),
      this.db.query<PostDbRow>(dataQuery, [userId, validatedOptions.limit, offset]),
    ]);

    const total = parseInt(countResult.rows[0].count, 10);
    const posts = dataResult.rows.map(row => this.mapRowToPost(row));

    return createPaginatedResult(posts, total, validatedOptions);
  }

  async create(postData: CreatePostInput): Promise<Post> {
    const query = `
      INSERT INTO posts (user_id, title, content, medias, calorie)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, user_id, title, content, medias, calorie, created_at, updated_at
    `;

    const values = [
      postData.userId,
      postData.title || null,
      postData.content || null,
      postData.medias || [],
      postData.calorie || null,
    ];

    const result = await this.db.query<PostDbRow>(query, values);
    return this.mapRowToPost(result.rows[0]);
  }

  async update(id: number, updates: Partial<Post>): Promise<Post | null> {
    const setParts: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.title !== undefined) {
      setParts.push(`title = $${paramCount++}`);
      values.push(updates.title);
    }
    if (updates.content !== undefined) {
      setParts.push(`content = $${paramCount++}`);
      values.push(updates.content);
    }
    if (updates.medias !== undefined) {
      setParts.push(`medias = $${paramCount++}`);
      values.push(updates.medias);
    }
    if (updates.calorie !== undefined) {
      setParts.push(`calorie = $${paramCount++}`);
      values.push(updates.calorie);
    }

    if (setParts.length === 0) {
      return this.findById(id);
    }

    setParts.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE posts 
      SET ${setParts.join(", ")}
      WHERE id = $${paramCount}
      RETURNING id, user_id, title, content, medias, calorie, created_at, updated_at
    `;

    const result = await this.db.query<PostDbRow>(query, values);
    return result.rows.length > 0 ? this.mapRowToPost(result.rows[0]) : null;
  }

  async delete(id: number): Promise<boolean> {
    const query = `DELETE FROM posts WHERE id = $1`;
    const result = await this.db.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  async findAll(options?: PaginationOptions): Promise<PaginatedResult<Post>> {
    const validatedOptions = validatePaginationOptions(options);
    const offset = calculateOffset(validatedOptions.page, validatedOptions.limit);

    const countQuery = `SELECT COUNT(*) as count FROM posts`;
    const dataQuery = `
      SELECT id, user_id, title, content, medias, calorie, created_at, updated_at
      FROM posts 
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const [countResult, dataResult] = await Promise.all([
      this.db.query<{ count: string }>(countQuery),
      this.db.query<PostDbRow>(dataQuery, [validatedOptions.limit, offset]),
    ]);

    const total = parseInt(countResult.rows[0].count, 10);
    const posts = dataResult.rows.map(row => this.mapRowToPost(row));

    return createPaginatedResult(posts, total, validatedOptions);
  }

  async searchPosts(query: string, options?: PaginationOptions): Promise<PaginatedResult<Post>> {
    const validatedOptions = validatePaginationOptions(options);
    const offset = calculateOffset(validatedOptions.page, validatedOptions.limit);
    const searchTerm = `%${query}%`;

    const countQuery = `
      SELECT COUNT(*) as count FROM posts 
      WHERE title ILIKE $1 OR content ILIKE $1
    `;

    const dataQuery = `
      SELECT id, user_id, title, content, medias, calorie, created_at, updated_at
      FROM posts 
      WHERE title ILIKE $1 OR content ILIKE $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const [countResult, dataResult] = await Promise.all([
      this.db.query<{ count: string }>(countQuery, [searchTerm]),
      this.db.query<PostDbRow>(dataQuery, [searchTerm, validatedOptions.limit, offset]),
    ]);

    const total = parseInt(countResult.rows[0].count, 10);
    const posts = dataResult.rows.map(row => this.mapRowToPost(row));

    return createPaginatedResult(posts, total, validatedOptions);
  }

  async findHealthyPosts(options?: PaginationOptions): Promise<PaginatedResult<Post>> {
    const validatedOptions = validatePaginationOptions(options);
    const offset = calculateOffset(validatedOptions.page, validatedOptions.limit);

    const countQuery = `SELECT COUNT(*) as count FROM posts WHERE calorie <= 500 AND calorie IS NOT NULL`;
    const dataQuery = `
      SELECT id, user_id, title, content, medias, calorie, created_at, updated_at
      FROM posts 
      WHERE calorie <= 500 AND calorie IS NOT NULL
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const [countResult, dataResult] = await Promise.all([
      this.db.query<{ count: string }>(countQuery),
      this.db.query<PostDbRow>(dataQuery, [validatedOptions.limit, offset]),
    ]);

    const total = parseInt(countResult.rows[0].count, 10);
    const posts = dataResult.rows.map(row => this.mapRowToPost(row));

    return createPaginatedResult(posts, total, validatedOptions);
  }

  // 데이터베이스 행을 Post 객체로 변환
  private mapRowToPost(row: PostDbRow): Post {
    return new Post(
      row.id,
      row.user_id,
      row.title || undefined,
      row.content || undefined,
      row.medias || [],
      row.calorie || undefined,
      new Date(row.created_at),
      new Date(row.updated_at),
    );
  }
}
