export interface CreatePostInput {
  userId: string; // username 사용
  title?: string;
  content?: string;
  medias?: string[]; // 이미지/비디오 링크 배열
  calorie?: number;
}

export interface UpdatePostInput {
  title?: string;
  content?: string;
  medias?: string[];
  calorie?: number;
}

export class Post {
  constructor(
    public id: number,
    public userId: string, // username 사용
    public title?: string,
    public content?: string,
    public medias: string[] = [],
    public calorie?: number,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
  ) {}

  // 비즈니스 로직
  get isHealthy(): boolean {
    if (!this.calorie) return false;
    return this.calorie <= 500; // 500칼로리 이하를 건강한 음식으로 간주
  }

  get calorieCategory(): string {
    if (!this.calorie) return "Unknown";
    if (this.calorie <= 300) return "Low";
    if (this.calorie <= 600) return "Medium";
    return "High";
  }

  get hasMedia(): boolean {
    return this.medias.length > 0;
  }

  get mediaCount(): number {
    return this.medias.length;
  }

  getContentPreview(maxLength: number = 100): string {
    if (!this.content) return "";
    if (this.content.length <= maxLength) {
      return this.content;
    }
    return this.content.substring(0, maxLength) + "...";
  }

  // 권한 확인
  canBeEditedBy(username: string): boolean {
    return this.userId === username;
  }

  canBeDeletedBy(username: string): boolean {
    return this.userId === username;
  }

  // 미디어 관리
  addMedia(mediaUrl: string): void {
    if (!this.medias.includes(mediaUrl)) {
      this.medias.push(mediaUrl);
      this.updatedAt = new Date();
    }
  }

  removeMedia(mediaUrl: string): void {
    const index = this.medias.indexOf(mediaUrl);
    if (index > -1) {
      this.medias.splice(index, 1);
      this.updatedAt = new Date();
    }
  }

  // 검증 메서드
  static validate(data: CreatePostInput): string[] {
    const errors: string[] = [];

    if (!data.userId?.trim()) {
      errors.push("User ID is required");
    }

    // title과 content 중 하나는 있어야 함
    if (!data.title?.trim() && !data.content?.trim()) {
      errors.push("Either title or content is required");
    }

    if (data.title && data.title.length > 200) {
      errors.push("Title must be less than 200 characters");
    }

    if (data.calorie !== undefined && data.calorie < 0) {
      errors.push("Calorie cannot be negative");
    }

    if (data.medias && data.medias.length > 10) {
      errors.push("Maximum 10 media files allowed");
    }

    return errors;
  }

  // 팩토리 메서드
  static create(data: CreatePostInput): Post {
    const errors = Post.validate(data);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(", ")}`);
    }

    return new Post(
      0, // ID는 데이터베이스에서 생성
      data.userId,
      data.title,
      data.content,
      data.medias || [],
      data.calorie,
    );
  }

  // 업데이트 메서드
  update(data: UpdatePostInput): void {
    if (data.title !== undefined) this.title = data.title;
    if (data.content !== undefined) this.content = data.content;
    if (data.medias !== undefined) this.medias = [...data.medias];
    if (data.calorie !== undefined) this.calorie = data.calorie;

    this.updatedAt = new Date();
  }

  // 공개용 데이터
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      title: this.title,
      content: this.content,
      medias: this.medias,
      calorie: this.calorie,
      isHealthy: this.isHealthy,
      calorieCategory: this.calorieCategory,
      hasMedia: this.hasMedia,
      mediaCount: this.mediaCount,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
