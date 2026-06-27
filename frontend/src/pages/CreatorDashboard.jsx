import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext, formatDate, addDays } from '../context/AppContext.jsx';
import { 
  Users, 
  CheckCircle, 
  AlertCircle, 
  IndianRupee, 
  Plus, 
  Search, 
  LogOut, 
  Shield, 
  CreditCard, 
  Check, 
  Upload, 
  RotateCcw, 
  X, 
  History,
  Building
} from 'lucide-react';

function CreatorDashboard() {
  const { 
    user, 
    logout, 
    gymOwners, 
    developerSettings, 
    updateDeveloperSettings, 
    markGymOwnerPaid, 
    reverseGymOwnerPayment, 
    deleteGymOwner, 
    addGymOwner,
    updateGymOwnerStatus,
    members: allMembers,
    billingRequests,
    approveBillingRequest,
    rejectBillingRequest,
    addMember,
    deleteMember
  } = useContext(AppContext);
  const navigate = useNavigate();
  const [expandedOwnerMembers, setExpandedOwnerMembers] = useState(null); // ownerId
  const [creatorAddMemberForm, setCreatorAddMemberForm] = useState({
    name: '', phoneNumber: '', subscriptionTier: 'monthly', subscriptionAmount: 1000, joiningDate: formatDate(new Date()), isPaid: false
  });

  // Redirect if not creator
  useEffect(() => {
    if (user && user.role !== 'creator') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Creator dashboard state
  const [creatorSearchQuery, setCreatorSearchQuery] = useState('');
  const [isAddGymOpen, setIsAddGymOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState(null); // owner to revoke
  const [deleteTarget, setDeleteTarget] = useState(null); // owner to delete
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [addGymForm, setAddGymForm] = useState({
    businessName: '', ownerName: '', phone1: '', phone2: '', address: '', pricingPlan: 'basic', allowedGyms: 1
  });

  // Creator credentials edit state
  const [devUpiId, setDevUpiId] = useState(developerSettings?.upiId || '7004689533@ptyes');
  const [devQrCode, setDevQrCode] = useState(developerSettings?.qrCode || '');
  const [devBankName, setDevBankName] = useState(developerSettings?.bankName || 'YES BANK');
  const [devCardNumber, setDevCardNumber] = useState(developerSettings?.cardNumber || '4111 2222 3333 7004');
  const [devCardHolder, setDevCardHolder] = useState(developerSettings?.cardHolder || 'Navneet Nihal Lakra');
  const [devCardExpiry, setDevCardExpiry] = useState(developerSettings?.cardExpiry || '12/32');
  const [devSavedSuccess, setDevSavedSuccess] = useState(false);
  const [devError, setDevError] = useState('');
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerShowAll, setLedgerShowAll] = useState(false);
  const [isArrLedgerOpen, setIsArrLedgerOpen] = useState(false);
  const [lastPaidOwnerId, setLastPaidOwnerId] = useState(null);

  // Sync creator settings states from context
  useEffect(() => {
    if (developerSettings) {
      setDevUpiId(developerSettings.upiId || '7004689533@ptyes');
      setDevQrCode(developerSettings.qrCode || '');
      setDevBankName(developerSettings.bankName || 'YES BANK');
      setDevCardNumber(developerSettings.cardNumber || '4111 2222 3333 7004');
      setDevCardHolder(developerSettings.cardHolder || 'Navneet Nihal Lakra');
      setDevCardExpiry(developerSettings.cardExpiry || '12/32');
    }
  }, [developerSettings]);

  // Handle Developer QR Code Upload (Base64)
  const handleDevImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setDevError('Image size should be less than 2MB');
        return;
      }
      setDevError('');
      const reader = new FileReader();
      reader.onloadend = () => {
        setDevQrCode(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Developer Payment coordinates save
  const handleDevSave = (e) => {
    e.preventDefault();
    setDevError('');

    if (!devUpiId) {
      setDevError('Please fill in creator UPI ID');
      return;
    }

    updateDeveloperSettings({
      upiId: devUpiId,
      qrCode: devQrCode
    });

    setDevSavedSuccess(true);
    setTimeout(() => {
      setDevSavedSuccess(false);
    }, 2000);
  };

  // Helper to determine if a gym owner has a reversible payment
  const hasReversibleOwnerPayment = (owner) => {
    const amount = 699;
    const history = owner.paymentsHistory || (
      owner.totalPaidToCreator > 0 
        ? Array.from({ length: Math.floor(owner.totalPaidToCreator / amount) }).map((_, i) => ({
            id: `op_mock_${owner.id}_${i}`,
            amountPaid: amount,
            paymentDate: owner.lastPaymentDate || formatDate(new Date())
          }))
        : []
    );

    const paymentToReverse = history.find(p => {
      if (p.amountPaid <= 0 || p.id.startsWith('op_rev_')) return false;
      const isAlreadyReversed = history.some(rev => rev.reversesPaymentId === p.id);
      return !isAlreadyReversed;
    });

    return !!paymentToReverse;
  };

  const totalOwners = gymOwners?.length || 0;
  const activeOwners = gymOwners?.filter(o => o.subscriptionStatus === 'active')?.length || 0;
  const totalARR = gymOwners?.reduce((sum, o) => sum + o.totalPaidToCreator, 0) || 0;
  const growthOwnersCount = gymOwners?.filter(o => o.pricingPlan === 'growth')?.length || 0;

  const filteredOwners = gymOwners?.filter(owner => 
    owner.businessName.toLowerCase().includes(creatorSearchQuery.toLowerCase()) ||
    owner.name.toLowerCase().includes(creatorSearchQuery.toLowerCase()) ||
    owner.email.toLowerCase().includes(creatorSearchQuery.toLowerCase()) ||
    owner.phone.includes(creatorSearchQuery)
  ) || [];

  // Aggregate all payment history across all owners for the ledger
  const allLedgerEntries = (gymOwners || []).flatMap(owner => {
    const amount = 699;
    const history = owner.paymentsHistory || (
      owner.totalPaidToCreator > 0
        ? Array.from({ length: Math.floor(owner.totalPaidToCreator / amount) }).map((_, i) => ({
            id: `op_mock_${owner.id}_${i}`,
            amountPaid: amount,
            paymentDate: owner.lastPaymentDate || 'N/A',
            isReversal: false
          }))
        : []
    );
    return history.map(p => ({
      ...p,
      ownerName: owner.name,
      businessName: owner.businessName,
      isReversal: p.amountPaid < 0
    }));
  }).sort((a, b) => {
    if (a.paymentDate === 'N/A') return 1;
    if (b.paymentDate === 'N/A') return -1;
    return new Date(b.paymentDate) - new Date(a.paymentDate);
  });

  const filteredLedger = allLedgerEntries.filter(entry =>
    !ledgerSearch ||
    entry.businessName.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
    entry.ownerName.toLowerCase().includes(ledgerSearch.toLowerCase())
  );

  const ledgerToShow = ledgerShowAll ? filteredLedger : filteredLedger.slice(0, 10);

  return (
    <div className="min-h-screen pb-12 relative px-4 sm:px-6 lg:px-8">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-primary/5 rounded-full blur-[120px]"></div>

      <div className="max-w-7xl mx-auto z-10 relative mt-6 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 backdrop-blur-md bg-slate-900/40 border border-slate-800 rounded-2xl gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 border border-purple-500/25 rounded-xl text-purple-400">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-100">Due Date Creator Portal</h1>
                <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full text-[9px] font-black uppercase tracking-wider">
                  Super Admin
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Global platform statistics & gym client subscription registry.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            <span className="text-xs font-semibold text-slate-400 font-mono">
              Admin: <strong className="text-slate-100 font-bold">Navneet Nihal Lakra</strong>
            </span>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-800 hover:border-red-500/30 hover:bg-red-500/5 rounded-xl text-xs font-bold text-slate-400 hover:text-red-400 transition cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
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
            <h2 className="text-2xl sm:text-3xl font-black text-slate-100 mt-1">{activeOwners} <span className="text-xs text-slate-400 font-normal">/ {totalOwners}</span></h2>
            <div className="text-[9px] text-slate-450 mt-1.5 font-semibold">Paying License Status</div>
          </div>

          {/* Metric 3 */}
          <div className="backdrop-blur-md bg-slate-900/40 border border-slate-800 rounded-xl p-4 sm:p-5 relative overflow-hidden">
            <div className="absolute top-3 right-3 text-purple-400">
              <Users className="h-5 w-5" />
            </div>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Basic Plan Rate</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-100 mt-1">₹699<span className="text-xs text-slate-450 font-normal">/month</span></h2>
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
                    <span className="text-[8px] text-slate-500 font-semibold block mt-0.5">{allLedgerEntries.length} total transaction{allLedgerEntries.length !== 1 ? 's' : ''}</span>
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
                        const isNewEntry = !entry.isReversal && lastPaidOwnerId && entry.id === allLedgerEntries.find(e => !e.isReversal)?.id && idx === 0;
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
                                <span className={`text-[10px] font-bold block truncate ${isNewEntry ? 'text-emerald-300' : 'text-slate-200'}`}>{entry.businessName}</span>
                                {isNewEntry && (
                                  <span className="flex-shrink-0 text-[7px] font-black uppercase tracking-wider px-1 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">New</span>
                                )}
                              </div>
                              <span className="text-[8px] text-slate-500 truncate block">{entry.ownerName} · {entry.paymentDate}</span>
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

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Creator credentials summary card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="backdrop-blur-md bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 animate-in fade-in duration-200">
              <div className="pb-3 border-b border-slate-850 flex items-center justify-between">
                <span className="text-xs font-black text-slate-200 uppercase tracking-widest block">Creator Details Summary</span>
                <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded text-[8px] font-bold uppercase tracking-wider">
                  Editable Settings
                </span>
              </div>

              {devError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {devError}
                </div>
              )}

              <form onSubmit={handleDevSave} className="space-y-4">
                {/* Creator Name */}
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Creator Name</label>
                  <div className="text-xs font-semibold text-slate-400 bg-slate-950/60 border border-slate-850 rounded-lg p-2.5">
                    Navneet Nihal Lakra
                  </div>
                </div>

                {/* App Creator UPI ID */}
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">
                    App Creator UPI ID (Dynamic Checkout)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-550">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      value={devUpiId}
                      onChange={(e) => setDevUpiId(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-955/60 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500 text-xs font-mono font-semibold"
                      placeholder="7004689533@ptyes"
                      required
                    />
                  </div>
                </div>

                {/* QR Image Uploader & Preview */}
                <div className="space-y-2">
                  <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Developer QR Code Scan</label>
                  <div className="grid grid-cols-3 gap-3 items-center">
                    <div className="col-span-2 relative border border-slate-850 rounded-lg p-2 bg-slate-950/40 flex items-center gap-2">
                      <Upload className="h-4 w-4 text-slate-500" />
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleDevImageChange}
                        className="text-[9px] text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[8px] file:font-bold file:bg-purple-500/10 file:text-purple-400 file:hover:bg-purple-500/20 file:cursor-pointer cursor-pointer flex-1"
                      />
                    </div>
                    
                    <div className="flex items-center justify-center p-1 bg-slate-950/40 border border-slate-850 rounded-lg h-[46px]">
                      {devQrCode ? (
                        <div className="relative group w-8 h-8 bg-white p-0.5 rounded border border-slate-750 flex items-center justify-center overflow-hidden">
                          <img src={devQrCode} alt="Dev QR Code" className="max-w-full max-h-full object-contain" />
                          <button 
                            type="button"
                            onClick={() => setDevQrCode('')}
                            className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 text-red-400 text-[6px] font-bold transition cursor-pointer"
                          >
                            Del
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-600 text-[7px] text-center uppercase tracking-wider font-bold">No QR</span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-purple-650 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition duration-150 active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-md shadow-purple-950/20 cursor-pointer"
                >
                  {devSavedSuccess ? (
                    <>
                      <Check className="h-4 w-4" />
                      Settings Saved!
                    </>
                  ) : (
                    'Save Creator Credentials'
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT: Gym Owners Subscription registry */}
          <div className="lg:col-span-2 space-y-4">

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
                                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800'
                                }`}
                              >
                                Active
                              </button>
                              <button
                                type="button"
                                onClick={() => updateGymOwnerStatus(owner.id, 'overdue')}
                                className={`py-1 px-2 text-[9px] font-bold rounded transition cursor-pointer ${
                                  owner.subscriptionStatus === 'overdue'
                                    ? 'bg-amber-500 text-slate-950 font-black'
                                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800'
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
                                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800'
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
                            <div className="flex items-center gap-1.5">
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

                      {/* Collapsible Member Management for Creator */}
                      <div className="border-t border-slate-900 pt-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (expandedOwnerMembers === owner.id) {
                              setExpandedOwnerMembers(null);
                            } else {
                              setExpandedOwnerMembers(owner.id);
                              setCreatorAddMemberForm({
                                name: '', phoneNumber: '', subscriptionTier: 'monthly', subscriptionAmount: 1000, joiningDate: formatDate(new Date()), isPaid: false
                              });
                            }
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-750 text-slate-350 hover:text-slate-200 text-[10px] font-bold rounded-lg transition cursor-pointer"
                        >
                          <Users className="h-3 w-3 text-purple-400" />
                          {expandedOwnerMembers === owner.id ? 'Hide Members List' : 'Manage Members / Add Member'}
                        </button>

                        {expandedOwnerMembers === owner.id && (
                          <div className="mt-3 bg-slate-955/40 border border-slate-900 rounded-xl p-3 space-y-3 animate-in fade-in duration-200">
                            <h5 className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Gym Members Database</h5>
                            
                            {/* Member list */}
                            <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
                              {allMembers.filter(m => (m.gymId || 'owner_golds') === owner.id).length === 0 ? (
                                <p className="text-[10px] text-slate-500 italic py-2">No members registered in this gym yet.</p>
                              ) : (
                                allMembers.filter(m => (m.gymId || 'owner_golds') === owner.id).map(m => (
                                  <div key={m.id} className="flex items-center justify-between p-2 bg-slate-950/70 border border-slate-900 rounded-lg text-[10px]">
                                    <div>
                                      <span className="font-bold text-slate-200 block">{m.name}</span>
                                      <span className="text-slate-500 text-[9px] block font-mono">{m.phoneNumber} • Due: {m.nextDueDate}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold uppercase ${
                                        m.status === 'active' 
                                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                      }`}>
                                        {m.status}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (confirm(`Are you sure you want to delete member ${m.name}?`)) {
                                            deleteMember(m.id);
                                          }
                                        }}
                                        className="p-1 border border-slate-805 hover:border-red-500/30 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded transition cursor-pointer"
                                      >
                                        <X className="h-2.5 w-2.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>

                            {/* Add Member inline form */}
                            <div className="border-t border-slate-900/60 pt-3 space-y-2">
                              <span className="text-[9px] text-slate-450 font-black uppercase tracking-wider block">Add Member Dynamically</span>
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  placeholder="Full Name"
                                  value={creatorAddMemberForm.name}
                                  onChange={e => setCreatorAddMemberForm(f => ({ ...f, name: e.target.value }))}
                                  className="px-2 py-1.5 bg-slate-950/70 border border-slate-850 rounded-lg text-slate-200 text-[10px] focus:outline-none focus:border-purple-500"
                                />
                                <input
                                  type="text"
                                  placeholder="Phone Number (10 digits)"
                                  value={creatorAddMemberForm.phoneNumber}
                                  onChange={e => setCreatorAddMemberForm(f => ({ ...f, phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                                  className="px-2 py-1.5 bg-slate-955/70 border border-slate-850 rounded-lg text-slate-200 text-[10px] focus:outline-none focus:border-purple-500"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[8px] text-slate-500 font-bold block mb-0.5">Tier</label>
                                  <select
                                    value={creatorAddMemberForm.subscriptionTier}
                                    onChange={e => {
                                      const tier = e.target.value;
                                      let amount = 1000;
                                      if (tier === 'quarterly') amount = 2500;
                                      else if (tier === 'yearly') amount = 8000;
                                      setCreatorAddMemberForm(f => ({ ...f, subscriptionTier: tier, subscriptionAmount: amount }));
                                    }}
                                    className="w-full px-2 py-1 bg-slate-950/70 border border-slate-850 rounded-lg text-slate-300 text-[10px] focus:outline-none focus:border-purple-500 cursor-pointer"
                                  >
                                    <option value="monthly">Monthly (₹1,000)</option>
                                    <option value="quarterly">Quarterly (₹2,500)</option>
                                    <option value="yearly">Yearly (₹8,000)</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-[8px] text-slate-500 font-bold block mb-0.5">Custom Amount (₹)</label>
                                  <input
                                    type="number"
                                    value={creatorAddMemberForm.subscriptionAmount}
                                    onChange={e => setCreatorAddMemberForm(f => ({ ...f, subscriptionAmount: e.target.value }))}
                                    className="w-full px-2 py-1 bg-slate-950/70 border border-slate-850 rounded-lg text-slate-200 text-[10px] focus:outline-none focus:border-purple-500"
                                  />
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!creatorAddMemberForm.name.trim() || !creatorAddMemberForm.phoneNumber.trim()) {
                                    alert("Please fill name and phone number");
                                    return;
                                  }
                                  
                                  let days = 30;
                                  if (creatorAddMemberForm.subscriptionTier === 'quarterly') days = 90;
                                  else if (creatorAddMemberForm.subscriptionTier === 'yearly') days = 365;

                                  const nextDueDate = addDays(creatorAddMemberForm.joiningDate, days);
                                  
                                  addMember({
                                    ...creatorAddMemberForm,
                                    nextDueDate,
                                    gymId: owner.id
                                  });

                                  setCreatorAddMemberForm({
                                    name: '', phoneNumber: '', subscriptionTier: 'monthly', subscriptionAmount: 1000, joiningDate: formatDate(new Date()), isPaid: false
                                  });
                                }}
                                className="w-full py-1.5 bg-purple-600 hover:bg-purple-750 text-white font-bold text-[10px] rounded-lg transition cursor-pointer shadow-sm shadow-purple-900/10"
                              >
                                Create Member
                              </button>
                            </div>

                          </div>
                        )}
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
          </div>

          {/* ── Revoke Confirmation Modal ── */}
          {revokeTarget && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <div className="bg-slate-900 border border-red-500/30 rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 h-10 w-10 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center text-red-400">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-100">Revoke Gym Access?</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      This will <strong className="text-red-400">suspend all access</strong> for <strong className="text-slate-200">{revokeTarget.businessName}</strong> on the Due Date app. The gym owner will see a locked screen.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setRevokeTarget(null)}
                    className="flex-1 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateGymOwnerStatus(revokeTarget.id, 'revoked');
                      setRevokeTarget(null);
                    }}
                    className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Yes, Revoke Access
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Delete Confirmation Modal ── */}
          {deleteTarget && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <div className="bg-slate-950 border border-red-500/30 rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 h-10 w-10 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center text-red-450">
                    <AlertCircle className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-100">Delete Gym Client?</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      This will <strong className="text-red-450">permanently delete</strong> <strong className="text-slate-200">{deleteTarget.businessName}</strong> and all associated data from the platform. This action cannot be undone.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(null)}
                    className="flex-1 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      deleteGymOwner(deleteTarget.id);
                      setDeleteTarget(null);
                    }}
                    className="flex-1 py-2 bg-red-650 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Yes, Delete Gym
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Sign Out Confirmation Modal ── */}
          {showLogoutConfirm && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <div className="bg-slate-900 border border-amber-500/20 rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 h-10 w-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400">
                    <AlertCircle className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-100">Sign Out?</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Are you sure you want to sign out of the Due Date Creator Portal?
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 py-2 border border-slate-700 hover:bg-slate-800 text-slate-350 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowLogoutConfirm(false);
                      logout();
                    }}
                    className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition cursor-pointer"
                  >
                    Yes, Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Add Gym Client Modal ── */}
          {isAddGymOpen && (
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
                    onClick={() => setIsAddGymOpen(false)}
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
                    setIsAddGymOpen(false);
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
          )}

          {/* PLATFORM SAAS LEDGER */}
          <div className="lg:col-span-3">
            <div className="backdrop-blur-md bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-850">
                <div>
                  <h3 className="text-xs font-black text-slate-200 uppercase tracking-widest flex items-center gap-2">
                    <History className="h-3.5 w-3.5 text-purple-400" />
                    Platform SaaS Ledger
                  </h3>
                  <p className="text-[9px] text-slate-555 mt-0.5 font-semibold">All subscription payments recorded across gym clients.</p>
                </div>
                <div className="relative max-w-xs w-full">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-555">
                    <Search className="h-3.5 w-3.5" />
                  </div>
                  <input
                    type="text"
                    value={ledgerSearch}
                    onChange={e => setLedgerSearch(e.target.value)}
                    placeholder="Filter by gym or owner..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-955/60 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-brand-primary text-xs"
                  />
                </div>
              </div>

              {filteredLedger.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-555 border border-dashed border-slate-800 rounded-xl">
                  No payment entries recorded yet. Mark a gym owner as paid to see entries here.
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {/* Column headers */}
                    <div className="grid grid-cols-[1fr_1fr_90px_80px] gap-2 px-3 py-1.5 text-[8px] font-black uppercase tracking-wider text-slate-600 border-b border-slate-900">
                      <span>Gym / Business</span>
                      <span>Owner</span>
                      <span>Date</span>
                      <span className="text-right">Amount</span>
                    </div>

                    {ledgerToShow.map(entry => (
                      <div
                        key={entry.id}
                        className={`grid grid-cols-[1fr_1fr_90px_80px] gap-2 items-center px-3 py-2.5 rounded-lg border transition ${
                          entry.isReversal
                            ? 'bg-red-500/5 border-red-500/15 hover:border-red-500/25'
                            : 'bg-slate-950/50 border-slate-900 hover:border-slate-800'
                        }`}
                      >
                        <div className="truncate">
                          <span className="text-[10px] font-bold text-slate-200 block truncate">{entry.businessName}</span>
                        </div>
                        <div className="truncate">
                          <span className="text-[9px] text-slate-450 truncate block">{entry.ownerName}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-mono text-slate-500">{entry.paymentDate}</span>
                        </div>
                        <div className="text-right">
                          {entry.isReversal ? (
                            <span className="text-[10px] font-black text-red-400">
                              -₹{Math.abs(entry.amountPaid).toLocaleString('en-IN')}
                            </span>
                          ) : (
                            <span className="text-[10px] font-black text-emerald-400">
                              +₹{entry.amountPaid.toLocaleString('en-IN')}
                            </span>
                          )}
                          {entry.isReversal && (
                            <span className="block text-[7px] text-red-500/70 uppercase font-bold tracking-wide">reversal</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {filteredLedger.length > 10 && (
                    <button
                      type="button"
                      onClick={() => setLedgerShowAll(v => !v)}
                      className="w-full py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-300 border border-dashed border-slate-800 hover:border-slate-700 rounded-lg transition cursor-pointer"
                    >
                      {ledgerShowAll
                        ? 'Show Less'
                        : `Show All ${filteredLedger.length} Entries`}
                    </button>
                  )}

                  {/* Ledger summary row */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-850 text-[10px]">
                    <span className="text-slate-500 font-semibold">{filteredLedger.length} transaction{filteredLedger.length !== 1 ? 's' : ''} total</span>
                    <span className="font-black text-slate-200">
                      Net Collected: <span className="text-emerald-400">
                        ₹{filteredLedger.reduce((sum, e) => sum + e.amountPaid, 0).toLocaleString('en-IN')}
                      </span>
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default CreatorDashboard;
