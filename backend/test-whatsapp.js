import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Member from './models/Member.js';
import { formatDate } from './utils/dateHelpers.js';

dotenv.config();

const addTestMember = async () => {
  console.log('🔌 Connecting to MongoDB Atlas...');
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected!');

    const todayStr = formatDate(new Date());
    const testPhoneNumber = '7870015984'; // Your number

    // Delete any existing test members with this name first to prevent duplicate spam
    await Member.deleteMany({ name: 'Ni (Test Member)' });

    console.log(`🌱 Injecting test member into MongoDB with phone ${testPhoneNumber} and due date ${todayStr}...`);

    await Member.create({
      ownerId: new mongoose.Types.ObjectId(), // Fake owner ID
      gymId: 'owner_golds',
      name: 'Ni (Test Member)',
      phoneNumber: testPhoneNumber,
      joiningDate: todayStr,
      subscriptionTier: 'monthly',
      amount: 1000,
      nextDueDate: todayStr,
      status: 'active'
    });

    console.log('✅ Test member successfully written to MongoDB and kept there!');
    console.log('\n======================================================');
    console.log('👉 STEP 2: Now open your browser and visit:');
    console.log('👉 http://localhost:5001/api/members/trigger-reminders');
    console.log('======================================================\n');

    mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to add test member:', err);
    process.exit(1);
  }
};

addTestMember();
