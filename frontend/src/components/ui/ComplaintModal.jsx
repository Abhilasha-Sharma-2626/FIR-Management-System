import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { complaintsApi } from '../../lib/api';

export function ComplaintModal({ isOpen, onClose, initialCategory = 'Theft / Property Loss' }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [statement, setStatement] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      onClose();
      navigate('/login');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      const payload = {
        station_id: 1, // Central Police Station default
        category_id: 1, // General Theft default
        incident_date: new Date().toISOString(),
        incident_place: location.trim() || 'Central Jurisdiction',
        incident_description: statement.trim(),
        is_draft: false
      };

      const res = await complaintsApi.create(payload);
      const data = res?.data || res;
      setResult({
        trackingId: data.tracking_id || data.trackingId || 'TRK-' + Date.now(),
        firId: data.fir_id
      });
    } catch (err) {
      setErrorMsg(err.message || 'Could not submit complaint. Try using the full filing portal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setStatement('');
    setLocation('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-surface-container-lowest w-full max-w-lg rounded-2xl border border-outline-variant shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-primary text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary-fixed-dim text-lg">edit_note</span>
            <h3 className="font-bold text-sm">Quick Complaint Lodgment</h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-white/80 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        {result ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto text-xl">
              <span className="material-symbols-outlined text-2xl">verified</span>
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-primary text-base">Complaint Lodged Successfully</h4>
              <p className="text-xs text-secondary">
                Your incident report has been securely registered in CaseSync.
              </p>
            </div>

            <div className="p-3 bg-surface-container-low rounded-xl font-mono font-bold text-primary text-sm border border-outline-variant">
              {result.trackingId}
            </div>

            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-outline-variant text-xs font-semibold rounded-xl text-secondary hover:text-primary"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  navigate(isAuthenticated ? `/dashboard/live-tracking?id=${encodeURIComponent(result.trackingId)}` : `/live-tracking?id=${encodeURIComponent(result.trackingId)}`);
                }}
                className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-container whitespace-nowrap cursor-pointer transition-colors"
              >
                Track Status
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-error-container text-on-error-container text-[11px]">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block font-bold text-primary mb-1">Incident Category</label>
              <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant text-secondary font-medium">
                {initialCategory}
              </div>
            </div>

            <div>
              <label className="block font-bold text-primary mb-1">Incident Location / Landmark *</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Near Metro Station Gate 2"
                className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-low text-primary outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block font-bold text-primary mb-1">Statement of Facts *</label>
              <textarea
                rows={3}
                required
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                placeholder="Briefly describe what happened..."
                className="w-full p-2.5 rounded-xl border border-outline-variant bg-surface-container-low text-primary outline-none focus:border-primary"
              />
            </div>

            {!isAuthenticated && (
              <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                Note: You will be prompted to sign in before submission to link this complaint to your citizen profile.
              </p>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-outline-variant/60">
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  navigate(isAuthenticated ? '/dashboard/file-fir' : '/file-complaint');
                }}
                className="text-primary hover:underline text-[11px] font-medium whitespace-nowrap cursor-pointer"
              >
                Open Full Guided e-FIR Form
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-3.5 py-2 border border-outline-variant rounded-xl text-secondary hover:text-primary font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-container"
                >
                  {isSubmitting ? 'Lodging...' : 'Lodge Report'}
                </button>
              </div>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}

export default ComplaintModal;
