/**
 * One-time script: delete the old stale creator account from MongoDB
 * so it gets auto-created correctly on next login.
 * Run: node reset-creator.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

await mongoose.connect(process.env.MONGO_URI);
const result = await mongoose.connection.db
  .collection('users')
  .deleteOne({ email: (process.env.CREATOR_EMAIL || 'lakranihal0070@gmail.com').toLowerCase().trim() });

console.log(result.deletedCount
  ? '✅ Old creator account deleted. Now log in fresh at localhost:5173'
  : '⚠️  No creator account found (already clean).'
);
await mongoose.disconnect();
process.exit(0);
