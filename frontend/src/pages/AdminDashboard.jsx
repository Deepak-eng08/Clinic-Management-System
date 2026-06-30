import React, { useEffect, useState } from 'react';
import API from '../services/api.js';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from 'recharts';
import { Users, UserSquare2, CalendarRange, DollarSign, ArrowUpRight } from 'lucide-react';

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await API.get('/admin/analytics');
        setAnalytics(response.data.analytics);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load system analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8 h-80 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl"></div>
          <div className="md:col-span-4 h-80 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 rounded-xl border border-red-200/10">
        <p className="font-semibold">Error loading dashboard: {error}</p>
      </div>
    );
  }

  const { totalPatients, totalDoctors, appointments, totalRevenue, revenueChart, specializationDistribution, recentAppointments } = analytics;

  const statCards = [
    { label: 'Registered Patients', val: totalPatients, icon: Users, color: 'text-blue-500 bg-blue-500/10' },
    { label: 'Specialist Doctors', val: totalDoctors, icon: UserSquare2, color: 'text-teal-500 bg-teal-500/10' },
    { label: 'Total Consultations', val: appointments.total, icon: CalendarRange, color: 'text-purple-500 bg-purple-500/10' },
    { label: 'Earnings (INR)', val: `₹${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-amber-500 bg-amber-500/10' },
  ];

  const colors = ['#0d9488', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#10b981'];

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Clinical Overview</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Real-time status updates and hospital operational analytics.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="glass-card p-6 rounded-2xl shadow-sm hover:translate-y-[-2px] transition duration-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{card.label}</span>
                <div className={`p-2.5 rounded-xl ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mt-4">{card.val}</h2>
            </div>
          );
        })}
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Revenue line chart */}
        <div className="lg:col-span-8 glass-card p-6 rounded-2xl shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-6">Revenue Analysis (Last 6 Months)</h3>
          <div className="h-72 w-full">
            {revenueChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChart}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#0d9488" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue (₹)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400 text-xs">
                No payment data available for analysis.
              </div>
            )}
          </div>
        </div>

        {/* Specialization distribution chart */}
        <div className="lg:col-span-4 glass-card p-6 rounded-2xl shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-6">Staffing by Specialization</h3>
          <div className="h-72 w-full">
            {specializationDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={specializationDistribution} layout="vertical">
                  <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis dataKey="specialization" type="category" stroke="#94a3b8" fontSize={9} width={80} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={12} name="Doctors">
                    {specializationDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400 text-xs">
                No doctors registered in the system.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Recent Activity Table */}
      <div className="glass-card rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Recent Appointments</h3>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Latest 5 Bookings</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/40 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
                <th className="px-6 py-4">Patient</th>
                <th className="px-6 py-4">Assigned Doctor</th>
                <th className="px-6 py-4">Schedule</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Billing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
              {recentAppointments.map((appt) => (
                <tr key={appt._id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{appt.patientId?.name || 'Deleted Patient'}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{appt.patientId?.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      Dr. {appt.doctorId?.userId?.name || 'Deleted Doctor'}
                    </div>
                    <div className="text-[10px] text-brand-500 font-medium mt-0.5">{appt.doctorId?.specialization}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-700 dark:text-slate-300">
                      {new Date(appt.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{appt.timeSlot}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      appt.status === 'confirmed' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400' :
                      appt.status === 'completed' ? 'bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400' :
                      appt.status === 'cancelled' ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400' :
                      'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {appt.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      appt.paymentStatus === 'paid' ? 'bg-teal-50 text-teal-600 dark:bg-teal-950/30 dark:text-teal-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'
                    }`}>
                      {appt.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}
              {recentAppointments.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-400 text-xs">
                    No recent appointments found.
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

export default AdminDashboard;
