import express from 'express';
import { 
  registerOwner, 
  loginUser,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getUserProfile, 
  updateOwnerProfile, 
  updateOwnerSettings,
  startFreeTrial
} from '../controllers/authController.js';
import { protect, authorizeRoles } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

router.post('/register', registerOwner);
router.post('/login', loginUser);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);


// Temp debug: check if email exists in DB (safe — no password exposed)
router.get('/check/:email', async (req, res) => {
  const user = await User.findOne({ email: req.params.email.toLowerCase() });
  if (!user) return res.json({ exists: false });
  res.json({
    exists: true,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    subscriptionStatus: user.subscriptionStatus,
    hasPasswordHash: !!user.passwordHash
  });
});

router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, authorizeRoles('owner'), updateOwnerProfile);
router.put('/settings', protect, authorizeRoles('owner'), updateOwnerSettings);
router.post('/start-trial', protect, authorizeRoles('owner'), startFreeTrial);

export default router;
