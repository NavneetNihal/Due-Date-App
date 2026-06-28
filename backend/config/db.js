import mongoose from 'mongoose';
import User from '../models/User.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/duedate');
    console.log(`🚀 MongoDB Connected: ${conn.connection.host}`);

    // Seed creator user if not exists
    const creatorEmail = 'creator@app.com';
    const creatorExists = await User.findOne({ email: creatorEmail });
    if (!creatorExists) {
      console.log('🌱 Seeding creator admin account...');
      await User.create({
        name: 'Navneet Nihal Lakra',
        email: creatorEmail,
        passwordHash: 'creator123', // hooks auto-hash
        role: 'creator',
        businessName: 'Due Date Platform Creator',
        phone: '9999988888',
        subscriptionStatus: 'active',
        pricingPlan: 'basic',
        subscriptionDueDate: '2099-12-31',
        graceDaysRemaining: 9999
      });
      console.log('🌱 Creator account successfully seeded (email: creator@app.com, password: creator123)');
    }
  } catch (error) {
    console.error(`❌ Database connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
