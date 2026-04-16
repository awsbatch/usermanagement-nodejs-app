// models/dbAdapter.js
import { config } from '../config/index.js';

let adapter;

export async function initDb() {
  if (config.useMongoDb) {
    console.log('🍃 Connecting to MongoDB...');
    const mongoose = (await import('mongoose')).default;
    await mongoose.connect(config.mongoUri);
    console.log('✅ MongoDB connected');
    const { MongoAdapter } = await import('./mongoAdapter.js');
    adapter = new MongoAdapter();
  } else {
    console.log('💾 Using in-memory store (no MongoDB)');
    const { MemoryAdapter } = await import('./memoryAdapter.js');
    adapter = new MemoryAdapter();
  }
  return adapter;
}

export function getDb() {
  if (!adapter) throw new Error('DB not initialized');
  return adapter;
}
