// src/lib/dbConnect.ts
import mongoose from 'mongoose'
import { config } from './config'

type MongooseCache = {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  // allow global cache across module reloads in dev
  var _mongooseCache: MongooseCache
}

const cache: MongooseCache = global._mongooseCache || { conn: null, promise: null }

export default async function dbConnect() {
  if (cache.conn) {
    return cache.conn
  }
  if (!cache.promise) {
    cache.promise = mongoose
      .connect(config.mongodbUri)
      .then((mongoose) => mongoose)
  }
  cache.conn = await cache.promise
  global._mongooseCache = cache
  return cache.conn
}
