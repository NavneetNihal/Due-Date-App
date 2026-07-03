import Member from '../models/Member.js';
import User from '../models/User.js';
import { formatDate, addDays } from '../utils/dateHelpers.js';

// @desc    Get Gym Members list for the active outlet
// @route   GET /api/members
// @access  Private (Owner Only)
export const getMembers = async (req, res) => {
  const gymId = req.query.gymId || 'owner_golds';

  try {
    const members = await Member.find({ 
      ownerId: req.user._id,
      gymId: gymId
    });

    res.json(members);
  } catch (error) {
    console.error('Fetch members error:', error);
    res.status(500).json({ message: 'Server error fetching members' });
  }
};

// @desc    Add a Gym Member
// @route   POST /api/members
// @access  Private (Owner Only)
export const addMember = async (req, res) => {
  const { name, phoneNumber, subscriptionTier, amount, joiningDate, nextDueDate, gymId } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (!name || !phoneNumber || !subscriptionTier || amount === undefined) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Default dates if missing
    const finalJoiningDate = joiningDate || formatDate(new Date());
    let finalNextDueDate = nextDueDate;

    if (!finalNextDueDate) {
      if (subscriptionTier === 'monthly') {
        finalNextDueDate = addDays(finalJoiningDate, 30);
      } else if (subscriptionTier === 'quarterly') {
        finalNextDueDate = addDays(finalJoiningDate, 90);
      } else if (subscriptionTier === 'yearly') {
        finalNextDueDate = addDays(finalJoiningDate, 365);
      } else {
        finalNextDueDate = addDays(finalJoiningDate, 30);
      }
    }

    const member = await Member.create({
      ownerId: req.user._id,
      gymId: gymId || 'owner_golds',
      name,
      phoneNumber,
      joiningDate: finalJoiningDate,
      subscriptionTier,
      amount,
      nextDueDate: finalNextDueDate,
      status: 'active'
    });

    res.status(201).json(member);
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ message: 'Server error adding member' });
  }
};

// @desc    Delete a Gym Member (Keeps payments history intact)
// @route   DELETE /api/members/:id
// @access  Private (Owner Only)
export const deleteMember = async (req, res) => {
  try {
    const member = await Member.findOne({
      _id: req.params.id,
      ownerId: req.user._id
    });

    if (!member) {
      return res.status(404).json({ message: 'Member not found or unauthorized' });
    }

    await Member.deleteOne({ _id: req.params.id });

    res.json({ message: 'Member removed from registry successfully (Ledger intact)' });
  } catch (error) {
    console.error('Delete member error:', error);
    res.status(500).json({ message: 'Server error deleting member' });
  }
};
