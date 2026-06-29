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
      console.warn('Update client status API error, falling back to mock:', err);
      
      const savedOwners = localStorage.getItem('mock_gym_owners');
      let ownersList = savedOwners ? JSON.parse(savedOwners) : [];
      ownersList = ownersList.map(o => {
        if (o.id === ownerId) {
          const updated = {
            ...o,
            subscriptionStatus: newStatus || o.subscriptionStatus,
            pricingPlan: newPlan || o.pricingPlan,
            allowedGyms: newAllowedGyms !== undefined ? newAllowedGyms : o.allowedGyms
          };
          if (user && user.id === ownerId) {
            setUser(updated);
            localStorage.setItem('owner_user', JSON.stringify(updated));
          }
          return updated;
        }
        return o;
      });
      localStorage.setItem('mock_gym_owners', JSON.stringify(ownersList));
      setGymOwners(ownersList);
      return true;
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
    const isExpired = owner.subscriptionStatus === 'overdue' || 
                      owner.subscriptionStatus === 'revoked' || 
                      owner.subscriptionStatus === 'unpaid' ||
                      !owner.subscriptionDueDate ||
                      new Date(owner.subscriptionDueDate) < new Date(todayStr);
                      
    const baseDate = isExpired ? todayStr : owner.subscriptionDueDate;
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
      console.warn('Mark gym owner paid API error, falling back to mock:', err);
      
      const savedOwners = localStorage.getItem('mock_gym_owners');
      let ownersList = savedOwners ? JSON.parse(savedOwners) : [];
      ownersList = ownersList.map(o => {
        if (o.id === ownerId) {
          const updated = {
            ...o,
            subscriptionStatus: 'active',
            subscriptionDueDate: newDueDate,
            totalPaidToCreator: (o.totalPaidToCreator || 0) + 699,
            billingPayments: [
              ...(o.billingPayments || []),
              {
                amount: 699,
                paymentDate: todayStr,
                paymentMethod: 'UPI',
                notes: 'Manual payment approval by creator'
              }
            ]
          };
          if (user && user.id === ownerId) {
            setUser(updated);
            localStorage.setItem('owner_user', JSON.stringify(updated));
          }
          return updated;
        }
        return o;
      });
      localStorage.setItem('mock_gym_owners', JSON.stringify(ownersList));
      setGymOwners(ownersList);

      // Create mock approved billing log
      const newLog = {
        id: `mock_req_${Date.now()}`,
        _id: `mock_req_${Date.now()}`,
        ownerId: ownerId,
        ownerName: owner.name,
        businessName: owner.businessName,
        amount: 699,
        status: 'approved',
        requestDate: todayStr,
        upiTxnId: 'MANUAL_CREATOR_APPROVE_MOCK',
        notes: 'Manual payment approval by creator'
      };

      const savedReqs = localStorage.getItem('mock_billing_requests');
      let reqsList = savedReqs ? JSON.parse(savedReqs) : [];
      reqsList.unshift(newLog);
      localStorage.setItem('mock_billing_requests', JSON.stringify(reqsList));
      setBillingRequests(reqsList);
      return true;
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
      console.warn('Reverse gym owner payment API error, falling back to mock:', err);
      
      const savedOwners = localStorage.getItem('mock_gym_owners');
      let ownersList = savedOwners ? JSON.parse(savedOwners) : [];
      ownersList = ownersList.map(o => {
        if (o.id === ownerId) {
          if (!o.billingPayments || o.billingPayments.length === 0) return o;
          const lastPayment = o.billingPayments[o.billingPayments.length - 1];
          const newPayments = [...o.billingPayments];
          newPayments.pop();

          const todayStr = formatDate(new Date());
          const oldDueDate = o.subscriptionDueDate || todayStr;
          const newDueDate = addDays(oldDueDate, -30);

          const updated = {
            ...o,
            subscriptionDueDate: newDueDate,
            totalPaidToCreator: Math.max(0, (o.totalPaidToCreator || 0) - (lastPayment.amount || 699)),
            billingPayments: newPayments
          };

          if (user && user.id === ownerId) {
            setUser(updated);
            localStorage.setItem('owner_user', JSON.stringify(updated));
          }
          return updated;
        }
        return o;
      });
      localStorage.setItem('mock_gym_owners', JSON.stringify(ownersList));
      setGymOwners(ownersList);
      return true;
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
      console.warn('Delete client API error, falling back to mock:', err);
      
      const savedOwners = localStorage.getItem('mock_gym_owners');
      let ownersList = savedOwners ? JSON.parse(savedOwners) : [];
      ownersList = ownersList.filter(o => o.id !== ownerId);
      localStorage.setItem('mock_gym_owners', JSON.stringify(ownersList));
      setGymOwners(ownersList);
      return true;
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

        if (user && user.role === 'owner') {
          setActiveOutletId(data.user.id);
        }
        return true;
      }
    } catch (err) {
      console.warn('Add gym owner API error, falling back to mock:', err);
      
      const todayStr = formatDate(new Date());
      const newMockOwner = {
        id: `mock_owner_${Date.now()}`,
        name: ownerData.ownerName || 'Gym Owner',
        email: ownerData.email || `gym_${Date.now()}@test.com`,
        businessName: ownerData.businessName,
        phone: ownerData.phone1 || '9999988888',
        subscriptionStatus: 'unpaid',
        pricingPlan: 'basic',
        subscriptionDueDate: todayStr,
        allowedGyms: 1,
        totalPaidToCreator: 0,
        registeredMembersCount: 0,
        billingPayments: []
      };

      const savedOwners = localStorage.getItem('mock_gym_owners');
      let ownersList = savedOwners ? JSON.parse(savedOwners) : [];
      ownersList.unshift(newMockOwner);
      localStorage.setItem('mock_gym_owners', JSON.stringify(ownersList));
      setGymOwners(ownersList);

      if (user && user.role === 'owner') {
        setActiveOutletId(newMockOwner.id);
      }
      return true;
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

        setBillingRequests(prev => [data.billingRequest, ...prev]);
        return true;
      }
    } catch (err) {
      console.warn('Submit billing request API error, falling back to mock:', err);
      
      const newRequest = {
        id: `mock_req_${Date.now()}`,
        _id: `mock_req_${Date.now()}`,
        ownerId: user.id || user._id,
        ownerName: user.name,
        businessName: user.businessName,
        amount: amount || 699,
        status: 'pending',
        requestDate: formatDate(new Date()),
        upiTxnId: 'Direct Pay (Mock)',
        notes: `Plan: ${requestedPlan}, Gyms: ${requestedGyms}`,
        paymentMethod: paymentMethod || 'UPI'
      };

      const savedReqs = localStorage.getItem('mock_billing_requests');
      let reqsList = savedReqs ? JSON.parse(savedReqs) : [];
      reqsList.unshift(newRequest);
      localStorage.setItem('mock_billing_requests', JSON.stringify(reqsList));
      setBillingRequests(reqsList);
      return true;
    }
    return false;
  };

  const approveBillingRequest = async (requestId) => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return false;
    try {
      const response = await fetch(`http://localhost:5001/api/creator/requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'approved' })
      });
      if (response.ok) {
        const data = await response.json(); // returns { request }
        
        setBillingRequests(prev => prev.map(r => (r.id === requestId || r._id === requestId) ? { ...data.request, id: data.request._id } : r));
        
        const clientsResp = await fetch('http://localhost:5001/api/creator/clients', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (clientsResp.ok) {
          const clientsData = await clientsResp.json();
          setGymOwners(clientsData.map(c => ({ ...c, id: c._id || c.id })));
        }
        return true;
      }
    } catch (err) {
      console.warn('Approve billing request API error, falling back to mock:', err);
      
      const savedReqs = localStorage.getItem('mock_billing_requests');
      let reqsList = savedReqs ? JSON.parse(savedReqs) : [];
      const reqIndex = reqsList.findIndex(r => r.id === requestId || r._id === requestId);
      if (reqIndex !== -1) {
        reqsList[reqIndex].status = 'approved';
        localStorage.setItem('mock_billing_requests', JSON.stringify(reqsList));
        setBillingRequests(reqsList);

        const targetReq = reqsList[reqIndex];
        const savedOwners = localStorage.getItem('mock_gym_owners');
        let ownersList = savedOwners ? JSON.parse(savedOwners) : [];
        const ownerIndex = ownersList.findIndex(o => o.id === targetReq.ownerId);
        if (ownerIndex !== -1) {
          const owner = ownersList[ownerIndex];
          owner.subscriptionStatus = 'active';
          
          const todayStr = formatDate(new Date());
          const isExpired = owner.subscriptionStatus === 'overdue' || 
                            owner.subscriptionStatus === 'revoked' || 
                            owner.subscriptionStatus === 'unpaid' ||
                            !owner.subscriptionDueDate ||
                            new Date(owner.subscriptionDueDate) < new Date(todayStr);
                            
          const baseDate = isExpired ? todayStr : owner.subscriptionDueDate;
          const newDueDate = addDays(baseDate, 30);
          
          owner.subscriptionDueDate = newDueDate;
          owner.totalPaidToCreator = (owner.totalPaidToCreator || 0) + targetReq.amount;
          owner.billingPayments.push({
            amount: targetReq.amount,
            paymentDate: todayStr,
            paymentMethod: 'UPI',
            notes: targetReq.notes || 'Mock payment approved'
          });

          const notesText = targetReq.notes || '';
          if (notesText.includes('Plan: growth')) {
            owner.pricingPlan = 'growth';
          }
          if (notesText.includes('Gyms: 2')) {
            owner.allowedGyms = 2;
          }

          localStorage.setItem('mock_gym_owners', JSON.stringify(ownersList));
          setGymOwners(ownersList);
          
          if (user && user.id === targetReq.ownerId) {
            setUser(prev => {
              const updated = {
                ...prev,
                subscriptionStatus: 'active',
                subscriptionDueDate: newDueDate,
                totalPaidToCreator: owner.totalPaidToCreator,
                billingPayments: owner.billingPayments,
                pricingPlan: owner.pricingPlan,
                allowedGyms: owner.allowedGyms
              };
              localStorage.setItem('owner_user', JSON.stringify(updated));
              return updated;
            });
          }
        }
      }
      return true;
    }
    return false;
  };

  const rejectBillingRequest = async (requestId) => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return false;
    try {
      const response = await fetch(`http://localhost:5001/api/creator/requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'rejected' })
      });
      if (response.ok) {
        const data = await response.json(); // returns { request }
        setBillingRequests(prev => prev.map(r => (r.id === requestId || r._id === requestId) ? { ...data.request, id: data.request._id } : r));
        return true;
      }
    } catch (err) {
      console.warn('Reject billing request API error, falling back to mock:', err);
      
      const savedReqs = localStorage.getItem('mock_billing_requests');
      let reqsList = savedReqs ? JSON.parse(savedReqs) : [];
      const reqIndex = reqsList.findIndex(r => r.id === requestId || r._id === requestId);
      if (reqIndex !== -1) {
        reqsList[reqIndex].status = 'rejected';
        localStorage.setItem('mock_billing_requests', JSON.stringify(reqsList));
        setBillingRequests(reqsList);
      }
      return true;
    }
    return false;
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
