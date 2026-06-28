import React, { createContext, useState, useEffect } from 'react';
import { formatDate, addDays } from './dateHelpers.js';
import { useAuthActions } from './authActions.js';
import { usePaymentActions } from './paymentActions.js';
import { useMemberActions } from './memberActions.js';
import { useOwnerActions } from './ownerActions.js';

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
        const response = await fetch('http://localhost:5001/api/creator/settings');
        if (response.ok) {
          const settingsData = await response.json();
          setDeveloperSettings(settingsData);
        }
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

      setLoading(true);
      try {
        // Fetch Profile
        const profileResp = await fetch('http://localhost:5001/api/auth/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (profileResp.ok) {
          const userData = await profileResp.json();
          const userWithId = { ...userData, id: userData.id || userData._id };
          setUser(userWithId);
          localStorage.setItem('owner_user', JSON.stringify(userWithId));

          if (userData.role === 'creator') {
            // Load platform clients (gyms list)
            const clientsResp = await fetch('http://localhost:5001/api/creator/clients', {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (clientsResp.ok) {
              const clientsData = await clientsResp.json();
              setGymOwners(clientsData.map(c => ({ ...c, id: c._id || c.id })));
            }

            // Load billing receipts history
            const ledgerResp = await fetch('http://localhost:5001/api/creator/ledger', {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (ledgerResp.ok) {
              const ledgerData = await ledgerResp.json();
              setBillingRequests(ledgerData.logs.map(r => ({ ...r, id: r._id || r.id })));
            }
          } else {
            // Load members
            const membersResp = await fetch(`http://localhost:5001/api/members?gymId=${activeOutletId}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (membersResp.ok) {
              const membersData = await membersResp.json();
              setMembers(membersData.map(m => ({ ...m, id: m._id || m.id })));
            }

            // Load accounting payments history
            const paymentsResp = await fetch(`http://localhost:5001/api/payments?gymId=${activeOutletId}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (paymentsResp.ok) {
              const paymentsData = await paymentsResp.json();
              setPayments(paymentsData.map(p => ({ ...p, id: p._id || p.id })));
            }
          }
        }
      } catch (err) {
        console.error('Initial async data fetch error:', err);
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
  const memberActions = useMemberActions(members, setMembers, activeOutletId, setPayments, setUser, paymentActions.addPaymentRecord);
  const ownerActions = useOwnerActions(user, setUser, gymOwners, setGymOwners, billingRequests, setBillingRequests, activeOutletId, setActiveOutletId);

  const updateDeveloperSettings = async (newDevSettings) => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return false;
    try {
      const response = await fetch('http://localhost:5001/api/creator/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newDevSettings)
      });
      if (response.ok) {
        const data = await response.json();
        setDeveloperSettings(data.settings);
        return true;
      }
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
