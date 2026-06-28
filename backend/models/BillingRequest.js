import mongoose from 'mongoose';

const billingRequestSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ownerName: {
    type: String,
    required: true
  },
  businessName: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    default: 699
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  requestDate: {
    type: String,
    required: true
  },
  upiTxnId: {
    type: String,
    default: ''
  },
  paymentMethod: {
    type: String,
    default: 'UPI'
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const BillingRequest = mongoose.model('BillingRequest', billingRequestSchema);
export default BillingRequest;
