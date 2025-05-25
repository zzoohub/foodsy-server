import { User, CreateUserDto, UpdateUserDto } from "../models/user";
import { UserRepository } from "../repositories/userRepository";

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async getAllUsers(): Promise<User[]> {
    return await this.userRepository.findAll();
  }

  async getUserById(id: number): Promise<User | null> {
    if (id <= 0) {
      throw new Error("Invalid user ID");
    }
    return await this.userRepository.findById(id);
  }

  async createUser(userData: CreateUserDto): Promise<User> {
    // 비즈니스 로직: 이메일 중복 검사
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new Error("Email already exists");
    }

    // 비즈니스 로직: 입력 데이터 검증
    if (!userData.name || userData.name.trim().length === 0) {
      throw new Error("Name is required");
    }

    if (!userData.email || !this.isValidEmail(userData.email)) {
      throw new Error("Valid email is required");
    }

    return await this.userRepository.create(userData);
  }

  async updateUser(id: number, userData: UpdateUserDto): Promise<User | null> {
    if (id <= 0) {
      throw new Error("Invalid user ID");
    }

    // 기존 사용자 확인
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      return null;
    }

    // 이메일 변경 시 중복 검사
    if (userData.email && userData.email !== existingUser.email) {
      const emailExists = await this.userRepository.findByEmail(userData.email);
      if (emailExists) {
        throw new Error("Email already exists");
      }
    }

    // 입력 데이터 검증
    if (userData.name !== undefined && userData.name.trim().length === 0) {
      throw new Error("Name cannot be empty");
    }

    if (userData.email !== undefined && !this.isValidEmail(userData.email)) {
      throw new Error("Valid email is required");
    }

    return await this.userRepository.update(id, userData);
  }

  async deleteUser(id: number): Promise<boolean> {
    if (id <= 0) {
      throw new Error("Invalid user ID");
    }

    const user = await this.userRepository.findById(id);
    if (!user) {
      return false;
    }

    return await this.userRepository.delete(id);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
