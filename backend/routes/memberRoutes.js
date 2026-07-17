import express from 'express';
import { 
  getMembers, 
  addMember, 
  deleteMember,
  triggerRemindersManual
} from '../controllers/memberController.js';
import { protect, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Manual trigger route for reminders (protected test endpoint)
router.get('/trigger-reminders', authorizeRoles('owner', 'creator'), triggerRemindersManual);

// Other member routes are owner-only
router.use(authorizeRoles('owner'));
router.get('/', getMembers);
router.post('/', addMember);
router.delete('/:id', deleteMember);

export default router;

