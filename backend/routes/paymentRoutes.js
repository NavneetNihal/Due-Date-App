import express from 'express';
import { 
  getPayments, 
  payMemberRenewal, 
  reverseMemberPayment 
} from '../controllers/paymentController.js';
import { protect, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('owner'));

router.get('/', getPayments);
router.post('/pay', payMemberRenewal);
router.post('/reverse', reverseMemberPayment);

export default router;
