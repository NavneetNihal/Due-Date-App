import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['owner', 'creator'],
    default: 'owner'
  },
  businessName: {
    type: String,
    default: "My Gym"
  },
  phone: {
    type: String,
    default: '9999988888'
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'overdue', 'revoked'],
    default: 'active'
  },
  pricingPlan: {
    type: String,
    default: 'basic'
  },
  totalPaidToCreator: {
    type: Number,
    default: 0
  },
  allowedGyms: {
    type: Number,
    default: 1
  },
  subscriptionDueDate: {
    type: String,
    required: true
  },
  isTrial: {
    type: Boolean,
    default: false
  },
  trialUsed: {
    type: Boolean,
    default: false
  },
  graceDaysRemaining: {
    type: Number,
    default: 10
  },
  settings: {
    upiId: { type: String, default: 'goldsgym@okaxis' },
    qrCode: { type: String, default: '' },
    whatsappTemplate: { type: String, default: 'Hello *{memberName}*,\n\nThis is a payment reminder from *{businessName}*.\nYour *{subscriptionTier}* subscription of *₹{amount}* is due on *{dueDate}*.\n\nPlease pay using our UPI ID: *{upiId}*.\n\nThank you!' },
    reminderFrequency: { type: String, default: 'standard' }
  },
  billingPayments: [{
    amount: Number,
    paymentDate: String,
    paymentMethod: { type: String, default: 'UPI' },
    notes: String,
    upiTxnId: String
  }]
}, {
  timestamps: true
});

// Compare password hashes
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// Auto hash passwords before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

const User = mongoose.model('User', userSchema);
export default User;
