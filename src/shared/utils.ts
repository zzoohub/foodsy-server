import { PaginationOptions, PaginatedResult } from "./types";

// ID 파싱 유틸리티
export const parseId = (id: string): number => {
  const parsed = parseInt(id, 10);
  if (isNaN(parsed) || parsed <= 0) {
    throw new Error(`Invalid ID: ${id}`);
  }
  return parsed;
};

// 날짜 포맷팅
export const formatDate = (date: Date): string => {
  return date.toISOString();
};

// 페이지네이션 유틸리티
export const createPaginatedResult = <T>(data: T[], total: number, options: PaginationOptions): PaginatedResult<T> => {
  const totalPages = Math.ceil(total / options.limit);

  return {
    data,
    total,
    page: options.page,
    limit: options.limit,
    totalPages,
    hasNext: options.page < totalPages,
    hasPrev: options.page > 1,
  };
};

// 페이지네이션 옵션 검증
export const validatePaginationOptions = (options?: Partial<PaginationOptions>): PaginationOptions => {
  return {
    page: Math.max(1, options?.page || 1),
    limit: Math.min(100, Math.max(1, options?.limit || 10)),
    sortBy: options?.sortBy,
    sortOrder: options?.sortOrder || "DESC",
  };
};

// SQL OFFSET/LIMIT 계산
export const calculateOffset = (page: number, limit: number): number => {
  return (page - 1) * limit;
};

// 이메일 검증
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 비밀번호 검증 (간단한 버전)
export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

// 에러 응답 생성
export const createErrorResponse = (message: string, statusCode: number = 400) => {
  return {
    success: false,
    message,
    statusCode,
    timestamp: new Date().toISOString(),
  };
};

// 성공 응답 생성
export const createSuccessResponse = <T>(data: T, message: string = "Success") => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
};
