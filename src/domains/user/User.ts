import { GenderType } from "../../shared/types";
import { isValidEmail, isValidPassword } from "../../shared/utils";

export interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  profilePicture?: string;
  gender?: GenderType;
  dateOfBirth?: Date;
}

export interface UpdateUserInput {
  email?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  profilePicture?: string;
  gender?: GenderType;
  dateOfBirth?: Date;
}

export class User {
  constructor(
    public username: string, // PK로 사용
    public email: string,
    public password: string,
    public phoneNumber?: string,
    public firstName?: string,
    public lastName?: string,
    public bio?: string,
    public profilePicture?: string,
    public gender: GenderType = GenderType.UNKNOWN,
    public dateOfBirth?: Date,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
  ) {}

  // 비즈니스 로직
  get fullName(): string {
    if (this.firstName && this.lastName) {
      return `${this.firstName} ${this.lastName}`;
    }
    return this.firstName || this.lastName || this.username;
  }

  get age(): number | null {
    if (!this.dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  get isAdult(): boolean {
    const userAge = this.age;
    return userAge !== null && userAge >= 18;
  }

  // 전화번호 검증
  get isValidPhoneNumber(): boolean {
    if (!this.phoneNumber) return true; // 선택사항이므로 없어도 유효
    const phoneRegex = /^[\d\-\+\(\)\s]+$/;
    return phoneRegex.test(this.phoneNumber) && this.phoneNumber.length >= 10;
  }

  // 검증 메서드
  static validate(data: CreateUserInput): string[] {
    const errors: string[] = [];

    if (!data.username?.trim()) {
      errors.push("Username is required");
    } else if (data.username.length < 3) {
      errors.push("Username must be at least 3 characters");
    } else if (data.username.length > 50) {
      errors.push("Username must be less than 50 characters");
    }

    if (!data.email?.trim()) {
      errors.push("Email is required");
    } else if (!isValidEmail(data.email)) {
      errors.push("Invalid email format");
    }

    if (!data.password) {
      errors.push("Password is required");
    } else if (!isValidPassword(data.password)) {
      errors.push("Password must be at least 6 characters");
    }

    if (data.phoneNumber) {
      const phoneRegex = /^[\d\-\+\(\)\s]+$/;
      if (!phoneRegex.test(data.phoneNumber) || data.phoneNumber.length < 10) {
        errors.push("Invalid phone number format");
      }
    }

    return errors;
  }

  // 팩토리 메서드
  static create(data: CreateUserInput): User {
    const errors = User.validate(data);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(", ")}`);
    }

    return new User(
      data.username,
      data.email,
      data.password,
      data.phoneNumber,
      data.firstName,
      data.lastName,
      data.bio,
      data.profilePicture,
      data.gender || GenderType.UNKNOWN,
      data.dateOfBirth,
    );
  }

  // 업데이트 메서드 (username은 변경 불가)
  update(data: UpdateUserInput): void {
    if (data.email !== undefined) this.email = data.email;
    if (data.phoneNumber !== undefined) this.phoneNumber = data.phoneNumber;
    if (data.firstName !== undefined) this.firstName = data.firstName;
    if (data.lastName !== undefined) this.lastName = data.lastName;
    if (data.bio !== undefined) this.bio = data.bio;
    if (data.profilePicture !== undefined) this.profilePicture = data.profilePicture;
    if (data.gender !== undefined) this.gender = data.gender;
    if (data.dateOfBirth !== undefined) this.dateOfBirth = data.dateOfBirth;

    this.updatedAt = new Date();
  }

  // 팔로우 가능 여부
  canFollow(other: User): boolean {
    return this.username !== other.username;
  }

  // 공개용 데이터 (비밀번호 제외)
  toPublicJSON() {
    return {
      username: this.username,
      email: this.email,
      phoneNumber: this.phoneNumber,
      firstName: this.firstName,
      lastName: this.lastName,
      fullName: this.fullName,
      bio: this.bio,
      profilePicture: this.profilePicture,
      gender: this.gender,
      dateOfBirth: this.dateOfBirth,
      age: this.age,
      isAdult: this.isAdult,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
