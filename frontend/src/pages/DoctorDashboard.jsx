import React, { useEffect, useState } from 'react';
import API from '../services/api.js';
import { Calendar, Plus, Trash2, X, FileText, Stethoscope, Clock, ShieldCheck, FileDown } from 'lucide-react';

const DoctorDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Prescription modal state
  const [prescriptionModal, setPrescriptionModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [advice, setAdvice] = useState('');
  const [medicines, setMedicines] = useState([{ name: '', dosage: '', frequency: 'Once daily', duration: '5 days' }]);
  
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const fetchAppointments = async () => {
    try {
      const response = await API.get('/doctors/appointments?dateFilter=upcoming');
      setAppointments(response.data.appointments);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const openPrescribeModal = (appt) => {
    setSelectedAppt(appt);
    setDiagnosis('');
    setAdvice('');
    setMedicines([{ name: '', dosage: '', frequency: 'Once daily', duration: '5 days' }]);
    setSubmitError(null);
    setPrescriptionModal(true);
  };

  const handleMedChange = (index, field, val) => {
    setMedicines(prev => prev.map((med, idx) => {
      if (idx === index) {
        return { ...med, [field]: val };
      }
      return med;
    }));
  };

  const addMedRow = () => {
    setMedicines(prev => [...prev, { name: '', dosage: '', frequency: 'Once daily', duration: '5 days' }]);
  };

  const removeMedRow = (index) => {
    if (medicines.length === 1) return;
    setMedicines(prev => prev.filter((_, idx) => idx !== index));
  };

  const handlePrescriptionSubmit = async (e) => {
    e.preventDefault();
    if (!diagnosis.trim()) {
      setSubmitError('Diagnosis is required.');
      return;
    }

    // Filter out blank medicines
    const filteredMeds = medicines.filter(m => m.name.trim() !== '');
    if (filteredMeds.length === 0) {
      setSubmitError('Please prescribe at least one medicine.');
      return;
    }

    setSubmitLoading(true);
    setSubmitError(null);

    try {
      await API.post('/doctors/prescriptions', {
        appointmentId: selectedAppt._id,
        diagnosis,
        advice,
        medicines: filteredMeds
      });
      
      // Refresh list
      await fetchAppointments();
      setPrescriptionModal(false);
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Failed to submit prescription');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-44 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const todayCount = appointments.filter(appt => {
    const apptDate = new Date(appt.date).toDateString();
    const today = new Date().toDateString();
    return apptDate === today;
  }).length;

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Consultation Schedule</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Review upcoming bookings, patient history, and issue clinical prescriptions.</p>
        </div>
        <div className="glass-card px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 border-teal-500/10">
          <Clock className="h-4.5 w-4.5 text-teal-600 animate-pulse" />
          <span>Today's Sessions: <span className="text-brand-500 font-bold">{todayCount}</span></span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 rounded-xl border border-red-200/10 text-xs">
          <span>{error}</span>
        </div>
      )}

      {/* Roster Grid list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {appointments.map((appt) => {
          const isToday = new Date(appt.date).toDateString() === new Date().toDateString();
          return (
            <div
              key={appt._id}
              className={`glass-card p-6 rounded-2xl shadow-sm border transition duration-300 relative flex flex-col justify-between ${
                isToday ? 'border-brand-500/30 ring-1 ring-brand-500/10' : 'border-slate-100'
              }`}
            >
              <div>
                {/* Header Row */}
                <div className="flex justify-between items-start">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {appt.type} consult
                  </div>
                  {isToday && (
                    <span className="px-2 py-0.5 rounded-full bg-brand-500 text-white text-[9px] font-bold uppercase tracking-wider animate-pulse-slow">
                      Today
                    </span>
                  )}
                </div>

                {/* Patient Header */}
                <div className="flex items-center gap-3 mt-4">
                  <div className="h-10 w-10 bg-brand-100 text-brand-600 font-bold rounded-lg flex items-center justify-center">
                    {appt.patientId?.name?.charAt(0) || 'P'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-800 dark:text-white truncate">{appt.patientId?.name || 'Deleted'}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">{appt.patientId?.email}</p>
                  </div>
                </div>

                {/* Info block */}
                <div className="mt-5 space-y-2.5 text-xs border-t border-slate-100 dark:border-slate-850 pt-4 text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>{new Date(appt.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{appt.timeSlot}</span>
                  </div>
                  {appt.reason && (
                    <div className="text-[11px] bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg mt-1 italic text-slate-500 border border-slate-100/10">
                      Reason: "{appt.reason}"
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-850 flex gap-2">
                {appt.status === 'completed' ? (
                  <div className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/20 dark:text-teal-400 text-xs font-bold border border-teal-200/10">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Consultation Finished</span>
                  </div>
                ) : appt.status === 'cancelled' ? (
                  <div className="w-full text-center py-2 bg-red-50 text-red-500 rounded-xl text-xs font-semibold">
                    Appointment Cancelled
                  </div>
                ) : (
                  <button
                    onClick={() => openPrescribeModal(appt)}
                    className="w-full py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-semibold transition flex justify-center items-center gap-2 shadow-lg shadow-brand-500/10"
                  >
                    <Stethoscope className="h-4 w-4" />
                    Write Prescription
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {appointments.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400 text-sm">
            No upcoming consultations scheduled. Check back later!
          </div>
        )}
      </div>

      {/* Prescription Form Modal Dialog */}
      {prescriptionModal && selectedAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="glass-card w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-white/20">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-brand-500" />
                  Prescription Details
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Patient: {selectedAppt.patientId?.name}</p>
              </div>
              <button onClick={() => setPrescriptionModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handlePrescriptionSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {submitError && (
                <div className="p-3.5 rounded-xl bg-red-50 text-red-650 text-xs border border-red-200/10">
                  {submitError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  Diagnosis & Notes
                </label>
                <textarea
                  rows="2"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Describe patient condition, clinical observations..."
                  className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  required
                ></textarea>
              </div>

              {/* Medicines List Section */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                    Prescribed Medicines
                  </label>
                  <button
                    type="button"
                    onClick={addMedRow}
                    className="flex items-center gap-1 text-[10px] font-bold text-brand-500 hover:text-brand-600 uppercase"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Row
                  </button>
                </div>

                {medicines.map((med, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2.5 items-end bg-slate-50/50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100/50">
                    <div className="col-span-12 sm:col-span-4">
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1">Medicine Name</label>
                      <input
                        type="text"
                        value={med.name}
                        onChange={(e) => handleMedChange(idx, 'name', e.target.value)}
                        placeholder="e.g. Paracetamol"
                        className="w-full px-2.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                        required
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1">Dosage</label>
                      <input
                        type="text"
                        value={med.dosage}
                        onChange={(e) => handleMedChange(idx, 'dosage', e.target.value)}
                        placeholder="e.g. 500 mg"
                        className="w-full px-2.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                        required
                      />
                    </div>
                    <div className="col-span-8 sm:col-span-3">
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1">Frequency</label>
                      <select
                        value={med.frequency}
                        onChange={(e) => handleMedChange(idx, 'frequency', e.target.value)}
                        className="w-full px-2 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                      >
                        <option value="Once daily">Once daily</option>
                        <option value="Twice daily">Twice daily</option>
                        <option value="Thrice daily">Thrice daily</option>
                        <option value="Four times daily">Four times daily</option>
                        <option value="Before meals">Before meals</option>
                        <option value="As needed (SOS)">As needed (SOS)</option>
                      </select>
                    </div>
                    <div className="col-span-8 sm:col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1">Duration</label>
                      <input
                        type="text"
                        value={med.duration}
                        onChange={(e) => handleMedChange(idx, 'duration', e.target.value)}
                        placeholder="e.g. 5 days"
                        className="w-full px-2.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                        required
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-1 flex justify-center pb-1">
                      <button
                        type="button"
                        onClick={() => removeMedRow(idx)}
                        disabled={medicines.length === 1}
                        className="p-1.5 text-red-500 hover:text-red-700 disabled:opacity-40"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  Advice & Lifestyle Instructions
                </label>
                <textarea
                  rows="2"
                  value={advice}
                  onChange={(e) => setAdvice(e.target.value)}
                  placeholder="Drink plenty of water, rest, avoid greasy food..."
                  className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-5 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setPrescriptionModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:text-slate-300 dark:hover:bg-slate-750 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition flex items-center gap-2"
                >
                  {submitLoading ? 'Generating PDF...' : 'Sign & Issue Prescription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
