import React, { useEffect, useState } from 'react';
import API from '../services/api.js';
import { Users, Mail, Phone, Calendar } from 'lucide-react';

const DoctorPatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await API.get('/doctors/patients');
        setPatients(response.data.patients);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch patients list');
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

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
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Patient Roster</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Directory of patients treated or scheduled for consultation.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 rounded-xl border border-red-200/10 text-xs">
          <span>{error}</span>
        </div>
      )}

      {/* Roster Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {patients.map((patient) => (
          <div key={patient._id} className="glass-card p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <div>
              {/* Profile Card */}
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold text-sm shrink-0">
                  {patient.name?.charAt(0) || 'P'}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-800 dark:text-white truncate">{patient.name}</h3>
                  <span className="inline-flex items-center gap-1 text-[9px] text-slate-400 font-semibold uppercase mt-0.5">
                    Patient ID: #{patient._id.substring(18)}
                  </span>
                </div>
              </div>

              {/* Bio & Details */}
              <div className="mt-5 space-y-3 border-t border-slate-100 dark:border-slate-850 pt-4 text-xs text-slate-650 dark:text-slate-400">
                <div className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="truncate">{patient.email}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>{patient.phoneNumber || 'Not provided'}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>Consulted since: {new Date(patient.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' })}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        {patients.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400 text-sm">
            No consulting records or patients linked yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorPatients;
