import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { formatDate, addDays } from '../utils/dateHelpers.js';

// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecuresecretkey123!@#', {
    expiresIn: '30d'
  });
};

// @desc    Register a new Gym Owner
// @route   POST /api/auth/register
// @access  Public
export const registerOwner = async (req, res) => {
  const { name, email, password, businessName, phone } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email address already registered' });
    }

    // Default subscription setup: Trial 30 days, status active
    const subscriptionDueDate = addDays(formatDate(new Date()), 30);

    const user = await User.create({
      name,
      email,
      passwordHash: password, // auto-hashed by User model schema hooks
      role: 'owner',
      businessName: businessName || `${name}'s Gym`,
      phone: phone || '9999988888',
      subscriptionStatus: 'active',
      pricingPlan: 'basic',
      subscriptionDueDate,
      graceDaysRemaining: 10
    });

    res.status(201).json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        businessName: user.businessName,
        phone: user.phone,
        subscriptionStatus: user.subscriptionStatus,
        pricingPlan: user.pricingPlan,
        subscriptionDueDate: user.subscriptionDueDate,
        graceDaysRemaining: user.graceDaysRemaining,
        settings: user.settings,
        billingPayments: user.billingPayments
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// @desc    Login User (Gym Owner or Admin Creator)
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        businessName: user.businessName,
        phone: user.phone,
        subscriptionStatus: user.subscriptionStatus,
        pricingPlan: user.pricingPlan,
        subscriptionDueDate: user.subscriptionDueDate,
        graceDaysRemaining: user.graceDaysRemaining,
        settings: user.settings,
        billingPayments: user.billingPayments
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Get Current User Profile & Sync Subscription Status
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let modified = false;

    // Check subscription status if owner
    if (user.role === 'owner' && user.subscriptionDueDate) {
      const todayDate = new Date(formatDate(new Date()));
      const dueDate = new Date(user.subscriptionDueDate);

      if (todayDate > dueDate) {
        // Overdue status check
        if (user.subscriptionStatus === 'active') {
          user.subscriptionStatus = 'overdue';
          modified = true;
        }

        const diffTime = Math.abs(todayDate - dueDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const graceLeft = Math.max(0, 10 - diffDays);

        if (user.graceDaysRemaining !== graceLeft) {
          user.graceDaysRemaining = graceLeft;
          modified = true;
        }
      } else {
        // Status remains active if not manually revoked
        if (user.subscriptionStatus === 'overdue') {
          user.subscriptionStatus = 'active';
          user.graceDaysRemaining = 10;
          modified = true;
        }
      }
    }

    if (modified) {
      await user.save();
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      businessName: user.businessName,
      phone: user.phone,
      subscriptionStatus: user.subscriptionStatus,
      pricingPlan: user.pricingPlan,
      subscriptionDueDate: user.subscriptionDueDate,
      graceDaysRemaining: user.graceDaysRemaining,
      settings: user.settings,
      billingPayments: user.billingPayments
    });
  } catch (error) {
    console.error('Fetch profile error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};

// @desc    Update Settings (UPI ID, QR, template)
// @route   PUT /api/auth/settings
// @access  Private (Owner Only)
export const updateOwnerSettings = async (req, res) => {
  const { upiId, qrCode, whatsappTemplate, reminderFrequency } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (upiId !== undefined) user.settings.upiId = upiId;
    if (qrCode !== undefined) user.settings.qrCode = qrCode;
    if (whatsappTemplate !== undefined) user.settings.whatsappTemplate = whatsappTemplate;
    if (reminderFrequency !== undefined) user.settings.reminderFrequency = reminderFrequency;

    await user.save();

    res.json({
      message: 'Settings updated successfully',
      settings: user.settings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Server error updating settings' });
  }
};

// @desc    Update profile basic settings
// @route   PUT /api/auth/profile
// @access  Private (Owner Only)
export const updateOwnerProfile = async (req, res) => {
  const { name, businessName, phone } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (businessName) user.businessName = businessName;
    if (phone) user.phone = phone;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        businessName: user.businessName,
        phone: user.phone,
        subscriptionStatus: user.subscriptionStatus,
        pricingPlan: user.pricingPlan,
        subscriptionDueDate: user.subscriptionDueDate,
        graceDaysRemaining: user.graceDaysRemaining,
        settings: user.settings,
        billingPayments: user.billingPayments
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
};
