// models/memoryAdapter.js
import { memoryStore } from './memoryStore.js';
import bcrypt from 'bcryptjs';

export class MemoryAdapter {
  async createUser(data) { return memoryStore.createUser(data); }
  async findByEmail(email) { return memoryStore.findByEmail(email); }
  async findById(id) { return memoryStore.findById(id); }
  async getAllUsers() { return memoryStore.getAllUsers(); }
  async updateUser(id, updates) { return memoryStore.updateUser(id, updates); }
  async deleteUser(id) { return memoryStore.deleteUser(id); }
  async getUserStats() { return memoryStore.getUserStats(); }

  async verifyPassword(user, plain) {
    return bcrypt.compare(plain, user.password);
  }

  async updateLastLogin(id) {
    return memoryStore.updateUser(id, { lastLogin: new Date() });
  }
}
