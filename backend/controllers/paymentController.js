import Payment from '../models/Payment.js';
import Member from '../models/Member.js';
import { formatDate, addDays } from '../utils/dateHelpers.js';

// @desc    Get transaction ledger history
// @route   GET /api/payments
// @access  Private (Owner Only)
export const getPayments = async (req, res) => {
  const gymId = req.query.gymId || 'owner_golds';

  try {
    const payments = await Payment.find({
      ownerId: req.user._id,
      gymId: gymId
    }).sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    console.error('Fetch payments error:', error);
    res.status(500).json({ message: 'Server error fetching payments ledger' });
  }
};

// @desc    Mark member subscription as paid (extends due date, adds payment log)
// @route   POST /api/payments/pay
// @access  Private (Owner Only)
export const payMemberRenewal = async (req, res) => {
  const { memberId, paymentMethod, notes } = req.body;

  try {
    const member = await Member.findOne({
      _id: memberId,
      ownerId: req.user._id
    });

    if (!member) {
      return res.status(404).json({ message: 'Member not found or unauthorized' });
    }

    const todayStr = formatDate(new Date());
    let daysToAdd = 30;
    if (member.subscriptionTier === 'quarterly') daysToAdd = 90;
    if (member.subscriptionTier === 'yearly') daysToAdd = 365;

    // Standard business rule: If current due date is in the future, renew from that date.
    // If it's overdue or due today, renew from today's date.
    const baseDate = new Date(member.nextDueDate) > new Date(todayStr) 
      ? member.nextDueDate 
      : todayStr;

    const newDueDate = addDays(baseDate, daysToAdd);

    // Save extended member properties
    member.nextDueDate = newDueDate;
    member.status = 'active';
    await member.save();

    // Log the transaction
    const payment = await Payment.create({
      ownerId: req.user._id,
      gymId: member.gymId,
      memberId: member._id,
      memberName: member.name,
      amountPaid: member.amount,
      paymentDate: todayStr,
      paymentMethod: paymentMethod || 'UPI',
      notes: notes || `Subscription Renewal (${member.subscriptionTier.toUpperCase()})`
    });

    res.status(201).json({ member, payment });
  } catch (error) {
    console.error('Renew member error:', error);
    res.status(500).json({ message: 'Server error renewing subscription' });
  }
};

// @desc    Reverse payment (rolls back due date, logs negative ledger transaction)
// @route   POST /api/payments/reverse
// @access  Private (Owner Only)
export const reverseMemberPayment = async (req, res) => {
  const { paymentId } = req.body;

  try {
    const originalPayment = await Payment.findOne({
      _id: paymentId,
      ownerId: req.user._id
    });

    if (!originalPayment) {
      return res.status(404).json({ message: 'Transaction record not found or unauthorized' });
    }

    if (originalPayment.isReversal) {
      return res.status(400).json({ message: 'Cannot reverse an already reversed or correction transaction' });
    }

    const member = await Member.findOne({
      _id: originalPayment.memberId,
      ownerId: req.user._id
    });

    if (!member) {
      return res.status(404).json({ message: 'Associated member not found' });
    }

    // Rollback nextDueDate based on tier
    let daysToSubtract = -30;
    if (member.subscriptionTier === 'quarterly') daysToSubtract = -90;
    if (member.subscriptionTier === 'yearly') daysToSubtract = -365;

    const rolledBackDueDate = addDays(member.nextDueDate, daysToSubtract);
    member.nextDueDate = rolledBackDueDate;

    // Check if new due date is past today -> update status to inactive if needed
    const todayStr = formatDate(new Date());
    if (new Date(rolledBackDueDate) < new Date(todayStr)) {
      member.status = 'inactive';
    }
    await member.save();

    // Mark original payment as reversed
    originalPayment.isReversal = true;
    await originalPayment.save();

    // Add balancing negative ledger record
    const reversalPayment = await Payment.create({
      ownerId: req.user._id,
      gymId: originalPayment.gymId,
      memberId: originalPayment.memberId,
      memberName: originalPayment.memberName,
      amountPaid: -originalPayment.amountPaid,
      paymentDate: todayStr,
      paymentMethod: originalPayment.paymentMethod,
      notes: `REVERSAL: Error correction for txn ${originalPayment._id}`,
      isReversal: true
    });

    res.status(201).json({ member, payment: reversalPayment });
  } catch (error) {
    console.error('Reverse payment error:', error);
    res.status(500).json({ message: 'Server error reversing transaction' });
  }
};
