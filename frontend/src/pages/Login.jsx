import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext.jsx';
import { Dumbbell, Mail, Lock, LogIn, User } from 'lucide-react';

function Login() {
  const [loginTab, setLoginTab] = useState('owner'); // owner, creator
  const [username, setUsername] = useState('Nihal');
  const [email, setEmail] = useState('demo@gymowner.com');
  const [password, setPassword] = useState('password123');
  const [creatorPassword, setCreatorPassword] = useState('creator123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AppContext);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Mock delay for realistic premium feel
    setTimeout(() => {
      if (loginTab === 'creator') {
        if (creatorPassword !== 'creator123') {
          setError('Invalid administrator key / password');
          setLoading(false);
          return;
        }
        
        const success = login('Nihal', 'creator@app.com', 'creator123');
        if (success) {
          navigate('/dashboard');
        } else {
          setError('Creator authentication failed');
        }
      } else {
        if (!username || !email || !password) {
          setError('Please fill in all fields');
          setLoading(false);
          return;
        }
        
        const success = login(username, email, password);
        if (success) {
          navigate('/dashboard');
        } else {
          setError('Invalid credentials');
        }
      }
      setLoading(false);
    }, 800);
  };

  const handleSSOLogin = (provider) => {
    setError('');
    setLoading(true);
    
    // Simulate SSO loading
    setTimeout(() => {
      const mockUsername = `${username || 'Nihal'} (${provider})`;
      const success = login(mockUsername, `sso-${provider.toLowerCase()}@gymowner.com`, 'sso_password_123');
      if (success) {
        navigate('/dashboard');
      } else {
        setError(`${provider} Authentication Failed`);
      }
      setLoading(false);
    }, 850);
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden px-4">
      {/* Dynamic Background Blurs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-primary/20 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-accent/15 rounded-full blur-[120px] animate-pulse delay-700"></div>

      {/* Main Login Card */}
      <div className="w-full max-w-md z-10">
        <div className="backdrop-blur-xl bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 shadow-2xl shadow-black/40">
          
          {/* Logo Header */}
          <div className="flex flex-col items-center mb-5">
            <div className="p-3 bg-brand-primary/10 border border-brand-primary/30 rounded-full mb-3 text-brand-primary shadow-lg shadow-brand-primary/5">
              <Dumbbell className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Due Date
            </h1>
            <p className="text-slate-400 text-sm mt-1">Gym Payment Reminder App</p>
          </div>

          {/* Login Role Toggle */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950/60 border border-slate-850 rounded-xl mb-5 shadow-inner">
            <button
              type="button"
              onClick={() => {
                setLoginTab('owner');
                setError('');
              }}
              className={`py-2 px-3 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                loginTab === 'owner'
                  ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/10'
                  : 'text-slate-500 hover:text-slate-350'
              }`}
            >
              Gym Owner
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginTab('creator');
                setError('');
              }}
              className={`py-2 px-3 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                loginTab === 'creator'
                  ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/10'
                  : 'text-slate-500 hover:text-slate-350'
              }`}
            >
              App Creator
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                {error}
              </div>
            )}

            {loginTab === 'creator' ? (
              <>
                {/* Creator Username Field */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-350 uppercase tracking-wider block">
                    Admin Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <User className="h-4.5 w-4.5" />
                    </div>
                    <input
                      type="text"
                      value="Navneet Nihal Lakra"
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/20 border border-slate-850 rounded-lg text-slate-400 font-bold select-none text-sm cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Creator Password Field */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-350 uppercase tracking-wider block">
                    Creator Access Key
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Lock className="h-4.5 w-4.5" />
                    </div>
                    <input
                      type="password"
                      value={creatorPassword}
                      onChange={(e) => setCreatorPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all duration-200 placeholder-slate-650 text-sm font-mono"
                      placeholder="Enter administrator password"
                      required
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 block italic leading-normal mt-1">
                    Demo credentials pre-filled. Enter 'creator123' to log in as creator.
                  </span>
                </div>
              </>
            ) : (
              <>
                {/* Username Field */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-350 uppercase tracking-wider block">
                    Your Username (shown on dashboard)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <User className="h-4.5 w-4.5" />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all duration-200 placeholder-slate-650 text-sm"
                      placeholder="Nihal"
                      required
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-350 uppercase tracking-wider block">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Mail className="h-4.5 w-4.5" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all duration-200 placeholder-slate-600 text-sm"
                      placeholder="name@business.com"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-350 uppercase tracking-wider block">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Lock className="h-4.5 w-4.5" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all duration-200 placeholder-slate-650 text-sm"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold rounded-lg shadow-lg shadow-brand-primary/10 hover:shadow-brand-primary/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer text-sm mt-2"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn className="h-4.5 w-4.5" />
                  {loginTab === 'creator' ? 'Sign In as Creator' : 'Sign In to Dashboard'}
                </>
              )}
            </button>
          </form>

          {loginTab !== 'creator' && (
            <>
              {/* Divider */}
              <div className="relative my-5 flex items-center justify-center">
                <div className="absolute inset-x-0 h-px bg-slate-800/80"></div>
                <span className="relative px-3 bg-[#0a0f18] text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Or Continue With
                </span>
              </div>

              {/* SSO Buttons */}
              <div className="grid grid-cols-2 gap-3">
                {/* Google SSO */}
                <button
                  type="button"
                  onClick={() => handleSSOLogin('Google')}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 rounded-lg text-[11px] font-bold text-slate-300 hover:text-slate-100 transition active:scale-[0.98] cursor-pointer disabled:opacity-50"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5.04c1.62 0 3.08.56 4.22 1.65l3.15-3.15C17.45 1.68 14.93 1 12 1 7.37 1 3.4 3.66 1.48 7.56l3.87 3C6.27 7.74 8.92 5.04 12 5.04z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.28 1.48-1.12 2.74-2.38 3.58l3.68 2.85c2.15-1.98 3.73-4.9 3.73-8.58z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.35 14.86c-.24-.72-.38-1.5-.38-2.31s.14-1.59.38-2.31L1.48 7.24C.53 9.15 0 11.28 0 13.5s.53 4.35 1.48 6.26l3.87-2.9z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.68-2.85c-1.02.68-2.33 1.09-3.8 1.09-3.08 0-5.73-2.7-6.65-5.52l-3.87 3C3.4 20.34 7.37 23 12 23z"
                    />
                  </svg>
                  Google
                </button>

                {/* Apple SSO */}
                <button
                  type="button"
                  onClick={() => handleSSOLogin('Apple')}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 rounded-lg text-[11px] font-bold text-slate-300 hover:text-slate-100 transition active:scale-[0.98] cursor-pointer disabled:opacity-50"
                >
                  <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.5-.63.73-1.18 1.87-1.03 2.98 1.12.09 2.27-.56 2.98-1.42z" />
                  </svg>
                  Apple
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

export default Login;
