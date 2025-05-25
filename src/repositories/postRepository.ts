import { CreatePostDto, Post, UpdatePostDto } from "../models/post";

export class PostRepository {
  private posts: Post[] = [
    {
      id: 1,
      name: "김치찌개",
      description: "매콤한 김치찌개",
      price: 8000,
      category: "한식",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      name: "파스타",
      description: "크림 파스타",
      price: 12000,
      category: "양식",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
  private nextId = 3;

  async findAll(): Promise<Post[]> {
    return Promise.resolve([...this.posts]);
  }

  async findById(id: number): Promise<Post | null> {
    const post = this.posts.find(post => post.id === id);
    return Promise.resolve(post || null);
  }

  async create(postData: CreatePostDto): Promise<Post> {
    const newPost: Post = {
      id: this.nextId++,
      name: postData.name,
      description: postData.description,
      price: postData.price,
      category: postData.category,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.posts.push(newPost);
    return Promise.resolve(newPost);
  }

  async update(id: number, postData: UpdatePostDto): Promise<Post | null> {
    const postIndex = this.posts.findIndex(post => post.id === id);

    if (postIndex === -1) {
      return Promise.resolve(null);
    }

    const updatedpost = {
      ...this.posts[postIndex],
      ...postData,
      updatedAt: new Date(),
    };

    this.posts[postIndex] = updatedpost;
    return Promise.resolve(updatedpost);
  }

  async delete(id: number): Promise<boolean> {
    const postIndex = this.posts.findIndex(post => post.id === id);

    if (postIndex === -1) {
      return Promise.resolve(false);
    }

    this.posts.splice(postIndex, 1);
    return Promise.resolve(true);
  }

  async findByCategory(category: string): Promise<Post[]> {
    const posts = this.posts.filter(post => post.category === category);
    return Promise.resolve(posts);
  }
}
