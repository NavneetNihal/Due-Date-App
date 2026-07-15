import React, { useContext, useState } from 'react';
import { Calendar, Phone, CheckCircle, Trash2, Clock, Check, RotateCcw, AlertCircle } from 'lucide-react';
import { formatDate, AppContext, addDays } from '../context/AppContext.jsx';

function MembersTable({ members, payments = [], onMarkPaid, onDelete, onReversePayment }) {
  const { user } = useContext(AppContext);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState(null);
  const [undoConfirmTarget, setUndoConfirmTarget] = useState(null);
  const today = formatDate(new Date());

  const getWhatsAppLink = (member) => {
    const template = user?.settings?.whatsappTemplate || 'Hi {name}, your gym fee of *₹{amount}* is due on *{due_date}*. Please pay via UPI to ID: *{upi_id}* and *send a screenshot* of the receipt to this chat to confirm. Thank you!';
    const upiId = user?.settings?.upiId || 'your-upi-id';
    const paymentLink = user?.settings?.paymentLink || '';
    
    const text = template
      .replace(/{name}/g, member.name)
      .replace(/{amount}/g, member.subscriptionAmount || member.amount || 0)
      .replace(/{due_date}/g, member.nextDueDate)
      .replace(/{upi_id}/g, upiId)
      .replace(/{payment_link}/g, paymentLink);
      
    return `https://wa.me/91${member.phoneNumber}?text=${encodeURIComponent(text)}`;
  };

  // Helper to find latest positive payment that can be undone/reversed (has not been reversed yet)
  const getReversiblePayment = (memberId) => {
    if (!payments) return null;
    
    // Find all payments for this member (latest first)
    const memberPayments = payments.filter(p => p.memberId === memberId);
    
    // Find first positive payment that is not reversed by any other record in payments
    return memberPayments.find(p => {
      // Must be a positive payment and not a reversal itself
      if (p.amountPaid <= 0 || p.id.startsWith('p_rev_')) return false;
      
      // Look for a reversal entry for this specific payment in the global list
      const isReversed = payments.some(rev => rev.reversesPaymentId === p.id);
      return !isReversed;
    });
  };

  const getReminderScheduleState = (member) => {
    const nextDue = new Date(member.nextDueDate);
    const todayDate = new Date(today);
    const diffTime = nextDue - todayDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Days until due date (can be negative if overdue)

    if (diffDays > 7) {
      const alertDate = addDays(member.nextDueDate, -7);
      return {
        label: `7d Before Alert: Scheduled for ${alertDate}`,
        color: 'text-slate-550',
        badge: 'bg-slate-900/40 text-slate-500 border-slate-800'
      };
    } else if (diffDays <= 7 && diffDays > 0) {
      return {
        label: `7d Before Alert Sent! Next: On Due Date (${member.nextDueDate})`,
        color: 'text-purple-400',
        badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      };
    } else if (diffDays === 0) {
      return {
        label: `Due Today Alert Sent! Next: +3 Days Overdue (${addDays(member.nextDueDate, 3)})`,
        color: 'text-amber-400',
        badge: 'bg-amber-500/10 text-amber-400 border-amber-550/20'
      };
    } else {
      const overdueDays = Math.abs(diffDays);
      if (overdueDays < 3) {
        return {
          label: `Due Today Alert Sent! Next: +3 Days Overdue (${addDays(member.nextDueDate, 3)})`,
          color: 'text-amber-500',
          badge: 'bg-amber-500/10 text-amber-500 border-amber-550/20'
        };
      } else if (overdueDays >= 3 && overdueDays < 7) {
        return {
          label: `+3d Overdue Alert Sent! Next: +7 Days Overdue (${addDays(member.nextDueDate, 7)})`,
          color: 'text-red-400',
          badge: 'bg-red-500/10 text-red-400 border-red-500/20'
        };
      } else if (overdueDays >= 7 && overdueDays < 10) {
        return {
          label: `+7d Overdue Alert Sent! Next: +10 Days Overdue (${addDays(member.nextDueDate, 10)})`,
          color: 'text-red-450',
          badge: 'bg-red-500/15 text-red-450 border-red-550/25'
        };
      } else {
        return {
          label: `+10d Overdue Alert Sent! (Final Reminder Sent)`,
          color: 'text-red-500',
          badge: 'bg-red-500/20 text-red-500 border-red-600/30'
        };
      }
    }
  };

  // Helper to determine status type and styles
  const getMemberStatus = (member) => {
    // Always compute overdue/due-today first — status field is only used for Inactive
    // after 10 days overdue (set by scheduler), but we still show the overdue days.
    if (member.nextDueDate < today) {
      const due = new Date(member.nextDueDate);
      const diffTime = Math.abs(new Date(today) - due);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        label: `Overdue (${diffDays}d)`,
        bg: 'bg-red-500/10 text-red-400 border-red-500/25 animate-pulse',
        textClass: 'text-red-400 font-bold'
      };
    }

    if (member.nextDueDate === today) {
      return {
        label: 'Due Today',
        bg: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
        textClass: 'text-amber-400 font-semibold'
      };
    }

    if (member.status === 'inactive') {
      return {
        label: 'Inactive',
        bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        textClass: 'text-slate-400'
      };
    }

    // Active & Paid
    return {
      label: 'Active',
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      textClass: 'text-emerald-400'
    };
  };


  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border border-slate-800/80 bg-slate-900/40 rounded-2xl backdrop-blur-md">
        <Clock className="h-10 w-10 text-slate-600 mb-3" />
        <p className="text-slate-400 font-medium">No members found</p>
        <p className="text-xs text-slate-500 mt-1">Try refining your search or add a new member.</p>
      </div>
    );
  }

  return (
    <div>
      {/* ================= DESKTOP TABLE VIEW ================= */}
      <div className="hidden md:block overflow-x-auto border border-slate-800 bg-slate-900/50 rounded-2xl backdrop-blur-md">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-850 bg-slate-950/40 text-slate-400 text-xs font-bold uppercase tracking-wider">
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">WhatsApp</th>
              <th className="px-6 py-4">Subscription</th>
              <th className="px-6 py-4">Next Due Date</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850 text-sm text-slate-300">
            {members.map((member) => {
              const statusObj = getMemberStatus(member);
              const isOverdueOrToday = member.nextDueDate <= today;
              const reversiblePayment = getReversiblePayment(member.id);

              return (
                <tr 
                  key={member.id} 
                  className={`hover:bg-slate-800/30 transition duration-150 ${isOverdueOrToday ? 'bg-red-500/[0.01]' : ''}`}
                >
                  {/* Name */}
                  <td className="px-6 py-4 font-semibold text-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-xs font-bold text-brand-primary">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="block">{member.name}</span>
                        <span className="text-[10px] text-slate-500 font-normal">Joined {member.joiningDate}</span>
                      </div>
                    </div>
                  </td>
                  
                  {/* WhatsApp */}
                  <td className="px-6 py-4 font-mono text-slate-300 text-xs">
                    <a 
                      href={getWhatsAppLink(member)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 hover:text-brand-accent transition"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      +91 {member.phoneNumber}
                    </a>
                  </td>

                  {/* Subscription Tier */}
                  <td className="px-6 py-4">
                    <span className="block font-medium text-slate-200 capitalize">
                      {member.subscriptionTier}
                    </span>
                    <span className="text-xs text-slate-500">
                      ₹{(member.subscriptionAmount || member.amount || 0).toLocaleString('en-IN')}
                    </span>
                  </td>

                  {/* Next Due Date */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-slate-500" />
                      <span className={statusObj.textClass}>
                        {member.nextDueDate}
                      </span>
                    </div>
                    {getReminderScheduleState(member) && (
                      <span className={`mt-1.5 block text-[8px] font-bold uppercase tracking-wider ${getReminderScheduleState(member).color}`}>
                        {getReminderScheduleState(member).label}
                      </span>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusObj.bg}`}>
                      {statusObj.label}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {isOverdueOrToday && (
                        <button
                          onClick={() => onMarkPaid(member.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg text-xs transition duration-150 active:scale-95 shadow-md shadow-emerald-500/10 cursor-pointer"
                          title="Mark payment completed (+30 days)"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Mark Paid
                        </button>
                      )}
                      
                      {!isOverdueOrToday && (
                        <button
                          onClick={() => onMarkPaid(member.id)}
                          className="p-1.5 border border-slate-800 hover:border-emerald-500/40 hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-400 rounded-lg transition duration-150 cursor-pointer"
                          title="Renew early"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}

                      {/* Quick Undo button */}
                      {reversiblePayment && (
                        <button
                          onClick={() => {
                            setUndoConfirmTarget({
                              payment: reversiblePayment,
                              memberName: member.name
                            });
                          }}
                          className="p-1.5 border border-slate-800 hover:border-amber-500/40 hover:bg-amber-500/10 text-slate-400 hover:text-amber-400 rounded-lg transition duration-150 cursor-pointer"
                          title="Undo last payment"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      )}

                      <button
                        onClick={() => setDeleteConfirmTarget(member)}
                        className="p-1.5 border border-slate-800 hover:border-red-500/40 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-lg transition duration-150 cursor-pointer"
                        title="Delete Member"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ================= MOBILE CARD VIEW ================= */}
      <div className="md:hidden space-y-4">
        {members.map((member) => {
          const statusObj = getMemberStatus(member);
          const isOverdueOrToday = member.nextDueDate <= today;
          const reversiblePayment = getReversiblePayment(member.id);

          return (
            <div 
              key={member.id} 
              className={`backdrop-blur-md border rounded-2xl p-5 space-y-4 transition ${
                isOverdueOrToday 
                  ? 'bg-red-500/[0.02] border-red-500/20' 
                  : 'bg-slate-900/40 border-slate-800'
              }`}
            >
              {/* Header Info */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center font-bold text-brand-primary">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100">{member.name}</h3>
                    <p className="text-[10px] text-slate-500">Joined {member.joiningDate}</p>
                  </div>
                </div>

                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${statusObj.bg}`}>
                  {statusObj.label}
                </span>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 py-3 border-t border-b border-slate-850/60 text-xs">
                <div>
                  <span className="text-slate-500 block mb-0.5">WhatsApp</span>
                  <a 
                    href={getWhatsAppLink(member)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 font-mono text-slate-200 hover:text-brand-accent transition"
                  >
                    <Phone className="h-3 w-3" />
                    +91 {member.phoneNumber}
                  </a>
                </div>

                <div>
                  <span className="text-slate-500 block mb-0.5">Subscription</span>
                  <span className="text-slate-200 capitalize font-medium">
                    {member.subscriptionTier} (₹{member.subscriptionAmount || member.amount || 0})
                  </span>
                </div>

                <div className="col-span-2">
                  <span className="text-slate-500 block mb-0.5">Next Due Date</span>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" />
                    <span className={statusObj.textClass}>
                      {member.nextDueDate}
                    </span>
                  </div>
                  {getReminderScheduleState(member) && (
                    <span className={`mt-1.5 block text-[8px] font-bold uppercase tracking-wider ${getReminderScheduleState(member).color}`}>
                      {getReminderScheduleState(member).label}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => onMarkPaid(member.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold text-xs transition duration-150 active:scale-95 cursor-pointer ${
                    isOverdueOrToday 
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/10' 
                      : 'bg-slate-800 text-slate-300 border border-slate-700/50 hover:bg-slate-750'
                  }`}
                >
                  <Check className="h-4 w-4" />
                  {isOverdueOrToday ? 'Mark Paid' : 'Renew / Pay'}
                </button>

                {/* Mobile Quick Undo */}
                {reversiblePayment && (
                  <button
                    onClick={() => {
                      setUndoConfirmTarget({
                        payment: reversiblePayment,
                        memberName: member.name
                      });
                    }}
                    className="px-3 border border-slate-800 hover:border-amber-500/40 hover:bg-amber-500/10 text-slate-400 hover:text-amber-400 rounded-xl transition duration-150 cursor-pointer"
                    title="Undo last payment"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                )}

                <button
                  onClick={() => setDeleteConfirmTarget(member)}
                  className="px-3 border border-slate-800 hover:border-red-500/40 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-xl transition duration-150 cursor-pointer"
                  title="Delete Member"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* ── Delete Member Confirmation Modal ── */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm text-left">
          <div className="bg-slate-900 border border-red-500/30 rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 h-10 w-10 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center text-red-400">
                <AlertCircle className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-100 font-sans">Delete Gym Member?</h3>
                <p className="text-xs text-slate-400 mt-1 font-sans">
                  Are you sure you want to permanently delete <strong className="text-slate-200">{deleteConfirmTarget.name}</strong>? This action will also delete all their payment records and cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1 font-sans">
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget(null)}
                className="flex-1 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete(deleteConfirmTarget.id);
                  setDeleteConfirmTarget(null);
                }}
                className="flex-1 py-2 bg-red-650 hover:bg-red-750 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Undo Payment Confirmation Modal ── */}
      {undoConfirmTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm text-left">
          <div className="bg-slate-900 border border-amber-500/20 rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 h-10 w-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400">
                <AlertCircle className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-100 font-sans">Undo Last Payment?</h3>
                <p className="text-xs text-slate-400 mt-1 font-sans">
                  Are you sure you want to undo the last payment of <strong className="text-slate-200">₹{undoConfirmTarget.payment.amountPaid.toLocaleString('en-IN')}</strong> for <strong className="text-slate-200">{undoConfirmTarget.memberName}</strong>? This will rollback their subscription next due date.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1 font-sans">
              <button
                type="button"
                onClick={() => setUndoConfirmTarget(null)}
                className="flex-1 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onReversePayment(undoConfirmTarget.payment.id);
                  setUndoConfirmTarget(null);
                }}
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Yes, Undo Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MembersTable;
