import { formatDate, addDays } from './dateHelpers.js';

export const useAuthActions = (user, setUser, gymOwners, setGymOwners) => {
  const login = (username, email, password) => {
    // Check if logging in as App Creator
    const isCreator = (username.toLowerCase() === 'nihal' && password === 'creator123') || 
                      (email === 'creator@app.com' && password === 'creator123');

    if (isCreator) {
      const creatorUser = {
        id: 'creator_nihal',
        name: 'Navneet Nihal Lakra',
        email: 'creator@app.com',
        businessName: 'Due Date Platform Creator',
        role: 'creator'
      };
      setUser(creatorUser);
      localStorage.setItem('owner_user', JSON.stringify(creatorUser));
      localStorage.setItem('jwt_token', 'mock_jwt_token_creator');
      return true;
    }

    // Default mock Gym Owner login
    const existingOwner = gymOwners.find(o => 
      (username && o.name.toLowerCase() === username.toLowerCase()) || 
      (email && o.email.toLowerCase() === email.toLowerCase()) ||
      (!username && !email && o.id === 'owner_golds')
    );

    let finalOwner = existingOwner;
    if (!existingOwner) {
      const newOwnerId = 'owner_' + Date.now();
      const newOwner = {
        id: newOwnerId,
        name: username || "New Gym Owner",
        businessName: username ? `${username}'s Gym` : "Gold's Gym Elite",
        email: email || 'demo@gymowner.com',
        phone: '9999988888',
        subscriptionStatus: 'active',
        pricingPlan: 'basic',
        registeredMembersCount: 0,
        totalPaidToCreator: 0,
        lastPaymentDate: 'N/A',
        subscriptionDueDate: addDays(formatDate(new Date()), 30),
        paymentsHistory: []
      };
      setGymOwners(prev => {
        const updated = [...prev, newOwner];
        localStorage.setItem('gym_owners_registry_v3', JSON.stringify(updated));
        return updated;
      });
      finalOwner = newOwner;
    }

    const mockUser = {
      id: finalOwner.id,
      name: finalOwner.name,
      email: finalOwner.email,
      businessName: finalOwner.businessName,
      phone: finalOwner.phone,
      subscriptionStatus: finalOwner.subscriptionStatus,
      subscriptionDueDate: finalOwner.subscriptionDueDate,
      graceDaysRemaining: 10,
      billingPayments: [],
      pricingPlan: 'basic',
      allowedGyms: finalOwner.allowedGyms || 1,
      role: 'owner',
      allTimeEarnings: 0,
      settings: {
        whatsappTemplate: 'Hi {name}, your gym fee of *₹{amount}* is due on *{due_date}*. Please pay via UPI to ID: *{upi_id}* and *send a screenshot* of the receipt to this chat to confirm. Thank you!',
        paymentLink: 'https://upi.link/goldsgym',
        reminderSchedule: 'standard'
      }
    };
    setUser(mockUser);
    localStorage.setItem('owner_user', JSON.stringify(mockUser));
    localStorage.setItem('jwt_token', 'mock_jwt_token_xyz');
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('owner_user');
    localStorage.removeItem('jwt_token');
  };

  const updateSettings = (newSettings) => {
    setUser(prev => {
      const updated = { ...prev, settings: { ...prev.settings, ...newSettings } };
      localStorage.setItem('owner_user', JSON.stringify(updated));
      return updated;
    });
  };

  const updateProfile = (profileData) => {
    setUser(prev => {
      const updated = {
        ...prev,
        name: profileData.name ?? prev?.name,
        businessName: profileData.businessName ?? prev?.businessName,
        phone: profileData.phone ?? prev?.phone,
        settings: {
          ...prev?.settings,
          ...profileData.settings
        }
      };
      localStorage.setItem('owner_user', JSON.stringify(updated));

      // Also update the owner's entry in the gymOwners state!
      setGymOwners(currentOwners => {
        const updatedOwners = currentOwners.map(owner => {
          if (owner.id === prev.id) {
            return {
              ...owner,
              name: updated.name,
              businessName: updated.businessName,
              phone: updated.phone
            };
          }
          return owner;
        });
        localStorage.setItem('gym_owners_registry_v3', JSON.stringify(updatedOwners));
        return updatedOwners;
      });

      return updated;
    });
  };

  const updateOwnerSubscription = (status, dueDate, graceDaysRemaining) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = {
        ...prev,
        subscriptionStatus: status,
        subscriptionDueDate: dueDate ?? prev.subscriptionDueDate,
        graceDaysRemaining: graceDaysRemaining !== undefined ? graceDaysRemaining : prev.graceDaysRemaining
      };
      localStorage.setItem('owner_user', JSON.stringify(updated));
      return updated;
    });
  };

  const payOwnerSubscription = (amount, paymentMethod) => {
    setUser(prev => {
      if (!prev) return null;
      
      let pricingPlan = 'basic';
      let allowedGyms = prev.allowedGyms || 1;
      let notes = 'Basic Plan SaaS Renewal (paid to Navneet Nihal Lakra)';

      const newBillingPayment = {
        id: 'bp_' + Date.now(),
        amountPaid: amount,
        paymentDate: formatDate(new Date()),
        paymentMethod: paymentMethod || 'UPI',
        notes: notes
      };
      const updated = {
        ...prev,
        subscriptionStatus: 'active',
        subscriptionDueDate: addDays(prev.subscriptionDueDate || formatDate(new Date()), 30),
        graceDaysRemaining: 10,
        pricingPlan: pricingPlan,
        allowedGyms: allowedGyms,
        billingPayments: [newBillingPayment, ...(prev.billingPayments || [])]
      };
      localStorage.setItem('owner_user', JSON.stringify(updated));
      return updated;
    });
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
