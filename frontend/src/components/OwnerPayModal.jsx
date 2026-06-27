import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext.jsx';
import { X, Check, CreditCard, IndianRupee, QrCode } from 'lucide-react';

function OwnerPayModal({ isOpen, onClose, amount, requestedPlan, requestedGyms }) {
  const { submitBillingRequest, developerSettings, user } = useContext(AppContext);
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // UPI, Card
  const [simulating, setSimulating] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    setSimulating(true);
    
    // Simulate payment processing delay (1.5 seconds)
    setTimeout(() => {
      setSimulating(false);
      setSuccess(true);
      
      // Submit the license upgrade/renewal request
      submitBillingRequest(
        user?.id || 'owner_golds', 
        requestedPlan, 
        requestedGyms, 
        amount, 
        paymentMethod
      );
      
      // Delay closing to show success checkmark
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2500);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-850">
          <div>
            <h3 className="text-base font-bold text-slate-100">Pay SaaS Subscription</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Renew license to keep your dashboard running.</p>
          </div>
          {!success && !simulating && (
            <button 
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {success ? (
          /* SUCCESS STATE */
          <div className="py-12 flex flex-col items-center justify-center text-center animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/35 rounded-full flex items-center justify-center text-emerald-400 mb-4">
              <Check className="h-8 w-8" />
            </div>
            <h4 className="text-base font-black text-slate-100">Payment Request Sent!</h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed px-4">
              Your ₹{amount.toLocaleString('en-IN')} payment request has been logged.
            </p>
            <p className="text-[10px] text-amber-500/90 font-semibold mt-1.5 uppercase tracking-wide">
              Send the screenshot to Navneet Nihal Lakra to get access approved.
            </p>
          </div>
        ) : simulating ? (
          /* SIMULATION LOADER */
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 border-4 border-t-brand-primary border-slate-800 rounded-full animate-spin mb-4"></div>
            <h4 className="text-sm font-extrabold text-slate-200">Processing UPI Transaction...</h4>
            <p className="text-[10px] text-slate-500 mt-1">Verifying receipt signature on the ledger.</p>
          </div>
        ) : (
          /* CHECKOUT FORM */
          <form onSubmit={handlePaymentSubmit} className="mt-4 space-y-4">
            
            {/* Amount Summary */}
            <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400">
                <IndianRupee className="h-5 w-5 text-brand-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider">Amount Due:</span>
              </div>
              <span className="text-2xl font-black text-slate-100">₹{amount.toLocaleString('en-IN')}</span>
            </div>

            <div className="space-y-4 animate-in fade-in duration-200">
              {/* QR Code Attachment */}
              <div className="border border-slate-800 bg-white p-3 rounded-xl max-w-[140px] mx-auto flex flex-col items-center justify-center shadow-lg">
                <div className="w-24 h-24 bg-slate-100 border border-slate-200 flex items-center justify-center relative overflow-hidden">
                  {developerSettings?.qrCode ? (
                    <img 
                      src={developerSettings.qrCode} 
                      alt="Developer UPI QR" 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <>
                      {/* Generative Mock QR indicator */}
                      <div className="absolute inset-0 bg-[radial-gradient(#111_1px,transparent_1px)] [background-size:8px_8px] opacity-70"></div>
                      <div className="w-8 h-8 bg-slate-900 border border-slate-800 rounded flex items-center justify-center text-[8px] font-black text-brand-primary tracking-widest z-10 font-mono">D.D.</div>
                    </>
                  )}
                </div>
                <span className="text-[8px] text-slate-500 font-bold uppercase mt-1 tracking-wider">UPI SCANNER QR</span>
              </div>

              <div className="p-3 bg-slate-950/50 border border-slate-850 rounded-xl space-y-1.5 text-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">App Creator UPI Address</span>
                <code className="text-xs text-slate-300 font-mono font-semibold block select-all cursor-pointer hover:text-slate-100 transition">
                  {developerSettings?.upiId || '7004689533@ptyes'}
                </code>
              </div>
            </div>

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
                className="flex-1 py-2 px-4 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold rounded-lg text-xs shadow-md transition cursor-pointer"
              >
                Confirm Payment
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default OwnerPayModal;
