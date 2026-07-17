import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext.jsx';
import { Dumbbell, Mail, Lock, LogIn, User, ShieldCheck } from 'lucide-react';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP verification state
  const [showOtp, setShowOtp] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [emailSent, setEmailSent] = useState(true);

  const { login, register, verifyEmailCode } = useContext(AppContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        if (!username || !email || !password) {
          setError('Please fill in all fields');
          return;
        }
        const result = await register(username, email, password);
        if (result?.requiresVerification) {
          setPendingEmail(result.email || email);
          setEmailSent(result.emailSent !== false);
          setShowOtp(true);
        } else if (result?.alreadyExists) {
          setError('This email is already registered. Click "Already have an account? Sign In" below.');
        } else if (result?.serverError) {
          setError('Server error. Make sure the backend is running and try again.');
        } else {
          setError('Something went wrong. Please try again.');
        }
      } else {
        if (!email || !password) {
          setError('Please fill in all fields');
          return;
        }
        const result = await login(email, password);
        if (result === true) {
          navigate('/dashboard');
        } else if (result?.requiresVerification) {
          setPendingEmail(result.email || email);
          setShowOtp(true);
        } else if (result?.serverError) {
          setError('Cannot connect to server. Make sure the backend is running.');
        } else {
          setError('Invalid email or password');
        }
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const success = await verifyEmailCode(pendingEmail, otpCode.trim());
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Invalid or expired code. Check your email and try again.');
      }
    } catch {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP Screen ────────────────────────────────────────────────────────────
  if (showOtp) {
    return (
      <div className="relative flex items-center justify-center min-h-screen overflow-hidden px-4">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-primary/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-accent/15 rounded-full blur-[120px] animate-pulse delay-700"></div>

        <div className="w-full max-w-md z-10">
          <div className="backdrop-blur-xl bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 shadow-2xl shadow-black/40">
            <div className="flex flex-col items-center mb-6">
              <div className="p-3 bg-brand-primary/10 border border-brand-primary/30 rounded-full mb-3 text-brand-primary">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-extrabold text-white">Verify Your Email</h2>
              <p className="text-slate-400 text-sm mt-2 text-center">
                {emailSent
                  ? <>We sent a 6-digit code to<br /><span className="text-brand-primary font-semibold">{pendingEmail}</span></>
                  : <>Enter the verification code for<br /><span className="text-brand-primary font-semibold">{pendingEmail}</span></>}
              </p>
              {!emailSent && (
                <div className="mt-3 p-2.5 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs rounded-lg text-center">
                  ⚠️ Email sending failed. Check Gmail config in backend .env.<br/>
                  The code is saved in MongoDB — contact admin for the code.
                </div>
              )}
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0"></span>
                  {error}
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Verification Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-lg text-white text-center text-2xl font-bold tracking-[0.5em] focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                  placeholder="000000"
                  required
                  autoFocus
                />
                <p className="text-[10px] text-slate-500 text-center mt-1">Expires in 10 minutes · Check spam if you don't see it</p>
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length < 6}
                className="w-full py-3 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer text-sm"
              >
                {loading
                  ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  : <><ShieldCheck className="h-4 w-4" /> Verify & Sign In</>}
              </button>

              <button type="button" onClick={() => { setShowOtp(false); setOtpCode(''); setError(''); }}
                className="w-full text-xs text-slate-500 hover:text-slate-300 transition cursor-pointer">
                ← Go back
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Login / Register ─────────────────────────────────────────────────
  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden px-4">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-primary/20 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-accent/15 rounded-full blur-[120px] animate-pulse delay-700"></div>

      <div className="w-full max-w-md z-10">
        <div className="backdrop-blur-xl bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 shadow-2xl shadow-black/40">

          {/* Logo */}
          <div className="flex flex-col items-center mb-7">
            <div className="p-3 bg-brand-primary/10 border border-brand-primary/30 rounded-full mb-3 text-brand-primary">
              <Dumbbell className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Due Date
            </h1>
            <p className="text-slate-400 text-sm mt-1">Gym Payment Reminder App</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0"></span>
                {error}
              </div>
            )}

            {/* Name field — only on register */}
            {isRegistering && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Your Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all text-sm"
                    placeholder="Nihal"
                    required
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all text-sm"
                  placeholder="name@business.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold rounded-lg shadow-lg shadow-brand-primary/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer text-sm mt-1"
            >
              {loading
                ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                : <><LogIn className="h-4 w-4" />{isRegistering ? 'Create Account' : 'Sign In'}</>}
            </button>
          </form>

          {/* Toggle login / register */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
              className="text-xs text-brand-primary hover:text-brand-primary-hover font-bold hover:underline cursor-pointer"
            >
              {isRegistering ? 'Already have an account? Sign In' : 'New to Due Date? Create an Account'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Login;
