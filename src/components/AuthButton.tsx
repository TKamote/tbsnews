'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase/client';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  User 
} from 'firebase/auth';
import { LogIn, LogOut, User as UserIcon, Eye, EyeOff, Mail, CheckCircle2, XCircle } from 'lucide-react';

type AuthView = 'signin' | 'signup' | 'forgot';

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [authView, setAuthView] = useState<AuthView>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      if (user) {
        setShowAuthForm(false);
        setVerificationSent(false);
        // Check if email is verified
        setIsVerifying(!user.emailVerified);
      } else {
        setIsVerifying(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!auth) {
      setError('Firebase not configured');
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (!userCredential.user.emailVerified) {
        setError('Please verify your email before signing in. Check your inbox for the verification link.');
        await signOut(auth);
        return;
      }
      setEmail('');
      setPassword('');
      setShowAuthForm(false);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email. Sign up instead?');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password. Forgot your password?');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address.');
      } else {
        setError(err.message || 'Sign in failed');
      }
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!auth) {
      setError('Firebase not configured');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Send verification email
      await sendEmailVerification(userCredential.user);
      setVerificationSent(true);
      setSuccess('Account created! Please check your email to verify your account before signing in.');
      setEmail('');
      setPassword('');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Sign in instead?');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use a stronger password.');
      } else {
        setError(err.message || 'Sign up failed');
      }
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!auth) {
      setError('Firebase not configured');
      return;
    }

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess('Password reset email sent! Check your inbox for instructions.');
      setEmail('');
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address.');
      } else {
        setError(err.message || 'Failed to send reset email');
      }
    }
  };

  const handleResendVerification = async () => {
    if (!auth || !user) return;
    
    try {
      await sendEmailVerification(user);
      setSuccess('Verification email sent! Check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Failed to send verification email');
    }
  };

  const handleSignOut = async () => {
    if (!auth) return;
    
    try {
      await signOut(auth);
      setShowAuthForm(false);
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setError('');
    setSuccess('');
    setShowPassword(false);
    setVerificationSent(false);
  };

  if (loading) {
    return (
      <div className="w-24 h-10 bg-slate-200 animate-pulse rounded-lg" />
    );
  }

  if (!auth) {
    return null;
  }

  if (user) {
    const isEmailVerified = user.emailVerified;
    
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <UserIcon className="w-4 h-4 text-slate-600" />
          <div className="hidden sm:flex flex-col">
            <span className="text-slate-700 font-medium">{user.email}</span>
            {!isEmailVerified && (
              <span className="text-xs text-amber-600 flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                Unverified
              </span>
            )}
          </div>
        </div>
        {!isEmailVerified && (
          <button
            onClick={handleResendVerification}
            className="text-xs px-2 py-1 bg-amber-50 text-amber-700 rounded hover:bg-amber-100 transition-colors"
          >
            Resend Verification
          </button>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium shadow-sm"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          setShowAuthForm(!showAuthForm);
          resetForm();
          setAuthView('signin');
        }}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
      >
        <LogIn className="w-4 h-4" />
        Sign In
      </button>

      {showAuthForm && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" 
            onClick={() => {
              setShowAuthForm(false);
              resetForm();
            }}
          />
          
          {/* Auth Form */}
          <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 p-6 z-50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">
                {authView === 'signin' && 'Sign In'}
                {authView === 'signup' && 'Create Account'}
                {authView === 'forgot' && 'Reset Password'}
              </h3>
              <button
                onClick={() => {
                  setShowAuthForm(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* View Switcher */}
            {authView !== 'forgot' && (
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => {
                    setAuthView('signin');
                    resetForm();
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    authView === 'signin'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setAuthView('signup');
                    resetForm();
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    authView === 'signup'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-800">{success}</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Verification Sent Message */}
            {verificationSent && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2 mb-2">
                  <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-1">Verification Email Sent!</p>
                    <p className="text-xs text-blue-700">
                      We've sent a verification link to your email. Please check your inbox and click the link to verify your account.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Forms */}
            {authView === 'signin' && (
              <form onSubmit={handleSignIn}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-3 py-2.5 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthView('forgot');
                      setError('');
                      setSuccess('');
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Forgot password?
                  </button>

                  <button
                    type="submit"
                    className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                  >
                    Sign In
                  </button>
                </div>
              </form>
            )}

            {authView === 'signup' && (
              <form onSubmit={handleSignUp}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-3 py-2.5 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="At least 6 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Must be at least 6 characters</p>
                  </div>

                  <button
                    type="submit"
                    className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                  >
                    Create Account
                  </button>
                </div>
              </form>
            )}

            {authView === 'forgot' && (
              <form onSubmit={handleForgotPassword}>
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 mb-4">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthView('signin');
                        resetForm();
                      }}
                      className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                    >
                      Back to Sign In
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                    >
                      Send Reset Link
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </>
      )}
    </div>
  );
}
