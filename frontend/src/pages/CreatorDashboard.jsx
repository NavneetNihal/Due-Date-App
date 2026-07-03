import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext, formatDate } from '../context/AppContext.jsx';
import AddGymClientModal from '../components/AddGymClientModal.jsx';
import CreatorStats from '../components/CreatorStats.jsx';
import CreatorClientList from '../components/CreatorClientList.jsx';
import CreatorSettingsCard from '../components/CreatorSettingsCard.jsx';
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
    billingRequests,
    approveBillingRequest,
    rejectBillingRequest,
    members: allMembers
  } = useContext(AppContext);
  const navigate = useNavigate();

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

  // Creator credentials edit state
  const [devUpiId, setDevUpiId] = useState(developerSettings?.upiId || '7004689533@ptyes');
  const [devQrCode, setDevQrCode] = useState(developerSettings?.qrCode || '');
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
        <CreatorStats
          totalOwners={totalOwners}
          activeOwners={activeOwners}
          totalARR={totalARR}
          allLedgerEntries={allLedgerEntries}
          isArrLedgerOpen={isArrLedgerOpen}
          setIsArrLedgerOpen={setIsArrLedgerOpen}
          lastPaidOwnerId={lastPaidOwnerId}
        />

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Creator credentials summary card */}
          <div className="lg:col-span-1 space-y-6">
            <CreatorSettingsCard
              devError={devError}
              devUpiId={devUpiId}
              setDevUpiId={setDevUpiId}
              devQrCode={devQrCode}
              setDevQrCode={setDevQrCode}
              devSavedSuccess={devSavedSuccess}
              handleDevSave={handleDevSave}
              handleDevImageChange={handleDevImageChange}
            />
          </div>

          <div className="lg:col-span-2 space-y-4">
            {/* Pending Inbound Payment Requests */}
            {(() => {
              const pendingRequests = billingRequests?.filter(r => r.status === 'pending') || [];

              return (
                <div className="backdrop-blur-md bg-slate-900/40 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-850">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-200 flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 text-amber-500 animate-pulse" />
                      Pending License Requests ({pendingRequests.length})
                    </span>
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Manual Approve Required</span>
                  </div>

                  {pendingRequests.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 italic text-[10px]">
                      No pending payment logs to verify. When gym owners pay and confirm checkout, they will appear here.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                      {pendingRequests.map(req => (
                        <div key={req._id || req.id} className="p-3 bg-slate-955/60 border border-slate-850 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <strong className="text-slate-100 font-sans">{req.businessName}</strong>
                              <span className="px-1 py-0.5 bg-slate-900 border border-slate-800 rounded text-[8px] font-semibold text-slate-450 uppercase">
                                {req.notes || 'Basic'}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 block">Owner: {req.ownerName}</span>
                            <span className="text-[10px] text-slate-455 block font-mono">Date: {req.requestDate}</span>
                          </div>
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <button
                              onClick={() => rejectBillingRequest(req._id || req.id)}
                              className="px-2.5 py-1.5 border border-slate-800 hover:border-red-500/30 hover:bg-red-500/5 text-slate-450 hover:text-red-400 font-bold text-[9px] rounded-lg transition cursor-pointer"
                            >
                              Decline
                            </button>
                            <button
                              onClick={() => approveBillingRequest(req._id || req.id)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] rounded-lg transition cursor-pointer active:scale-95 shadow-md shadow-emerald-955/15"
                            >
                              Approve & Unlock
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            <CreatorClientList
              filteredOwners={filteredOwners}
              allMembers={allMembers}
              creatorSearchQuery={creatorSearchQuery}
              setCreatorSearchQuery={setCreatorSearchQuery}
              setIsAddGymOpen={setIsAddGymOpen}
              updateGymOwnerStatus={updateGymOwnerStatus}
              setRevokeTarget={setRevokeTarget}
              markGymOwnerPaid={markGymOwnerPaid}
              reverseGymOwnerPayment={reverseGymOwnerPayment}
              setDeleteTarget={setDeleteTarget}
              hasReversibleOwnerPayment={hasReversibleOwnerPayment}
              setIsArrLedgerOpen={setIsArrLedgerOpen}
              setLastPaidOwnerId={setLastPaidOwnerId}
            />
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
          <AddGymClientModal 
            isOpen={isAddGymOpen} 
            onClose={() => setIsAddGymOpen(false)} 
            addGymOwner={addGymOwner} 
          />

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
