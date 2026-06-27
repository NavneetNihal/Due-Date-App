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
  const updateGymOwnerStatus = (ownerId, newStatus, newPlan, newAllowedGyms) => {
    setGymOwners(prev => {
      const targetOwner = prev.find(o => o.id === ownerId);
      if (!targetOwner) return prev;

      const todayStr = formatDate(new Date());
      const updated = prev.map(owner => {
        if (owner.id === ownerId || (targetOwner && owner.name === targetOwner.name && owner.name !== '')) {
          let updatedOwner = { ...owner };
          if (newStatus) {
            updatedOwner.subscriptionStatus = newStatus;
            
            // Adjust subscriptionDueDate to match manual simulation status
            if (newStatus === 'active') {
              const currentDue = owner.subscriptionDueDate ? new Date(owner.subscriptionDueDate) : null;
              const todayVal = new Date(todayStr);
              if (!currentDue || currentDue <= todayVal) {
                updatedOwner.subscriptionDueDate = addDays(todayStr, 30);
              }
            } else if (newStatus === 'overdue') {
              updatedOwner.subscriptionDueDate = addDays(todayStr, -3); // 3 days overdue
            } else if (newStatus === 'revoked') {
              updatedOwner.subscriptionDueDate = addDays(todayStr, -15); // 15 days overdue (revoked)
            }
          }
          if (newPlan) {
            updatedOwner.pricingPlan = newPlan;
          }
          if (newAllowedGyms !== undefined && newAllowedGyms !== null) {
            updatedOwner.allowedGyms = newAllowedGyms;
          }
          return updatedOwner;
        }
        return owner;
      });
      localStorage.setItem('gym_owners_registry_v3', JSON.stringify(updated));
      return updated;
    });
  };

  const markGymOwnerPaid = (ownerId) => {
    setGymOwners(prev => {
      const todayStr = formatDate(new Date());
      const updated = prev.map(owner => {
        if (owner.id === ownerId) {
          const amount = 699;
          const newPayment = {
            id: 'op_' + Date.now(),
            amountPaid: amount,
            paymentDate: todayStr
          };
          const history = owner.paymentsHistory || (
            owner.totalPaidToCreator > 0 
              ? Array.from({ length: Math.floor(owner.totalPaidToCreator / amount) }).map((_, i) => ({
                  id: `op_mock_${owner.id}_${i}`,
                  amountPaid: amount,
                  paymentDate: owner.lastPaymentDate || todayStr
                }))
              : []
          );

          // Calculate next subscription due date
          const currentDueDate = owner.subscriptionDueDate || todayStr;
          const isOverdue = owner.subscriptionStatus === 'overdue' || owner.subscriptionStatus === 'revoked' || new Date(currentDueDate) < new Date(todayStr);
          const baseDate = isOverdue ? todayStr : currentDueDate;
          const newDueDate = addDays(baseDate, 30);

          return {
            ...owner,
            subscriptionStatus: 'active',
            subscriptionDueDate: newDueDate,
            totalPaidToCreator: owner.totalPaidToCreator + amount,
            lastPaymentDate: todayStr,
            paymentsHistory: [newPayment, ...history]
          };
        }
        return owner;
      });
      localStorage.setItem('gym_owners_registry_v3', JSON.stringify(updated));
      return updated;
    });
  };

  const reverseGymOwnerPayment = (ownerId) => {
    setGymOwners(prev => {
      const updated = prev.map(owner => {
        if (owner.id === ownerId) {
          const history = owner.paymentsHistory || [];

          // Find the most recent positive (non-reversed) payment to remove
          const latestIdx = [...history].findIndex(
            p => p.amountPaid > 0 && !history.some(rev => rev.reversesPaymentId === p.id)
          );

          if (latestIdx === -1) return owner; // nothing to undo

          // Remove that entry cleanly
          const newHistory = history.filter((_, i) => i !== latestIdx);
          const amount = 699;
          const newTotal = Math.max(0, owner.totalPaidToCreator - amount);

          // Recompute lastPaymentDate from remaining positive entries
          const remaining = newHistory.filter(p => p.amountPaid > 0);
          const nextLastPaymentDate = remaining.length > 0 ? remaining[0].paymentDate : 'N/A';

          // Subtract 30 days from due date and recalculate status
          const todayStr = formatDate(new Date());
          const currentDueDate = owner.subscriptionDueDate || todayStr;
          const newDueDate = addDays(currentDueDate, -30);

          let newStatus = 'active';
          const todayDate = new Date(todayStr);
          const parsedNewDueDate = new Date(newDueDate);
          if (todayDate > parsedNewDueDate) {
            const diffDays = Math.ceil(Math.abs(todayDate - parsedNewDueDate) / (1000 * 60 * 60 * 24));
            newStatus = diffDays > 10 ? 'revoked' : 'overdue';
          }

          return {
            ...owner,
            subscriptionStatus: newStatus,
            subscriptionDueDate: newDueDate,
            totalPaidToCreator: newTotal,
            lastPaymentDate: nextLastPaymentDate,
            paymentsHistory: newHistory
          };
        }
        return owner;
      });
      localStorage.setItem('gym_owners_registry_v3', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteGymOwner = (ownerId) => {
    setGymOwners(prev => {
      const updated = prev.filter(o => o.id !== ownerId);
      localStorage.setItem('gym_owners_registry_v3', JSON.stringify(updated));
      return updated;
    });
  };

  const addGymOwner = (ownerData) => {
    const newId = 'owner_' + Date.now();
    const isOwnerRole = user && user.role === 'owner';
    const newOwner = {
      id: newId,
      name: ownerData.ownerName || user?.name || 'Navneet Nihal Lakra',
      businessName: ownerData.businessName,
      email: ownerData.email || user?.email || '',
      phone: ownerData.phone1,
      phone2: ownerData.phone2 || '',
      address: ownerData.address || '',
      subscriptionStatus: 'active',
      pricingPlan: 'basic',
      allowedGyms: isOwnerRole ? (user.allowedGyms || 1) : (ownerData.allowedGyms || 1),
      registeredMembersCount: 0,
      totalPaidToCreator: 0,
      lastPaymentDate: 'N/A',
      subscriptionDueDate: '2026-07-05',
      paymentsHistory: []
    };
    setGymOwners(prev => {
      const updated = [newOwner, ...prev];
      localStorage.setItem('gym_owners_registry_v3', JSON.stringify(updated));
      return updated;
    });
    if (user && user.role === 'owner') {
      setActiveOutletId(newId);
    }
  };

  const submitBillingRequest = (ownerId, requestedPlan, requestedGyms, amount, paymentMethod) => {
    const newReq = {
      id: 'req_' + Date.now(),
      ownerId: ownerId || user?.id || 'owner_golds',
      ownerName: user?.name || 'Navneet Nihal Lakra',
      ownerEmail: user?.email || 'demo@gymowner.com',
      businessName: user?.businessName || "Gold's Gym Elite",
      requestedPlan: 'basic',
      requestedGyms: requestedGyms || 1,
      amount: 699,
      paymentMethod: paymentMethod || 'UPI',
      paymentDate: formatDate(new Date()),
      status: 'approved'
    };
    
    setBillingRequests(prev => {
      const updated = [newReq, ...prev];
      localStorage.setItem('billing_requests_v1', JSON.stringify(updated));
      return updated;
    });

    // Directly apply renewal approval
    setGymOwners(currentOwners => {
      const updatedOwners = currentOwners.map(owner => {
        if (
          owner.id === newReq.ownerId || 
          owner.name === newReq.ownerName || 
          (owner.email === newReq.ownerEmail && owner.email !== '')
        ) {
          const notes = `Access Granted: Basic Plan - ₹699`;
          const newPayment = {
            id: 'pay_' + Date.now(),
            amountPaid: 699,
            paymentDate: formatDate(new Date()),
            paymentMethod: newReq.paymentMethod || 'UPI',
            notes: notes
          };
          
          // Calculate next subscription due date
          const todayStr = formatDate(new Date());
          const currentDueDate = owner.subscriptionDueDate || todayStr;
          const isOverdue = owner.subscriptionStatus === 'overdue' || owner.subscriptionStatus === 'revoked' || new Date(currentDueDate) < new Date(todayStr);
          const baseDate = isOverdue ? todayStr : currentDueDate;
          const newDueDate = addDays(baseDate, 30);

          return {
            ...owner,
            pricingPlan: 'basic',
            allowedGyms: newReq.requestedGyms || 1,
            subscriptionStatus: 'active',
            subscriptionDueDate: newDueDate,
            paymentsHistory: [newPayment, ...(owner.paymentsHistory || [])],
            totalPaidToCreator: (owner.totalPaidToCreator || 0) + 699,
            lastPaymentDate: formatDate(new Date())
          };
        }
        return owner;
      });
      localStorage.setItem('gym_owners_registry_v3', JSON.stringify(updatedOwners));
      return updatedOwners;
    });

    setUser(currentUser => {
      if (
        currentUser && 
        (currentUser.id === newReq.ownerId || 
         currentUser.name === newReq.ownerName || 
         (currentUser.email === newReq.ownerEmail && currentUser.email !== ''))
      ) {
        const newBillingPayment = {
          id: 'bp_' + Date.now(),
          amountPaid: 699,
          paymentDate: formatDate(new Date()),
          paymentMethod: newReq.paymentMethod || 'UPI',
          notes: `Package Activated: Basic Plan - ₹699`
        };

        const todayStr = formatDate(new Date());
        const currentDueDate = currentUser.subscriptionDueDate || todayStr;
        const isOverdue = currentUser.subscriptionStatus === 'overdue' || currentUser.subscriptionStatus === 'revoked' || new Date(currentDueDate) < new Date(todayStr);
        const baseDate = isOverdue ? todayStr : currentDueDate;
        const newDueDate = addDays(baseDate, 30);

        const updated = {
          ...currentUser,
          subscriptionStatus: 'active',
          subscriptionDueDate: newDueDate,
          graceDaysRemaining: 10,
          pricingPlan: 'basic',
          allowedGyms: newReq.requestedGyms || 1,
          billingPayments: [newBillingPayment, ...(currentUser.billingPayments || [])]
        };
        localStorage.setItem('owner_user', JSON.stringify(updated));
        return updated;
      }
      return currentUser;
    });
  };

  const approveBillingRequest = (requestId) => {
    let request = billingRequests.find(r => r.id === requestId);
    
    setBillingRequests(prev => {
      const updatedRequests = prev.map(req => {
        if (req.id === requestId) {
          request = req; // capture in case state was deferred
          return { ...req, status: 'approved' };
        }
        return req;
      });
      localStorage.setItem('billing_requests_v1', JSON.stringify(updatedRequests));
      return updatedRequests;
    });

    if (request) {
      setGymOwners(currentOwners => {
        const updatedOwners = currentOwners.map(owner => {
          if (
            owner.id === request.ownerId || 
            owner.name === request.ownerName || 
            (owner.email === request.ownerEmail && owner.email !== '')
          ) {
            const notes = `Access Granted: Basic Plan - ₹699`;
            const newPayment = {
              id: 'pay_' + Date.now(),
              amountPaid: 699,
              paymentDate: formatDate(new Date()),
              paymentMethod: request.paymentMethod || 'UPI',
              notes: notes
            };
            return {
              ...owner,
              pricingPlan: 'basic',
              allowedGyms: request.requestedGyms || 1,
              subscriptionStatus: 'active',
              subscriptionDueDate: addDays(formatDate(new Date()), 30),
              paymentsHistory: [newPayment, ...(owner.paymentsHistory || [])],
              totalPaidToCreator: (owner.totalPaidToCreator || 0) + 699,
              lastPaymentDate: formatDate(new Date())
            };
          }
          return owner;
        });
        localStorage.setItem('gym_owners_registry_v3', JSON.stringify(updatedOwners));
        return updatedOwners;
      });

      setUser(currentUser => {
        if (
          currentUser && 
          (currentUser.id === request.ownerId || 
           currentUser.name === request.ownerName || 
           (currentUser.email === request.ownerEmail && currentUser.email !== ''))
        ) {
          const newBillingPayment = {
            id: 'bp_' + Date.now(),
            amountPaid: 699,
            paymentDate: formatDate(new Date()),
            paymentMethod: request.paymentMethod || 'UPI',
            notes: `Package Activated: Basic Plan - ₹699`
          };
          const updated = {
            ...currentUser,
            subscriptionStatus: 'active',
            subscriptionDueDate: addDays(formatDate(new Date()), 30),
            graceDaysRemaining: 10,
            pricingPlan: 'basic',
            allowedGyms: request.requestedGyms || 1,
            billingPayments: [newBillingPayment, ...(currentUser.billingPayments || [])]
          };
          localStorage.setItem('owner_user', JSON.stringify(updated));
          return updated;
        }
        return currentUser;
      });
    }
  };

  const rejectBillingRequest = (requestId) => {
    setBillingRequests(prev => {
      const updated = prev.map(req => {
        if (req.id === requestId) {
          return { ...req, status: 'rejected' };
        }
        return req;
      });
      localStorage.setItem('billing_requests_v1', JSON.stringify(updated));
      return updated;
    });
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
