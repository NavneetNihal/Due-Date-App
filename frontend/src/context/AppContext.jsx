import React, { createContext, useState, useEffect } from 'react';
import { formatDate, addDays } from './dateHelpers.js';
import { useAuthActions } from './authActions.js';
import { usePaymentActions } from './paymentActions.js';
import { useMemberActions } from './memberActions.js';
import { useOwnerActions } from './ownerActions.js';

export const AppContext = createContext();

// Re-export helpers so components importing them from AppContext.jsx still work
export { formatDate, addDays };

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('owner_user');
    if (!savedUser) return null;
    const parsedUser = JSON.parse(savedUser);
    if (parsedUser && parsedUser.subscriptionStatus === undefined) {
      parsedUser.subscriptionStatus = 'active';
      parsedUser.subscriptionDueDate = addDays(formatDate(new Date()), 30);
      parsedUser.graceDaysRemaining = 10;
      parsedUser.billingPayments = [];
      localStorage.setItem('owner_user', JSON.stringify(parsedUser));
    }
    if (parsedUser && (parsedUser.pricingPlan === undefined || parsedUser.pricingPlan === 'starter' || parsedUser.pricingPlan === 'growth')) {
      parsedUser.pricingPlan = 'basic';
      localStorage.setItem('owner_user', JSON.stringify(parsedUser));
    }
    return parsedUser;
  });

  const [members, setMembers] = useState(() => {
    const savedMembers = localStorage.getItem('gym_members_v5');
    const parsed = savedMembers ? JSON.parse(savedMembers) : [];
    return parsed.filter(m => !m.id.includes('mock') && m.id !== 'm1' && m.id !== 'm2' && m.id !== 'm3');
  });

  const [payments, setPayments] = useState(() => {
    const savedPayments = localStorage.getItem('gym_payments_v5');
    const savedMembers = localStorage.getItem('gym_members_v5');
    const parsedMembers = savedMembers ? JSON.parse(savedMembers) : [];
    const filteredMembers = parsedMembers.filter(m => !m.id.includes('mock') && m.id !== 'm1' && m.id !== 'm2' && m.id !== 'm3');
    const memberIds = new Set(filteredMembers.map(m => m.id));
    const parsedPayments = savedPayments ? JSON.parse(savedPayments) : [];
    return parsedPayments.filter(p => !p.memberId || memberIds.has(p.memberId));
  });

  const [developerSettings, setDeveloperSettings] = useState(() => {
    const savedDev = localStorage.getItem('developer_settings_v2') || localStorage.getItem('developer_settings_v1');
    if (savedDev) {
      const parsed = JSON.parse(savedDev);
      if (parsed.upiId === 'nihal.lakra@okaxis') {
        parsed.upiId = '7004689533@ptyes';
      }
      if (parsed.bankName === undefined) {
        parsed.bankName = 'YES BANK';
        parsed.cardNumber = '4111 2222 3333 7004';
        parsed.cardHolder = 'Navneet Nihal Lakra';
        parsed.cardExpiry = '12/32';
      }
      if (parsed.cardHolder && parsed.cardHolder.toLowerCase() === 'nihal lakra') {
        parsed.cardHolder = 'Navneet Nihal Lakra';
      }
      localStorage.setItem('developer_settings_v2', JSON.stringify(parsed));
      return parsed;
    }
    return {
      upiId: '7004689533@ptyes',
      qrCode: '',
      bankName: 'YES BANK',
      cardNumber: '4111 2222 3333 7004',
      cardHolder: 'Navneet Nihal Lakra',
      cardExpiry: '12/32'
    };
  });

  const [gymOwners, setGymOwners] = useState(() => {
    const savedOwners = localStorage.getItem('gym_owners_registry_v3');
    const parsed = savedOwners ? JSON.parse(savedOwners) : [];
    const mockIds = new Set(['owner_golds', 'owner_spartan', 'owner_iron', 'owner_titanium']);
    const cleanOwners = parsed.filter(o => !mockIds.has(o.id)).map(owner => {
      let changed = false;
      let nameVal = owner.name;
      if (owner.name && owner.name.toLowerCase() === 'nihal lakra') {
        nameVal = 'Navneet Nihal Lakra';
        changed = true;
      }
      if (owner.pricingPlan !== 'basic') {
        owner.pricingPlan = 'basic';
        changed = true;
      }
      let dueDateVal = owner.subscriptionDueDate;
      if (!dueDateVal) {
        changed = true;
        const todayStr = formatDate(new Date());
        if (owner.subscriptionStatus === 'active') {
          dueDateVal = addDays(owner.lastPaymentDate && owner.lastPaymentDate !== 'N/A' ? owner.lastPaymentDate : todayStr, 30);
        } else if (owner.subscriptionStatus === 'overdue') {
          dueDateVal = addDays(todayStr, -3); // 3 days overdue
        } else if (owner.subscriptionStatus === 'revoked') {
          dueDateVal = addDays(todayStr, -15); // 15 days overdue (revoked)
        } else {
          dueDateVal = addDays(todayStr, 30);
        }
      }
      if (changed) {
        return { ...owner, name: nameVal, pricingPlan: owner.pricingPlan, subscriptionDueDate: dueDateVal };
      }
      return owner;
    });
    return cleanOwners;
  });

  const [billingRequests, setBillingRequests] = useState(() => {
    const saved = localStorage.getItem('billing_requests_v1');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeOutletId, setActiveOutletId] = useState(() => {
    return localStorage.getItem('active_outlet_id') || 'owner_golds';
  });

  useEffect(() => {
    localStorage.setItem('active_outlet_id', activeOutletId);
  }, [activeOutletId]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('gym_members_v5', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem('gym_payments_v5', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('developer_settings_v2', JSON.stringify(developerSettings));
  }, [developerSettings]);

  useEffect(() => {
    localStorage.setItem('gym_owners_registry_v3', JSON.stringify(gymOwners));
  }, [gymOwners]);

  // One-time data wipe: clear all legacy keys and reset ledgers to blank slate
  useEffect(() => {
    const resetDone = localStorage.getItem('app_data_reset_v4');
    if (!resetDone) {
      [
        'gym_payments_v3', 'gym_payments_v4', 'gym_payments_v5',
        'gym_members_v3', 'gym_members_v4',
        'gym_owners_registry_v1', 'gym_owners_registry_v2',
        'developer_settings_v1',
        'app_data_reset_v3'
      ].forEach(k => localStorage.removeItem(k));

      setPayments([]);
      localStorage.setItem('gym_payments_v5', JSON.stringify([]));

      setGymOwners(prev => {
        const wiped = prev.map(owner => ({
          ...owner,
          totalPaidToCreator: 0,
          lastPaymentDate: 'N/A',
          paymentsHistory: []
        }));
        localStorage.setItem('gym_owners_registry_v3', JSON.stringify(wiped));
        return wiped;
      });

      localStorage.setItem('app_data_reset_v4', 'done');
    } else {
      setPayments(prev => {
        const clean = prev.filter(p => p.amountPaid > 0);
        if (clean.length !== prev.length) {
          localStorage.setItem('gym_payments_v5', JSON.stringify(clean));
          return clean;
        }
        return prev;
      });
      setGymOwners(prev => {
        let changed = false;
        const clean = prev.map(owner => {
          const cleanHistory = (owner.paymentsHistory || []).filter(p => p.amountPaid > 0);
          if (cleanHistory.length !== (owner.paymentsHistory || []).length) {
            changed = true;
            const newTotal = cleanHistory.reduce((s, p) => s + p.amountPaid, 0);
            const newLast = cleanHistory.length > 0 ? cleanHistory[0].paymentDate : 'N/A';
            return { ...owner, paymentsHistory: cleanHistory, totalPaidToCreator: newTotal, lastPaymentDate: newLast };
          }
          return owner;
        });
        if (changed) localStorage.setItem('gym_owners_registry_v3', JSON.stringify(clean));
        return changed ? clean : prev;
      });
    }
  }, []);

  // Initialize modular hook instances
  const authActions = useAuthActions(user, setUser, gymOwners, setGymOwners);
  const paymentActions = usePaymentActions(members, setMembers, payments, setPayments, activeOutletId, setUser);
  const memberActions = useMemberActions(members, setMembers, activeOutletId, setPayments, setUser, paymentActions.addPaymentRecord);
  const ownerActions = useOwnerActions(user, setUser, gymOwners, setGymOwners, billingRequests, setBillingRequests, activeOutletId, setActiveOutletId);

  // Automatic subscription status check based on due dates
  useEffect(() => {
    if (user && user.subscriptionDueDate) {
      const todayDate = new Date(formatDate(new Date()));
      const dueDate = new Date(user.subscriptionDueDate);
      
      if (todayDate > dueDate) {
        const diffTime = Math.abs(todayDate - dueDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 10) {
          if (user.subscriptionStatus !== 'revoked') {
            authActions.updateOwnerSubscription('revoked', user.subscriptionDueDate, 0);
          }
        } else {
          const graceLeft = 10 - diffDays;
          if (user.subscriptionStatus !== 'overdue' || user.graceDaysRemaining !== graceLeft) {
            authActions.updateOwnerSubscription('overdue', user.subscriptionDueDate, graceLeft);
          }
        }
      } else {
        if (user.subscriptionStatus !== 'active') {
          authActions.updateOwnerSubscription('active', user.subscriptionDueDate, 10);
        }
      }
    }
  }, [members.length, user?.subscriptionDueDate]);

  // Synchronize current logged-in owner user state with registry updates from creator dashboard
  useEffect(() => {
    if (user && user.role === 'owner' && gymOwners.length > 0) {
      const ownerEntry = gymOwners.find(o => o.id === user.id || o.name === user.name || o.email === user.email);
      if (ownerEntry) {
        if (
          user.pricingPlan !== ownerEntry.pricingPlan ||
          user.allowedGyms !== ownerEntry.allowedGyms ||
          user.subscriptionStatus !== ownerEntry.subscriptionStatus ||
          user.subscriptionDueDate !== ownerEntry.subscriptionDueDate
        ) {
          setUser(prev => {
            if (!prev) return prev;
            const updated = {
              ...prev,
              pricingPlan: ownerEntry.pricingPlan,
              allowedGyms: ownerEntry.allowedGyms,
              subscriptionStatus: ownerEntry.subscriptionStatus,
              subscriptionDueDate: ownerEntry.subscriptionDueDate
            };
            localStorage.setItem('owner_user', JSON.stringify(updated));
            return updated;
          });
        }
      }
    }
  }, [gymOwners, user]);

  const updateDeveloperSettings = (newDevSettings) => {
    setDeveloperSettings(prev => ({
      ...prev,
      ...newDevSettings
    }));
  };

  return (
    <AppContext.Provider value={{
      user,
      isAuthenticated: !!user,
      members,
      payments,
      developerSettings,
      activeOutletId,
      gymOwners,
      billingRequests,
      setActiveOutletId,
      updateDeveloperSettings,
      ...authActions,
      ...paymentActions,
      ...memberActions,
      ...ownerActions
    }}>
      {children}
    </AppContext.Provider>
  );
};
