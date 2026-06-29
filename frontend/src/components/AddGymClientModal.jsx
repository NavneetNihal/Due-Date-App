import React, { useState } from 'react';
import { Building, X } from 'lucide-react';

function AddGymClientModal({ isOpen, onClose, addGymOwner }) {
  const [addGymForm, setAddGymForm] = useState({
    businessName: '', ownerName: '', phone1: '', phone2: '', address: '', pricingPlan: 'basic', allowedGyms: 1
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-purple-500/20 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-100 flex items-center gap-2">
              <Building className="h-4 w-4 text-purple-400" />
              Add New Gym Client
            </h3>
            <p className="text-[10px] text-slate-555 mt-0.5 font-semibold">Register a new gym outlet on the platform.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 p-1 rounded hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!addGymForm.businessName.trim() || !addGymForm.ownerName.trim() || !addGymForm.phone1.trim()) return;
            addGymOwner(addGymForm);
            setAddGymForm({ businessName: '', ownerName: '', phone1: '', phone2: '', address: '', pricingPlan: 'basic', allowedGyms: 1 });
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
              placeholder="e.g. Gold's Gym Elite"
              required
              className="w-full px-3 py-2 bg-slate-955/60 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500 text-xs"
            />
          </div>

          {/* Owner / Client Name */}
          <div className="space-y-1">
            <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Gym Owner Name *</label>
            <input
              type="text"
              value={addGymForm.ownerName}
              onChange={e => setAddGymForm(f => ({ ...f, ownerName: e.target.value }))}
              placeholder="e.g. Rajesh Kumar"
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
            Register Gym Client
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddGymClientModal;
