import { Database } from "../../database/connection";
import { PaginationOptions, PaginatedResult, GenderType } from "../../shared/types";
import { validatePaginationOptions, calculateOffset, createPaginatedResult } from "../../shared/utils";
import { User, CreateUserInput } from "./User";

interface UserDbRow {
  username: string;
  email: string;
  password: string;
  phone_number?: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
  profile_picture?: string;
  gender?: string;
  date_of_birth?: string;
  created_at: string;
  updated_at: string;
}

export class UserRepository {
  private db = Database.getInstance();

  async findByUsername(username: string): Promise<User | null> {
    const query = `
      SELECT username, email, password, phone_number, first_name, last_name, bio, 
             profile_picture, gender, date_of_birth, created_at, updated_at
      FROM users WHERE username = $1
    `;

    const result = await this.db.query<UserDbRow>(query, [username]);
    return result.rows.length > 0 ? this.mapRowToUser(result.rows[0]) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT username, email, password, phone_number, first_name, last_name, bio, 
             profile_picture, gender, date_of_birth, created_at, updated_at
      FROM users WHERE email = $1
    `;

    const result = await this.db.query<UserDbRow>(query, [email]);
    return result.rows.length > 0 ? this.mapRowToUser(result.rows[0]) : null;
  }

  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    const query = `
      SELECT username, email, password, phone_number, first_name, last_name, bio, 
             profile_picture, gender, date_of_birth, created_at, updated_at
      FROM users WHERE phone_number = $1
    `;

    const result = await this.db.query<UserDbRow>(query, [phoneNumber]);
    return result.rows.length > 0 ? this.mapRowToUser(result.rows[0]) : null;
  }

  async create(userData: CreateUserInput): Promise<User> {
    const query = `
      INSERT INTO users (username, email, password, phone_number, first_name, last_name, bio, 
                        profile_picture, gender, date_of_birth)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING username, email, password, phone_number, first_name, last_name, bio, 
                profile_picture, gender, date_of_birth, created_at, updated_at
    `;

    const values = [
      userData.username,
      userData.email,
      userData.password,
      userData.phoneNumber || null,
      userData.firstName || null,
      userData.lastName || null,
      userData.bio || null,
      userData.profilePicture || null,
      userData.gender || "unknown",
      userData.dateOfBirth || null,
    ];

    const result = await this.db.query<UserDbRow>(query, values);
    return this.mapRowToUser(result.rows[0]);
  }

  async update(username: string, updates: Partial<User>): Promise<User | null> {
    const setParts: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.email !== undefined) {
      setParts.push(`email = $${paramCount++}`);
      values.push(updates.email);
    }
    if (updates.phoneNumber !== undefined) {
      setParts.push(`phone_number = $${paramCount++}`);
      values.push(updates.phoneNumber);
    }
    if (updates.firstName !== undefined) {
      setParts.push(`first_name = $${paramCount++}`);
      values.push(updates.firstName);
    }
    if (updates.lastName !== undefined) {
      setParts.push(`last_name = $${paramCount++}`);
      values.push(updates.lastName);
    }
    if (updates.bio !== undefined) {
      setParts.push(`bio = $${paramCount++}`);
      values.push(updates.bio);
    }
    if (updates.profilePicture !== undefined) {
      setParts.push(`profile_picture = $${paramCount++}`);
      values.push(updates.profilePicture);
    }
    if (updates.gender !== undefined) {
      setParts.push(`gender = $${paramCount++}`);
      values.push(updates.gender);
    }
    if (updates.dateOfBirth !== undefined) {
      setParts.push(`date_of_birth = $${paramCount++}`);
      values.push(updates.dateOfBirth);
    }

    if (setParts.length === 0) {
      return this.findByUsername(username);
    }

    setParts.push(`updated_at = NOW()`);
    values.push(username);

    const query = `
      UPDATE users 
      SET ${setParts.join(", ")}
      WHERE username = $${paramCount}
      RETURNING username, email, password, phone_number, first_name, last_name, bio, 
                profile_picture, gender, date_of_birth, created_at, updated_at
    `;

    const result = await this.db.query<UserDbRow>(query, values);
    return result.rows.length > 0 ? this.mapRowToUser(result.rows[0]) : null;
  }

  async delete(username: string): Promise<boolean> {
    const query = `DELETE FROM users WHERE username = $1`;
    const result = await this.db.query(query, [username]);
    return (result.rowCount || 0) > 0;
  }

  async findAll(options?: PaginationOptions): Promise<PaginatedResult<User>> {
    const validatedOptions = validatePaginationOptions(options);
    const offset = calculateOffset(validatedOptions.page, validatedOptions.limit);

    const countQuery = `SELECT COUNT(*) as count FROM users`;
    const dataQuery = `
      SELECT username, email, password, phone_number, first_name, last_name, bio, 
             profile_picture, gender, date_of_birth, created_at, updated_at
      FROM users 
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const [countResult, dataResult] = await Promise.all([
      this.db.query<{ count: string }>(countQuery),
      this.db.query<UserDbRow>(dataQuery, [validatedOptions.limit, offset]),
    ]);

    const total = parseInt(countResult.rows[0].count, 10);
    const users = dataResult.rows.map(row => this.mapRowToUser(row));

    return createPaginatedResult(users, total, validatedOptions);
  }

  async searchUsers(query: string, options?: PaginationOptions): Promise<PaginatedResult<User>> {
    const validatedOptions = validatePaginationOptions(options);
    const offset = calculateOffset(validatedOptions.page, validatedOptions.limit);
    const searchTerm = `%${query}%`;

    const countQuery = `
      SELECT COUNT(*) as count FROM users 
      WHERE username ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1
    `;

    const dataQuery = `
      SELECT username, email, password, phone_number, first_name, last_name, bio, 
             profile_picture, gender, date_of_birth, created_at, updated_at
      FROM users 
      WHERE username ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const [countResult, dataResult] = await Promise.all([
      this.db.query<{ count: string }>(countQuery, [searchTerm]),
      this.db.query<UserDbRow>(dataQuery, [searchTerm, validatedOptions.limit, offset]),
    ]);

    const total = parseInt(countResult.rows[0].count, 10);
    const users = dataResult.rows.map(row => this.mapRowToUser(row));

    return createPaginatedResult(users, total, validatedOptions);
  }

  // 데이터베이스 행을 User 객체로 변환
  private mapRowToUser(row: UserDbRow): User {
    return new User(
      row.username,
      row.email,
      row.password,
      row.phone_number || undefined,
      row.first_name || undefined,
      row.last_name || undefined,
      row.bio || undefined,
      row.profile_picture || undefined,
      (row.gender as GenderType) || GenderType.UNKNOWN,
      row.date_of_birth ? new Date(row.date_of_birth) : undefined,
      new Date(row.created_at),
      new Date(row.updated_at),
    );
  }
}
