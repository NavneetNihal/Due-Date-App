import React, { useState, useEffect } from 'react';
import { X, Link as LinkIcon, IndianRupee, MessageSquare } from 'lucide-react';

function SettingsModal({ isOpen, onClose, user, updateSettings }) {
  const [whatsappTemplate, setWhatsappTemplate] = useState(user?.settings?.whatsappTemplate || '');
  const [paymentLink, setPaymentLink] = useState(user?.settings?.paymentLink || '');
  const [reminderSchedule, setReminderSchedule] = useState(user?.settings?.reminderSchedule || 'standard');
  const [upiId, setUpiId] = useState(user?.settings?.upiId || 'goldsgym@okaxis');
  const [settingsSavedMessage, setSettingsSavedMessage] = useState(false);

  useEffect(() => {
    if (user?.settings) {
      setWhatsappTemplate(user.settings.whatsappTemplate || '');
      setPaymentLink(user.settings.paymentLink || '');
      setReminderSchedule(user.settings.reminderSchedule || 'standard');
      setUpiId(user.settings.upiId || 'goldsgym@okaxis');
    }
  }, [user?.settings]);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    updateSettings({ whatsappTemplate, paymentLink, reminderSchedule, upiId });
    setSettingsSavedMessage(true);
    setTimeout(() => {
      setSettingsSavedMessage(false);
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-850">
          <h3 className="text-lg font-bold text-slate-100">Automation Settings</h3>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSaveSettings} className="mt-4 space-y-4">
          {/* Payment Link */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Default Payment Link (UPI / Razorpay)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <LinkIcon className="h-4 w-4" />
              </div>
              <input
                type="url"
                value={paymentLink}
                onChange={(e) => setPaymentLink(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-slate-350 focus:outline-none focus:border-brand-primary text-xs"
                placeholder="https://upi.link/yourgym"
                required
              />
            </div>
          </div>

          {/* UPI ID */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              UPI ID for Direct Transfers
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-550">
                <IndianRupee className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-955/60 border border-slate-800 rounded-lg text-slate-350 focus:outline-none focus:border-brand-primary text-xs"
                placeholder="goldsgym@okaxis"
                required
              />
            </div>
          </div>

          {/* Reminder Schedule */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              WhatsApp Reminder Schedule
            </label>
            <select
              value={reminderSchedule}
              onChange={(e) => setReminderSchedule(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-brand-primary text-xs"
            >
              <option value="standard">Standard: 7d Before, On Due, then overdue 3, 7, and 10 days</option>
              <option value="interval">Aggressive: On Due Date, overdue 1 day, 3 days, then every 3 days</option>
            </select>
            <p className="text-[9px] text-slate-500 mt-0.5 leading-relaxed">
              Choose exactly when overdue members will receive automated WhatsApp pings.
            </p>
          </div>

          {/* WhatsApp Template */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              WhatsApp Message Template
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none text-slate-550">
                <MessageSquare className="h-4 w-4" />
              </div>
              <textarea
                rows="4"
                value={whatsappTemplate}
                onChange={(e) => setWhatsappTemplate(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-brand-primary text-xs"
                placeholder="Enter message template..."
                required
              ></textarea>
            </div>
            <div className="p-2 bg-slate-950/40 rounded border border-slate-850 text-[10px] text-slate-450 leading-relaxed">
              <span className="font-bold text-slate-300 block mb-1">Available placeholders:</span>
              `{name}`: Member's name • `{amount}`: Price • `{due_date}`: Next due date • `{upi_id}`: Your UPI ID • `{payment_link}`: Custom payment link
            </div>
          </div>

          {settingsSavedMessage && (
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded text-center">
              Settings saved successfully!
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 flex gap-3 border-t border-slate-850">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-slate-850 hover:bg-slate-800/50 text-slate-350 font-semibold rounded-lg text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold rounded-lg text-xs shadow-md transition cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SettingsModal;
