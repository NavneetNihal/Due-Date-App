import { formatDate } from './dateHelpers.js';
import api from '../api.js';

export const useAuthActions = (user, setUser, _gymOwners, _setGymOwners) => {
  // Helper to generate persistent mock users for offline fallbacks
  const generateMockUser = (email, username = '') => {
    const isCreator = email.toLowerCase() === 'lakranihal0070@gmail.com';
    const todayStr = formatDate(new Date());
    let mockUser = {
      id: isCreator ? 'creator_admin' : `mock_owner_${email.replace(/[^a-zA-Z0-9]/g, '')}`,
      name: isCreator ? 'Navneet Nihal Lakra' : (username || email.split('@')[0] || "New Gym Owner"),
      email: email,
      role: isCreator ? 'creator' : 'owner',
      businessName: isCreator ? 'Due Date Platform Creator' : (username ? `${username}'s Gym` : `${email.split('@')[0]}'s Gym`),
      phone: '9999988888',
      subscriptionStatus: isCreator ? 'active' : 'unpaid',
      pricingPlan: 'basic',
      subscriptionDueDate: isCreator ? '2099-12-31' : todayStr,
      graceDaysRemaining: isCreator ? 9999 : 0,
      billingPayments: []
    };

    if (!isCreator) {
      const savedOwners = localStorage.getItem('mock_gym_owners');
      let ownersList = savedOwners ? JSON.parse(savedOwners) : [];
      let existingOwner = ownersList.find(o => o.email.toLowerCase() === email.toLowerCase());
      if (!existingOwner) {
        existingOwner = {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          businessName: mockUser.businessName,
          phone: mockUser.phone,
          subscriptionStatus: mockUser.subscriptionStatus,
          pricingPlan: mockUser.pricingPlan,
          subscriptionDueDate: mockUser.subscriptionDueDate,
          allowedGyms: 1,
          totalPaidToCreator: 0,
          billingPayments: []
        };
        ownersList.push(existingOwner);
        localStorage.setItem('mock_gym_owners', JSON.stringify(ownersList));
      }
      
      mockUser = {
        ...mockUser,
        id: existingOwner.id,
        name: existingOwner.name,
        businessName: existingOwner.businessName,
        phone: existingOwner.phone,
        subscriptionStatus: existingOwner.subscriptionStatus,
        pricingPlan: existingOwner.pricingPlan,
        subscriptionDueDate: existingOwner.subscriptionDueDate,
        allowedGyms: existingOwner.allowedGyms || 1,
        totalPaidToCreator: existingOwner.totalPaidToCreator || 0,
        billingPayments: existingOwner.billingPayments || []
      };
    }
    return mockUser;
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const data = response.data;
      setUser(data.user);
      localStorage.setItem('owner_user', JSON.stringify(data.user));
      localStorage.setItem('jwt_token', data.token);
      return true;
    } catch (error) {
      if (error.response?.status === 403 && error.response?.data?.requiresVerification) {
        return { requiresVerification: true, email };
      }
      // No response = server is down or unreachable
      if (!error.response) {
        return { serverError: true };
      }
      console.error('Login failed:', error.response?.data?.message || error.message);
      return false;
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await api.post('/auth/register', {
        name: username || "New Gym Owner",
        email,
        password,
        businessName: username ? `${username}'s Gym` : "My Gym",
        phone: '9999988888'
      });

      const data = response.data;

      // Backend signals that OTP was sent — don't log in yet
      if (data.requiresVerification) {
        return { requiresVerification: true, email, emailSent: data.emailSent !== false };
      }

      setUser(data.user);
      localStorage.setItem('owner_user', JSON.stringify(data.user));
      localStorage.setItem('jwt_token', data.token);
      return true;
    } catch (error) {
      // 409 = email already verified and registered
      if (error.response?.status === 409) return { alreadyExists: true };
      // No response = server down
      if (!error.response) return { serverError: true };
      console.error('Register error:', error);
      return { serverError: true };
    }
  };

  const verifyEmailCode = async (email, code) => {
    try {
      const response = await api.post('/auth/verify-email', { email, code });
      const data = response.data;
      setUser(data.user);
      localStorage.setItem('owner_user', JSON.stringify(data.user));
      localStorage.setItem('jwt_token', data.token);
      return true;
    } catch (error) {
      console.error('Verify email error:', error.response?.data?.message || error.message);
      return false;
    }
  };

  const requestPasswordReset = async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return { success: true, emailSent: response.data.emailSent !== false };
    } catch (error) {
      console.error('Request password reset error:', error.response?.data?.message || error.message);
      return { success: false, message: error.response?.data?.message || 'Failed to request reset' };
    }
  };

  const submitPasswordReset = async (email, code, password) => {
    try {
      await api.post('/auth/reset-password', { email, code, password });
      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error.response?.data?.message || error.message);
      return { success: false, message: error.response?.data?.message || 'Failed to reset password' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('owner_user');
    localStorage.removeItem('jwt_token');
  };

  const updateSettings = async (newSettings) => {
    try {
      const response = await api.put('/auth/settings', newSettings);
      const data = response.data;
      setUser(prev => {
        if (!prev) return null;
        const updated = { ...prev, settings: data.settings };
        localStorage.setItem('owner_user', JSON.stringify(updated));
        return updated;
      });
      return true;
    } catch (err) {
      console.error('Update settings API error:', err);
    }
    return false;
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/auth/profile', profileData);
      const data = response.data;
      setUser(data.user);
      localStorage.setItem('owner_user', JSON.stringify(data.user));
      return true;
    } catch (err) {
      console.error('Update profile API error:', err);
    }
    return false;
  };

  const updateOwnerSubscription = async (_status, _dueDate, _graceDaysRemaining) => {
    try {
      const response = await api.get('/auth/profile');
      const data = response.data;
      setUser(data);
      localStorage.setItem('owner_user', JSON.stringify(data));
    } catch (err) {
      console.error('Update owner subscription API error:', err);
    }
  };

  const payOwnerSubscription = async (amount, paymentMethod) => {
    try {
      const response = await api.post('/creator/checkout', {
        notes: `Paid ₹${amount} via ${paymentMethod}`
      });
      const data = response.data;
      setUser(prev => {
        if (!prev) return null;
        const updated = {
          ...prev,
          ...data.user
        };
        localStorage.setItem('owner_user', JSON.stringify(updated));
        return updated;
      });
      return true;
    } catch (err) {
      console.error('payOwnerSubscription API error:', err);
    }
    return false;
  };

  return {
    login,
    register,
    verifyEmailCode,
    requestPasswordReset,
    submitPasswordReset,
    logout,
    updateSettings,
    updateProfile,
    updateOwnerSubscription,
    payOwnerSubscription
  };
};
