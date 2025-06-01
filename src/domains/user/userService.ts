import { User, CreateUserInput, UpdateUserInput } from "./User";
import { UserRepository } from "./userRepository";
import { PaginationOptions, PaginatedResult, AppError } from "../../shared/types";

export class UserService {
  constructor(private userRepository: UserRepository) {}

  async createUser(userData: CreateUserInput): Promise<User> {
    // 이메일 중복 확인
    const existingUserByEmail = await this.userRepository.findByEmail(userData.email);
    if (existingUserByEmail) {
      throw new AppError("Email already exists", 409, "EMAIL_EXISTS");
    }

    // 사용자명 중복 확인
    const existingUserByUsername = await this.userRepository.findByUsername(userData.username);
    if (existingUserByUsername) {
      throw new AppError("Username already exists", 409, "USERNAME_EXISTS");
    }

    // 전화번호 중복 확인 (있는 경우)
    if (userData.phoneNumber) {
      const existingUserByPhone = await this.userRepository.findByPhoneNumber(userData.phoneNumber);
      if (existingUserByPhone) {
        throw new AppError("Phone number already exists", 409, "PHONE_EXISTS");
      }
    }

    // User 엔티티 생성 (검증 포함)
    const user = User.create(userData);

    // 데이터베이스에 저장
    return this.userRepository.create(userData);
  }

  async getUserByUsername(username: string): Promise<User | null> {
    if (!username?.trim()) {
      throw new AppError("Username is required", 400, "USERNAME_REQUIRED");
    }

    return this.userRepository.findByUsername(username);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    if (!email?.trim()) {
      throw new AppError("Email is required", 400, "EMAIL_REQUIRED");
    }

    return this.userRepository.findByEmail(email);
  }

  async getUserByPhoneNumber(phoneNumber: string): Promise<User | null> {
    if (!phoneNumber?.trim()) {
      throw new AppError("Phone number is required", 400, "PHONE_REQUIRED");
    }

    return this.userRepository.findByPhoneNumber(phoneNumber);
  }

  async updateUser(username: string, updates: UpdateUserInput): Promise<User | null> {
    if (!username?.trim()) {
      throw new AppError("Username is required", 400, "USERNAME_REQUIRED");
    }

    // 사용자 존재 확인
    const existingUser = await this.userRepository.findByUsername(username);
    if (!existingUser) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    // 이메일 중복 확인 (다른 사용자가 사용 중인지)
    if (updates.email && updates.email !== existingUser.email) {
      const userWithEmail = await this.userRepository.findByEmail(updates.email);
      if (userWithEmail && userWithEmail.username !== username) {
        throw new AppError("Email already exists", 409, "EMAIL_EXISTS");
      }
    }

    // 전화번호 중복 확인 (다른 사용자가 사용 중인지)
    if (updates.phoneNumber && updates.phoneNumber !== existingUser.phoneNumber) {
      const userWithPhone = await this.userRepository.findByPhoneNumber(updates.phoneNumber);
      if (userWithPhone && userWithPhone.username !== username) {
        throw new AppError("Phone number already exists", 409, "PHONE_EXISTS");
      }
    }

    // 엔티티 업데이트 (비즈니스 로직 적용)
    existingUser.update(updates);

    // 데이터베이스 업데이트
    return this.userRepository.update(username, updates);
  }

  async deleteUser(username: string): Promise<boolean> {
    if (!username?.trim()) {
      throw new AppError("Username is required", 400, "USERNAME_REQUIRED");
    }

    const user = await this.userRepository.findByUsername(username);
    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    return this.userRepository.delete(username);
  }

  async getAllUsers(options?: PaginationOptions): Promise<PaginatedResult<User>> {
    return this.userRepository.findAll(options);
  }

  async searchUsers(query: string, options?: PaginationOptions): Promise<PaginatedResult<User>> {
    if (!query?.trim()) {
      throw new AppError("Search query is required", 400, "QUERY_REQUIRED");
    }

    return this.userRepository.searchUsers(query.trim(), options);
  }

  // 유틸리티 메서드
  async checkEmailAvailability(email: string, excludeUsername?: string): Promise<boolean> {
    if (!email?.trim()) {
      return false;
    }

    const existingUser = await this.userRepository.findByEmail(email);

    if (!existingUser) {
      return true;
    }

    // 특정 사용자 제외 (업데이트 시 사용)
    if (excludeUsername && existingUser.username === excludeUsername) {
      return true;
    }

    return false;
  }

  async checkUsernameAvailability(username: string): Promise<boolean> {
    if (!username?.trim()) {
      return false;
    }

    const existingUser = await this.userRepository.findByUsername(username);
    return !existingUser;
  }

  async checkPhoneAvailability(phoneNumber: string, excludeUsername?: string): Promise<boolean> {
    if (!phoneNumber?.trim()) {
      return true; // 전화번호는 선택사항
    }

    const existingUser = await this.userRepository.findByPhoneNumber(phoneNumber);

    if (!existingUser) {
      return true;
    }

    // 특정 사용자 제외 (업데이트 시 사용)
    if (excludeUsername && existingUser.username === excludeUsername) {
      return true;
    }

    return false;
  }

  // 비즈니스 로직 메서드
  async validateUserData(userData: Partial<CreateUserInput>): Promise<{ isValid: boolean; errors: string[] }> {
    try {
      if (userData.username && userData.email && userData.password) {
        User.validate(userData as CreateUserInput);
      }
      return { isValid: true, errors: [] };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Validation failed";
      const errors = message.replace("Validation failed: ", "").split(", ");
      return { isValid: false, errors };
    }
  }
}
