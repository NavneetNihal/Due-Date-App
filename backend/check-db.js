import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Member from './models/Member.js';

dotenv.config();

const checkDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const members = await Member.find({});
    console.log('--- ALL MEMBERS IN MONGODB ---');
    members.forEach((m, idx) => {
      console.log(`${idx + 1}. Name: "${m.name}", Phone: "${m.phoneNumber}", Due Date: "${m.nextDueDate}", ID: "${m._id}"`);
    });
    console.log('------------------------------');
    mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
};

checkDB();
