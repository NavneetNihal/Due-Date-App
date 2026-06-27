import { formatDate, addDays } from './dateHelpers.js';

export const useMemberActions = (members, setMembers, activeOutletId, setPayments, setUser, addPaymentRecord) => {
  const simulate200Members = () => {
    setMembers(prev => {
      const activeGymId = activeOutletId || 'owner_golds';
      const otherMembers = prev.filter(m => (m.gymId || 'owner_golds') !== activeGymId);
      const currentGymMembers = prev.filter(m => (m.gymId || 'owner_golds') === activeGymId);
      const mockList = [...currentGymMembers];
      const countToGenerate = 200 - mockList.length;
      if (countToGenerate > 0) {
        for (let i = 0; i < countToGenerate; i++) {
          mockList.push({
            id: 'm_mock_' + activeGymId + '_' + Date.now() + '_' + i,
            name: `Test Member ${i + 1}`,
            phoneNumber: '9876500000',
            joiningDate: formatDate(new Date()),
            subscriptionTier: 'monthly',
            subscriptionAmount: 1000,
            nextDueDate: addDays(formatDate(new Date()), 30),
            status: 'active',
            gymId: activeGymId
          });
        }
      }
      const updated = [...otherMembers, ...mockList];
      localStorage.setItem('gym_members_v5', JSON.stringify(updated));
      return updated;
    });
  };

  const addMember = (memberData) => {
    const newMember = {
      id: 'm_' + Date.now(),
      name: memberData.name,
      phoneNumber: memberData.phoneNumber,
      joiningDate: memberData.joiningDate,
      subscriptionTier: memberData.subscriptionTier,
      subscriptionAmount: parseInt(memberData.subscriptionAmount, 10),
      nextDueDate: memberData.nextDueDate,
      status: memberData.status || 'active',
      gymId: memberData.gymId || activeOutletId || 'owner_golds'
    };

    setMembers(prev => [newMember, ...prev]);

    // Also add initial payment record if marked as paid during creation
    if (memberData.isPaid) {
      addPaymentRecord(newMember.id, newMember.name, newMember.subscriptionAmount, 'UPI', 'Initial Join Payment');
      
      setUser(prev => {
        if (!prev) return prev;
        const updated = { ...prev, allTimeEarnings: (prev.allTimeEarnings || 0) + newMember.subscriptionAmount };
        localStorage.setItem('owner_user', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const deleteMember = (id) => {
    setMembers(prev => prev.filter(m => m.id !== id));
    setPayments(prev => prev.filter(p => p.memberId !== id));
  };

  return {
    simulate200Members,
    addMember,
    deleteMember
  };
};
