import { formatDate, addDays } from './dateHelpers.js';

export const useOwnerActions = (
  user,
  setUser,
  gymOwners,
  setGymOwners,
  billingRequests,
  setBillingRequests,
  activeOutletId,
  setActiveOutletId
) => {
  const updateGymOwnerStatus = async (ownerId, newStatus, newPlan, newAllowedGyms) => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return false;
    try {
      const response = await fetch(`http://localhost:5001/api/creator/clients/${ownerId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: newStatus,
          pricingPlan: newPlan,
          allowedGyms: newAllowedGyms
        })
      });

      if (response.ok) {
        const data = await response.json(); // returns { client }
        setGymOwners(prev => prev.map(o => o.id === ownerId ? data.client : o));
        return true;
      }
    } catch (err) {
      console.error('Update client status API error:', err);
    }
    return false;
  };

  const markGymOwnerPaid = async (ownerId) => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return false;
    
    // Find the owner to calculate next subscription due date
    const owner = gymOwners.find(o => o.id === ownerId);
    if (!owner) return false;

    const todayStr = formatDate(new Date());
    const currentDueDate = owner.subscriptionDueDate || todayStr;
    const isOverdue = owner.subscriptionStatus === 'overdue' || owner.subscriptionStatus === 'revoked' || new Date(currentDueDate) < new Date(todayStr);
    const baseDate = isOverdue ? todayStr : currentDueDate;
    const newDueDate = addDays(baseDate, 30);

    try {
      const response = await fetch(`http://localhost:5001/api/creator/clients/${ownerId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'active',
          subscriptionDueDate: newDueDate,
          recordPayment: true
        })
      });

      if (response.ok) {
        const data = await response.json(); // returns { client }
        setGymOwners(prev => prev.map(o => o.id === ownerId ? data.client : o));
        
        // Refresh billing requests list (creator ledger)
        const ledgerResp = await fetch('http://localhost:5001/api/creator/ledger', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (ledgerResp.ok) {
          const ledgerData = await ledgerResp.json();
          setBillingRequests(ledgerData.logs);
        }
        return true;
      }
    } catch (err) {
      console.error('Mark gym owner paid API error:', err);
    }
    return false;
  };

  const reverseGymOwnerPayment = async (ownerId) => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return false;
    try {
      const response = await fetch(`http://localhost:5001/api/creator/clients/${ownerId}/reverse`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json(); // returns { client }
        setGymOwners(prev => prev.map(o => o.id === ownerId ? data.client : o));
        
        // Refresh billing requests list
        const ledgerResp = await fetch('http://localhost:5001/api/creator/ledger', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (ledgerResp.ok) {
          const ledgerData = await ledgerResp.json();
          setBillingRequests(ledgerData.logs);
        }
        return true;
      }
    } catch (err) {
      console.error('Reverse gym owner payment API error:', err);
    }
    return false;
  };

  const deleteGymOwner = async (ownerId) => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return false;
    try {
      const response = await fetch(`http://localhost:5001/api/creator/clients/${ownerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setGymOwners(prev => prev.filter(o => o.id !== ownerId));
        return true;
      }
    } catch (err) {
      console.error('Delete client API error:', err);
    }
    return false;
  };

  const addGymOwner = async (ownerData) => {
    const token = localStorage.getItem('jwt_token');
    try {
      const response = await fetch('http://localhost:5001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: ownerData.ownerName || 'Gym Owner',
          email: ownerData.email || `gym_${Date.now()}@test.com`,
          password: 'password123',
          businessName: ownerData.businessName,
          phone: ownerData.phone1
        })
      });

      if (response.ok) {
        const data = await response.json(); // returns { token, user }
        const newOwnerEnriched = {
          ...data.user,
          registeredMembersCount: 0
        };
        setGymOwners(prev => [newOwnerEnriched, ...prev]);

        // If called by an Owner themselves to create a new gym outlet (allowedGyms logic)
        if (user && user.role === 'owner') {
          setActiveOutletId(data.user.id);
        }
        return true;
      }
    } catch (err) {
      console.error('Add gym owner API error:', err);
    }
    return false;
  };

  const submitBillingRequest = async (ownerId, requestedPlan, requestedGyms, amount, paymentMethod) => {
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
          upiTxnId: 'Direct Pay',
          notes: `Plan: ${requestedPlan}, Gyms: ${requestedGyms}`
        })
      });

      if (response.ok) {
        const data = await response.json(); // returns { user, billingRequest }
        
        // Update context user with fresh subscription coordinates
        setUser(prev => {
          if (!prev) return null;
          const updated = {
            ...prev,
            subscriptionStatus: data.user.subscriptionStatus,
            subscriptionDueDate: data.user.subscriptionDueDate,
            totalPaidToCreator: data.user.totalPaidToCreator,
            billingPayments: data.user.billingPayments
          };
          localStorage.setItem('owner_user', JSON.stringify(updated));
          return updated;
        });

        // Add request to local billingRequests
        setBillingRequests(prev => [data.billingRequest, ...prev]);
        return true;
      }
    } catch (err) {
      console.error('Submit billing request API error:', err);
    }
    return false;
  };

  const approveBillingRequest = async (requestId) => {
    // The self-serve checkout automatically approves, so this is handled by database update status or recordPayment.
    // If called manually on creator dashboard:
    const reqItem = billingRequests.find(r => r.id === requestId || r._id === requestId);
    if (!reqItem) return false;
    
    // Approve it by setting owner status active and adding payment
    return await markGymOwnerPaid(reqItem.ownerId);
  };

  const rejectBillingRequest = async (requestId) => {
    // Standard mock rejection simply updates local status. We can keep it client-side or ignore since checkout auto-approves.
    setBillingRequests(prev => prev.map(req => {
      if (req.id === requestId || req._id === requestId) {
        return { ...req, status: 'rejected' };
      }
      return req;
    }));
  };

  return {
    updateGymOwnerStatus,
    markGymOwnerPaid,
    reverseGymOwnerPayment,
    deleteGymOwner,
    addGymOwner,
    submitBillingRequest,
    approveBillingRequest,
    rejectBillingRequest
  };
};
