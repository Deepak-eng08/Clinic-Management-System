import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { loginUser, clearError } from '../features/authSlice.js';
import { HeartPulse, Key, Mail, ShieldAlert } from 'lucide-react';

const Login = () => {
  const [showDemoAcc, setShowDemoAcc] = useState(true);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'doctor') navigate('/doctor');
      else navigate('/patient');
    }
  }, [isAuthenticated, user, navigate]);

  const onSubmit = (data) => {
    dispatch(loginUser(data));
  };

  const handleQuickLogin = (email, password) => {
    setValue('email', email);
    setValue('password', password);
    dispatch(loginUser({ email, password }));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-slate-950 dark:to-slate-900 px-4">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center">

        {/* Left Side: Brand presentation */}
        <div className="md:col-span-6 space-y-6 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 font-semibold text-xs tracking-wider uppercase">
            🏥 Integrated Clinical Workspace
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-800 dark:text-white leading-tight">
            Health Care Clinic<br />
            <span className="text-brand-500"> Health Portal</span>
          </h1>
          <p className="text-base text-slate-500 dark:text-slate-400 max-w-md">
            A secure clinic management utility connecting administrators, medical specialists, and patients in a unified real-time dashboard ecosystem.
          </p>

          {/* Quick Login credentials drawer */}
          {showDemoAcc && (
            <div className="glass-card p-5 rounded-2xl shadow-lg border border-teal-500/15 space-y-3">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                ⚡ Click Here For Login
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin@clinic.com', 'adminpassword')}
                  className="px-3 py-2 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 dark:text-teal-400 dark:bg-teal-950/30 dark:hover:bg-teal-900/40 border border-teal-200/20 rounded-xl transition"
                >
                  Admin Profile
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('rajesh.sharma@clinic.com', 'doctorpassword')}
                  className="px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-950/30 dark:hover:bg-blue-900/40 border border-blue-200/20 rounded-xl transition"
                >
                  Doctor Profile
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('patient@clinic.com', 'patientpassword')}
                  className="px-3 py-2 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 dark:text-purple-400 dark:bg-purple-950/30 dark:hover:bg-purple-900/40 border border-purple-200/20 rounded-xl transition"
                >
                  Patient Profile (Add)
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                *Note: The patient login requires registering a patient first or using the quick link. Clicking any login hashes automatically.
              </p>
            </div>
          )}
        </div>

        {/* Right Side: Glassmorphic form */}
        <div className="md:col-span-6 glass-card p-8 rounded-3xl shadow-2xl border border-white/40 max-w-md mx-auto w-full">
          <div className="flex flex-col items-center mb-6">
            <div className="h-12 w-12 rounded-2xl bg-brand-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/20 mb-3">
              <HeartPulse className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Sign In to Account</h2>
            <p className="text-xs text-slate-400 mt-1">Enter your credentials below to proceed</p>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 p-3.5 mb-5 rounded-xl bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 text-xs border border-red-200/10">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  placeholder="e.g. name@clinic.com"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  className="w-full pl-10 pr-4 py-3 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/35 focus:border-brand-500 transition-colors"
                />
              </div>
              {errors.email && <p className="text-red-500 text-[10px] mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Security Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Key className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  placeholder="Enter secret code"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                  className="w-full pl-10 pr-4 py-3 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/35 focus:border-brand-500 transition-colors"
                />
              </div>
              {errors.password && <p className="text-red-500 text-[10px] mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white text-sm font-semibold rounded-xl transition duration-200 flex justify-center items-center gap-2 mt-6 shadow-lg shadow-brand-500/10"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>Authenticating...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="text-center mt-6">
            <p className="text-xs text-slate-400">
              New patient?{' '}
              <Link to="/register" className="text-brand-500 hover:underline font-semibold">
                Register here
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
