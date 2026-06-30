import { formatDate } from './dateHelpers.js';
import api from '../api.js';

export const useAuthActions = (user, setUser, _gymOwners, _setGymOwners) => {
  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const data = response.data;
      setUser(data.user);
      localStorage.setItem('owner_user', JSON.stringify(data.user));
      localStorage.setItem('jwt_token', data.token);
      return true;
    } catch (error) {
      console.warn('Login API error, falling back to mock login (offline mode):', error);
      
      const isCreator = email.toLowerCase() === 'lakranihal0070@gmail.com';
      const todayStr = formatDate(new Date());
      let mockUser = {
        id: isCreator ? 'creator_admin' : `mock_owner_${email.replace(/[^a-zA-Z0-9]/g, '')}`,
        name: isCreator ? 'Navneet Nihal Lakra' : (email.split('@')[0] || "New Gym Owner"),
        email: email,
        role: isCreator ? 'creator' : 'owner',
        businessName: isCreator ? 'Due Date Platform Creator' : `${email.split('@')[0]}'s Gym`,
        phone: '9999988888',
        subscriptionStatus: isCreator ? 'active' : 'unpaid',
        pricingPlan: 'basic',
        subscriptionDueDate: isCreator ? '2099-12-31' : todayStr,
        graceDaysRemaining: isCreator ? 9999 : 0,
        billingPayments: []
      };

      if (!isCreator) {
        // Enforce mock_gym_owners registry persistence
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
        
        // Merge state
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
      
      setUser(mockUser);
      localStorage.setItem('owner_user', JSON.stringify(mockUser));
      localStorage.setItem('jwt_token', 'mock_jwt_token_123');
      return true;
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
      setUser(data.user);
      localStorage.setItem('owner_user', JSON.stringify(data.user));
      localStorage.setItem('jwt_token', data.token);
      return true;
    } catch (error) {
      console.warn('Register API error, falling back to mock registration (offline mode):', error);
      
      const isCreator = email.toLowerCase() === 'lakranihal0070@gmail.com';
      const todayStr = formatDate(new Date());
      let mockUser = {
        id: isCreator ? 'creator_admin' : `mock_owner_${email.replace(/[^a-zA-Z0-9]/g, '')}`,
        name: username || "New Gym Owner",
        email: email,
        role: isCreator ? 'creator' : 'owner',
        businessName: username ? `${username}'s Gym` : "My Gym",
        phone: '9999988888',
        subscriptionStatus: isCreator ? 'active' : 'unpaid',
        pricingPlan: 'basic',
        subscriptionDueDate: isCreator ? '2099-12-31' : todayStr,
        graceDaysRemaining: isCreator ? 9999 : 0,
        billingPayments: []
      };

      if (!isCreator) {
        // Enforce mock_gym_owners registry persistence
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
        
        // Merge state
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
      
      setUser(mockUser);
      localStorage.setItem('owner_user', JSON.stringify(mockUser));
      localStorage.setItem('jwt_token', 'mock_jwt_token_123');
      return true;
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
    // Single source of truth is fetched from /api/auth/profile during app mount/refresh.
    // If called manually, fetch the fresh profile.
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
    // This is handled by checkout endpoint on backend
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
    logout,
    updateSettings,
    updateProfile,
    updateOwnerSubscription,
    payOwnerSubscription
  };
};
