import mongoose from "mongoose";

declare global {
  var mongooseConnection: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | undefined;
}

const globalCache = global.mongooseConnection || { conn: null as typeof mongoose | null, promise: null as Promise<typeof mongoose> | null };
global.mongooseConnection = globalCache;

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (globalCache.conn) return globalCache.conn;

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI is not set in environment variables");
  }

  if (!globalCache.promise) {
    globalCache.promise = mongoose
      .connect(mongoUri, {
        dbName: process.env.MONGODB_DB_NAME || undefined,
      })
      .then((m) => m);
  }

  globalCache.conn = await globalCache.promise;
  return globalCache.conn;
}

export default connectToDatabase;


