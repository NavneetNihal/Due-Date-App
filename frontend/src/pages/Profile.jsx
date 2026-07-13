import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext, addDays, formatDate } from '../context/AppContext.jsx';
import OwnerPayModal from '../components/OwnerPayModal.jsx';
import { 
  ArrowLeft, 
  User, 
  Building, 
  Phone, 
  QrCode, 
  CreditCard, 
  IndianRupee, 
  Upload, 
  Check, 
  AlertCircle,
  Shield
} from 'lucide-react';

function Profile() {
  const { 
    user, 
    payments, 
    updateProfile, 
    updateOwnerSubscription, 
    developerSettings,
    billingRequests,
    activeOutletId
  } = useContext(AppContext);
  const navigate = useNavigate();

  // Redirect creator to dashboard since profile settings are for Gym Owners
  useEffect(() => {
    if (user && user.role === 'creator') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Tab State
  const [activeTab, setActiveTab] = useState('collections'); // collections, billing

  const [selectedGyms, setSelectedGyms] = useState(user?.allowedGyms || 1);
  const [selectedPlan, setSelectedPlan] = useState(user?.pricingPlan || 'starter');

  useEffect(() => {
    if (user) {
      setSelectedGyms(user.allowedGyms || 1);
      setSelectedPlan(user.pricingPlan || 'starter');
    }
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'billing' || tabParam === 'collections') {
      setActiveTab(tabParam);
    }
  }, []);
  const [isBillingPayOpen, setIsBillingPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState(999);

  const pendingRequest = billingRequests?.find(r => 
    (r.ownerId === user?.id || r.ownerName === user?.name) && 
    r.status === 'pending'
  );

  // Form states
  const [name, setName] = useState(user?.name || '');
  const [businessName, setBusinessName] = useState(user?.businessName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [upiId, setUpiId] = useState(user?.settings?.upiId || 'goldsgym@okaxis');
  const [qrCode, setQrCode] = useState(user?.settings?.qrCode || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState('');



  // Filter payments to only those belonging to the active outlet
  const outletPayments = payments.filter(p => (p.gymId || 'owner_golds') === (activeOutletId || 'owner_golds'));

  // Calculate total earnings from ledger
  const totalCollected = outletPayments.reduce((sum, p) => sum + p.amountPaid, 0);

  // Handle QR Code Image Upload (Base64)
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Image size should be less than 2MB');
        return;
      }
      setError('');
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrCode(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    setError('');
    
    if (!name || !businessName || !phone || !upiId) {
      setError('Please fill in all required fields');
      return;
    }

    // Save values in user state / settings context
    updateProfile({
      name,
      businessName,
      phone,
      settings: {
        upiId,
        qrCode
      }
    });
    
    // Trigger success notification
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 2000);
  };



  const getMessagePreview = () => {
    return `Hello [Member Name], this is a friendly reminder from *${businessName || 'your gym'}*. Your subscription fee of *₹1,000* is due on *2026-06-26*. 

Please pay via UPI using ID: *${upiId || 'your-upi-id'}* (QR attached) and *send a screenshot* of the transaction receipt to this chat to confirm your payment.

Thank you!`;
  };

  return (
    <div className="relative min-h-screen pb-12 px-4 sm:px-6 lg:px-8">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-brand-primary/10 rounded-full blur-[80px]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-brand-accent/5 rounded-full blur-[100px]"></div>

      {/* Profile Container */}
      <div className="max-w-4xl mx-auto z-10 relative mt-6">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-xs font-semibold px-4 py-2 border border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-900 rounded-xl text-slate-300 transition duration-150 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
          <span className="text-sm font-extrabold text-slate-100 font-mono">Gym Owner Profile Settings</span>
        </div>

        {/* Profile Card Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT: Stats & Earnings */}
          <div className="space-y-6 lg:col-span-1">
            
            {/* All-Time Earnings Card */}
            <div className="backdrop-blur-md bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-xl text-center">
              <div className="mx-auto w-12 h-12 bg-amber-500/10 border border-amber-500/25 rounded-full flex items-center justify-center text-amber-400 mb-3">
                <IndianRupee className="h-6 w-6" />
              </div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">All-Time Earnings</span>
              <h2 className="text-3xl font-black text-slate-100 mt-1">₹{(user?.allTimeEarnings || 0).toLocaleString('en-IN')}</h2>
              <p className="text-[10px] text-slate-400 mt-1">Total revenue accumulated (persistent across deletions).</p>
            </div>

            {/* Active Ledger Card */}
            <div className="backdrop-blur-md bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-xl text-center">
              <div className="mx-auto w-12 h-12 bg-purple-500/10 border border-purple-500/25 rounded-full flex items-center justify-center text-purple-400 mb-3">
                <IndianRupee className="h-6 w-6" />
              </div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Active Ledger Earnings</span>
              <h2 className="text-3xl font-black text-slate-100 mt-1">₹{totalCollected.toLocaleString('en-IN')}</h2>
              <p className="text-[10px] text-slate-400 mt-1">Revenue calculated from active ledger members.</p>
            </div>
          </div>

          {/* RIGHT: Tabs & Detail view panels */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Tabs Header */}
            <div className="flex border-b border-slate-850 gap-2">
              <button
                onClick={() => setActiveTab('collections')}
                className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider transition-all relative cursor-pointer ${
                  activeTab === 'collections'
                    ? 'text-brand-primary border-b-2 border-brand-primary'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Collections Config
              </button>
              <button
                onClick={() => setActiveTab('billing')}
                className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider transition-all relative cursor-pointer ${
                  activeTab === 'billing'
                    ? 'text-brand-primary border-b-2 border-brand-primary'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                App Creator Billing & Plan
              </button>
            </div>

            {activeTab === 'collections' ? (
              /* TAB 1: COLLECTIONS CONFIG */
              <div className="backdrop-blur-md bg-slate-900/40 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl animate-in fade-in duration-200">
                <h3 className="text-sm font-bold text-slate-250 mb-6 pb-2 border-b border-slate-850 uppercase tracking-wider">Profile & Payment Configurations</h3>
                
                <form onSubmit={handleSave} className="space-y-5">
                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {error}
                    </div>
                  )}

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Owner Name */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                        Owner Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                          <User className="h-4 w-4" />
                        </div>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-brand-primary text-xs"
                          required
                        />
                      </div>
                    </div>

                    {/* Gym Name */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                        Gym Name (Business Name)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                          <Building className="h-4 w-4" />
                        </div>
                        <input
                          type="text"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-brand-primary text-xs"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
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
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          maxLength={10}
                          pattern="[0-9]{10}"
                          className="w-full pl-9 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-brand-primary text-xs font-mono"
                          required
                        />
                      </div>
                    </div>

                    {/* UPI ID */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                        UPI ID for Reminders
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                          <CreditCard className="h-4 w-4" />
                        </div>
                        <input
                          type="text"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-brand-primary text-xs"
                          placeholder="goldsgym@upi"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* QR Code Upload Box with integrated Preview */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                      Upload UPI QR Code Image (JPEG/PNG)
                    </label>
                    <div className="border border-slate-850 rounded-lg p-4 bg-slate-950/40 flex flex-col sm:flex-row items-center gap-4">
                      <div className="flex-1 w-full">
                        <div className="relative border border-slate-800 border-dashed rounded-lg p-3 bg-slate-950/20 flex items-center gap-3">
                          <Upload className="h-4 w-4 text-slate-500" />
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleImageChange}
                            className="text-xs text-slate-400 file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-brand-primary/10 file:text-brand-primary file:hover:bg-brand-primary/20 file:cursor-pointer cursor-pointer flex-1"
                          />
                        </div>
                        <p className="text-[9px] text-slate-500 mt-2 leading-relaxed">
                          This QR code will be attached as media in WhatsApp reminders to unpaid members.
                        </p>
                      </div>

                      {qrCode && (
                        <div className="relative group w-20 h-20 bg-white p-1 rounded-lg border border-slate-755 flex items-center justify-center overflow-hidden shadow-md">
                          <img src={qrCode} alt="UPI QR Code preview" className="max-w-full max-h-full object-contain" />
                          <button 
                            type="button"
                            onClick={() => setQrCode('')}
                            className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 text-red-400 text-[9px] font-bold transition cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Outgoing Message preview panel */}
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <span>Preview of Automated WhatsApp Member Alert</span>
                      <span className="px-1.5 py-0.5 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 rounded text-[9px] font-normal normal-case">
                        System Triggered Only
                      </span>
                    </div>

                    {/* WhatsApp Bubble Frame */}
                    <div className="p-4 bg-slate-950/50 border border-slate-850 rounded-xl flex flex-col items-start">
                      <div className="w-full max-w-[280px] bg-[#0c241a] border border-[#164330] rounded-xl rounded-tr-none p-2.5 shadow-md self-end text-xs text-slate-200">
                        {qrCode ? (
                          <div className="w-full bg-white p-2 rounded-lg border border-slate-200 mb-2 flex flex-col items-center justify-center">
                            <img src={qrCode} alt="UPI QR Code preview" className="max-h-28 object-contain" />
                            <span className="text-[9px] text-slate-500 font-semibold uppercase mt-1 tracking-wider block">UPI QR Code Attachment</span>
                          </div>
                        ) : (
                          <div className="w-full h-16 border-2 border-dashed border-slate-800 rounded-lg mb-2 flex items-center justify-center text-[10px] text-slate-500 p-2 text-center leading-relaxed">
                            No QR Code attached. Upload QR above to include it.
                          </div>
                        )}
                        <p className="whitespace-pre-wrap leading-relaxed">{getMessagePreview()}</p>
                        <div className="text-[8px] text-slate-550 text-right mt-1 font-semibold flex items-center justify-end gap-0.5">
                          <span>09:15 AM</span>
                          <span className="text-emerald-500">✓✓</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Save button */}
                  <div className="pt-4 flex gap-4 border-t border-slate-850">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 px-4 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold rounded-xl text-xs shadow-lg shadow-brand-primary/15 transition duration-150 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {savedSuccess ? (
                        <>
                          <Check className="h-4 w-4" />
                          Saved Successfully!
                        </>
                      ) : (
                        'Save Settings'
                      )}
                    </button>
                  </div>
                </form>
               </div>
            ) : (
              /* TAB 2: APP CREATOR BILLING & PLAN */
              <div className="backdrop-blur-md bg-slate-900/40 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 animate-in fade-in duration-200">
                <h3 className="text-sm font-bold text-slate-255 pb-2 border-b border-slate-850 uppercase tracking-wider">SaaS Licensing & Subscriptions</h3>
                
                {pendingRequest && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3 text-xs animate-in fade-in duration-150">
                    <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-extrabold text-amber-400 uppercase tracking-wide">License Request Pending Approval</h4>
                      <p className="text-slate-350 mt-1 leading-relaxed">
                        You submitted a request for the <strong className="text-slate-200 capitalize">Basic Plan</strong> (₹{pendingRequest.amount.toLocaleString('en-IN')}) on <strong>{pendingRequest.paymentDate}</strong>.
                      </p>
                      <p className="text-slate-400 mt-2">
                        Your payment request has been logged and is being processed.
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Active Info Banner */}
                <div className="grid grid-cols-1 gap-4">
                  {/* Current Active Plan Card */}
                  <div className="p-4 bg-slate-955/60 border border-slate-850 rounded-xl relative overflow-hidden">
                    <div className="absolute top-2.5 right-2.5 px-1.5 py-0.5 bg-brand-primary/15 border border-brand-primary/30 rounded text-[8px] font-bold text-brand-primary uppercase tracking-wider animate-pulse">
                      Active Plan
                    </div>
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Your Current License</span>
                    <h4 className="text-base font-black text-slate-100 mt-1">
                      Basic Plan
                    </h4>
                    <span className="text-xs text-slate-450 block mt-1.5">
                      Billing Rate: <strong className="text-slate-100">₹699/month</strong>
                    </span>
                    <p className="text-[9px] text-slate-500 mt-2 leading-relaxed font-semibold">
                      Active license grants full access to the member check-in registry and automated WhatsApp alerts.
                    </p>
                  </div>
                </div>

                {/* Account Status overview */}
                <div className="p-4 border rounded-xl bg-slate-950/60 border-slate-850 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1.5">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Access Subscription Status</span>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                        (!user?.billingPayments || user.billingPayments.length === 0)
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                          : user?.subscriptionStatus === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' 
                          : user?.subscriptionStatus === 'overdue' 
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/25' 
                          : 'bg-red-500/10 text-red-400 border-red-500/25'
                      }`}>
                        {(!user?.billingPayments || user.billingPayments.length === 0) ? 'unpaid' : (user?.subscriptionStatus || 'active')}
                      </span>
                      <span className="text-xs text-slate-350">
                        {(!user?.billingPayments || user.billingPayments.length === 0)
                          ? 'Subscription payment pending. Pay to activate license.'
                          : user?.subscriptionStatus === 'active' 
                          ? `Next renewal: ${user?.subscriptionDueDate || '2026-07-26'}` 
                          : user?.subscriptionStatus === 'overdue' 
                          ? `Grace expires in ${user?.graceDaysRemaining || 10} days (${user?.subscriptionDueDate || '2026-07-26'})` 
                          : 'Service suspended. Please renew to resume operations.'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {(() => {
                      if (pendingRequest) {
                        return (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5">
                            <AlertCircle className="h-4 w-4 animate-pulse" />
                            <span>Confirmation Pending Approval</span>
                          </div>
                        );
                      }

                      return (
                        <button
                          onClick={() => {
                            setPayAmount(699);
                            setIsBillingPayOpen(true);
                          }}
                          className="py-2.5 px-4 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold rounded-xl text-xs transition duration-150 cursor-pointer"
                        >
                          {(!user?.billingPayments || user.billingPayments.length === 0) ? 'Pay Now' : (user?.subscriptionStatus === 'active' ? 'Renew Early' : 'Pay Renewal')} (₹699)
                        </button>
                      );
                    })()}
                  </div>
                </div>

                {/* Developer / App Creator Settings (Read-Only for Gym Owners) */}
                <div className="p-5 border border-purple-900/20 bg-purple-950/5 rounded-xl space-y-4 shadow-lg backdrop-blur-md relative overflow-hidden">
                  {/* Lock Indicator */}
                  <div className="absolute top-3 right-3 text-purple-400/20">
                    <Shield className="h-5 w-5" />
                  </div>
                  
                  <div className="flex items-center gap-2 pb-2 border-b border-purple-950/20">
                    <div className="w-8 h-8 bg-purple-500/10 border border-purple-500/25 rounded-lg flex items-center justify-center text-purple-400">
                      <QrCode className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-100 uppercase tracking-widest">Developer Payment Credentials</h4>
                      <p className="text-[9px] text-slate-550 mt-0.5 font-semibold">Standard Gym Owners cannot edit developer credentials.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* UPI ID Info */}
                    <div className="sm:col-span-2 space-y-3">
                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Developer UPI ID</span>
                        <div className="text-xs font-mono font-semibold text-purple-400 bg-slate-950/40 border border-slate-850 rounded-lg p-2.5 flex items-center justify-between">
                          <span>{developerSettings?.upiId || '7004689533@ptyes'}</span>
                        </div>
                      </div>
                    </div>

                    {/* QR Code Preview */}
                    <div className="flex flex-col items-center justify-center p-3 bg-slate-950/40 border border-slate-850 rounded-xl">
                      <span className="text-[8px] text-slate-550 font-bold uppercase tracking-wider mb-2">QR Scanner</span>
                      {developerSettings?.qrCode ? (
                        <div className="w-24 h-24 bg-white p-1 rounded-lg border border-slate-800 flex items-center justify-center overflow-hidden shadow-lg">
                          <img src={developerSettings.qrCode} alt="Developer QR Code" className="max-w-full max-h-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-24 h-24 border border-dashed border-slate-800 rounded-lg flex flex-col items-center justify-center text-slate-600 text-[8px] text-center p-2 leading-tight">
                          No QR Code Uploaded
                        </div>
                      )}
                      <span className="text-[8px] text-slate-550 font-bold uppercase tracking-wider mt-2.5 font-sans">UPI SCANNER QR</span>
                    </div>
                  </div>
                </div>

                {/* SaaS ledger history */}
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">SaaS Payment Logs</span>
                  <div className="border border-slate-850 rounded-xl bg-slate-950/40 p-2 max-h-[160px] overflow-y-auto space-y-2.5">
                    {!user?.billingPayments || user?.billingPayments.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-4">No payments recorded to app developer.</p>
                    ) : (
                      user.billingPayments.map((p, index) => (
                        <div key={p._id || p.id || index} className="p-2.5 bg-slate-950/60 border border-slate-850 rounded-lg flex items-center justify-between text-xs text-slate-300 font-mono">
                          <div className="space-y-1">
                            <span className="font-bold text-slate-200 block font-sans">SaaS License Renewed</span>
                            <span className="text-[10px] text-slate-500 block">Method: {p.paymentMethod} • Ref: {(p._id || p.id || '').toString().substring(0, 8)}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-brand-primary block font-sans">₹{p.amountPaid || p.amount ? (p.amountPaid || p.amount).toLocaleString('en-IN') : '699'}</span>
                            <span className="text-[9px] text-slate-500 block">{p.paymentDate}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Billing simulation panel */}
                <div className="p-4 bg-slate-950/40 border border-dashed border-slate-800 rounded-xl space-y-3">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">🕒 SaaS Subscription Simulation Control (Developer/Test Panel)</span>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Quickly test how the app reacts to different subscription stages (grace period warnings, lockout suspends).
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => updateOwnerSubscription('active', addDays(formatDate(new Date()), 30), 10)}
                      className={`py-1.5 px-3 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                        user?.subscriptionStatus === 'active'
                          ? 'bg-emerald-500 text-slate-950 font-black'
                          : 'bg-slate-900 border border-slate-800 text-slate-450 hover:bg-slate-800'
                      }`}
                    >
                      Active (+30 Days)
                    </button>
                    <button
                      onClick={() => {
                        sessionStorage.removeItem('seen_overdue_warning');
                        updateOwnerSubscription('overdue', formatDate(new Date()), 6);
                      }}
                      className={`py-1.5 px-3 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                        user?.subscriptionStatus === 'overdue'
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : 'bg-slate-900 border border-slate-800 text-slate-450 hover:bg-slate-800'
                      }`}
                    >
                      Overdue (6d Grace)
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>
      </div>

      {/* Checkout Pay Modal */}
      {isBillingPayOpen && (
        <OwnerPayModal 
          isOpen={isBillingPayOpen} 
          onClose={() => setIsBillingPayOpen(false)} 
          amount={payAmount}
          requestedPlan={selectedPlan}
          requestedGyms={selectedGyms}
        />
      )}
    </div>
  );
}

export default Profile;
