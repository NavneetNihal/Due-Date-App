export const useMemberActions = (members, setMembers, activeOutletId, setPayments, setUser, addPaymentRecord) => {
  const simulate200Members = async () => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return;
    
    // To make it fast and not overload database/network, we simulate by adding 10 test members in MongoDB
    console.log('Simulating test members in database...');
    const activeGymId = activeOutletId || 'owner_golds';
    
    for (let i = 0; i < 10; i++) {
      try {
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
      } catch (err) {
        console.error('Simulation member error:', err);
      }
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

        // Also add initial payment record if marked as paid during creation
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
            // Update local member state with extended due date
            setMembers(prev => prev.map(m => m._id === newMember._id ? payData.member : m));
            setPayments(prev => [payData.payment, ...prev]);
          }
        }
        return true;
      }
    } catch (error) {
      console.error('Add member API error:', error);
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
      console.error('Delete member API error:', error);
    }
    return false;
  };

  return {
    simulate200Members,
    addMember,
    deleteMember
  };
};
