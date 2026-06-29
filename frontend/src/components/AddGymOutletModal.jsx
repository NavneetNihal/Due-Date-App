import React, { useState } from 'react';
import { Building, AlertCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function AddGymOutletModal({ isOpen, onClose, user, ownerOutlets, addGymOwner }) {
  const navigate = useNavigate();
  const [addGymForm, setAddGymForm] = useState({
    businessName: '', ownerName: '', phone1: '', phone2: '', address: '', pricingPlan: 'basic'
  });

  const gymLimitReached = false; // Add actual limit logic if needed

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-purple-500/20 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-100 flex items-center gap-2">
              <Building className="h-4 w-4 text-purple-400" />
              {gymLimitReached ? 'Upgrade Plan Required' : 'Add New Gym Outlet'}
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {gymLimitReached ? 'Multi-gym support is only active on the 2-Gym location license.' : 'Register a new gym branch/outlet under your account.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 p-1 rounded hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {gymLimitReached ? (
          <div className="py-6 text-center space-y-4 animate-in fade-in duration-200">
            <div className="mx-auto w-12 h-12 bg-purple-500/10 border border-purple-500/25 rounded-full flex items-center justify-center text-purple-450 mb-1 animate-bounce">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-extrabold text-slate-105">Gym License Capacity Reached</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your account is licensed for <strong className="text-slate-200">{user?.allowedGyms || 1} gym location(s)</strong>. 
              You already have <strong className="text-slate-200">{ownerOutlets.length} active location(s)</strong>.
            </p>
            <p className="text-xs text-slate-500 font-medium">
              Please purchase a <strong>2-Gym Location Support License</strong> in your profile settings tab to register another branch.
            </p>
            
            <div className="pt-4 flex gap-3 border-t border-slate-850">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 px-4 border border-slate-800 hover:bg-slate-800 text-slate-400 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/profile?tab=billing');
                }}
                className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-lg shadow-purple-900/10 animate-pulse"
              >
                Go to Billing
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!addGymForm.businessName.trim() || !addGymForm.phone1.trim()) return;
              addGymOwner({
                ...addGymForm,
                ownerName: user?.name
              });
              setAddGymForm({ businessName: '', ownerName: '', phone1: '', phone2: '', address: '', pricingPlan: 'basic' });
              onClose();
            }}
            className="space-y-4"
          >
            {/* Business / Outlet Name */}
            <div className="space-y-1">
              <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Gym / Outlet Name *</label>
              <input
                type="text"
                value={addGymForm.businessName}
                onChange={e => setAddGymForm(f => ({ ...f, businessName: e.target.value }))}
                placeholder="e.g. Gold's Gym Downtown"
                required
                className="w-full px-3 py-2 bg-slate-955/60 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500 text-xs"
              />
            </div>

            {/* Two Phone Numbers */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Primary Phone *</label>
                <input
                  type="tel"
                  value={addGymForm.phone1}
                  onChange={e => setAddGymForm(f => ({ ...f, phone1: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                  placeholder="9876543210"
                  maxLength={10}
                  pattern="[0-9]{10}"
                  required
                  className="w-full px-3 py-2 bg-slate-955/60 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Secondary Phone</label>
                <input
                  type="tel"
                  value={addGymForm.phone2}
                  onChange={e => setAddGymForm(f => ({ ...f, phone2: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                  placeholder="Optional"
                  maxLength={10}
                  pattern="[0-9]{10}"
                  className="w-full px-3 py-2 bg-slate-955/60 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500 text-xs font-mono"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1">
              <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Gym Address</label>
              <textarea
                value={addGymForm.address}
                onChange={e => setAddGymForm(f => ({ ...f, address: e.target.value }))}
                placeholder="Street, City, State, PIN"
                rows={2}
                className="w-full px-3 py-2 bg-slate-955/60 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500 text-xs resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-purple-900/20"
            >
              Register New Location
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default AddGymOutletModal;
