import mongoose from 'mongoose';

/**
 * Connect to MongoDB. Retries a few times so the API can come up
 * alongside a starting database container/process.
 */
export async function connectDB(uri, attempt = 1) {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri);
    console.log(`✅ MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (err) {
    console.error(`❌ MongoDB connection failed (attempt ${attempt}):`, err.message);
    if (attempt >= 5) {
      console.error('Giving up on MongoDB. Check MONGO_URI and that mongod is running.');
      process.exit(1);
    }
    console.log('Retrying in 3s…');
    await new Promise((r) => setTimeout(r, 3000));
    return connectDB(uri, attempt + 1);
  }
}
