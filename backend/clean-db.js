import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Member from './models/Member.js';

dotenv.config();

const cleanDB = async () => {
  console.log('🔌 Connecting to MongoDB Atlas...');
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected!');

    // Delete the test member created by the test script
    console.log('🧹 Deleting "Ni (Test Member)"...');
    await Member.deleteMany({ name: 'Ni (Test Member)' });

    // Delete the old deleted member "nihal" with phone "7004689533"
    console.log('🧹 Deleting old offline member with phone "7004689533"...');
    await Member.deleteMany({ phoneNumber: '7004689533' });

    console.log('✨ Cleanup complete! Listing remaining members:');
    const remaining = await Member.find({});
    remaining.forEach((m, idx) => {
      console.log(`${idx + 1}. Name: "${m.name}", Phone: "${m.phoneNumber}", Due Date: "${m.nextDueDate}", ID: "${m._id}"`);
    });

    mongoose.disconnect();
    console.log('🔌 Disconnected.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Cleanup failed:', err);
    process.exit(1);
  }
};

cleanDB();
