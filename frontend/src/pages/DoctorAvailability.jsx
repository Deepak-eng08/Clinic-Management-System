import React, { useEffect, useState } from 'react';
import API from '../services/api.js';
import { CalendarRange, CheckCircle2, Save } from 'lucide-react';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
  '12:00', '14:00', '14:30', '15:00', '15:30', '16:00', 
  '16:30', '17:00'
];

const DoctorAvailability = () => {
  // Local state representing availability map: { Monday: [...slots], Tuesday: [...] }
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await API.get('/auth/me');
        const doctorProfile = response.data.profile;
        
        // Convert availability array to schedule map
        const scheduleMap = {};
        DAYS_OF_WEEK.forEach(d => {
          scheduleMap[d] = [];
        });

        if (doctorProfile && doctorProfile.availability) {
          doctorProfile.availability.forEach(item => {
            scheduleMap[item.day] = item.slots;
          });
        }
        setSchedule(scheduleMap);
      } catch (err) {
        setError('Failed to fetch availability schedule');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleToggleSlot = (day, slot) => {
    setSchedule(prev => {
      const daySlots = prev[day] || [];
      const updatedSlots = daySlots.includes(slot)
        ? daySlots.filter(s => s !== slot)
        : [...daySlots, slot].sort();
      return { ...prev, [day]: updatedSlots };
    });
  };

  const handleToggleWholeDay = (day) => {
    setSchedule(prev => {
      const allSelected = prev[day]?.length === TIME_SLOTS.length;
      return {
        ...prev,
        [day]: allSelected ? [] : [...TIME_SLOTS]
      };
    });
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setSuccessMsg(null);
    setError(null);

    // Format schedule map back to schema array
    const formattedAvailability = Object.keys(schedule)
      .map(day => ({
        day,
        slots: schedule[day]
      }))
      .filter(item => item.slots.length > 0); // Only save days that have slots

    try {
      await API.put('/doctors/availability', { availability: formattedAvailability });
      setSuccessMsg('Weekly availability updated successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save schedule');
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
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Availability Settings</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure your weekly operating days and timeslots. Patients will book according to these timings.</p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-4 bg-teal-50 text-teal-600 dark:bg-teal-950/20 dark:text-teal-400 rounded-xl border border-teal-200/10 text-xs">
          <CheckCircle2 className="h-4 w-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 rounded-xl border border-red-200/10 text-xs">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSaveSchedule} className="glass-card p-6 rounded-2xl shadow-sm space-y-6">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <CalendarRange className="h-4.5 w-4.5 text-brand-500" />
          Operating Hours Checkboard
        </h3>

        <div className="space-y-6 divide-y divide-slate-100 dark:divide-slate-850">
          {DAYS_OF_WEEK.map((day) => {
            const selectedSlots = schedule[day] || [];
            const allSelected = selectedSlots.length === TIME_SLOTS.length;
            return (
              <div key={day} className="pt-5 first:pt-0 flex flex-col lg:flex-row lg:items-start gap-4">
                {/* Day title & control */}
                <div className="w-40 shrink-0">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350">{day}</h4>
                  <button
                    type="button"
                    onClick={() => handleToggleWholeDay(day)}
                    className="text-[10px] text-brand-500 hover:text-brand-600 font-semibold uppercase mt-1"
                  >
                    {allSelected ? 'Clear Day' : 'Select All'}
                  </button>
                </div>

                {/* Slots grid */}
                <div className="flex-1 flex flex-wrap gap-2">
                  {TIME_SLOTS.map((slot) => {
                    const isSelected = selectedSlots.includes(slot);
                    return (
                      <button
                        type="button"
                        key={slot}
                        onClick={() => handleToggleSlot(day, slot)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                          isSelected
                            ? 'bg-brand-500 border-brand-500 text-white shadow-sm shadow-brand-500/10'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80">
          <button
            type="submit"
            disabled={saveLoading}
            className="w-full sm:w-auto px-6 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white text-xs font-semibold rounded-xl transition flex justify-center items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saveLoading ? 'Saving hours...' : 'Save Weekly Schedule'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DoctorAvailability;
