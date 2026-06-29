import User from '../models/User.js';
import Member from '../models/Member.js';
import Payment from '../models/Payment.js';
import BillingRequest from '../models/BillingRequest.js';
import Settings from '../models/Settings.js';
import { formatDate, addDays } from '../utils/dateHelpers.js';

// Helper to find or create singleton developer settings
const getDeveloperSettingsDoc = async () => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({
      upiId: '7004689533@ptyes',
      qrCode: ''
    });
  }
  return settings;
};

// @desc    Get SaaS stats (Total gyms, ARR, metrics)
// @route   GET /api/creator/stats
// @access  Private (Creator Only)
export const getPlatformStats = async (req, res) => {
  try {
    const totalGyms = await User.countDocuments({ role: 'owner' });
    const activeGyms = await User.countDocuments({ role: 'owner', subscriptionStatus: 'active' });
    
    // ARR: Active gyms * 699 * 12
    const arr = activeGyms * 699 * 12;

    res.json({
      totalGyms,
      activeGyms,
      arr,
      basicSubscribers: activeGyms
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({ message: 'Server error fetching statistics' });
  }
};

// @desc    Get Gym Owner Clients list
// @route   GET /api/creator/clients
// @access  Private (Creator Only)
export const getPlatformClients = async (req, res) => {
  try {
    const clients = await User.find({ role: 'owner' }).select('-passwordHash');

    // Populate registered members count for each client
    const enrichedClients = await Promise.all(clients.map(async (client) => {
      const memberCount = await Member.countDocuments({ ownerId: client._id });
      return {
        ...client.toObject(),
        id: client._id, // match client format
        registeredMembersCount: memberCount
      };
    }));

    res.json(enrichedClients);
  } catch (error) {
    console.error('Clients fetch error:', error);
    res.status(500).json({ message: 'Server error fetching client list' });
  }
};

// @desc    Modify Gym Owner subscription status manually (Revoke, Overdue, Activate)
// @route   PUT /api/creator/clients/:id/status
// @access  Private (Creator Only)
export const updateClientSubscriptionStatus = async (req, res) => {
  const { status, subscriptionDueDate, allowedGyms, recordPayment } = req.body;

  try {
    const client = await User.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    if (status) client.subscriptionStatus = status;
    if (subscriptionDueDate) client.subscriptionDueDate = subscriptionDueDate;
    if (allowedGyms !== undefined) client.allowedGyms = allowedGyms;

    if (recordPayment) {
      const todayStr = formatDate(new Date());
      client.totalPaidToCreator = (client.totalPaidToCreator || 0) + 699;
      client.billingPayments.push({
        amount: 699,
        paymentDate: todayStr,
        paymentMethod: 'UPI',
        notes: 'Manual payment approval by creator'
      });

      // Log the BillingRequest
      await BillingRequest.create({
        ownerId: client._id,
        ownerName: client.name,
        businessName: client.businessName,
        amount: 699,
        status: 'approved',
        requestDate: todayStr,
        upiTxnId: 'MANUAL_CREATOR_APPROVE',
        notes: 'Manual payment approval by creator'
      });
    }

    await client.save();

    res.json({
      message: 'Client subscription status updated successfully',
      client: {
        id: client._id,
        name: client.name,
        businessName: client.businessName,
        subscriptionStatus: client.subscriptionStatus,
        subscriptionDueDate: client.subscriptionDueDate,
        allowedGyms: client.allowedGyms,
        totalPaidToCreator: client.totalPaidToCreator,
        billingPayments: client.billingPayments
      }
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Server error updating client status' });
  }
};

// @desc    Creator delete client owner account
// @route   DELETE /api/creator/clients/:id
// @access  Private (Creator Only)
export const deleteClient = async (req, res) => {
  try {
    const client = await User.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    await User.deleteOne({ _id: req.params.id });
    // Also remove associated members
    await Member.deleteMany({ ownerId: req.params.id });

    res.json({ message: 'Client account deleted successfully' });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({ message: 'Server error deleting client' });
  }
};

// @desc    Get developer configurations (UPI settings)
// @route   GET /api/creator/settings
// @access  Public
export const getDeveloperSettings = async (req, res) => {
  try {
    const settings = await getDeveloperSettingsDoc();
    res.json(settings);
  } catch (error) {
    console.error('Fetch settings error:', error);
    res.status(500).json({ message: 'Server error fetching developer settings' });
  }
};

// @desc    Update developer settings
// @route   PUT /api/creator/settings
// @access  Private (Creator Only)
export const updateDeveloperSettings = async (req, res) => {
  const { upiId, qrCode } = req.body;

  try {
    const settings = await getDeveloperSettingsDoc();
    if (upiId) settings.upiId = upiId;
    if (qrCode !== undefined) settings.qrCode = qrCode;

    await settings.save();

    res.json({
      message: 'Developer settings updated successfully',
      settings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Server error updating developer configurations' });
  }
};

// @desc    Get Platform SaaS Billings logs
// @route   GET /api/creator/ledger
// @access  Private (Creator/Owner Shared)
export const getPlatformLedger = async (req, res) => {
  try {
    // If owner, only fetch their requests. If creator, fetch all requests.
    let filter = {};
    if (req.user.role === 'owner') {
      filter = { ownerId: req.user._id };
    }

    const logs = await BillingRequest.find(filter).sort({ createdAt: -1 });
    
    // Sum total platform earnings (approved requests only)
    const approvedLogs = await BillingRequest.find({ status: 'approved' });
    const totalEarnings = approvedLogs.reduce((sum, log) => sum + log.amount, 0);

    res.json({
      logs,
      totalEarnings
    });
  } catch (error) {
    console.error('Ledger logs error:', error);
    res.status(500).json({ message: 'Server error fetching SaaS billing logs' });
  }
};

// @desc    Submit SaaS checkout payment renewal request (Self-renew flat ₹699/mo)
// @route   POST /api/creator/checkout
// @access  Private (Owner Only)
export const submitSaaSRenewal = async (req, res) => {
  const { upiTxnId, notes } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const todayStr = formatDate(new Date());

    // Create the billing request as PENDING
    const billingReq = await BillingRequest.create({
      ownerId: user._id,
      ownerName: user.name,
      businessName: user.businessName,
      amount: 699,
      status: 'pending',
      requestDate: todayStr,
      upiTxnId: upiTxnId || 'Direct Pay',
      notes: notes || 'Subscription renewal payment'
    });

    res.status(201).json({
      message: 'SaaS payment request submitted successfully. Awaiting creator approval.',
      user: {
        id: user._id,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionDueDate: user.subscriptionDueDate,
        totalPaidToCreator: user.totalPaidToCreator,
        billingPayments: user.billingPayments
      },
      billingRequest: billingReq
    });
  } catch (error) {
    console.error('Renewal submission error:', error);
    res.status(500).json({ message: 'Server error submitting renewal payment' });
  }
};

// @desc    Reverse SaaS subscription payment for a gym owner
// @route   POST /api/creator/clients/:id/reverse
// @access  Private (Creator Only)
export const reverseClientPayment = async (req, res) => {
  try {
    const client = await User.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    if (!client.billingPayments || client.billingPayments.length === 0) {
      return res.status(400).json({ message: 'No payments found to reverse' });
    }

    // Find the last positive payment and remove it
    const lastPayment = client.billingPayments[client.billingPayments.length - 1];
    client.billingPayments.pop();
    client.totalPaidToCreator = Math.max(0, (client.totalPaidToCreator || 0) - lastPayment.amount);

    // Rollback due date by 30 days
    const todayStr = formatDate(new Date());
    const oldDueDate = client.subscriptionDueDate || todayStr;
    const newDueDate = addDays(oldDueDate, -30);
    client.subscriptionDueDate = newDueDate;

    // Recalculate status based on rolled back due date
    const todayDate = new Date(todayStr);
    const parsedNewDueDate = new Date(newDueDate);
    if (todayDate > parsedNewDueDate) {
      const diffDays = Math.ceil(Math.abs(todayDate - parsedNewDueDate) / (1000 * 60 * 60 * 24));
      client.subscriptionStatus = diffDays > 10 ? 'revoked' : 'overdue';
    } else {
      client.subscriptionStatus = 'active';
    }

    // Also remove from BillingRequests matching this client and amount
    const billingReq = await BillingRequest.findOne({ ownerId: client._id }).sort({ createdAt: -1 });
    if (billingReq) {
      await BillingRequest.deleteOne({ _id: billingReq._id });
    }

    await client.save();

    res.json({
      message: 'SaaS payment reversed successfully',
      client: {
        id: client._id,
        name: client.name,
        businessName: client.businessName,
        subscriptionStatus: client.subscriptionStatus,
        subscriptionDueDate: client.subscriptionDueDate,
        allowedGyms: client.allowedGyms,
        totalPaidToCreator: client.totalPaidToCreator,
        billingPayments: client.billingPayments
      }
    });
  } catch (error) {
    console.error('Reverse client payment error:', error);
    res.status(500).json({ message: 'Server error reversing client payment' });
  }
};

// @desc    Approve/Reject inbound billing request
// @route   PUT /api/creator/requests/:id
// @access  Private (Creator Only)
export const updateBillingRequestStatus = async (req, res) => {
  const { status } = req.body; // 'approved' or 'rejected'
  
  try {
    const billingReq = await BillingRequest.findById(req.params.id);
    if (!billingReq) {
      return res.status(404).json({ message: 'Request not found' });
    }

    billingReq.status = status;
    await billingReq.save();

    if (status === 'approved') {
      // Find the client owner
      const client = await User.findById(billingReq.ownerId);
      if (client) {
        const todayStr = formatDate(new Date());
        client.subscriptionStatus = 'active';
        client.graceDaysRemaining = 10;
        
        // Calculate next subscription due date
        const isExpired = client.subscriptionStatus === 'overdue' || 
                          client.subscriptionStatus === 'revoked' || 
                          client.subscriptionStatus === 'unpaid' ||
                          !client.subscriptionDueDate ||
                          new Date(client.subscriptionDueDate) < new Date(todayStr);
                          
        const baseDate = isExpired ? todayStr : client.subscriptionDueDate;
        const newDueDate = addDays(baseDate, 30);
        
        client.subscriptionDueDate = newDueDate;
        client.totalPaidToCreator = (client.totalPaidToCreator || 0) + billingReq.amount;
        
        // Add to billingPayments
        client.billingPayments.push({
          amount: billingReq.amount,
          paymentDate: todayStr,
          paymentMethod: 'UPI',
          notes: billingReq.notes || 'UPI Payment approved by creator'
        });

        // Parse requested plan and allowed gyms from notes if present
        const notesText = billingReq.notes || '';
        if (notesText.includes('Plan: growth')) {
          client.pricingPlan = 'growth';
        } else if (notesText.includes('Plan: basic') || notesText.includes('Plan: starter')) {
          client.pricingPlan = 'basic';
        }

        if (notesText.includes('Gyms: 2')) {
          client.allowedGyms = 2;
        } else if (notesText.includes('Gyms: 1')) {
          client.allowedGyms = 1;
        }

        await client.save();
      }
    }

    res.json({ message: `Request successfully ${status}`, request: billingReq });
  } catch (error) {
    console.error('Update request status error:', error);
    res.status(500).json({ message: 'Server error updating request status' });
  }
};
