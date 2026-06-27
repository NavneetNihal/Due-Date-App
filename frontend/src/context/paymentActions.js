import { formatDate, addDays } from './dateHelpers.js';

export const usePaymentActions = (members, setMembers, payments, setPayments, activeOutletId, setUser) => {
  const addPaymentRecord = (memberId, memberName, amount, method, notes) => {
    const newPayment = {
      id: 'p_' + Date.now(),
      memberId,
      memberName,
      amountPaid: amount,
      paymentDate: formatDate(new Date()),
      paymentMethod: method,
      notes: notes || 'Subscription renewal',
      gymId: activeOutletId || 'owner_golds'
    };
    setPayments(prev => [newPayment, ...prev]);
  };

  // Ledger Rule: Mark member as paid (adds +30, 90 or 365 days depending on tier)
  const markAsPaid = (memberId, method = 'UPI', notes = 'Subscription renewal') => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    let daysToAdd = 30;
    if (member.subscriptionTier === 'quarterly') daysToAdd = 90;
    if (member.subscriptionTier === 'yearly') daysToAdd = 365;

    const updatedDueDate = addDays(member.nextDueDate, daysToAdd);

    // 1. Update members due date and status
    setMembers(prevMembers => {
      return prevMembers.map(m => {
        if (m.id === memberId) {
          return {
            ...m,
            nextDueDate: updatedDueDate,
            status: 'active' // reactivate if inactive
          };
        }
        return m;
      });
    });

    // 2. Add to accounting ledger
    addPaymentRecord(member.id, member.name, member.subscriptionAmount, method, notes);

    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, allTimeEarnings: (prev.allTimeEarnings || 0) + member.subscriptionAmount };
      localStorage.setItem('owner_user', JSON.stringify(updated));
      return updated;
    });
  };

  // Ledger Rule: Reverse payment (adds a negative entry to ledger and subtracts tier days from nextDueDate)
  const reversePayment = (paymentId) => {
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) return;

    const member = members.find(m => m.id === payment.memberId);
    if (!member) return;

    let daysToSubtract = 30;
    if (member.subscriptionTier === 'quarterly') daysToSubtract = 90;
    if (member.subscriptionTier === 'yearly') daysToSubtract = 365;

    // Subtract days from the member's nextDueDate
    setMembers(prevMembers =>
      prevMembers.map(m => {
        if (m.id === member.id) {
          return { ...m, nextDueDate: addDays(m.nextDueDate, -daysToSubtract) };
        }
        return m;
      })
    );

    // Remove the original entry from the ledger (clean undo)
    setPayments(prev => prev.filter(p => p.id !== paymentId));

    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, allTimeEarnings: Math.max(0, (prev.allTimeEarnings || 0) - payment.amountPaid) };
      localStorage.setItem('owner_user', JSON.stringify(updated));
      return updated;
    });
  };

  return {
    addPaymentRecord,
    markAsPaid,
    reversePayment
  };
};
