import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  upiId: {
    type: String,
    required: true,
    default: '7004689533@ptyes'
  },
  qrCode: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;
