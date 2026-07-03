import React from 'react';
import { Building, CheckCircle, Users, IndianRupee, History, X } from 'lucide-react';

function CreatorStats({
  totalOwners,
  activeOwners,
  totalARR,
  allLedgerEntries,
  isArrLedgerOpen,
  setIsArrLedgerOpen,
  lastPaidOwnerId
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Metric 1 */}
      <div className="backdrop-blur-md bg-slate-900/40 border border-slate-800 rounded-xl p-4 sm:p-5 relative overflow-hidden">
        <div className="absolute top-3 right-3 text-slate-600">
          <Building className="h-5 w-5" />
        </div>
        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Registered Gym Clients</span>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-100 mt-1">{totalOwners}</h2>
        <div className="text-[9px] text-slate-450 mt-1.5 font-semibold">Active Gym SaaS Installs</div>
      </div>

      {/* Metric 2 */}
      <div className="backdrop-blur-md bg-slate-900/40 border border-slate-800 rounded-xl p-4 sm:p-5 relative overflow-hidden">
        <div className="absolute top-3 right-3 text-emerald-500">
          <CheckCircle className="h-5 w-5" />
        </div>
        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Active Subscribers</span>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-100 mt-1">
          {activeOwners} <span className="text-xs text-slate-400 font-normal">/ {totalOwners}</span>
        </h2>
        <div className="text-[9px] text-slate-450 mt-1.5 font-semibold">Paying License Status</div>
      </div>

      {/* Metric 3 */}
      <div className="backdrop-blur-md bg-slate-900/40 border border-slate-800 rounded-xl p-4 sm:p-5 relative overflow-hidden">
        <div className="absolute top-3 right-3 text-purple-400">
          <Users className="h-5 w-5" />
        </div>
        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Basic Plan Rate</span>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-100 mt-1">
          ₹699<span className="text-xs text-slate-450 font-normal">/month</span>
        </h2>
        <div className="text-[9px] text-slate-450 mt-1.5 font-semibold">Flat Pricing Model</div>
      </div>

      {/* Metric 4 - Clickable ARR / Ledger Drawer */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsArrLedgerOpen(v => !v)}
          className={`w-full text-left backdrop-blur-md bg-slate-900/40 border rounded-xl p-4 sm:p-5 relative overflow-hidden transition hover:border-amber-500/30 cursor-pointer group ${
            isArrLedgerOpen ? 'border-amber-500/40 shadow-lg shadow-amber-500/5' : 'border-slate-800'
          }`}
        >
          <div className="absolute top-3 right-3 text-amber-500">
            <IndianRupee className="h-5 w-5" />
          </div>
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Total Platform ARR / Earnings</span>
          <h2 className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">₹{totalARR.toLocaleString('en-IN')}</h2>
          <div className="flex items-center gap-1 text-[9px] text-slate-450 mt-1.5 font-semibold">
            <span>Collected Directly on Platform</span>
            <span className={`ml-auto text-[8px] font-black uppercase tracking-wider transition ${
              isArrLedgerOpen ? 'text-amber-400' : 'text-slate-600 group-hover:text-slate-400'
            }`}>
              {isArrLedgerOpen ? '▲ Hide' : '▼ View Ledger'}
            </span>
          </div>
        </button>

        {/* Inline ledger dropdown */}
        {isArrLedgerOpen && (
          <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-slate-900 border border-amber-500/20 rounded-xl shadow-2xl shadow-black/60 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-200 flex items-center gap-1.5">
                  <History className="h-3 w-3 text-amber-400" />
                  Payment Ledger
                </span>
                <span className="text-[8px] text-slate-500 font-semibold block mt-0.5">
                  {allLedgerEntries.length} total transaction{allLedgerEntries.length !== 1 ? 's' : ''}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsArrLedgerOpen(false)}
                className="text-slate-500 hover:text-slate-300 transition cursor-pointer p-1 rounded hover:bg-slate-800"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Scrollable ledger rows */}
            <div className="max-h-72 overflow-y-auto">
              {allLedgerEntries.length === 0 ? (
                <div className="py-8 text-center text-[10px] text-slate-500">
                  No payments recorded yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-800/60">
                  {allLedgerEntries.map((entry, idx) => {
                    const isNewEntry =
                      !entry.isReversal &&
                      lastPaidOwnerId &&
                      entry.id === allLedgerEntries.find(e => !e.isReversal)?.id &&
                      idx === 0;
                    return (
                      <div
                        key={entry.id}
                        className={`flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/30 transition-all duration-300 ${
                          entry.isReversal ? 'opacity-60' : ''
                        } ${isNewEntry ? 'bg-emerald-500/10 border-l-2 border-emerald-500/60' : ''}`}
                      >
                        {/* Icon */}
                        <div className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-[8px] font-black ${
                          entry.isReversal
                            ? 'bg-red-500/15 text-red-400'
                            : isNewEntry
                            ? 'bg-emerald-500/30 text-emerald-300'
                            : 'bg-emerald-500/15 text-emerald-400'
                        }`}>
                          {entry.isReversal ? '−' : '+'}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-bold block truncate ${isNewEntry ? 'text-emerald-300' : 'text-slate-200'}`}>
                              {entry.businessName}
                            </span>
                            {isNewEntry && (
                              <span className="flex-shrink-0 text-[7px] font-black uppercase tracking-wider px-1 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">New</span>
                            )}
                          </div>
                          <span className="text-[8px] text-slate-500 truncate block">
                            {entry.ownerName} · {entry.paymentDate}
                          </span>
                        </div>

                        {/* Amount */}
                        <div className="flex-shrink-0 text-right">
                          <span className={`text-[11px] font-black ${
                            entry.isReversal ? 'text-red-400' : isNewEntry ? 'text-emerald-300' : 'text-emerald-405'
                          }`}>
                            {entry.isReversal ? '-' : '+'}₹{Math.abs(entry.amountPaid).toLocaleString('en-IN')}
                          </span>
                          {entry.isReversal && (
                            <span className="block text-[7px] text-red-500/65 uppercase font-bold">reversal</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Net total footer */}
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-800 bg-slate-950/60">
              <span className="text-[9px] text-slate-500 font-semibold">Net Collected</span>
              <span className="text-[11px] font-black text-amber-400">
                ₹{allLedgerEntries.reduce((sum, e) => sum + e.amountPaid, 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CreatorStats;
