import { formatDate, addDays } from './dateHelpers.js';

export const useAuthActions = (user, setUser, gymOwners, setGymOwners) => {
  const login = async (username, email, password) => {
    // Check if logging in as App Creator
    const isCreator = (username && username.toLowerCase() === 'nihal') || 
                      (email && email.toLowerCase() === 'lakranihal0070@gmail.com');

    try {
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email || 'demo@gymowner.com', password })
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        localStorage.setItem('owner_user', JSON.stringify(data.user));
        localStorage.setItem('jwt_token', data.token);
        return true;
      }

      // If user doesn't exist and they are trying to log in as a gym owner, auto-register them
      if (!isCreator && (response.status === 401 || response.status === 404)) {
        console.log('User not found. Auto-registering Gym Owner...');
        const regResponse = await fetch('http://localhost:5001/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: username || "New Gym Owner",
            email: email || 'demo@gymowner.com',
            password,
            businessName: username ? `${username}'s Gym` : "Gold's Gym Elite",
            phone: '9999988888'
          })
        });

        if (regResponse.ok) {
          const regData = await regResponse.json();
          setUser(regData.user);
          localStorage.setItem('owner_user', JSON.stringify(regData.user));
          localStorage.setItem('jwt_token', regData.token);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Login/register API error:', error);
      return false;
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
    logout,
    updateSettings,
    updateProfile,
    updateOwnerSubscription,
    payOwnerSubscription
  };
};
