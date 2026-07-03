import React from 'react';
import { AlertCircle, CreditCard, Upload, Check } from 'lucide-react';

function CreatorSettingsCard({
  devError,
  devUpiId,
  setDevUpiId,
  devQrCode,
  setDevQrCode,
  devSavedSuccess,
  handleDevSave,
  handleDevImageChange
}) {
  return (
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
          <div className="text-xs font-semibold text-slate-400 bg-slate-955/60 border border-slate-850 rounded-lg p-2.5">
            Navneet Nihal Lakra
          </div>
        </div>

        {/* App Creator UPI ID */}
        <div className="space-y-1">
          <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">
            App Creator UPI ID (Dynamic Checkout)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-555">
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
  );
}

export default CreatorSettingsCard;
