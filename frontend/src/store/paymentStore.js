import { create } from 'zustand';

export const usePaymentStore = create((set) => ({
  paymentStatus: 'unpaid', // 'unpaid', 'pending', 'paid'
  setPaymentStatus: (status) => set({ paymentStatus: status }),
  
  // Sync state based on database user payments array and current pending requests
  syncPaymentStatus: (user, billingRequests) => {
    if (!user) {
      set({ paymentStatus: 'unpaid' });
      return;
    }

    // Check if there is an in-flight checkout request awaiting approval first
    const pendingRequest = billingRequests?.find(r => 
      (r.ownerId === user.id || r.ownerId === user._id || r.ownerName === user.name) && 
      r.status === 'pending'
    );

    if (pendingRequest) {
      set({ paymentStatus: 'pending' });
      return;
    }
    
    // Revoked or Overdue accounts are blocked
    if (user.subscriptionStatus === 'revoked' || user.subscriptionStatus === 'overdue') {
      set({ paymentStatus: 'unpaid' });
      return;
    }

    // Has paid is defined by whether there is a record of successful billing logs in User database document
    const hasPaid = user.billingPayments && user.billingPayments.length > 0;
    if (hasPaid) {
      set({ paymentStatus: 'paid' });
      return;
    }

    set({ paymentStatus: 'unpaid' });
  }
}));
