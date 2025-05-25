export interface Post {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePostDto {
  name: string;
  description: string;
  price: number;
  category: string;
}

export interface UpdatePostDto {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
}
