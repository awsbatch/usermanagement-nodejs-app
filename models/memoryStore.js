// models/memoryStore.js
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

class MemoryStore {
  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    // Seed an admin user
    this._seedAdmin();
  }

  async _seedAdmin() {
    const hash = await bcrypt.hash('admin123', 10);
    const adminId = uuidv4();
    this.users.set(adminId, {
      _id: adminId,
      name: 'Admin User',
      email: 'admin@example.com',
      password: hash,
      role: 'admin',
      status: 'active',
      createdAt: new Date(),
      lastLogin: null,
      avatar: 'A',
    });
  }

  // USER METHODS
  async createUser({ name, email, password, role = 'user' }) {
    const existing = [...this.users.values()].find(u => u.email === email);
    if (existing) throw new Error('Email already exists');
    const hash = await bcrypt.hash(password, 10);
    const id = uuidv4();
    const user = {
      _id: id,
      name,
      email,
      password: hash,
      role,
      status: 'active',
      createdAt: new Date(),
      lastLogin: null,
      avatar: name.charAt(0).toUpperCase(),
    };
    this.users.set(id, user);
    return this._sanitize(user);
  }

  async findByEmail(email) {
    return [...this.users.values()].find(u => u.email === email) || null;
  }

  async findById(id) {
    return this.users.get(id) || null;
  }

  async getAllUsers() {
    return [...this.users.values()].map(u => this._sanitize(u));
  }

  async updateUser(id, updates) {
    const user = this.users.get(id);
    if (!user) throw new Error('User not found');
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }
    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    return this._sanitize(updated);
  }

  async deleteUser(id) {
    if (!this.users.has(id)) throw new Error('User not found');
    this.users.delete(id);
    return true;
  }

  async getUserStats() {
    const all = [...this.users.values()];
    return {
      total: all.length,
      active: all.filter(u => u.status === 'active').length,
      inactive: all.filter(u => u.status === 'inactive').length,
      admins: all.filter(u => u.role === 'admin').length,
    };
  }

  _sanitize(user) {
    const { password, ...safe } = user;
    return safe;
  }
}

export const memoryStore = new MemoryStore();
