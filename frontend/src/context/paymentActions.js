export const usePaymentActions = (members, setMembers, payments, setPayments, activeOutletId, setUser) => {
  const addPaymentRecord = (newPayment) => {
    setPayments(prev => [newPayment, ...prev]);
  };

  // Ledger Rule: Mark member as paid (adds +30, 90 or 365 days depending on tier)
  const markAsPaid = async (memberId, method = 'UPI', notes = 'Subscription renewal') => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return false;
    try {
      const response = await fetch('http://localhost:5001/api/payments/pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          memberId,
          paymentMethod: method,
          notes
        })
      });

      if (response.ok) {
        const data = await response.json(); // returns { member, payment }
        
        // Update member inside local state
        setMembers(prev => prev.map(m => m._id === memberId ? data.member : m));
        
        // Add payment transaction to local state
        addPaymentRecord(data.payment);

        // Fetch profile to update owner's allTimeEarnings
        const profileResponse = await fetch('http://localhost:5001/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setUser(profileData);
          localStorage.setItem('owner_user', JSON.stringify(profileData));
        }
        return true;
      }
    } catch (error) {
      console.error('Mark paid API error:', error);
    }
    return false;
  };

  // Ledger Rule: Reverse payment (adds a negative entry to ledger and subtracts tier days from nextDueDate)
  const reversePayment = async (paymentId) => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return false;
    try {
      const response = await fetch('http://localhost:5001/api/payments/reverse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ paymentId })
      });

      if (response.ok) {
        const data = await response.json(); // returns { member, payment }
        
        // Update member inside local state
        setMembers(prev => prev.map(m => m._id === data.member._id ? data.member : m));
        
        // Update payments state: mark original payment as reversed, append the new negative entry
        setPayments(prev => 
          prev.map(p => p._id === paymentId ? { ...p, isReversal: true } : p)
              .concat(data.payment)
        );

        // Fetch profile to update owner's allTimeEarnings
        const profileResponse = await fetch('http://localhost:5001/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setUser(profileData);
          localStorage.setItem('owner_user', JSON.stringify(profileData));
        }
        return true;
      }
    } catch (error) {
      console.error('Reverse payment API error:', error);
    }
    return false;
  };

  return {
    addPaymentRecord,
    markAsPaid,
    reversePayment
  };
};
