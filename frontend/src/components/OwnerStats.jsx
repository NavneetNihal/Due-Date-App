import React from 'react';
import { Users, CheckCircle, AlertCircle, IndianRupee } from 'lucide-react';

function OwnerStats({
  totalMembersCount,
  activeMembersCount,
  overdueMembersCount,
  monthlyCollected,
  expectedRevenue,
  totalCollected,
  setIsMembersListOpen,
  setActiveFilter,
  setIsOwnerLedgerOpen,
  isOwnerLedgerOpen,
  OwnerLedgerDropdownComponent
}) {
  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Members */}
      <button 
        onClick={() => setIsMembersListOpen(true)}
        className="backdrop-blur-md bg-slate-900/40 border border-slate-800 hover:border-slate-700 hover:bg-slate-850/50 p-4 rounded-xl flex items-center gap-4 text-left transition duration-150 cursor-pointer w-full"
      >
        <div className="p-3 bg-blue-500/10 border border-blue-500/25 rounded-lg text-blue-400">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Members</span>
          <span className="text-xl font-black text-slate-100">{totalMembersCount}</span>
          <span className="text-[8px] text-slate-500 font-semibold block mt-0.5">Basic Plan Members</span>
        </div>
      </button>

      {/* Active Members */}
      <button 
        onClick={() => setActiveFilter('active')}
        className="backdrop-blur-md bg-slate-900/40 border border-slate-800 hover:border-slate-700 hover:bg-slate-850/50 p-4 rounded-xl flex items-center gap-4 text-left transition duration-150 cursor-pointer w-full"
      >
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-lg text-emerald-400">
          <CheckCircle className="h-5 w-5" />
        </div>
        <div>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Active / Paid</span>
          <span className="text-xl font-black text-slate-100 text-emerald-400">{activeMembersCount}</span>
        </div>
      </button>

      {/* Overdue Members */}
      <button 
        onClick={() => setActiveFilter('overdue')}
        className="backdrop-blur-md bg-slate-900/40 border border-slate-800 hover:border-slate-700 hover:bg-slate-850/50 p-4 rounded-xl flex items-center gap-4 text-left transition duration-150 cursor-pointer w-full"
      >
        <div className={`p-3 rounded-lg ${overdueMembersCount > 0 ? 'bg-red-500/15 border border-red-500/30 text-red-400' : 'bg-slate-800 text-slate-500 border border-slate-850'}`}>
          <AlertCircle className="h-5 w-5" />
        </div>
        <div>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Overdue Fees</span>
          <span className={`text-xl font-black ${overdueMembersCount > 0 ? 'text-red-400' : 'text-slate-400'}`}>
            {overdueMembersCount}
          </span>
        </div>
      </button>

      {/* Expected Monthly Rev / Monthly Collected */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOwnerLedgerOpen(v => !v)}
          className={`w-full text-left backdrop-blur-md bg-slate-900/40 border p-4 rounded-xl flex items-center gap-4 transition hover:border-amber-500/30 cursor-pointer group ${
            isOwnerLedgerOpen ? 'border-amber-500/40 shadow-lg shadow-amber-500/5' : 'border-slate-800'
          }`}
        >
          <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-lg text-amber-400">
            <IndianRupee className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Monthly Collected</span>
            <span className="text-xl font-black text-amber-400 block">
              ₹{monthlyCollected.toLocaleString('en-IN')}
            </span>
            <div className="flex items-center gap-2 mt-1 text-[9px] text-slate-450 font-medium">
              <span>Est. MRR: ₹{Math.round(expectedRevenue).toLocaleString('en-IN')}/mo</span>
              <span className="text-slate-550">· All-time: ₹{totalCollected.toLocaleString('en-IN')}</span>
              <span className={`ml-auto text-[8px] font-black uppercase tracking-wider transition ${
                isOwnerLedgerOpen ? 'text-amber-400' : 'text-slate-600 group-hover:text-slate-400'
              }`}>
                {isOwnerLedgerOpen ? '▲ Hide' : '▼ View Ledger'}
              </span>
            </div>
          </div>
        </button>

        {/* Render inline payment ledger dropdown */}
        {isOwnerLedgerOpen && OwnerLedgerDropdownComponent}
      </div>
    </section>
  );
}

export default OwnerStats;
