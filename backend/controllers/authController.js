import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { formatDate, addDays } from '../utils/dateHelpers.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/emailService.js';


// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecuresecretkey123!@#', {
    expiresIn: '30d'
  });
};

// Helper to generate a 6-digit OTP
const generateOTP = () => String(Math.floor(100000 + Math.random() * 900000));

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
  isEmailVerified: user.isEmailVerified,
  settings: user.settings,
  billingPayments: user.billingPayments,
  allowedGyms: user.allowedGyms
});

// @desc    Register a new Gym Owner
// @route   POST /api/auth/register
// @access  Public
export const registerOwner = async (req, res) => {
  const { name, email, password, businessName, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }

  try {
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      // Already registered and verified → tell them to log in
      if (existing.isEmailVerified) {
        return res.status(409).json({ message: 'Email already registered. Please log in.' });
      }
      // Already registered but NOT verified → send a new OTP and show OTP screen
      const code = generateOTP();
      existing.emailVerificationCode = code;
      existing.emailVerificationExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await existing.save();
      // Try to send email — don't crash if it fails
      try { await sendVerificationEmail(email, code); } catch (emailErr) {
        console.error('Email send failed (resend):', emailErr.message);
      }
      return res.status(200).json({
        requiresVerification: true,
        message: 'A new verification code has been sent to your email.'
      });
    }

    // New registration — give owner a 7-day free trial
    const code = generateOTP();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    await User.create({
      name,
      email: email.toLowerCase().trim(),
      passwordHash: password,
      role: 'owner',
      businessName: businessName || `${name}'s Gym`,
      phone: phone || '9999988888',
      subscriptionStatus: 'unpaid',
      pricingPlan: 'basic',
      subscriptionDueDate: formatDate(new Date()),
      graceDaysRemaining: 0,
      isTrial: false,
      trialUsed: false,
      isEmailVerified: false,
      emailVerificationCode: code,
      emailVerificationExpiry: expiry
    });

    // Try to send OTP email — if it fails, OTP screen still shows
    console.log(`🔑 [DEBUG] Registration Verification Code for ${email}: ${code}`);
    let emailSent = true;
    try { await sendVerificationEmail(email, code); } catch (emailErr) {
      emailSent = false;
      console.error('Email send failed:', emailErr.message);
    }


    res.status(201).json({
      requiresVerification: true,
      emailSent,
      message: emailSent
        ? 'Account created! Check your email for a 6-digit verification code.'
        : 'Account created! Email sending failed — check server Gmail config.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};


// @desc    Verify email OTP after registration
// @route   POST /api/auth/verify-email
// @access  Public
export const verifyEmail = async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: 'Email and code are required' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ message: 'Account not found' });
    }

    if (user.isEmailVerified) {
      return res.json({
        token: generateToken(user._id),
        user: formatUserResponse(user)
      });
    }

    if (!user.emailVerificationCode || user.emailVerificationCode !== code) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    if (user.emailVerificationExpiry < new Date()) {
      return res.status(400).json({ message: 'Verification code expired. Please register again to get a new code.' });
    }

    // Mark verified, clear OTP
    user.isEmailVerified = true;
    user.emailVerificationCode = null;
    user.emailVerificationExpiry = null;
    await user.save();

    res.json({
      token: generateToken(user._id),
      user: formatUserResponse(user)
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ message: 'Server error during verification' });
  }
};

// @desc    Login User (Gym Owner or Creator)
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // ── Creator login ─────────────────────────────────────────────────────────
    const creatorEmail = (process.env.CREATOR_EMAIL || 'lakranihal0070@gmail.com').toLowerCase().trim().replace(/\r/g, '');
    const creatorPassword = (process.env.CREATOR_PASSWORD || 'creator123').trim().replace(/\r/g, '');
    const incomingEmail = email.toLowerCase().trim();

    if (incomingEmail === creatorEmail) {
      if (password.trim() !== creatorPassword) {
        return res.status(401).json({ message: 'Invalid creator credentials' });
      }

      // Find or auto-create creator account
      let creator = await User.findOneAndUpdate(
        { email: creatorEmail },
        {
          $set: {
            role: 'creator',
            isEmailVerified: true,
            name: 'Navneet Nihal Lakra',
            businessName: 'Due Date Platform',
            subscriptionStatus: 'active',
            subscriptionDueDate: '2099-12-31',
            graceDaysRemaining: 9999
          }
        },
        { upsert: true, new: true }
      );

      return res.json({
        token: generateToken(creator._id),
        user: formatUserResponse(creator)
      });
    }

    // ── Regular gym owner login ───────────────────────────────────────────────
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password using bcrypt
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Block unverified users — resend OTP and ask them to verify
    if (!user.isEmailVerified) {
      const code = generateOTP();
      user.emailVerificationCode = code;
      user.emailVerificationExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();
      try { await sendVerificationEmail(email, code); } catch (emailErr) {
        console.error('Email resend failed during login:', emailErr.message);
      }
      return res.status(403).json({
        requiresVerification: true,
        message: 'Please verify your email. A new code has been sent to your inbox.'
      });
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

// @desc    Get Current User Profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
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
  const { name, businessName, phone, settings } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (businessName) user.businessName = businessName;
    if (phone) user.phone = phone;

    if (settings) {
      if (settings.upiId !== undefined) user.settings.upiId = settings.upiId;
      if (settings.qrCode !== undefined) user.settings.qrCode = settings.qrCode;
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: formatUserResponse(user)
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
};

// @desc    Start Free Trial (7 Days)
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
    const trialDueDate = addDays(todayStr, 7);

    user.isTrial = true;
    user.trialUsed = true;
    user.subscriptionStatus = 'active';
    user.subscriptionDueDate = trialDueDate;
    user.graceDaysRemaining = 0;

    await user.save();

    res.json({
      message: '7-Day Free Trial started successfully!',
      user: formatUserResponse(user)
    });
  } catch (error) {
    console.error('Start trial error:', error);
    res.status(500).json({ message: 'Server error starting free trial' });
  }
};

// @desc    Request password reset OTP code
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // Security best practice: don't reveal if email doesn't exist
      return res.json({ message: 'If this email exists in our records, a reset code has been sent.' });
    }

    const code = generateOTP();
    user.resetPasswordCode = code;
    user.resetPasswordExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    console.log(`🔑 [DEBUG] Reset Code for ${user.email}: ${code}`);
    let emailSent = true;
    try {
      await sendPasswordResetEmail(user.email, code);
    } catch (emailErr) {
      emailSent = false;
      console.error('Reset password email failed:', emailErr.message);
    }


    res.json({
      emailSent,
      message: emailSent
        ? 'If this email exists in our records, a reset code has been sent.'
        : 'Failed to send reset email. Contact administrator.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error during forgot password request' });
  }
};

// @desc    Reset password using OTP code
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  const { email, code, password } = req.body;

  if (!email || !code || !password) {
    return res.status(400).json({ message: 'All fields (email, code, new password) are required' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ message: 'Account not found' });
    }

    if (!user.resetPasswordCode || user.resetPasswordCode !== code) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    if (user.resetPasswordExpiry < new Date()) {
      return res.status(400).json({ message: 'Verification code expired. Request a new one.' });
    }

    // Set new password (hooks will hash it on save)
    user.passwordHash = password;
    user.resetPasswordCode = null;
    user.resetPasswordExpiry = null;
    await user.save();

    res.json({ message: 'Password reset successful! You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error resetting password' });
  }
};

