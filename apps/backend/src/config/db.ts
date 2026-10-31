import mongoose from 'mongoose';
import { config } from './index';

let isConnected = false;

export async function connectDB(): Promise<boolean> {
  if (isConnected) return true;

  try {
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 3000,
    });
    isConnected = true;
    console.log(`[MongoDB] Connected to database: ${conn.connection.name}`);
    return true;
  } catch (err: any) {
    console.warn(`[MongoDB Warning] Could not connect to MongoDB (${err.message}). Running in Resilient In-Memory Mode with automatic persistence.`);
    isConnected = false;
    return false;
  }
}

export function isDbConnected(): boolean {
  return isConnected;
}
