import React, { useEffect, useState } from 'react';
import API from '../services/api.js';
import { ToggleLeft, ToggleRight, Search, ShieldCheck, Mail, Calendar } from 'lucide-react';

const AdminPatients = () => {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPatients = async () => {
    try {
      const response = await API.get('/admin/patients');
      setPatients(response.data.patients);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch patients roster');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await API.put(`/admin/users/${userId}/toggle`);
      setPatients(prev =>
        prev.map(p => {
          if (p.userId && p.userId._id === userId) {
            return {
              ...p,
              userId: {
                ...p.userId,
                isActive: !currentStatus
              }
            };
          }
          return p;
        })
      );
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update patient status');
    }
  };

  // Filter patients by name or email
  const filteredPatients = patients.filter(p => {
    const term = searchTerm.toLowerCase();
    const name = p.userId?.name?.toLowerCase() || '';
    const email = p.userId?.email?.toLowerCase() || '';
    return name.includes(term) || email.includes(term);
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg"></div>
        <div className="h-96 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Registered Patients</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage active patient accounts, contact profiles, and medical permissions.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 rounded-xl border border-red-200/10">
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex max-w-md">
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search patients by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/25 focus:border-brand-500 transition-colors"
          />
        </div>
      </div>

      {/* Patients Table */}
      <div className="glass-card rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/40 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
                <th className="px-6 py-4">Patient Profile</th>
                <th className="px-6 py-4">Bio Metrics</th>
                <th className="px-6 py-4">Location Address</th>
                <th className="px-6 py-4">Contact Phone</th>
                <th className="px-6 py-4">Registered Date</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
              {filteredPatients.map((p) => (
                <tr key={p._id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{p.userId?.name || 'Deleted User'}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{p.userId?.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 rounded text-[9px] font-bold uppercase">
                        G: {p.gender || 'N/A'}
                      </span>
                      <span className="px-1.5 py-0.5 bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-450 rounded text-[9px] font-bold">
                        B: {p.bloodGroup || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 max-w-[150px] truncate text-slate-600 dark:text-slate-400">
                    {p.address || <span className="italic text-slate-400">No address set</span>}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-355">
                    {p.userId?.phoneNumber || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(p.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-6 py-4">
                    {p.userId ? (
                      <button
                        onClick={() => handleToggleStatus(p.userId._id, p.userId.isActive)}
                        className={`flex items-center gap-1.5 font-semibold ${p.userId.isActive ? 'text-teal-600' : 'text-red-500'}`}
                      >
                        {p.userId.isActive ? (
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
                      <span className="italic text-red-550">Broken reference</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400 text-xs">
                    No matching patients found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPatients;
