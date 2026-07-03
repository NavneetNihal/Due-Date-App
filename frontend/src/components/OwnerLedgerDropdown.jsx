import React from 'react';
import { History, X } from 'lucide-react';

function OwnerLedgerDropdown({
  payments,
  totalCollected,
  setIsOwnerLedgerOpen
}) {
  return (
    <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-slate-900 border border-amber-500/20 rounded-xl shadow-2xl shadow-black/60 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-200 flex items-center gap-1.5">
            <History className="h-3 w-3 text-amber-400" />
            Member Payment Ledger
          </span>
          <span className="text-[8px] text-slate-500 font-semibold block mt-0.5">
            {payments.length} total payment{payments.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsOwnerLedgerOpen(false)}
          className="text-slate-500 hover:text-slate-300 transition cursor-pointer p-1 rounded hover:bg-slate-800"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Scrollable ledger rows */}
      <div className="max-h-72 overflow-y-auto">
        {payments.length === 0 ? (
          <div className="py-8 text-center text-[10px] text-slate-500">
            No payments recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {[...payments]
              .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
              .map(p => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/30 transition">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-[8px] font-black bg-emerald-500/15 text-emerald-400">
                    +
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-slate-200 block truncate">{p.memberName}</span>
                    <span className="text-[8px] text-slate-500 truncate block">
                      {p.paymentMethod} · {p.notes}
                    </span>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className="text-[11px] font-black text-emerald-400">
                      +₹{p.amountPaid.toLocaleString('en-IN')}
                    </span>
                    <span className="block text-[8px] text-slate-500 font-mono">{p.paymentDate}</span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Footer total */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-800 bg-slate-950/60">
        <span className="text-[9px] text-slate-500 font-semibold">Total Collected (All Time)</span>
        <span className="text-[11px] font-black text-amber-400">₹{totalCollected.toLocaleString('en-IN')}</span>
      </div>
    </div>
  );
}

export default OwnerLedgerDropdown;
