import React, { createContext, useState, useEffect } from 'react';
import { formatDate, addDays } from './dateHelpers.js';
import { useAuthActions } from './authActions.js';
import { usePaymentActions } from './paymentActions.js';
import { useMemberActions } from './memberActions.js';
import { useOwnerActions } from './ownerActions.js';
import api from '../api.js';

export const AppContext = createContext();

export { formatDate, addDays };

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('owner_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [members, setMembers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [developerSettings, setDeveloperSettings] = useState({ upiId: '7004689533@ptyes', qrCode: '' });
  const [gymOwners, setGymOwners] = useState([]);
  const [billingRequests, setBillingRequests] = useState([]);
  const [activeOutletId, setActiveOutletId] = useState('owner_golds');
  const [loading, setLoading] = useState(false);

  // Load Developer settings (checkout coordinates) from backend on mount
  useEffect(() => {
    const fetchDevSettings = async () => {
      try {
        const response = await api.get('/creator/settings');
        setDeveloperSettings(response.data);
      } catch (err) {
        console.error('Fetch developer settings error:', err);
      }
    };
    fetchDevSettings();
  }, []);

  // Sync state data from API when authenticated user changes
  useEffect(() => {
    const fetchFreshData = async () => {
      const token = localStorage.getItem('jwt_token');
      if (!token || !user) return;

      const loadMockLocalData = () => {
        const localGymOwners = localStorage.getItem('mock_gym_owners');
        const localBillingRequests = localStorage.getItem('mock_billing_requests');
        const localMembers = localStorage.getItem('mock_members');
        const localPayments = localStorage.getItem('mock_payments');

        if (localGymOwners) {
          setGymOwners(JSON.parse(localGymOwners));
        }
        if (localBillingRequests) {
          setBillingRequests(JSON.parse(localBillingRequests));
        }
        if (localMembers) {
          const mems = JSON.parse(localMembers);
          setMembers(mems.filter(m => (m.gymId || 'owner_golds') === (activeOutletId || 'owner_golds')));
        }
        if (localPayments) {
          const pays = JSON.parse(localPayments);
          setPayments(pays.filter(p => (p.gymId || 'owner_golds') === (activeOutletId || 'owner_golds')));
        }

        // Sync current logged-in owner profile from local registry
        if (user && user.role === 'owner') {
          const ownersList = localGymOwners ? JSON.parse(localGymOwners) : [];
          const ownerEntry = ownersList.find(o => o.id === user.id || o.name === user.name || o.email === user.email);
          if (ownerEntry) {
            if (
              user.pricingPlan !== ownerEntry.pricingPlan ||
              user.allowedGyms !== ownerEntry.allowedGyms ||
              user.subscriptionStatus !== ownerEntry.subscriptionStatus ||
              user.subscriptionDueDate !== ownerEntry.subscriptionDueDate ||
              JSON.stringify(user.billingPayments) !== JSON.stringify(ownerEntry.billingPayments)
            ) {
              const updated = {
                ...user,
                pricingPlan: ownerEntry.pricingPlan,
                allowedGyms: ownerEntry.allowedGyms,
                subscriptionStatus: ownerEntry.subscriptionStatus,
                subscriptionDueDate: ownerEntry.subscriptionDueDate,
                billingPayments: ownerEntry.billingPayments
              };
              setUser(updated);
              localStorage.setItem('owner_user', JSON.stringify(updated));
            }
          }
        }
      };

      setLoading(true);
      try {
        // Fetch Profile
        const profileResp = await api.get('/auth/profile');
        const userData = profileResp.data;
        const userWithId = { ...userData, id: userData.id || userData._id };
        setUser(userWithId);
        localStorage.setItem('owner_user', JSON.stringify(userWithId));

        if (userData.role === 'creator') {
          // Load platform clients (gyms list)
          const clientsResp = await api.get('/creator/clients');
          setGymOwners(clientsResp.data.map(c => ({ ...c, id: c._id || c.id })));

          // Load billing receipts history
          const ledgerResp = await api.get('/creator/ledger');
          setBillingRequests(ledgerResp.data.logs.map(r => ({ ...r, id: r._id || r.id })));
        } else {
          // Load members
          const membersResp = await api.get(`/members?gymId=${activeOutletId}`);
          setMembers(membersResp.data.map(m => ({ ...m, id: m._id || m.id })));

          // Load accounting payments history
          const paymentsResp = await api.get(`/payments?gymId=${activeOutletId}`);
          setPayments(paymentsResp.data.map(p => ({ ...p, id: p._id || p.id })));

          // Fetch owner's billing requests for persistence
          const ledgerResp = await api.get('/creator/ledger');
          setBillingRequests(ledgerResp.data.logs.map(r => ({ ...r, id: r._id || r.id })));
        }
      } catch (err) {
        console.warn('Initial async data fetch error, loading from localStorage fallback:', err);
        loadMockLocalData();
      } finally {
        setLoading(false);
      }
    };

    fetchFreshData();
  }, [user?.id, activeOutletId]);

  // Synchronize current logged-in owner user state with registry updates from creator dashboard
  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    if (user && user.role === 'owner' && gymOwners.length > 0 && token) {
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

  // Initialize modular hook actions
  const authActions = useAuthActions(user, setUser, gymOwners, setGymOwners);
  const paymentActions = usePaymentActions(members, setMembers, payments, setPayments, activeOutletId, setUser);
  const memberActions = useMemberActions(members, setMembers, activeOutletId, setPayments);
  const ownerActions = useOwnerActions(user, setUser, gymOwners, setGymOwners, billingRequests, setBillingRequests, activeOutletId, setActiveOutletId);

  const updateDeveloperSettings = async (newDevSettings) => {
    try {
      const response = await api.put('/creator/settings', newDevSettings);
      setDeveloperSettings(response.data.settings);
      return true;
    } catch (err) {
      console.error('Update developer settings error:', err);
    }
    return false;
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
      loading,
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
