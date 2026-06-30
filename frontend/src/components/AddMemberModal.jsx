import React, { useState, useEffect } from 'react';
import { X, User, Phone, Calendar, CreditCard } from 'lucide-react';
import { formatDate, addDays } from '../context/AppContext.jsx';

function AddMemberModal({ isOpen, onClose, onAdd }) {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [subscriptionTier, setSubscriptionTier] = useState('monthly');
  const [subscriptionAmount, setSubscriptionAmount] = useState(1000);
  const [joiningDate, setJoiningDate] = useState(formatDate(new Date()));
  const [nextDueDate, setNextDueDate] = useState('');
  const [status, setStatus] = useState('active');

  // Auto calculate amount and due date based on tier selection and joining date
  useEffect(() => {
    let amount = 1000;
    let days = 30;

    if (subscriptionTier === 'quarterly') {
      amount = 2500;
      days = 90;
    } else if (subscriptionTier === 'yearly') {
      amount = 8000;
      days = 365;
    }

    setSubscriptionAmount(amount);
    
    if (joiningDate) {
      setNextDueDate(addDays(joiningDate, days));
    }
  }, [subscriptionTier, joiningDate]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !phoneNumber || !joiningDate || !nextDueDate) return;

    onAdd({
      name,
      phoneNumber,
      joiningDate,
      subscriptionTier,
      subscriptionAmount,
      nextDueDate,
      status,
      isPaid: false
    });

    // Reset form
    setName('');
    setPhoneNumber('');
    setSubscriptionTier('monthly');
    setJoiningDate(formatDate(new Date()));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h2 className="text-xl font-bold text-slate-100">
            Add New Gym Member
          </h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition duration-150 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          
          {/* Member Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Member Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <User className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary text-sm"
                placeholder="Rahul Kumar"
                required
              />
            </div>
          </div>

          {/* Phone Number */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              WhatsApp Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Phone className="h-4 w-4" />
              </div>
              <input
                type="tel"
                pattern="[0-9]{10}"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary text-sm"
                placeholder="9876543210 (10 digits)"
                required
              />
            </div>
          </div>

          {/* Subscription Tier */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Subscription Tier
              </label>
              <select
                value={subscriptionTier}
                onChange={(e) => setSubscriptionTier(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary text-sm"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            {/* Price */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Amount (₹)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <CreditCard className="h-4 w-4" />
                </div>
                <input
                  type="number"
                  value={subscriptionAmount}
                  onChange={(e) => setSubscriptionAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary text-sm"
                  required
                />
              </div>
            </div>
          </div>

          {/* Dates Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Joining Date */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Joining Date
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Calendar className="h-4 w-4" />
                </div>
                <input
                  type="date"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary text-xs"
                  required
                />
              </div>
            </div>

            {/* Next Due Date */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Next Due Date
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Calendar className="h-4 w-4" />
                </div>
                <input
                  type="date"
                  value={nextDueDate}
                  onChange={(e) => setNextDueDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary text-xs"
                  required
                />
              </div>
            </div>
          </div>

          {/* Initial Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex gap-3 border-t border-slate-800 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-slate-850 hover:border-slate-700 hover:bg-slate-800/50 text-slate-300 font-semibold rounded-lg text-sm active:scale-95 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold rounded-lg text-sm shadow-md shadow-brand-primary/10 active:scale-95 transition cursor-pointer"
            >
              Add Member
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

export default AddMemberModal;
