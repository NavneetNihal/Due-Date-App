export const useMemberActions = (members, setMembers, activeOutletId, setPayments, setUser, addPaymentRecord) => {
  const simulate200Members = async () => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return;
    
    console.log('Simulating test members...');
    const activeGymId = activeOutletId || 'owner_golds';
    
    try {
      for (let i = 0; i < 10; i++) {
        const response = await fetch('http://localhost:5001/api/members', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: `Test Member ${i + 1}`,
            phoneNumber: '9876500000',
            subscriptionTier: 'monthly',
            amount: 1000,
            gymId: activeGymId
          })
        });
        if (response.ok) {
          const newMember = await response.json();
          setMembers(prev => [newMember, ...prev]);
        }
      }
    } catch (err) {
      console.warn('Simulation member API error, falling back to mock:', err);
      
      const savedMembers = localStorage.getItem('mock_members');
      let membersList = savedMembers ? JSON.parse(savedMembers) : [];
      
      for (let i = 0; i < 10; i++) {
        const newMockMember = {
          _id: `mock_mem_${Date.now()}_${i}`,
          ownerId: 'mock_owner_id',
          gymId: activeGymId,
          name: `Test Member ${i + 1}`,
          phoneNumber: '9876500000',
          joiningDate: '2026-06-29',
          subscriptionTier: 'monthly',
          amount: 1000,
          subscriptionAmount: 1000,
          nextDueDate: '2026-07-29',
          status: 'active'
        };
        membersList.unshift(newMockMember);
      }
      
      localStorage.setItem('mock_members', JSON.stringify(membersList));
      setMembers(membersList);
    }
  };

  const addMember = async (memberData) => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return false;
    try {
      const response = await fetch('http://localhost:5001/api/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: memberData.name,
          phoneNumber: memberData.phoneNumber,
          subscriptionTier: memberData.subscriptionTier,
          amount: parseInt(memberData.subscriptionAmount, 10),
          joiningDate: memberData.joiningDate,
          nextDueDate: memberData.nextDueDate,
          gymId: memberData.gymId || activeOutletId || 'owner_golds'
        })
      });

      if (response.ok) {
        const newMember = await response.json();
        setMembers(prev => [newMember, ...prev]);

        if (memberData.isPaid) {
          const payResponse = await fetch('http://localhost:5001/api/payments/pay', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              memberId: newMember._id,
              paymentMethod: 'UPI',
              notes: 'Initial Join Payment'
            })
          });

          if (payResponse.ok) {
            const payData = await payResponse.json();
            setMembers(prev => prev.map(m => m._id === newMember._id ? payData.member : m));
            setPayments(prev => [payData.payment, ...prev]);
          }
        }
        return true;
      }
    } catch (error) {
      console.warn('Add member API error, falling back to mock:', error);
      
      const newMockMember = {
        _id: `mock_mem_${Date.now()}`,
        ownerId: 'mock_owner_id',
        gymId: memberData.gymId || activeOutletId || 'owner_golds',
        name: memberData.name,
        phoneNumber: memberData.phoneNumber,
        joiningDate: memberData.joiningDate,
        subscriptionTier: memberData.subscriptionTier,
        amount: parseInt(memberData.subscriptionAmount, 10),
        subscriptionAmount: parseInt(memberData.subscriptionAmount, 10),
        nextDueDate: memberData.nextDueDate,
        status: memberData.status || 'active'
      };

      const savedMembers = localStorage.getItem('mock_members');
      let membersList = savedMembers ? JSON.parse(savedMembers) : [];
      membersList.unshift(newMockMember);
      localStorage.setItem('mock_members', JSON.stringify(membersList));
      setMembers(membersList);

      if (memberData.isPaid) {
        const newMockPayment = {
          _id: `mock_pay_${Date.now()}`,
          memberId: newMockMember._id,
          memberName: newMockMember.name,
          gymId: newMockMember.gymId,
          amountPaid: newMockMember.amount,
          paymentDate: newMockMember.joiningDate,
          paymentMethod: 'UPI',
          notes: 'Initial Join Payment',
          isReversal: false
        };

        const savedPayments = localStorage.getItem('mock_payments');
        let paymentsList = savedPayments ? JSON.parse(savedPayments) : [];
        paymentsList.unshift(newMockPayment);
        localStorage.setItem('mock_payments', JSON.stringify(paymentsList));
        setPayments(paymentsList);
      }
      return true;
    }
    return false;
  };

  const deleteMember = async (id) => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return false;
    try {
      const response = await fetch(`http://localhost:5001/api/members/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setMembers(prev => prev.filter(m => m._id !== id));
        setPayments(prev => prev.filter(p => p.memberId !== id));
        return true;
      }
    } catch (error) {
      console.warn('Delete member API error, falling back to mock:', error);
      
      const savedMembers = localStorage.getItem('mock_members');
      let membersList = savedMembers ? JSON.parse(savedMembers) : [];
      membersList = membersList.filter(m => m._id !== id);
      localStorage.setItem('mock_members', JSON.stringify(membersList));
      setMembers(membersList);

      const savedPayments = localStorage.getItem('mock_payments');
      let paymentsList = savedPayments ? JSON.parse(savedPayments) : [];
      paymentsList = paymentsList.filter(p => p.memberId !== id);
      localStorage.setItem('mock_payments', JSON.stringify(paymentsList));
      setPayments(paymentsList);
      return true;
    }
    return false;
  };

  return {
    simulate200Members,
    addMember,
    deleteMember
  };
};
