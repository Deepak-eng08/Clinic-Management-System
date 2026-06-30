import React, { useEffect, useState } from 'react';
import API from '../services/api.js';
import { Settings, CheckCircle, Save, Plus, Trash2 } from 'lucide-react';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    hospitalName: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    enableChatbot: true,
    enableSms: false,
    allowedSpecializations: [],
  });
  const [newSpec, setNewSpec] = useState('');
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await API.get('/admin/settings');
        if (response.data.settings) {
          setSettings(response.data.settings);
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load system settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAddSpecialization = (e) => {
    e.preventDefault();
    if (!newSpec.trim()) return;
    if (settings.allowedSpecializations.includes(newSpec.trim())) {
      alert('Specialization already exists');
      return;
    }
    setSettings((prev) => ({
      ...prev,
      allowedSpecializations: [...prev.allowedSpecializations, newSpec.trim()],
    }));
    setNewSpec('');
  };

  const handleRemoveSpecialization = (specToRemove) => {
    setSettings((prev) => ({
      ...prev,
      allowedSpecializations: prev.allowedSpecializations.filter((s) => s !== specToRemove),
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setSuccessMsg(null);
    setError(null);
    try {
      const response = await API.put('/admin/settings', settings);
      setSettings(response.data.settings);
      setSuccessMsg('System configurations updated successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaveLoading(false);
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
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">System Settings</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure clinical metadata, system modules, and taxonomies.</p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-4 bg-teal-50 text-teal-600 dark:bg-teal-950/20 dark:text-teal-400 rounded-xl border border-teal-200/10 text-xs">
          <CheckCircle className="h-4 w-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 rounded-xl border border-red-200/10 text-xs">
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Left Hand: Config form */}
        <form onSubmit={handleSave} className="lg:col-span-7 glass-card p-6 rounded-2xl shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <Settings className="h-4 w-4 text-brand-500" />
            Clinic Properties
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Hospital Name</label>
              <input
                type="text"
                name="hospitalName"
                value={settings.hospitalName}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Contact Email</label>
                <input
                  type="email"
                  name="contactEmail"
                  value={settings.contactEmail}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Contact Phone</label>
                <input
                  type="text"
                  name="contactPhone"
                  value={settings.contactPhone}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Address</label>
              <textarea
                name="address"
                value={settings.address}
                onChange={handleInputChange}
                rows="2"
                className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                required
              ></textarea>
            </div>
          </div>

          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-t border-slate-100 dark:border-slate-805/50 pt-5 pb-2">
            Module Toggles
          </h3>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="enableChatbot"
                checked={settings.enableChatbot}
                onChange={handleInputChange}
                className="h-4.5 w-4.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 focus:outline-none"
              />
              <div className="text-xs">
                <p className="font-semibold text-slate-700 dark:text-slate-300">Enable AI Medical Chatbot</p>
                <p className="text-[10px] text-slate-400">Allows patients to interact with the symptom checker and diagnosis chatbot.</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="enableSms"
                checked={settings.enableSms}
                onChange={handleInputChange}
                className="h-4.5 w-4.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 focus:outline-none"
              />
              <div className="text-xs">
                <p className="font-semibold text-slate-700 dark:text-slate-300">Enable SMS and Email Alerts</p>
                <p className="text-[10px] text-slate-400">Sends confirmation alerts when patients schedule or complete appointments.</p>
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={saveLoading}
            className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white text-xs font-semibold rounded-xl transition flex justify-center items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saveLoading ? 'Saving...' : 'Save Configurations'}
          </button>
        </form>

        {/* Right Hand: Taxonomy allowed specializations */}
        <div className="lg:col-span-5 glass-card p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800/80 pb-4">
            Manage Specializations
          </h3>

          <form onSubmit={handleAddSpecialization} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Oncology"
              value={newSpec}
              onChange={(e) => setNewSpec(e.target.value)}
              className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
            <button
              type="submit"
              className="p-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl transition flex items-center justify-center"
            >
              <Plus className="h-4.5 w-4.5" />
            </button>
          </form>

          <div className="flex flex-wrap gap-2 pt-2">
            {settings.allowedSpecializations.map((spec) => (
              <span
                key={spec}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 border border-teal-200/10 dark:bg-teal-950/40 dark:text-teal-400 text-xs font-medium"
              >
                {spec}
                <button
                  type="button"
                  onClick={() => handleRemoveSpecialization(spec)}
                  className="text-teal-500 hover:text-teal-700 dark:hover:text-teal-300 font-semibold"
                >
                  ×
                </button>
              </span>
            ))}
            {settings.allowedSpecializations.length === 0 && (
              <p className="text-xs text-slate-400 italic">No specializations configured.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminSettings;
