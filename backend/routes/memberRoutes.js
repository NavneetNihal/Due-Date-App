import express from 'express';
import { 
  getMembers, 
  addMember, 
  deleteMember,
  triggerRemindersManual
} from '../controllers/memberController.js';
import { protect, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Manual trigger route for reminders (public test endpoint)
router.get('/trigger-reminders', triggerRemindersManual);

router.use(protect);
router.use(authorizeRoles('owner'));

router.get('/', getMembers);
router.post('/', addMember);
router.delete('/:id', deleteMember);

export default router;
