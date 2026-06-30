import React, { useEffect, useState } from 'react';
import API from '../services/api.js';
import { Search, Stethoscope, Calendar, Clock, Star, Bot, Send, Sparkles, X, HeartPulse, User, CheckCircle2 } from 'lucide-react';

const PatientDashboard = () => {
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [specFilter, setSpecFilter] = useState('');
  const [settings, setSettings] = useState(null);
  
  // Booking modal state
  const [bookingModal, setBookingModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [reason, setReason] = useState('');
  const [consultType, setConsultType] = useState('in-person');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Chatbot Drawer state
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [chatMode, setChatMode] = useState('chat'); // 'chat' or 'symptoms'
  const [chatMessages, setChatMessages] = useState([
    { role: 'ai', content: 'Hello! I am Antigravity AI, your virtual health assistant. How can I help you today?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Symptom checker input
  const [symptomInput, setSymptomInput] = useState('');
  const [symptomResult, setSymptomResult] = useState(null);

  const [loading, setLoading] = useState(true);

  const fetchDoctors = async () => {
    try {
      const specQuery = specFilter ? `&specialization=${specFilter}` : '';
      const searchQuery = search ? `&search=${search}` : '';
      const response = await API.get(`/patients/doctors?${specQuery}${searchQuery}`);
      setDoctors(response.data.doctors);
    } catch (err) {
      console.error('Error fetching doctors:', err);
    }
  };

  const fetchSettings = async () => {
    try {
      // Fetch settings to check allowed specializations & chatbot toggle
      const response = await API.get('/admin/settings');
      setSettings(response.data.settings);
    } catch (err) {
      // Fallback
      setSettings({ enableChatbot: true, allowedSpecializations: [] });
    }
  };

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await Promise.all([fetchDoctors(), fetchSettings()]);
      setLoading(false);
    };
    initData();
  }, [specFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDoctors();
  };

  // Trigger when a date is selected in the booking modal to calculate slots
  useEffect(() => {
    if (!bookingDate || !selectedDoc) return;
    
    // 1. Find the day of week
    const dateObj = new Date(bookingDate);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[dateObj.getDay()];

    // 2. Find doctor availability for this day
    const dayAvail = selectedDoc.availability.find(a => a.day === dayName);
    if (dayAvail) {
      setAvailableSlots(dayAvail.slots);
    } else {
      setAvailableSlots([]);
    }
    setSelectedSlot('');
  }, [bookingDate, selectedDoc]);

  const openBookModal = (doc) => {
    setSelectedDoc(doc);
    setBookingDate('');
    setAvailableSlots([]);
    setSelectedSlot('');
    setReason('');
    setBookingSuccess(false);
    setBookingError(null);
    setBookingModal(true);
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      setBookingError('Please choose an available time slot.');
      return;
    }

    setBookingLoading(true);
    setBookingError(null);

    try {
      await API.post('/patients/appointments', {
        doctorId: selectedDoc._id,
        date: bookingDate,
        timeSlot: selectedSlot,
        reason,
        type: consultType,
      });

      setBookingSuccess(true);
      setTimeout(() => {
        setBookingModal(false);
      }, 2000);
    } catch (err) {
      setBookingError(err.response?.data?.error || 'Failed to book slot');
    } finally {
      setBookingLoading(false);
    }
  };

  // AI Chat Submission
  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const history = chatMessages.map(m => ({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.content
      }));

      const response = await API.post('/ai/chat', {
        message: userMsg,
        history
      });

      setChatMessages(prev => [...prev, { role: 'ai', content: response.data.reply }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I encountered an error. Please check your connection.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  // AI Symptom Checker Submission
  const handleCheckSymptoms = async (e) => {
    e.preventDefault();
    if (!symptomInput.trim() || chatLoading) return;

    setChatLoading(true);
    setSymptomResult(null);

    try {
      const response = await API.post('/ai/symptom-check', { symptoms: symptomInput });
      setSymptomResult(response.data);
    } catch (err) {
      alert('Symptom analyzer failed. Please try again.');
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg"></div>
        <div className="h-12 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const specializations = settings?.allowedSpecializations || [
    'General Medicine', 'Cardiology', 'Pediatrics', 'Dermatology', 'Neurology', 'Orthopedics'
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-brand-600 to-teal-500 text-white shadow-xl shadow-brand-500/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Need a medical consultation?</h1>
          <p className="text-xs sm:text-sm text-brand-100 max-w-md">Search and filter certified clinic doctors by specialty, check live timetables, and book slots instantly.</p>
        </div>
        <div className="relative z-10 shrink-0">
          <Stethoscope className="h-24 w-24 text-white/10 absolute -right-4 -bottom-6" />
        </div>
      </div>

      {/* Filters & Search */}
      <div className="glass-card p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800/80">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search doctors by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/25"
            />
          </div>

          {/* Specialty chips */}
          <div className="flex flex-wrap gap-2 justify-end w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setSpecFilter('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                !specFilter
                  ? 'bg-brand-500 border-brand-500 text-white shadow-sm shadow-brand-500/10'
                  : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
              }`}
            >
              All Specialities
            </button>
            {specializations.map((spec) => (
              <button
                type="button"
                key={spec}
                onClick={() => setSpecFilter(spec)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  specFilter === spec
                    ? 'bg-brand-500 border-brand-500 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
                }`}
              >
                {spec}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors.map((doc) => (
          <div key={doc._id} className="glass-card p-6 rounded-2xl shadow-sm border border-slate-100 hover:scale-[1.01] transition duration-300 flex flex-col justify-between">
            <div>
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold text-lg">
                  {doc.userId?.name?.charAt(0) || 'D'}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-800 dark:text-white truncate">Dr. {doc.userId?.name}</h3>
                  <p className="text-[10px] text-brand-500 font-semibold uppercase mt-0.5">{doc.specialization}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-1.5 text-xs text-amber-500 font-semibold">
                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                <span>{doc.ratings.average.toFixed(1)}</span>
                <span className="text-slate-400 font-normal">({doc.ratings.count} reviews)</span>
              </div>

              <div className="mt-4 space-y-2 border-t border-slate-100 dark:border-slate-850 pt-4 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex justify-between"><span>Credentials:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{doc.qualification}</span></div>
                <div className="flex justify-between"><span>Experience:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{doc.experienceYears} Years</span></div>
                <div className="flex justify-between"><span>Consultation Fee:</span> <span className="font-bold text-brand-500 dark:text-brand-400">₹{doc.consultationFee}</span></div>
              </div>

              {doc.bio && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-4 line-clamp-2 italic">
                  "{doc.bio}"
                </p>
              )}
            </div>

            <button
              onClick={() => openBookModal(doc)}
              className="mt-6 w-full py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-semibold transition flex justify-center items-center gap-2 shadow-lg shadow-brand-500/10"
            >
              <Calendar className="h-4 w-4" />
              Book Appointment
            </button>
          </div>
        ))}
        {doctors.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400 text-sm">
            No doctors matching the current search parameters.
          </div>
        )}
      </div>

      {/* 5. Appointment Booking Modal Dialog */}
      {bookingModal && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-white/20">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-brand-500" />
                  Select Schedule
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Physician: Dr. {selectedDoc.userId?.name}</p>
              </div>
              <button onClick={() => setBookingModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {bookingSuccess ? (
              <div className="p-8 text-center space-y-4">
                <div className="h-12 w-12 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto border border-teal-200/20">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h4 className="font-bold text-slate-800 dark:text-white">Booking Received!</h4>
                <p className="text-xs text-slate-400">Your appointment request has been logged. Double check payment prompts in "My Bookings" screen.</p>
              </div>
            ) : (
              <form onSubmit={handleConfirmBooking} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                {bookingError && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-650 text-xs border border-red-200/10">
                    {bookingError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Choose Date</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    required
                  />
                </div>

                {bookingDate && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Select Time Slot</label>
                    {availableSlots.length > 0 ? (
                      <div className="grid grid-cols-4 gap-2">
                        {availableSlots.map((slot) => (
                          <button
                            type="button"
                            key={slot}
                            onClick={() => setSelectedSlot(slot)}
                            className={`py-1.5 rounded-lg text-xs font-medium border text-center transition ${
                              selectedSlot === slot
                                ? 'bg-brand-500 border-brand-500 text-white'
                                : 'bg-white border-slate-250 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-red-500 italic">Doctor is not scheduling appointments on this day of week.</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Consultation Style</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setConsultType('in-person')}
                      className={`py-2 text-xs font-semibold rounded-xl border text-center transition ${
                        consultType === 'in-person' ? 'bg-brand-500 border-brand-500 text-white' : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
                      }`}
                    >
                      In-Person Visit
                    </button>
                    <button
                      type="button"
                      onClick={() => setConsultType('video')}
                      className={`py-2 text-xs font-semibold rounded-xl border text-center transition ${
                        consultType === 'video' ? 'bg-brand-500 border-brand-500 text-white' : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
                      }`}
                    >
                      Video Consultation
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Symptoms / Reason</label>
                  <textarea
                    rows="2"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Briefly state symptoms or clinical checkup reason..."
                    className="w-full px-3 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setBookingModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:text-slate-300 dark:hover:bg-slate-750 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={bookingLoading || !selectedSlot}
                    className="px-4 py-2 text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition flex items-center gap-2 shadow-lg shadow-brand-500/10"
                  >
                    {bookingLoading ? 'Reserving...' : 'Confirm Appointment'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Floating AI Chatbot Toggle Button & Drawer (Only if enabled by settings) */}
      {(!settings || settings.enableChatbot) && (
        <>
          {/* Floating button */}
          <button
            onClick={() => setChatbotOpen(true)}
            className="fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full bg-brand-500 text-white flex items-center justify-center hover:scale-105 transition duration-200 shadow-xl shadow-brand-500/25"
          >
            <Bot className="h-6 w-6" />
          </button>

          {/* Chatbot Drawer Panel */}
          {chatbotOpen && (
            <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between">
              {/* Header */}
              <div className="flex h-16 items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-brand-500 text-white rounded-lg flex items-center justify-center">
                    <Sparkles className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm">Antigravity AI Assistant</h3>
                    <p className="text-[9px] text-slate-400">Virtual medical assistant advice</p>
                  </div>
                </div>
                <button onClick={() => setChatbotOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Mode Selection Tab */}
              <div className="grid grid-cols-2 text-center bg-slate-50 dark:bg-slate-950/40 text-xs border-b border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setChatMode('chat')}
                  className={`py-2.5 font-bold ${chatMode === 'chat' ? 'text-brand-500 border-b-2 border-brand-500' : 'text-slate-500'}`}
                >
                  Medical Chat
                </button>
                <button
                  onClick={() => setChatMode('symptoms')}
                  className={`py-2.5 font-bold ${chatMode === 'symptoms' ? 'text-brand-500 border-b-2 border-brand-500' : 'text-slate-500'}`}
                >
                  Symptom Analyzer
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {chatMode === 'chat' ? (
                  // Chat Messages Area
                  <div className="space-y-4">
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-3.5 rounded-2xl max-w-[85%] text-xs border ${
                          msg.role === 'user'
                            ? 'bg-brand-500 text-white border-brand-500/20 rounded-tr-none'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-100/50 dark:border-slate-850 rounded-tl-none'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl flex items-center gap-1">
                          <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                          <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                          <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Symptom Checker Form & Report Summary output
                  <div className="space-y-6">
                    <form onSubmit={handleCheckSymptoms} className="space-y-3">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Describe Symptoms (e.g. fever, headache)
                      </label>
                      <textarea
                        rows="3"
                        placeholder="Type symptoms you are experiencing..."
                        value={symptomInput}
                        onChange={(e) => setSymptomInput(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                        required
                      ></textarea>
                      <button
                        type="submit"
                        disabled={chatLoading}
                        className="w-full py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-semibold transition"
                      >
                        {chatLoading ? 'Analyzing Symptoms...' : 'Analyze Symptoms'}
                      </button>
                    </form>

                    {symptomResult && (
                      <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-5 text-xs">
                        <div className="bg-teal-500/5 p-4 rounded-xl border border-teal-500/10 space-y-3">
                          <h4 className="font-bold text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
                            <HeartPulse className="h-4 w-4" />
                            Diagnosis Assessment
                          </h4>
                          <div>
                            <span className="text-[10px] text-slate-400">Potential Conditions:</span>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {symptomResult.assessment.conditions.map((c) => (
                                <span key={c} className="px-2 py-0.5 rounded bg-brand-100 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400 text-[10px] font-semibold">
                                  {c}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div>
                              <span className="text-slate-400">Severity:</span>
                              <span className={`block font-bold mt-0.5 ${
                                symptomResult.assessment.severity === 'High' ? 'text-red-500' :
                                symptomResult.assessment.severity === 'Medium' ? 'text-amber-500' : 'text-teal-600'
                              }`}>
                                {symptomResult.assessment.severity}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400">Clinic Speciality:</span>
                              <span className="block font-bold text-slate-700 dark:text-slate-350 mt-0.5">
                                {symptomResult.assessment.specialization}
                              </span>
                            </div>
                          </div>
                          <div className="text-[11px] text-slate-500 italic mt-2 border-t border-slate-200/20 pt-2">
                            "{symptomResult.assessment.advice}"
                          </div>
                        </div>

                        {/* Matching Doctor Seeding suggestions */}
                        {symptomResult.recommendedDoctors.length > 0 && (
                          <div className="space-y-2.5">
                            <h4 className="font-bold text-slate-700 dark:text-slate-300">Recommended Doctors</h4>
                            <div className="space-y-2">
                              {symptomResult.recommendedDoctors.map((doc) => (
                                <div key={doc._id} className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-lg bg-brand-50 flex items-center justify-center font-bold text-brand-600">
                                      {doc.userId?.name?.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-bold text-slate-800 dark:text-white truncate text-xs">Dr. {doc.userId?.name}</p>
                                      <p className="text-[9px] text-slate-400 mt-0.5">Fee: ₹{doc.consultationFee}</p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setChatbotOpen(false);
                                      openBookModal(doc);
                                    }}
                                    className="px-2.5 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-[10px] font-bold"
                                  >
                                    Book Now
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Chat Input drawer Footer */}
              {chatMode === 'chat' && (
                <form onSubmit={handleSendChat} className="p-4 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                  <input
                    type="text"
                    placeholder="Type medical questions..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <button
                    type="submit"
                    className="p-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl transition flex items-center justify-center shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              )}

            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PatientDashboard;
