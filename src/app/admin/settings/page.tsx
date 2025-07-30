"use client"

import { useEffect, useState } from "react";
import { useToast } from '@/context/ToastContext';

const days = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export default function AdminSettingsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    fetch("/api/admin/settings", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => r.json())
      .then((data) => {
        setSettings(data);
        setForm(data);
        setLoading(false);
      })
      .catch(() => {
        showToast("Failed to load settings", "error");
        setLoading(false);
      });
  }, [showToast]);

  const handleHourChange = (day: string, field: "open" | "close", value: string) => {
    setForm((f: any) => ({
      ...f,
      businessHours: {
        ...f.businessHours,
        [day]: { ...f.businessHours[day], [field]: value },
      },
    }));
  };

  const handleHolidayChange = (idx: number, value: string) => {
    setForm((f: any) => {
      const holidays = [...(f.holidays || [])];
      holidays[idx] = value;
      return { ...f, holidays };
    });
  };

  const addHoliday = () => {
    setForm((f: any) => ({ ...f, holidays: [...(f.holidays || []), ""] }));
  };

  const removeHoliday = (idx: number) => {
    setForm((f: any) => {
      const holidays = [...(f.holidays || [])];
      holidays.splice(idx, 1);
      return { ...f, holidays };
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((f: any) => ({ ...f, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('authToken')
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      const data = await res.json();
      setSettings(data);
      setForm(data);
      showToast("Settings saved!", "success");
    } catch (err) {
      showToast("Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Business Settings</h1>
      <div className="space-y-6">
        <div>
          <h2 className="font-semibold mb-2">Business Hours</h2>
          <div className="grid grid-cols-1 gap-2">
            {days.map((day) => (
              <div key={day} className="flex items-center gap-2">
                <span className="capitalize w-24">{day}</span>
                <input
                  type="time"
                  value={form.businessHours?.[day]?.open || ""}
                  onChange={(e) => handleHourChange(day, "open", e.target.value)}
                  className="border rounded px-2 py-1"
                />
                <span>-</span>
                <input
                  type="time"
                  value={form.businessHours?.[day]?.close || ""}
                  onChange={(e) => handleHourChange(day, "close", e.target.value)}
                  className="border rounded px-2 py-1"
                />
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="font-semibold mb-2">Holidays / Closed Dates</h2>
          <div className="space-y-2">
            {(form.holidays || []).map((date: string, idx: number) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => handleHolidayChange(idx, e.target.value)}
                  className="border rounded px-2 py-1"
                />
                <button
                  type="button"
                  onClick={() => removeHoliday(idx)}
                  className="text-red-500 hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addHoliday}
              className="text-secondary-500 hover:underline"
            >
              + Add Holiday
            </button>
          </div>
        </div>
        <div className="flex gap-4">
          <div>
            <label className="block font-semibold mb-1">Break Time (minutes)</label>
            <input
              type="number"
              name="breakMinutes"
              value={form.breakMinutes || 0}
              onChange={handleChange}
              className="border rounded px-2 py-1 w-24"
              min={0}
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Max Bookings Per Day</label>
            <input
              type="number"
              name="maxBookingsPerDay"
              value={form.maxBookingsPerDay || 0}
              onChange={handleChange}
              className="border rounded px-2 py-1 w-24"
              min={1}
            />
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-secondary-500 hover:bg-secondary-600 text-white px-6 py-2 rounded-full font-medium disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setForm(settings)}
            disabled={saving}
            className="border px-6 py-2 rounded-full font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
} 