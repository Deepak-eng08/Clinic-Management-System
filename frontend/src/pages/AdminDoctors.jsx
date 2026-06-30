import React, { useEffect, useState } from 'react';
import API from '../services/api.js';
import { useForm } from 'react-hook-form';
import { UserPlus, ToggleLeft, ToggleRight, X, Mail, ShieldCheck, Stethoscope } from 'lucide-react';

const AdminDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchDoctors = async () => {
    try {
      const response = await API.get('/admin/doctors');
      setDoctors(response.data.doctors);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch doctors list');
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await API.get('/admin/settings');
      setSettings(response.data.settings);
    } catch (err) {
      console.error('Failed to load clinic settings', err.message);
    }
  };

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await Promise.all([fetchDoctors(), fetchSettings()]);
      setLoading(false);
    };
    initData();
  }, []);

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await API.put(`/admin/users/${userId}/toggle`);
      // Update local state
      setDoctors(prev =>
        prev.map(doc => {
          if (doc.userId && doc.userId._id === userId) {
            return {
              ...doc,
              userId: {
                ...doc.userId,
                isActive: !currentStatus
              }
            };
          }
          return doc;
        })
      );
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update user status');
    }
  };

  const onSubmit = async (data) => {
    setSubmitLoading(true);
    setSubmitError(null);
    try {
      await API.post('/admin/doctors', data);
      await fetchDoctors();
      setModalOpen(false);
      reset();
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Onboarding failed');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg"></div>
          <div className="h-10 w-36 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg"></div>
        </div>
        <div className="h-96 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl"></div>
      </div>
    );
  }

  const specializations = settings?.allowedSpecializations || [
    'General Medicine', 'Cardiology', 'Pediatrics', 'Dermatology', 'Neurology', 'Orthopedics'
  ];

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Specialist Roster</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Onboard staff physicians, manage schedules, and configure access levels.</p>
        </div>
        <button
          onClick={() => {
            setSubmitError(null);
            setModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold rounded-xl transition duration-200 shadow-lg shadow-brand-500/10 self-start sm:self-auto"
        >
          <UserPlus className="h-4 w-4" />
          Onboard Doctor
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 rounded-xl border border-red-200/10">
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors.map((doc) => (
          <div key={doc._id} className="glass-card p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <div>
              {/* Profile Card */}
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center text-lg font-bold shrink-0">
                  {doc.userId?.name?.charAt(0) || 'D'}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-800 dark:text-white truncate">Dr. {doc.userId?.name || 'Deleted'}</h3>
                  <span className="inline-block text-[10px] font-bold text-brand-500 bg-brand-500/5 px-2 py-0.5 rounded-full mt-1">
                    {doc.specialization}
                  </span>
                </div>
              </div>

              {/* Bio & Details */}
              <div className="mt-4 space-y-2 border-t border-slate-100 dark:border-slate-800/50 pt-4 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex justify-between"><span className="text-slate-400">Qualification:</span> <span className="font-medium">{doc.qualification}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Experience:</span> <span className="font-medium">{doc.experienceYears} Years</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Consultation Fee:</span> <span className="font-medium">₹{doc.consultationFee}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Email:</span> <span className="font-medium truncate max-w-[150px]">{doc.userId?.email}</span></div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Account Status</span>
              {doc.userId ? (
                <button
                  onClick={() => handleToggleStatus(doc.userId._id, doc.userId.isActive)}
                  className={`flex items-center gap-1.5 text-xs font-semibold ${doc.userId.isActive ? 'text-teal-600' : 'text-red-500'}`}
                >
                  {doc.userId.isActive ? (
                    <>
                      <ToggleRight className="h-6 w-6" />
                      <span>Active</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="h-6 w-6" />
                      <span>Suspended</span>
                    </>
                  )}
                </button>
              ) : (
                <span className="text-xs text-red-500 italic">User account broken</span>
              )}
            </div>
          </div>
        ))}
        {doctors.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400 text-sm">
            No doctors onboarded yet. Click "Onboard Doctor" to begin seeding.
          </div>
        )}
      </div>

      {/* Onboarding Dialog Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="glass-card w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-brand-500" />
                Add Professional Doctor Profile
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {submitError && (
                <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs border border-red-200/10">
                  {submitError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Ramesh Gupta"
                    {...register('name', { required: 'Name is required' })}
                    className="w-full px-3 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                  {errors.name && <p className="text-red-500 text-[10px] mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. ramesh@clinic.com"
                    {...register('email', { required: 'Email is required' })}
                    className="w-full px-3 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                  {errors.email && <p className="text-red-500 text-[10px] mt-1">{errors.email.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Access Password</label>
                  <input
                    type="password"
                    placeholder="Set doctor account password"
                    {...register('password', { required: 'Password is required', minLength: 6 })}
                    className="w-full px-3 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                  {errors.password && <p className="text-red-500 text-[10px] mt-1">Password must be at least 6 characters</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 99888 77665"
                    {...register('phoneNumber')}
                    className="w-full px-3 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Specialization</label>
                  <select
                    {...register('specialization', { required: 'Specialization is required' })}
                    className="w-full px-3 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    {specializations.map((spec) => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Qualification</label>
                  <input
                    type="text"
                    placeholder="e.g. MBBS, MD (Cardiology)"
                    {...register('qualification', { required: 'Qualification is required' })}
                    className="w-full px-3 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                  {errors.qualification && <p className="text-red-500 text-[10px] mt-1">{errors.qualification.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Years of Experience</label>
                  <input
                    type="number"
                    placeholder="e.g. 5"
                    {...register('experienceYears', { required: true, min: 0 })}
                    className="w-full px-3 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Consultation Fee (INR)</label>
                  <input
                    type="number"
                    placeholder="e.g. 600"
                    {...register('consultationFee', { required: true, min: 0 })}
                    className="w-full px-3 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Physician Bio</label>
                <textarea
                  rows="3"
                  placeholder="Summarize doctor specialty and credentials..."
                  {...register('bio')}
                  className="w-full px-3 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition flex items-center gap-2"
                >
                  {submitLoading ? 'Registering...' : 'Create Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDoctors;
