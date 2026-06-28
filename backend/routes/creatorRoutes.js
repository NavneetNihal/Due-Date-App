import express from 'express';
import { 
  getPlatformStats, 
  getPlatformClients, 
  updateClientSubscriptionStatus, 
  deleteClient, 
  getDeveloperSettings, 
  updateDeveloperSettings, 
  getPlatformLedger, 
  submitSaaSRenewal 
} from '../controllers/creatorController.js';
import { protect, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Public route to fetch credentials (used by owners during checkout setup)
router.get('/settings', getDeveloperSettings);

// Protected routes
router.use(protect);

// Shared route (logs depend on user role: creator gets all, owner gets self)
router.get('/ledger', getPlatformLedger);

// Owner-only route
router.post('/checkout', authorizeRoles('owner'), submitSaaSRenewal);

// Creator-only routes
router.get('/stats', authorizeRoles('creator'), getPlatformStats);
router.get('/clients', authorizeRoles('creator'), getPlatformClients);
router.put('/clients/:id/status', authorizeRoles('creator'), updateClientSubscriptionStatus);
router.delete('/clients/:id', authorizeRoles('creator'), deleteClient);

export default router;
