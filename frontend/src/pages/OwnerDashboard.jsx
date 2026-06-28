import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext, formatDate } from '../context/AppContext.jsx';
import MembersTable from '../components/MembersTable.jsx';
import AddMemberModal from '../components/AddMemberModal.jsx';
import OwnerPayModal from '../components/OwnerPayModal.jsx';
import { 
  Users, 
  CheckCircle, 
  AlertCircle, 
  IndianRupee, 
  Plus, 
  Search, 
  Settings, 
  LogOut, 
  Dumbbell,
  MessageSquare,
  Link as LinkIcon,
  X,
  History,
  User,
  Building,
  Check,
  RotateCcw,
  Trash2,
  Lock
} from 'lucide-react';

function OwnerDashboard() {
  const { 
    user, 
    logout, 
    members: allMembers, 
    payments: allPayments, 
    addMember, 
    deleteMember, 
    markAsPaid,
    updateSettings,
    reversePayment,
    gymOwners,
    activeOutletId,
    setActiveOutletId,
    deleteGymOwner,
    addGymOwner,
    updateOwnerSubscription
  } = useContext(AppContext);
  const navigate = useNavigate();

  // Modals & Popups State
  const [isOutletDropdownOpen, setIsOutletDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [deleteOutletTarget, setDeleteOutletTarget] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isMembersListOpen, setIsMembersListOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [showOverduePopup, setShowOverduePopup] = useState(false);
  const [isOwnerLedgerOpen, setIsOwnerLedgerOpen] = useState(false);
  const [isAddGymOpen, setIsAddGymOpen] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [ledgerSearchQuery, setLedgerSearchQuery] = useState('');
  const [directorySearchQuery, setDirectorySearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // all, active, overdue, inactive

  // Settings State
  const [whatsappTemplate, setWhatsappTemplate] = useState(user?.settings?.whatsappTemplate || '');
  const [paymentLink, setPaymentLink] = useState(user?.settings?.paymentLink || '');
  const [reminderSchedule, setReminderSchedule] = useState(user?.settings?.reminderSchedule || 'standard');
  const [upiId, setUpiId] = useState(user?.settings?.upiId || 'goldsgym@okaxis');
  const [settingsSavedMessage, setSettingsSavedMessage] = useState(false);

  const [addGymForm, setAddGymForm] = useState({
    businessName: '', ownerName: '', phone1: '', phone2: '', address: '', pricingPlan: 'basic'
  });

  const today = formatDate(new Date());

  // Filter outlets owned by this gym owner
  const ownerOutlets = gymOwners.filter(o => 
    o.name === user?.name || 
    o.email === user?.email || 
    o.id === user?.id
  );

  const gymLimitReached = false;

  const activeOutlet = ownerOutlets.find(o => o.id === activeOutletId) || ownerOutlets[0] || {
    id: 'owner_golds',
    businessName: user?.businessName || "Gold's Gym Elite"
  };

  // Filter members and payments specific to this active outlet
  const members = allMembers.filter(m => (m.gymId || 'owner_golds') === activeOutlet.id);

  const payments = allPayments.filter(p => (p.gymId || 'owner_golds') === activeOutlet.id);

  // Redirect if not gym owner
  useEffect(() => {
    if (user && user.role !== 'owner') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Sync activeOutletId to first owner outlet if invalid
  useEffect(() => {
    if (ownerOutlets.length > 0) {
      if (!ownerOutlets.some(o => o.id === activeOutletId)) {
        setActiveOutletId(ownerOutlets[0].id);
      }
    }
  }, [ownerOutlets, activeOutletId, setActiveOutletId]);

  useEffect(() => {
    if (user?.settings) {
      setWhatsappTemplate(user.settings.whatsappTemplate || '');
      setPaymentLink(user.settings.paymentLink || '');
      setReminderSchedule(user.settings.reminderSchedule || 'standard');
      setUpiId(user.settings.upiId || 'goldsgym@okaxis');
    }
  }, [user?.settings]);

  useEffect(() => {
    if (user && user.subscriptionStatus === 'overdue') {
      const hasSeenOverdue = sessionStorage.getItem('seen_overdue_warning');
      if (!hasSeenOverdue) {
        setShowOverduePopup(true);
        sessionStorage.setItem('seen_overdue_warning', 'true');
      }
    }
  }, [user]);

  // Metrics Calculations
  const totalMembersCount = members.length;
  
  const activeMembersCount = members.filter(m => m.status === 'active' && m.nextDueDate >= today).length;
  
  const overdueMembersCount = members.filter(m => m.status === 'active' && m.nextDueDate < today).length;
  
  const inactiveMembersCount = members.filter(m => m.status === 'inactive').length;

  // Expected monthly revenue calculation (sum of members' fee normalized to monthly)
  const expectedRevenue = members
    .filter(m => m.status === 'active')
    .reduce((sum, m) => {
      let monthlyRate = m.subscriptionAmount;
      if (m.subscriptionTier === 'quarterly') monthlyRate = m.subscriptionAmount / 3;
      if (m.subscriptionTier === 'yearly') monthlyRate = m.subscriptionAmount / 12;
      return sum + monthlyRate;
    }, 0);

  // Total collected revenue from ledger payments
  const totalCollected = payments.reduce((sum, p) => sum + p.amountPaid, 0);

  // Monthly collected revenue from ledger payments (current calendar month)
  const currentMonthPrefix = today.substring(0, 7);
  const monthlyCollected = payments
    .filter(p => p.paymentDate.startsWith(currentMonthPrefix))
    .reduce((sum, p) => sum + p.amountPaid, 0);

  // Filtered members list
  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          member.phoneNumber.includes(searchQuery);

    if (!matchesSearch) return false;

    if (activeFilter === 'all') return true;
    if (activeFilter === 'inactive') return member.status === 'inactive';
    if (activeFilter === 'overdue') return member.status === 'active' && member.nextDueDate < today;
    if (activeFilter === 'active') return member.status === 'active' && member.nextDueDate >= today;

    return true;
  });

  const handleSaveSettings = (e) => {
    e.preventDefault();
    updateSettings({ whatsappTemplate, paymentLink, reminderSchedule, upiId });
    setSettingsSavedMessage(true);
    setTimeout(() => {
      setSettingsSavedMessage(false);
      setIsSettingsOpen(false);
    }, 1500);
  };

  // Revoked Access Locked Screen render
  if (user && user.subscriptionStatus === 'revoked') {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4 bg-slate-955">
        {/* Background glows */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-red-500/10 rounded-full blur-[80px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-brand-accent/5 rounded-full blur-[100px]"></div>
        
        <div className="backdrop-blur-md bg-slate-900/60 border border-red-500/25 max-w-md w-full rounded-2xl shadow-2xl p-6 text-center z-10 relative">
          <div className="mx-auto w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center text-red-500 mb-4 animate-pulse">
            <AlertCircle className="h-7 w-7" />
          </div>
          
          <h2 className="text-xl font-extrabold text-slate-100">Access Suspended</h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Your subscription to <strong>Due Date</strong> has expired and is overdue by 10+ days. Please pay the subscription fee to restore full access to your member dashboard.
          </p>
          
          <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl my-5 text-left">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
              <span>Plan Rate:</span>
              <span className="text-slate-200">₹699/month</span>
            </div>
            <div className="flex justify-between items-center text-xs font-semibold text-slate-400 mt-2">
              <span>Current Plan:</span>
              <span className="text-slate-200 font-bold">Basic Plan</span>
            </div>
            <div className="flex justify-between items-center text-xs font-semibold text-slate-400 mt-2">
              <span>Gym Name:</span>
              <span className="text-slate-200">{user.businessName}</span>
            </div>
          </div>

          <button
            onClick={() => {
              setIsPayModalOpen(true);
            }}
            className="w-full py-3 px-4 bg-red-650 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition duration-150 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-red-950/20"
          >
            Pay Now & Restore Access
          </button>
          
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full mt-3 py-2 px-4 border border-slate-800 hover:bg-slate-800/50 text-slate-400 hover:text-slate-300 font-semibold rounded-xl text-xs transition cursor-pointer"
          >
            Log Out
          </button>
        </div>
        
        {/* Direct Payment Checkout Modal */}
        {isPayModalOpen && (
          <OwnerPayModal 
            isOpen={isPayModalOpen} 
            onClose={() => setIsPayModalOpen(false)} 
            amount={699}
            requestedPlan="basic"
            requestedGyms={user?.allowedGyms || 1}
          />
        )}

        {/* ── Sign Out Confirmation Modal ── */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm text-left">
            <div className="bg-slate-900 border border-amber-500/20 rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 h-10 w-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400">
                  <AlertCircle className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-100 font-sans">Sign Out?</h3>
                  <p className="text-xs text-slate-400 mt-1 font-sans">
                    Are you sure you want to sign out of your active Due Date dashboard session?
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1 font-sans">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
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
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Navigation Header */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-slate-950/80 border-b border-slate-900 px-4 py-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-brand-primary/10 border border-brand-primary/20 rounded-lg text-brand-primary font-black">
                <Dumbbell className="h-5 w-5" />
              </div>
              <div className="hidden sm:block">
                <span className="font-extrabold tracking-tight text-lg sm:text-xl block">Due Date</span>
                <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase block">Gym Manager</span>
              </div>
            </div>

            {/* Gym Outlet Switcher Dropdown */}
            {ownerOutlets.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsOutletDropdownOpen(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer select-none"
                >
                  <Building className="h-3.5 w-3.5 text-brand-primary" />
                  <span className="truncate max-w-[120px] sm:max-w-[200px]">{activeOutlet.businessName}</span>
                  <span className="text-[7px] text-slate-500">▼</span>
                </button>

                {isOutletDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-45" onClick={() => setIsOutletDropdownOpen(false)}></div>
                    <div className="absolute left-0 mt-2 w-56 sm:w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-100">
                      <div className="px-3 py-1 border-b border-slate-850">
                        <span className="text-[9px] font-black text-slate-555 uppercase tracking-widest block">Select Gym Outlet</span>
                      </div>
                      <div className="max-h-48 overflow-y-auto mt-1 divide-y divide-slate-850/30">
                        {ownerOutlets.map(o => (
                          <div key={o.id} className="flex items-center justify-between group hover:bg-slate-850/30">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveOutletId(o.id);
                                setIsOutletDropdownOpen(false);
                              }}
                              className={`flex-1 text-left px-3 py-2.5 text-xs flex items-center justify-between transition ${
                                o.id === activeOutlet.id
                                  ? 'text-brand-primary font-black bg-brand-primary/5'
                                  : 'text-slate-300 font-bold hover:text-slate-200'
                              }`}
                            >
                              <span className="truncate pr-1.5">{o.businessName}</span>
                              {o.id === activeOutlet.id && (
                                <Check className="h-3.5 w-3.5 text-brand-primary flex-shrink-0" />
                              )}
                            </button>
                            {ownerOutlets.length > 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteOutletTarget(o);
                                  setIsOutletDropdownOpen(false);
                                }}
                                className="px-3 py-2.5 text-slate-500 hover:text-red-400 hover:bg-red-500/15 transition flex-shrink-0 cursor-pointer"
                                title="Delete Outlet Branch"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-slate-850 pt-1.5 mt-1 px-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddGymOpen(true);
                            setIsOutletDropdownOpen(false);
                          }}
                          className="w-full py-1.5 bg-brand-primary hover:bg-brand-primary-hover text-white text-[10px] font-black rounded-lg transition text-center flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          ADD NEW OUTLET
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* User Business Name (Desktop) */}
            <button 
              onClick={() => navigate('/profile')}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-full text-slate-300 hover:text-slate-100 transition cursor-pointer"
            >
              <User className="h-3 w-3 text-brand-primary" />
              {activeOutlet?.businessName || user?.businessName || 'Gym Owner'}
            </button>

            {/* Profile Button (Mobile) */}
            <button
              onClick={() => navigate('/profile')}
              className="sm:hidden p-2 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-200 transition cursor-pointer"
              title="Gym Profile"
            >
              <User className="h-4 w-4" />
            </button>

            {/* Recent Payments Button */}
            <button 
              onClick={() => setIsHistoryOpen(true)}
              className="p-2 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-200 transition cursor-pointer"
              title="Recent Payments Log"
            >
              <History className="h-4 w-4" />
            </button>

            {/* Settings Button */}
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-200 transition cursor-pointer"
              title="WhatsApp & UPI Settings"
            >
              <Settings className="h-4 w-4" />
            </button>

            {/* Logout Button */}
            <button 
              onClick={() => setShowLogoutConfirm(true)}
              className="p-2 border border-red-955 hover:border-red-900 hover:bg-red-955/20 rounded-lg text-red-400 hover:text-red-300 transition cursor-pointer"
              title="Log Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        
        {/* Banner */}
        <div className="backdrop-blur-md bg-gradient-to-r from-brand-primary/10 via-slate-900/20 to-brand-accent/5 border border-slate-800/80 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100">Welcome back, {user?.name.split(' ')[0]}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Manage members, log payments, and track automation triggers here.</p>
          </div>
          <button 
            onClick={() => {
              if (user?.subscriptionStatus === 'active' && user?.billingPayments && user.billingPayments.length > 0) {
                setIsAddModalOpen(true);
              } else {
                setIsPayModalOpen(true);
              }
            }}
            className={`flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl shadow-lg active:scale-95 transition cursor-pointer ${
              (user?.subscriptionStatus === 'active' && user?.billingPayments && user.billingPayments.length > 0)
                ? 'bg-brand-primary hover:bg-brand-primary-hover text-white shadow-brand-primary/10'
                : 'bg-slate-800 border border-slate-700/50 text-slate-400 hover:bg-slate-750'
            }`}
          >
            {(user?.subscriptionStatus === 'active' && user?.billingPayments && user.billingPayments.length > 0) ? (
              <Plus className="h-4 w-4" />
            ) : (
              <Lock className="h-4 w-4 text-amber-500 animate-pulse" />
            )}
            {(user?.subscriptionStatus === 'active' && user?.billingPayments && user.billingPayments.length > 0) ? 'Add Member' : 'Unlock Add Member (Pay Due)'}
          </button>
        </div>

        {/* Metrics Grid */}
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

            {/* Inline payment ledger dropdown */}
            {isOwnerLedgerOpen && (
              <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-slate-900 border border-amber-500/20 rounded-xl shadow-2xl shadow-black/60 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-200 flex items-center gap-1.5">
                      <History className="h-3 w-3 text-amber-400" />
                      Member Payment Ledger
                    </span>
                    <span className="text-[8px] text-slate-500 font-semibold block mt-0.5">{payments.length} total payment{payments.length !== 1 ? 's' : ''}</span>
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
                      {[...payments].sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate)).map(p => (
                        <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/30 transition">
                          <div className="flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-[8px] font-black bg-emerald-500/15 text-emerald-400">
                            +
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-bold text-slate-200 block truncate">{p.memberName}</span>
                            <span className="text-[8px] text-slate-500 truncate block">{p.paymentMethod} · {p.notes}</span>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <span className="text-[11px] font-black text-emerald-400">+₹{p.amountPaid.toLocaleString('en-IN')}</span>
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
            )}
          </div>

        </section>

        {/* Filter and Search Panel */}
        <section className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between bg-slate-900/20 border border-slate-850 p-4 rounded-xl">
          
          {/* Filters */}
          <div className="flex gap-1 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            {['all', 'active', 'overdue', 'inactive'].map((filter) => {
              const isActive = activeFilter === filter;
              let label = filter.toUpperCase();
              let count = totalMembersCount;
              if (filter === 'active') count = activeMembersCount;
              if (filter === 'overdue') count = overdueMembersCount;
              if (filter === 'inactive') count = inactiveMembersCount;

              return (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition duration-150 uppercase tracking-wide cursor-pointer ${
                    isActive 
                      ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/15' 
                      : 'bg-slate-900/60 hover:bg-slate-800/60 text-slate-400 hover:text-slate-300 border border-slate-800/80'
                  }`}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-555">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary text-xs"
              placeholder="Search by name or number..."
            />
          </div>

        </section>

        {/* Members List Component */}
        <section>
          <MembersTable 
            members={filteredMembers} 
            payments={payments}
            onMarkPaid={markAsPaid} 
            onDelete={deleteMember} 
            onReversePayment={reversePayment}
          />
        </section>

      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-850">
              <h3 className="text-lg font-bold text-slate-100">Automation Settings</h3>
              <button 
                onClick={() => setIsSettingsOpen(false)}
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

              {/* Reminder Schedule Model */}
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
                  onClick={() => setIsSettingsOpen(false)}
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
      )}

      {/* History Modal (Immutable Ledger Log) */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-850">
              <div>
                <h3 className="text-lg font-bold text-slate-100">Accounting Ledger</h3>
                <p className="text-[10px] text-slate-550 mt-0.5">Immutable records of all payments collected.</p>
              </div>
              <button 
                onClick={() => {
                  setIsHistoryOpen(false);
                  setLedgerSearchQuery('');
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search Box for Ledger */}
            <div className="mt-3 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-555">
                <Search className="h-3.5 w-3.5" />
              </div>
              <input
                type="text"
                value={ledgerSearchQuery}
                onChange={(e) => setLedgerSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-brand-primary text-xs"
                placeholder="Search payments by member name..."
              />
            </div>

            {/* List */}
            <div className="mt-4 max-h-[300px] overflow-y-auto pr-1 space-y-2.5">
              {payments.filter(p => p.memberName.toLowerCase().includes(ledgerSearchQuery.toLowerCase())).length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">
                  {payments.length === 0 ? "No payments logged yet." : "No matching payments found."}
                </p>
              ) : (
                payments
                  .filter(p => p.memberName.toLowerCase().includes(ledgerSearchQuery.toLowerCase()))
                  .map(payment => (
                    <div key={payment.id} className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl flex items-center justify-between text-xs text-slate-300">
                      <div className="space-y-1">
                        <span className="font-bold text-slate-200 block">{payment.memberName}</span>
                        <span className="text-[10px] text-slate-500 block">Method: {payment.paymentMethod} • Note: {payment.notes}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className={`font-black block ${payment.amountPaid < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                            {payment.amountPaid < 0 ? '' : '+' } ₹{payment.amountPaid.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-slate-500 block">{payment.paymentDate}</span>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="pt-4 mt-6 border-t border-slate-850 text-right">
              <button
                onClick={() => {
                  setIsHistoryOpen(false);
                  setLedgerSearchQuery('');
                }}
                className="py-2 px-6 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold rounded-lg text-xs transition cursor-pointer"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Members Directory Modal */}
      {isMembersListOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-850">
              <div>
                <h3 className="text-lg font-bold text-slate-100">Members Directory</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Quick lookup of active registration details.</p>
              </div>
              <button 
                onClick={() => {
                  setIsMembersListOpen(false);
                  setDirectorySearchQuery('');
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search Box for Directory */}
            <div className="mt-3 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Search className="h-3.5 w-3.5" />
              </div>
              <input
                type="text"
                value={directorySearchQuery}
                onChange={(e) => setDirectorySearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-slate-350 focus:outline-none focus:border-brand-primary text-xs"
                placeholder="Search by name or number..."
              />
            </div>

            {/* List */}
            <div className="mt-4 max-h-[300px] overflow-y-auto pr-1 space-y-2.5">
              {members.filter(m => m.name.toLowerCase().includes(directorySearchQuery.toLowerCase()) || m.phoneNumber.includes(directorySearchQuery)).length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">
                  {members.length === 0 ? "No registered members found." : "No matching members found."}
                </p>
              ) : (
                members
                  .filter(m => m.name.toLowerCase().includes(directorySearchQuery.toLowerCase()) || m.phoneNumber.includes(directorySearchQuery))
                  .map(member => {
                    const initials = member.name
                      ? member.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                      : 'M';
                    return (
                      <div key={member.id} className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl flex items-center gap-3">
                        {/* Avatar Circle */}
                        <div className="w-9 h-9 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-xs font-bold text-brand-primary font-mono">
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-slate-200 text-xs block truncate">{member.name}</span>
                          <span className="text-[10px] text-slate-500 block">{member.phoneNumber}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-slate-500 block font-semibold uppercase tracking-wider">Joined On</span>
                          <span className="text-[11px] text-slate-350 font-bold block">{member.joiningDate}</span>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            <div className="pt-4 mt-6 border-t border-slate-850 text-right">
              <button
                onClick={() => {
                  setIsMembersListOpen(false);
                  setDirectorySearchQuery('');
                }}
                className="py-2 px-6 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold rounded-lg text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      <AddMemberModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onAdd={addMember} 
      />

      {/* Owner Pay Modal */}
      {isPayModalOpen && (
        <OwnerPayModal 
          isOpen={isPayModalOpen} 
          onClose={() => setIsPayModalOpen(false)} 
          amount={699}
          requestedPlan="basic"
          requestedGyms={user?.allowedGyms || 1}
        />
      )}

      {/* Overdue Warning Popup */}
      {showOverduePopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/20 rounded-2xl shadow-2xl p-6 text-center animate-in fade-in zoom-in duration-200">
            <div className="mx-auto w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center text-amber-500 mb-4 animate-bounce">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-100">Subscription Payment Due</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Your SaaS subscription is currently overdue. You are in a <strong>{user?.graceDaysRemaining || 10}-day grace period</strong>. 
              Please pay the monthly fee to avoid automatic suspension of your dashboard access.
            </p>
            
            <div className="p-3 bg-slate-955/60 border border-slate-850 rounded-xl my-4 text-left flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Due Date:</span>
              <span className="text-amber-400 font-bold">{user?.subscriptionDueDate || today}</span>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => {
                  setShowOverduePopup(false);
                }}
                className="flex-1 py-2.5 px-4 border border-slate-850 hover:bg-slate-800/50 text-slate-350 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Remind Me Later
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowOverduePopup(false);
                  setIsPayModalOpen(true);
                }}
                className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/10 transition cursor-pointer"
              >
                Pay Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Gym Outlet Modal (Accessible to Owners) */}
      {isAddGymOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-purple-500/20 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-100 flex items-center gap-2">
                  <Building className="h-4 w-4 text-purple-400" />
                  {gymLimitReached ? 'Upgrade Plan Required' : 'Add New Gym Outlet'}
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {gymLimitReached ? 'Multi-gym support is only active on the 2-Gym location license.' : 'Register a new gym branch/outlet under your account.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddGymOpen(false)}
                className="text-slate-500 hover:text-slate-300 p-1 rounded hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {gymLimitReached ? (
              <div className="py-6 text-center space-y-4 animate-in fade-in duration-200">
                <div className="mx-auto w-12 h-12 bg-purple-500/10 border border-purple-500/25 rounded-full flex items-center justify-center text-purple-450 mb-1 animate-bounce">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-extrabold text-slate-105">Gym License Capacity Reached</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Your account is licensed for <strong className="text-slate-200">{user?.allowedGyms || 1} gym location(s)</strong>. 
                  You already have <strong className="text-slate-200">{ownerOutlets.length} active location(s)</strong>.
                </p>
                <p className="text-xs text-slate-500 font-medium">
                  Please purchase a <strong>2-Gym Location Support License</strong> in your profile settings tab to register another branch.
                </p>
                
                <div className="pt-4 flex gap-3 border-t border-slate-850">
                  <button
                    type="button"
                    onClick={() => setIsAddGymOpen(false)}
                    className="flex-1 py-2 px-4 border border-slate-800 hover:bg-slate-800 text-slate-400 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddGymOpen(false);
                      navigate('/profile?tab=billing');
                    }}
                    className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-lg shadow-purple-900/10 animate-pulse"
                  >
                    Go to Billing
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!addGymForm.businessName.trim() || !addGymForm.phone1.trim()) return;
                  addGymOwner({
                    ...addGymForm,
                    ownerName: user?.name
                  });
                  setAddGymForm({ businessName: '', ownerName: '', phone1: '', phone2: '', address: '', pricingPlan: 'basic' });
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
                  placeholder="e.g. Gold's Gym Downtown"
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
                Register Gym Outlet
              </button>
            </form>
            )}
          </div>
        </div>
      )}

      {/* ── Sign Out Confirmation Modal ── */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm text-left">
          <div className="bg-slate-900 border border-amber-500/20 rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 h-10 w-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400">
                <AlertCircle className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-100 font-sans">Sign Out?</h3>
                <p className="text-xs text-slate-400 mt-1 font-sans">
                  Are you sure you want to sign out of your active Due Date dashboard session?
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1 font-sans">
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
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-slate-955 font-bold rounded-xl transition cursor-pointer"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Outlet Warning Modal ── */}
      {deleteOutletTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-red-500/30 rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 h-10 w-10 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center text-red-400">
                <AlertCircle className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-100">Delete Gym Outlet?</h3>
                <p className="text-xs text-slate-400 mt-1">
                  This will <strong className="text-red-450">permanently delete</strong> the branch <strong className="text-slate-200">{deleteOutletTarget.businessName}</strong>, along with all its member rosters and payments ledger. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeleteOutletTarget(null)}
                className="flex-1 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteGymOwner(deleteOutletTarget.id);
                  const remaining = ownerOutlets.filter(o => o.id !== deleteOutletTarget.id);
                  if (remaining.length > 0) {
                    setActiveOutletId(remaining[0].id);
                  }
                  setDeleteOutletTarget(null);
                }}
                className="flex-1 py-2 bg-red-650 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Yes, Delete Outlet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OwnerDashboard;
