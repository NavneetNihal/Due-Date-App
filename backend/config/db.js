import mongoose from 'mongoose';
import User from '../models/User.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/duedate');
    console.log(`🚀 MongoDB Connected: ${conn.connection.host}`);

    // Seed creator user if not exists (using .env config with fallback defaults)
    const creatorEmail = (process.env.CREATOR_EMAIL || 'lakranihal0070@gmail.com').toLowerCase().trim();
    const creatorPassword = (process.env.CREATOR_PASSWORD || 'creator123').trim();
    
    const creatorExists = await User.findOne({ email: creatorEmail });
    if (!creatorExists) {
      console.log('🌱 Seeding creator admin account...');
      await User.create({
        name: 'Navneet Nihal Lakra',
        email: creatorEmail,
        passwordHash: creatorPassword, // hooks auto-hash
        role: 'creator',
        businessName: 'Due Date Platform Creator',
        phone: '9999988888',
        subscriptionStatus: 'active',
        pricingPlan: 'basic',
        subscriptionDueDate: '2099-12-31',
        graceDaysRemaining: 9999,
        isEmailVerified: true
      });
      console.log(`🌱 Creator account successfully seeded (email: ${creatorEmail})`);
    }

  } catch (error) {
    console.error(`❌ Database connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
