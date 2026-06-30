import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCurrentUser } from './features/authSlice.js';

// Context Providers
import { ThemeProvider } from './context/ThemeContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';

// Component Guards & Layouts
import ProtectedRoute from './components/ProtectedRoute.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';

// Auth Pages
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminDoctors from './pages/AdminDoctors.jsx';
import AdminPatients from './pages/AdminPatients.jsx';
import AdminSettings from './pages/AdminSettings.jsx';
import AdminLogs from './pages/AdminLogs.jsx';

// Doctor Pages
import DoctorDashboard from './pages/DoctorDashboard.jsx';
import DoctorAvailability from './pages/DoctorAvailability.jsx';
import DoctorPatients from './pages/DoctorPatients.jsx';

// Patient Pages
import PatientDashboard from './pages/PatientDashboard.jsx';
import PatientAppointments from './pages/PatientAppointments.jsx';
import PatientPrescriptions from './pages/PatientPrescriptions.jsx';
import PatientRecords from './pages/PatientRecords.jsx';

const App = () => {
  const dispatch = useDispatch();
  const { loading, isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading Clinical Application...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Admin Dashboard Protected Routes */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <DashboardLayout>
                    <Routes>
                      <Route path="/" element={<AdminDashboard />} />
                      <Route path="/doctors" element={<AdminDoctors />} />
                      <Route path="/patients" element={<AdminPatients />} />
                      <Route path="/settings" element={<AdminSettings />} />
                      <Route path="/logs" element={<AdminLogs />} />
                      <Route path="*" element={<Navigate to="/admin" replace />} />
                    </Routes>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Doctor Dashboard Protected Routes */}
            <Route
              path="/doctor/*"
              element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <DashboardLayout>
                    <Routes>
                      <Route path="/" element={<DoctorDashboard />} />
                      <Route path="/availability" element={<DoctorAvailability />} />
                      <Route path="/patients" element={<DoctorPatients />} />
                      <Route path="*" element={<Navigate to="/doctor" replace />} />
                    </Routes>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Patient Dashboard Protected Routes */}
            <Route
              path="/patient/*"
              element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <DashboardLayout>
                    <Routes>
                      <Route path="/" element={<PatientDashboard />} />
                      <Route path="/appointments" element={<PatientAppointments />} />
                      <Route path="/prescriptions" element={<PatientPrescriptions />} />
                      <Route path="/records" element={<PatientRecords />} />
                      <Route path="*" element={<Navigate to="/patient" replace />} />
                    </Routes>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Route Catch All - Redirect to appropriate dashboard based on authentication & role */}
            <Route
              path="*"
              element={
                isAuthenticated && user ? (
                  user.role === 'admin' ? (
                    <Navigate to="/admin" replace />
                  ) : user.role === 'doctor' ? (
                    <Navigate to="/doctor" replace />
                  ) : (
                    <Navigate to="/patient" replace />
                  )
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </ThemeProvider>
  );
};

export default App;
