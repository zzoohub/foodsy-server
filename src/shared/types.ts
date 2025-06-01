// 공통 타입 정의
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface PaginationInput {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
}

export enum GenderType {
  MALE = "male",
  FEMALE = "female",
  UNKNOWN = "unknown",
}

// GraphQL Context
export interface GraphQLContext {
  userId?: string; // username을 사용하므로 string으로 변경
  user?: any;
}

// 공통 응답 타입
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface ServiceResponse<T = any> {
  success: boolean;
  message: string;
  data: T | null;
}

// 에러 타입
export class AppError extends Error {
  constructor(message: string, public statusCode: number = 500, public code?: string) {
    super(message);
    this.name = "AppError";
  }
}
