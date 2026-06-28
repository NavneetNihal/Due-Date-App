import express from 'express';
import { 
  registerOwner, 
  loginUser, 
  getUserProfile, 
  updateOwnerProfile, 
  updateOwnerSettings 
} from '../controllers/authController.js';
import { protect, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', registerOwner);
router.post('/login', loginUser);

router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, authorizeRoles('owner'), updateOwnerProfile);
router.put('/settings', protect, authorizeRoles('owner'), updateOwnerSettings);

export default router;
