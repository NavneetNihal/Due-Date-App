import React from 'react';
import { Users, Check, RotateCcw, X, Search, Plus } from 'lucide-react';

function CreatorClientList({
  filteredOwners,
  allMembers,
  creatorSearchQuery,
  setCreatorSearchQuery,
  setIsAddGymOpen,
  updateGymOwnerStatus,
  setRevokeTarget,
  markGymOwnerPaid,
  reverseGymOwnerPayment,
  setDeleteTarget,
  hasReversibleOwnerPayment,
  setIsArrLedgerOpen,
  setLastPaidOwnerId
}) {
  return (
    <div className="backdrop-blur-md bg-slate-900/40 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl space-y-5">
      {/* Registry header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-850">
        <div>
          <h3 className="text-xs font-black text-slate-200 uppercase tracking-widest">Gym Client Subscription Registry</h3>
          <p className="text-[9px] text-slate-555 mt-0.5 font-semibold">Active installations of Due Date client database.</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search box */}
          <div className="relative max-w-xs w-full">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-555">
              <Search className="h-3.5 w-3.5" />
            </div>
            <input
              type="text"
              value={creatorSearchQuery}
              onChange={(e) => setCreatorSearchQuery(e.target.value)}
              placeholder="Search gyms, owners..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-955/60 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-brand-primary text-xs"
            />
          </div>
          {/* Add Gym Button */}
          <button
            type="button"
            onClick={() => setIsAddGymOpen(true)}
            className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] rounded-lg transition cursor-pointer"
          >
            <Plus className="h-3 w-3" />
            Add Gym
          </button>
        </div>
      </div>

      {/* Registry List */}
      <div className="space-y-4">
        {filteredOwners.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-555 border border-dashed border-slate-800 rounded-xl">
            No gym clients matched your search.
          </div>
        ) : (
          filteredOwners.map(owner => (
            <div key={owner.id} className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl space-y-3.5 relative overflow-hidden transition hover:border-slate-750">
              {/* Status Ribbon Tag */}
              <div className="absolute top-3.5 right-3.5 flex gap-1">
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                  owner.subscriptionStatus === 'active' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-sm shadow-emerald-500/5' 
                    : owner.subscriptionStatus === 'overdue' 
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                }`}>
                  {owner.subscriptionStatus}
                </span>
                <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border bg-brand-primary/10 text-brand-primary border-brand-primary/20">
                  Basic Plan
                </span>
                <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border bg-slate-900 text-slate-400 border-slate-800">
                  {owner.allowedGyms || 1} Gym{ (owner.allowedGyms || 1) > 1 ? 's' : '' }
                </span>
              </div>

              {/* Title block */}
              <div className="space-y-0.5">
                <h4 className="text-sm font-black text-slate-100 flex items-center gap-1.5">
                  {owner.businessName}
                </h4>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-slate-500 font-bold block">ID: {owner.id}</span>
                  <span className="text-[10px] font-bold font-mono flex items-center gap-1">
                    <Users className="h-3 w-3 text-slate-500" />
                    <span className="text-slate-300">{allMembers.filter(m => (m.gymId || 'owner_golds') === owner.id).length}</span>
                    <span className="text-slate-600 text-[8px] font-semibold ml-0.5">members</span>
                  </span>
                </div>
              </div>

              {/* Profiles / details grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-slate-400 border-t border-b border-slate-900 py-3 font-mono">
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-555 block font-sans uppercase font-bold">Gym Owner Profile</span>
                  <span className="text-slate-200 font-sans font-bold block">{owner.name}</span>
                  <span className="block text-slate-500">{owner.email}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-555 block font-sans uppercase font-bold">Billing Details</span>
                  <span className="block text-slate-400">Phone: {owner.phone}</span>
                  <span className="block text-slate-400 font-sans">
                    Revenue: <strong className="text-brand-primary">₹{owner.totalPaidToCreator.toLocaleString('en-IN')}</strong> (Last paid: {owner.lastPaymentDate})
                  </span>
                  <span className="block text-slate-400 font-sans">
                    Next Due: <strong className={
                      owner.subscriptionStatus === 'active' 
                        ? 'text-emerald-400 font-bold' 
                        : owner.subscriptionStatus === 'overdue' 
                        ? 'text-amber-400 font-bold' 
                        : 'text-red-400 font-bold'
                    }>{owner.subscriptionDueDate || 'N/A'}</strong>
                    {owner.subscriptionStatus === 'overdue' && (
                      <span className="text-[9px] text-amber-500 font-bold ml-1 font-sans uppercase tracking-wider">(Overdue)</span>
                    )}
                    {owner.subscriptionStatus === 'revoked' && (
                      <span className="text-[9px] text-red-500 font-bold ml-1 font-sans uppercase tracking-wider">(Suspended)</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Interactive Status & Plan Management Panel */}
              <div className="space-y-2">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Manage Gym Owner Access (Simulation & Controls)</span>
                
                <div className="flex flex-col gap-2 bg-slate-950/45 p-2.5 border border-slate-900 rounded-lg">
                  {/* Status & Plan Row */}
                  <div className="flex flex-wrap gap-2 justify-between items-center pb-2 border-b border-slate-900/55">
                    {/* Status controls */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider mr-1">Status:</span>
                      <button
                        type="button"
                        onClick={() => updateGymOwnerStatus(owner.id, 'active')}
                        className={`py-1 px-2 text-[9px] font-bold rounded transition cursor-pointer ${
                          owner.subscriptionStatus === 'active'
                            ? 'bg-emerald-500 text-slate-950 font-black'
                            : 'bg-slate-900 border border-slate-800 text-slate-444 hover:bg-slate-800'
                        }`}
                      >
                        Active
                      </button>
                      <button
                        type="button"
                        onClick={() => updateGymOwnerStatus(owner.id, 'overdue')}
                        className={`py-1 px-2 text-[9px] font-bold rounded transition cursor-pointer ${
                          owner.subscriptionStatus === 'overdue'
                            ? 'bg-amber-500 text-slate-955 font-black'
                            : 'bg-slate-900 border border-slate-800 text-slate-444 hover:bg-slate-800'
                        }`}
                      >
                        Overdue
                      </button>
                      <button
                        type="button"
                        onClick={() => setRevokeTarget(owner)}
                        className={`py-1 px-2 text-[9px] font-bold rounded transition cursor-pointer ${
                          owner.subscriptionStatus === 'revoked'
                            ? 'bg-red-500 text-white font-black'
                            : 'bg-slate-900 border border-slate-800 text-slate-444 hover:bg-slate-800'
                        }`}
                      >
                        Revoked
                      </button>
                    </div>

                    {/* Flat Basic Plan */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider mr-1">Plan:</span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-purple-500/10 border border-purple-500/20 text-purple-400">Basic Plan</span>
                    </div>
                  </div>

                  {/* SaaS Ledger Actions */}
                  <div className="flex flex-wrap items-center justify-between pt-1 text-[10px]">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[8px] text-slate-555 font-bold uppercase tracking-wider mr-1">SaaS Billing:</span>
                      <button
                        type="button"
                        onClick={() => {
                          markGymOwnerPaid(owner.id);
                          setIsArrLedgerOpen(true);
                          setLastPaidOwnerId(owner.id);
                          setTimeout(() => setLastPaidOwnerId(null), 2000);
                        }}
                        className="flex items-center gap-1 px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-955 font-bold rounded text-[8px] transition cursor-pointer active:scale-95 shadow-sm shadow-emerald-500/10"
                      >
                        <Check className="h-2.5 w-2.5" />
                        {owner.subscriptionStatus === 'active' ? 'Renew Early' : 'Mark Paid'} (₹699)
                      </button>

                      {hasReversibleOwnerPayment(owner) && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Undo last payment of ₹699 for ${owner.businessName}? This will deduct the payment entry.`)) {
                              reverseGymOwnerPayment(owner.id);
                            }
                          }}
                          className="flex items-center gap-1 px-2 py-1 border border-slate-800 hover:border-amber-500/40 hover:bg-amber-500/10 text-slate-400 hover:text-amber-450 rounded text-[8px] transition cursor-pointer"
                          title="Undo last payment"
                        >
                          <RotateCcw className="h-2.5 w-2.5" />
                          Undo Pay
                        </button>
                      )}
                    </div>
                    <span className="text-[8px] text-slate-555 italic font-semibold">Extend subscription (+30 days)</span>
                  </div>

                </div>
              </div>

              {/* Delete Gym Button */}
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(owner)}
                  className="flex items-center gap-1 px-2 py-1 border border-red-500/20 hover:border-red-500/50 hover:bg-red-500/10 text-red-500/60 hover:text-red-400 rounded text-[8px] font-bold transition cursor-pointer"
                >
                  <X className="h-2.5 w-2.5" />
                  Delete Gym
                </button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}

export default CreatorClientList;
