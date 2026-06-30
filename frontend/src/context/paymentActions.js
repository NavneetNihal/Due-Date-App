import api from '../api.js';

export const usePaymentActions = (members, setMembers, payments, setPayments, activeOutletId, setUser) => {
  const addPaymentRecord = (newPayment) => {
    setPayments(prev => [newPayment, ...prev]);
  };

  const markAsPaid = async (memberId, method = 'UPI', notes = 'Subscription renewal') => {
    try {
      const response = await api.post('/payments/pay', {
        memberId,
        paymentMethod: method,
        notes
      });
 
      const data = response.data; // returns { member, payment }
      
      setMembers(prev => prev.map(m => m._id === memberId ? data.member : m));
      addPaymentRecord(data.payment);
 
      const profileResponse = await api.get('/auth/profile');
      const profileData = profileResponse.data;
      setUser(profileData);
      localStorage.setItem('owner_user', JSON.stringify(profileData));
      return true;
    } catch (error) {
      console.warn('Mark paid API error, falling back to mock:', error);
      
      const savedMembers = localStorage.getItem('mock_members');
      let membersList = savedMembers ? JSON.parse(savedMembers) : [];
      let updatedMember = null;
      
      membersList = membersList.map(m => {
        if (m._id === memberId) {
          const currentDueDate = m.nextDueDate || '2026-06-29';
          let days = 30;
          if (m.subscriptionTier === 'quarterly') days = 90;
          else if (m.subscriptionTier === 'yearly') days = 365;

          // Simple date addition function
          const d = new Date(currentDueDate);
          d.setDate(d.getDate() + days);
          let month = '' + (d.getMonth() + 1);
          let day = '' + d.getDate();
          const year = d.getFullYear();
          if (month.length < 2) month = '0' + month;
          if (day.length < 2) day = '0' + day;
          const nextDueDate = [year, month, day].join('-');

          updatedMember = {
            ...m,
            nextDueDate,
            status: 'active'
          };
          return updatedMember;
        }
        return m;
      });

      if (updatedMember) {
        localStorage.setItem('mock_members', JSON.stringify(membersList));
        setMembers(membersList);

        const newPayment = {
          _id: `mock_pay_${Date.now()}`,
          memberId: memberId,
          memberName: updatedMember.name,
          gymId: updatedMember.gymId,
          amountPaid: updatedMember.amount,
          paymentDate: new Date().toISOString().substring(0, 10),
          paymentMethod: method,
          notes: notes,
          isReversal: false
        };

        const savedPayments = localStorage.getItem('mock_payments');
        let paymentsList = savedPayments ? JSON.parse(savedPayments) : [];
        paymentsList.unshift(newPayment);
        localStorage.setItem('mock_payments', JSON.stringify(paymentsList));
        addPaymentRecord(newPayment);
        return true;
      }
    }
    return false;
  };

  const reversePayment = async (paymentId) => {
    try {
      const response = await api.post('/payments/reverse', { paymentId });
      const data = response.data; // returns { member, payment }
      
      setMembers(prev => prev.map(m => m._id === data.member._id ? data.member : m));
      
      setPayments(prev => 
        prev.map(p => p._id === paymentId ? { ...p, isReversal: true } : p)
            .concat(data.payment)
      );
 
      const profileResponse = await api.get('/auth/profile');
      const profileData = profileResponse.data;
      setUser(profileData);
      localStorage.setItem('owner_user', JSON.stringify(profileData));
      return true;
    } catch (error) {
      console.warn('Reverse payment API error, falling back to mock:', error);
      
      const savedPayments = localStorage.getItem('mock_payments');
      let paymentsList = savedPayments ? JSON.parse(savedPayments) : [];
      const paymentToReverse = paymentsList.find(p => p._id === paymentId);
      
      if (paymentToReverse) {
        // Mark payment as reversed
        paymentsList = paymentsList.map(p => p._id === paymentId ? { ...p, isReversal: true } : p);
        
        // Append negative payment
        const reversalPayment = {
          _id: `mock_pay_rev_${Date.now()}`,
          memberId: paymentToReverse.memberId,
          memberName: paymentToReverse.memberName,
          gymId: paymentToReverse.gymId,
          amountPaid: -paymentToReverse.amountPaid,
          paymentDate: new Date().toISOString().substring(0, 10),
          paymentMethod: paymentToReverse.paymentMethod,
          notes: `Reversal of payment Ref: ${paymentId.substring(0, 8)}`,
          isReversal: true
        };
        paymentsList.unshift(reversalPayment);
        localStorage.setItem('mock_payments', JSON.stringify(paymentsList));
        
        // Update payments state
        setPayments(prev => 
          prev.map(p => p._id === paymentId ? { ...p, isReversal: true } : p)
              .concat(reversalPayment)
        );

        // Update member due date (subtract days)
        const savedMembers = localStorage.getItem('mock_members');
        let membersList = savedMembers ? JSON.parse(savedMembers) : [];
        membersList = membersList.map(m => {
          if (m._id === paymentToReverse.memberId) {
            const currentDueDate = m.nextDueDate || '2026-06-29';
            let days = 30;
            if (m.subscriptionTier === 'quarterly') days = 90;
            else if (m.subscriptionTier === 'yearly') days = 365;

            const d = new Date(currentDueDate);
            d.setDate(d.getDate() - days);
            let month = '' + (d.getMonth() + 1);
            let day = '' + d.getDate();
            const year = d.getFullYear();
            if (month.length < 2) month = '0' + month;
            if (day.length < 2) day = '0' + day;
            const nextDueDate = [year, month, day].join('-');

            return {
              ...m,
              nextDueDate
            };
          }
          return m;
        });
        localStorage.setItem('mock_members', JSON.stringify(membersList));
        setMembers(membersList);
        return true;
      }
    }
    return false;
  };

  return {
    addPaymentRecord,
    markAsPaid,
    reversePayment
  };
};
