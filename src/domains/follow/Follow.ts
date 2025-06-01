export interface CreateFollowInput {
  followingUserId: string; // 팔로우하는 사람 (username)
  followedUserId: string; // 팔로우당하는 사람 (username)
}

export class Follow {
  constructor(
    public followingUserId: string, // 팔로우하는 사람
    public followedUserId: string, // 팔로우당하는 사람
    public createdAt: Date = new Date(),
  ) {}

  // 검증 메서드
  static validate(data: CreateFollowInput): string[] {
    const errors: string[] = [];

    if (!data.followingUserId?.trim()) {
      errors.push("Following user ID is required");
    }

    if (!data.followedUserId?.trim()) {
      errors.push("Followed user ID is required");
    }

    if (data.followingUserId === data.followedUserId) {
      errors.push("Users cannot follow themselves");
    }

    return errors;
  }

  // 팩토리 메서드
  static create(data: CreateFollowInput): Follow {
    const errors = Follow.validate(data);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(", ")}`);
    }

    return new Follow(data.followingUserId, data.followedUserId);
  }

  // 공개용 데이터
  toJSON() {
    return {
      followingUserId: this.followingUserId,
      followedUserId: this.followedUserId,
      createdAt: this.createdAt,
    };
  }
}
