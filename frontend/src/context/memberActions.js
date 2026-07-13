import api from '../api.js';

export const useMemberActions = (members, setMembers, activeOutletId, setPayments) => {
  const addMember = async (memberData) => {
    try {
      const response = await api.post('/members', {
        name: memberData.name,
        phoneNumber: memberData.phoneNumber,
        subscriptionTier: memberData.subscriptionTier,
        amount: parseInt(memberData.subscriptionAmount, 10),
        joiningDate: memberData.joiningDate,
        nextDueDate: memberData.nextDueDate,
        gymId: memberData.gymId || activeOutletId || 'owner_golds'
      });

      const newMember = response.data;
      // Map both id and _id just to be safe
      const enrichedMember = { ...newMember, id: newMember._id || newMember.id };
      setMembers(prev => [enrichedMember, ...prev]);

      if (memberData.isPaid) {
        const payResponse = await api.post('/payments/pay', {
          memberId: newMember._id,
          paymentMethod: 'UPI',
          notes: 'Initial Join Payment'
        });

        const payData = payResponse.data;
        const enrichedPaidMember = { ...payData.member, id: payData.member._id || payData.member.id };
        setMembers(prev => prev.map(m => m._id === newMember._id ? enrichedPaidMember : m));
        setPayments(prev => [payData.payment, ...prev]);
      }
      return true;
    } catch (error) {
      console.warn('Add member API error, falling back to mock storage:', error);
      
      const mockId = `mock_mem_${Date.now()}`;
      const newMockMember = {
        _id: mockId,
        id: mockId,
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
        const mockPayId = `mock_pay_${Date.now()}`;
        const newMockPayment = {
          _id: mockPayId,
          id: mockPayId,
          memberId: newMockMember.id,
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
  };

  const deleteMember = async (id) => {
    try {
      await api.delete(`/members/${id}`);
      setMembers(prev => prev.filter(m => m._id !== id && m.id !== id));
      setPayments(prev => prev.filter(p => p.memberId !== id));
      return true;
    } catch (error) {
      console.warn('Delete member API error, falling back to mock storage:', error);
      
      const savedMembers = localStorage.getItem('mock_members');
      let membersList = savedMembers ? JSON.parse(savedMembers) : [];
      membersList = membersList.filter(m => m._id !== id && m.id !== id);
      localStorage.setItem('mock_members', JSON.stringify(membersList));
      setMembers(membersList);

      const savedPayments = localStorage.getItem('mock_payments');
      let paymentsList = savedPayments ? JSON.parse(savedPayments) : [];
      paymentsList = paymentsList.filter(p => p.memberId !== id);
      localStorage.setItem('mock_payments', JSON.stringify(paymentsList));
      setPayments(paymentsList);
      return true;
    }
  };

  return {
    addMember,
    deleteMember
  };
};
