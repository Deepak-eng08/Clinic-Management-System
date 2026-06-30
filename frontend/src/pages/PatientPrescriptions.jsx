import React, { useEffect, useState } from 'react';
import API from '../services/api.js';
import { FileDown, Calendar, FileText, User } from 'lucide-react';

const PatientPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const response = await API.get('/patients/prescriptions');
        setPrescriptions(response.data.prescriptions);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch prescriptions');
      } finally {
        setLoading(false);
      }
    };
    fetchPrescriptions();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg"></div>
        <div className="h-96 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl"></div>
      </div>
    );
  }

  const handleDownloadPDF = (pdfUrl) => {
    // Open prescription PDF generated on server
    const targetUrl = pdfUrl.startsWith('http')
      ? pdfUrl
      : `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${pdfUrl}`;
    window.open(targetUrl, '_blank');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Medical Prescriptions</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Access signed clinical prescriptions and medicine schedules written by your doctors.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 rounded-xl border border-red-200/10 text-xs">
          <span>{error}</span>
        </div>
      )}

      {/* Prescription List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {prescriptions.map((pres) => (
          <div key={pres._id} className="glass-card p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-850 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 bg-brand-500/10 text-brand-500 rounded-xl flex items-center justify-center">
                    <FileText className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm">Diagnosis Summary</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">ID: #{pres._id.substring(18)}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleDownloadPDF(pres.pdfUrl)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-brand-500/10 hover:bg-brand-500 text-brand-500 hover:text-white transition duration-200 rounded-lg text-[10px] font-bold"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  <span>PDF Invoice</span>
                </button>
              </div>

              {/* Diagnosis Details */}
              <div className="mt-4 space-y-3.5">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Diagnosis</span>
                  <p className="text-xs text-slate-700 dark:text-slate-200 font-semibold mt-1">
                    {pres.diagnosis}
                  </p>
                </div>

                {/* Medicines Checklist */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Prescribed Schedule</span>
                  <div className="mt-2 space-y-1.5">
                    {pres.medicines.map((med, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/40 px-3 py-2 rounded-lg text-[11px] border border-slate-100/50">
                        <div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{med.name}</span>
                          <span className="text-slate-400 text-[10px] ml-1.5">({med.dosage})</span>
                        </div>
                        <div className="text-slate-500 font-medium">
                          {med.frequency} &bull; {med.duration}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {pres.advice && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Advice & Lifestyle</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-405 italic mt-1 bg-slate-50 dark:bg-slate-950/40 p-2 rounded-lg">
                      "{pres.advice}"
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer doctor info */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-850 flex justify-between items-center text-xs">
              <div className="flex items-center gap-1.5 text-slate-500">
                <User className="h-4 w-4 text-slate-400" />
                <span>Dr. {pres.doctorId?.userId?.name || 'Staff Physician'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                <Calendar className="h-4 w-4" />
                <span>{new Date(pres.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </div>
            </div>
          </div>
        ))}
        {prescriptions.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400 text-sm">
            No active medical prescriptions listed for your profile.
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientPrescriptions;
