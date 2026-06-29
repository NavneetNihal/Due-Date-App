import { formatDate, addDays } from './dateHelpers.js';

export const useAuthActions = (user, setUser, gymOwners, setGymOwners) => {
  const login = async (email, password) => {
    try {
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        localStorage.setItem('owner_user', JSON.stringify(data.user));
        localStorage.setItem('jwt_token', data.token);
        return true;
      }
      return false;
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
      const response = await fetch('http://localhost:5001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: username || "New Gym Owner",
          email,
          password,
          businessName: username ? `${username}'s Gym` : "My Gym",
          phone: '9999988888'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        localStorage.setItem('owner_user', JSON.stringify(data.user));
        localStorage.setItem('jwt_token', data.token);
        return true;
      }
      
      // Fallback: If registration fails (e.g. duplicate email), automatically attempt login
      console.warn('Registration failed, executing automatic login fallback...');
      return await login(email, password);
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
    const token = localStorage.getItem('jwt_token');
    if (!token) return false;
    try {
      const response = await fetch('http://localhost:5001/api/auth/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newSettings)
      });
      if (response.ok) {
        const data = await response.json();
        setUser(prev => {
          if (!prev) return null;
          const updated = { ...prev, settings: data.settings };
          localStorage.setItem('owner_user', JSON.stringify(updated));
          return updated;
        });
        return true;
      }
    } catch (err) {
      console.error('Update settings API error:', err);
    }
    return false;
  };

  const updateProfile = async (profileData) => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return false;
    try {
      const response = await fetch('http://localhost:5001/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        localStorage.setItem('owner_user', JSON.stringify(data.user));
        return true;
      }
    } catch (err) {
      console.error('Update profile API error:', err);
    }
    return false;
  };

  const updateOwnerSubscription = async (status, dueDate, graceDaysRemaining) => {
    // Single source of truth is fetched from /api/auth/profile during app mount/refresh.
    // If called manually, fetch the fresh profile.
    const token = localStorage.getItem('jwt_token');
    if (!token) return;
    try {
      const response = await fetch('http://localhost:5001/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
        localStorage.setItem('owner_user', JSON.stringify(data));
      }
    } catch (err) {
      console.error('Update owner subscription API error:', err);
    }
  };

  const payOwnerSubscription = async (amount, paymentMethod) => {
    // This is handled by checkout endpoint on backend
    const token = localStorage.getItem('jwt_token');
    if (!token) return false;
    try {
      const response = await fetch('http://localhost:5001/api/creator/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          notes: `Paid ₹${amount} via ${paymentMethod}`
        })
      });
      if (response.ok) {
        const data = await response.json();
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
      }
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
