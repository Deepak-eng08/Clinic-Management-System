import React, { useEffect, useState } from 'react';
import API from '../services/api.js';
import { Calendar, Clock, CreditCard, ShieldCheck, CheckCircle2, ArrowRight, AlertCircle, X } from 'lucide-react';

const PatientAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Payment Simulation states
  const [mockGatewayOpen, setMockGatewayOpen] = useState(false);
  const [activePaymentAppt, setActivePaymentAppt] = useState(null);
  const [orderInfo, setOrderInfo] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const fetchAppointments = async () => {
    try {
      const response = await API.get('/patients/appointments');
      setAppointments(response.data.appointments);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch appointments list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Razorpay Checkout loader helper
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleInitiatePayment = async (appt) => {
    try {
      setPaymentLoading(true);
      const res = await API.post('/payments/create-order', { appointmentId: appt._id });
      const order = res.data.order;
      setOrderInfo(order);
      setActivePaymentAppt(appt);

      if (res.data.mock) {
        // Mock Gateway Simulation Mode
        setMockGatewayOpen(true);
      } else {
        // Real Razorpay Payment checkout
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
          alert('Failed to load payment gateway checkout client.');
          return;
        }

        const options = {
          key: res.data.razorpayKey,
          amount: order.amount,
          currency: order.currency,
          name: 'Antigravity Clinic',
          description: `Consultation fee with Dr. ${appt.doctorId?.userId?.name}`,
          order_id: order.id,
          handler: async (response) => {
            try {
              await API.post('/payments/verify', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                appointmentId: appt._id,
              });
              alert('Payment capture successful!');
              fetchAppointments();
            } catch (err) {
              alert('Signature verification failed.');
            }
          },
          prefill: {
            name: appt.patientId?.name,
            email: appt.patientId?.email,
          },
          theme: {
            color: '#0d9488',
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Order creation failed.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleCompleteMockPayment = async (status = 'success') => {
    setPaymentLoading(true);
    try {
      if (status === 'success') {
        // Trigger verification with dummy values
        await API.post('/payments/verify', {
          razorpay_order_id: orderInfo.id,
          razorpay_payment_id: 'pay_mock_' + Math.random().toString(36).substr(2, 9),
          razorpay_signature: 'sig_mock_verified',
          appointmentId: activePaymentAppt._id,
          mockSuccess: true
        });
        setMockGatewayOpen(false);
        fetchAppointments();
      } else {
        // Simulate failure
        alert('Simulated payment cancel / failure.');
        setMockGatewayOpen(false);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Verification failed');
    } finally {
      setPaymentLoading(false);
    }
  };

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
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">My Consultations</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Check appointment records, status tracking, and process bills.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-650 rounded-xl border border-red-200/10 text-xs">
          <span>{error}</span>
        </div>
      )}

      {/* Bookings table */}
      <div className="glass-card rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/40 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
                <th className="px-6 py-4">Assigned Doctor</th>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Consultation Style</th>
                <th className="px-6 py-4">Appointment Status</th>
                <th className="px-6 py-4">Invoice Payment</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
              {appointments.map((appt) => (
                <tr key={appt._id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-850 dark:text-slate-200">
                      Dr. {appt.doctorId?.userId?.name || 'Deleted Specialist'}
                    </div>
                    <div className="text-[10px] text-brand-500 font-semibold mt-0.5">{appt.doctorId?.specialization}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-700 dark:text-slate-300">
                      {new Date(appt.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{appt.timeSlot}</div>
                  </td>
                  <td className="px-6 py-4 capitalize font-mono text-[10px] text-slate-600 dark:text-slate-400">
                    {appt.type}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      appt.status === 'confirmed' ? 'bg-blue-50 text-blue-600 dark:bg-blue-955/40 dark:text-blue-400' :
                      appt.status === 'completed' ? 'bg-teal-50 text-teal-600 dark:bg-teal-955/40 dark:text-teal-400' :
                      appt.status === 'cancelled' ? 'bg-red-50 text-red-600 dark:bg-red-955/20 dark:text-red-400' :
                      'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {appt.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold">
                    <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      appt.paymentStatus === 'paid' ? 'bg-teal-50 text-teal-600 dark:bg-teal-950/30 dark:text-teal-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'
                    }`}>
                      {appt.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {appt.paymentStatus === 'unpaid' && appt.status !== 'cancelled' ? (
                      <button
                        onClick={() => handleInitiatePayment(appt)}
                        disabled={paymentLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white rounded-lg text-[10px] font-bold shadow-md shadow-brand-500/10"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        Pay Fee (₹{appt.doctorId?.consultationFee})
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">No actions needed</span>
                    )}
                  </td>
                </tr>
              ))}
              {appointments.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400 text-xs">
                    You have no consultations scheduled. Go to "Find & Book" to schedule one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Simulated Razorpay Overlay Checkout Modal */}
      {mockGatewayOpen && activePaymentAppt && orderInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-brand-500" />
                <h3 className="font-bold text-slate-800 dark:text-white text-sm">Razorpay Sandbox Gateway</h3>
              </div>
              <button onClick={() => setMockGatewayOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-amber-50 dark:bg-amber-950/20 p-3.5 rounded-xl border border-amber-200/10 text-amber-700 dark:text-amber-400 flex gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <div>
                  <p className="font-semibold">Simulated Gateway Active</p>
                  <p className="text-[10px] mt-0.5">Real API keys not set. The system has switched to Sandbox Simulator.</p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl space-y-2 border border-slate-100/50">
                <div className="flex justify-between text-slate-500"><span>Merchant Name:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">Antigravity Clinic</span></div>
                <div className="flex justify-between text-slate-500"><span>Order ID:</span> <span className="font-mono text-[10px] text-slate-800 dark:text-slate-200">{orderInfo.id}</span></div>
                <div className="flex justify-between text-slate-500"><span>Amount:</span> <span className="font-bold text-brand-500">₹{(orderInfo.amount / 100).toFixed(2)}</span></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleCompleteMockPayment('fail')}
                className="py-2.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/30 rounded-xl transition"
              >
                Simulate Decline
              </button>
              <button
                type="button"
                onClick={() => handleCompleteMockPayment('success')}
                className="py-2.5 text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition flex justify-center items-center gap-1 shadow-lg shadow-brand-500/10"
              >
                <CheckCircle2 className="h-4 w-4" />
                Simulate Success
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientAppointments;
