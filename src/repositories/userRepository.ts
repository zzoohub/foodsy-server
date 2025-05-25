import { User, CreateUserDto, UpdateUserDto } from "../models/user";

export class UserRepository {
  private users: User[] = [
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
  private nextId = 3;

  async findAll(): Promise<User[]> {
    return Promise.resolve([...this.users]);
  }

  async findById(id: number): Promise<User | null> {
    const user = this.users.find(user => user.id === id);
    return Promise.resolve(user || null);
  }

  async create(userData: CreateUserDto): Promise<User> {
    const newUser: User = {
      id: this.nextId++,
      name: userData.name,
      email: userData.email,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.push(newUser);
    return Promise.resolve(newUser);
  }

  async update(id: number, userData: UpdateUserDto): Promise<User | null> {
    const userIndex = this.users.findIndex(user => user.id === id);

    if (userIndex === -1) {
      return Promise.resolve(null);
    }

    const updatedUser = {
      ...this.users[userIndex],
      ...userData,
      updatedAt: new Date(),
    };

    this.users[userIndex] = updatedUser;
    return Promise.resolve(updatedUser);
  }

  async delete(id: number): Promise<boolean> {
    const userIndex = this.users.findIndex(user => user.id === id);

    if (userIndex === -1) {
      return Promise.resolve(false);
    }

    this.users.splice(userIndex, 1);
    return Promise.resolve(true);
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = this.users.find(user => user.email === email);
    return Promise.resolve(user || null);
  }
}
