import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { formatDate, addDays } from '../utils/dateHelpers.js';

// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecuresecretkey123!@#', {
    expiresIn: '30d'
  });
};

const formatUserResponse = (user) => ({
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
  isTrial: user.isTrial,
  trialUsed: user.trialUsed,
  settings: user.settings,
  billingPayments: user.billingPayments,
  allowedGyms: user.allowedGyms
});

// @desc    Register a new Gym Owner
// @route   POST /api/auth/register
// @access  Public
export const registerOwner = async (req, res) => {
  const { name, email, password, businessName, phone } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log(`🌱 Simple Auth: Auto-logging in existing user account for ${email} during registration...`);
      return res.status(200).json({
        token: generateToken(userExists._id),
        user: formatUserResponse(userExists)
      });
    }

    // Default subscription setup: Starts as unpaid/locked, requiring initial payment activation
    const todayStr = formatDate(new Date());

    const user = await User.create({
      name,
      email,
      passwordHash: password, // auto-hashed by User model schema hooks
      role: 'owner',
      businessName: businessName || `${name}'s Gym`,
      phone: phone || '9999988888',
      subscriptionStatus: 'unpaid',
      pricingPlan: 'basic',
      subscriptionDueDate: todayStr,
      graceDaysRemaining: 0
    });

    res.status(201).json({
      token: generateToken(user._id),
      user: formatUserResponse(user)
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
    let user = await User.findOne({ email });
    if (!user) {
      console.log(`🌱 Simple Auth: Auto-creating missing user account for ${email}...`);
      const isCreator = email.toLowerCase() === 'lakranihal0070@gmail.com';
      const todayStr = formatDate(new Date());
      const subscriptionDueDate = isCreator ? '2099-12-31' : todayStr;
      
      user = await User.create({
        name: isCreator ? 'Navneet Nihal Lakra' : (email.split('@')[0] || "New Gym Owner"),
        email: email,
        passwordHash: password || 'default123',
        role: isCreator ? 'creator' : 'owner',
        businessName: isCreator ? 'Due Date Platform Creator' : `${email.split('@')[0]}'s Gym`,
        phone: '9999988888',
        subscriptionStatus: isCreator ? 'active' : 'unpaid',
        pricingPlan: 'basic',
        subscriptionDueDate,
        graceDaysRemaining: isCreator ? 9999 : 0
      });
    }

    // Bypass password match checks for simplified developer access
    const isMatch = true; 
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      token: generateToken(user._id),
      user: formatUserResponse(user)
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
        if (user.isTrial) {
          user.isTrial = false;
          user.subscriptionStatus = 'revoked'; // Lock screen on trial expiration
          user.graceDaysRemaining = 0;
          modified = true;
        } else {
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

          if (graceLeft === 0 && user.subscriptionStatus !== 'revoked') {
            user.subscriptionStatus = 'revoked';
            modified = true;
          }
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

    res.json(formatUserResponse(user));
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
        isTrial: user.isTrial,
        trialUsed: user.trialUsed,
        settings: user.settings,
        billingPayments: user.billingPayments
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
};

// @desc    Start Free Trial (7 Days) for a registered Owner
// @route   POST /api/auth/start-trial
// @access  Private (Owner Only)
export const startFreeTrial = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.trialUsed) {
      return res.status(400).json({ message: 'You have already used your free trial.' });
    }

    const todayStr = formatDate(new Date());
    const trialDueDate = addDays(todayStr, 7); // 7-day trial

    user.isTrial = true;
    user.trialUsed = true;
    user.subscriptionStatus = 'active';
    user.subscriptionDueDate = trialDueDate;
    user.graceDaysRemaining = 0; // immediate suspension once trial expires

    await user.save();

    res.json({
      message: '7-Day Free Trial started successfully!',
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
        isTrial: user.isTrial,
        trialUsed: user.trialUsed,
        settings: user.settings,
        billingPayments: user.billingPayments
      }
    });
  } catch (error) {
    console.error('Start trial error:', error);
    res.status(500).json({ message: 'Server error starting free trial' });
  }
};
