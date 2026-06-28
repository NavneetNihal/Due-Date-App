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
  const { status, subscriptionDueDate, allowedGyms } = req.body;

  try {
    const client = await User.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    if (status) client.subscriptionStatus = status;
    if (subscriptionDueDate) client.subscriptionDueDate = subscriptionDueDate;
    if (allowedGyms !== undefined) client.allowedGyms = allowedGyms;

    await client.save();

    res.json({
      message: 'Client subscription status updated successfully',
      client: {
        id: client._id,
        name: client.name,
        businessName: client.businessName,
        subscriptionStatus: client.subscriptionStatus,
        subscriptionDueDate: client.subscriptionDueDate,
        allowedGyms: client.allowedGyms
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
    // If owner, only fetch their requests
    let filter = { status: 'approved' };
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
    const baseDate = new Date(user.subscriptionDueDate) > new Date(todayStr)
      ? user.subscriptionDueDate
      : todayStr;

    const extendedDate = addDays(baseDate, 30);

    // Create the billing request as APPROVED instantly (matching direct self-serve rule)
    const billingReq = await BillingRequest.create({
      ownerId: user._id,
      ownerName: user.name,
      businessName: user.businessName,
      amount: 699,
      status: 'approved',
      requestDate: todayStr,
      upiTxnId: upiTxnId || 'Direct Pay',
      notes: notes || 'Subscription renewal payment'
    });

    // Update owner user parameters
    user.subscriptionStatus = 'active';
    user.subscriptionDueDate = extendedDate;
    user.graceDaysRemaining = 10;
    user.totalPaidToCreator = (user.totalPaidToCreator || 0) + 699;
    user.billingPayments.push({
      amount: 699,
      paymentDate: todayStr,
      paymentMethod: 'UPI',
      notes: notes || 'Subscription renewal payment',
      upiTxnId: upiTxnId || 'Direct Pay'
    });

    await user.save();

    res.status(201).json({
      message: 'SaaS payment processed successfully. License activated!',
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
