import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function ComplaintModal({ isOpen, onClose, initialCategory = 'Theft / Property Loss (CrPC 379)' }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    district: 'Central Police District',
    category: initialCategory,
    statement: '',
    affirmed: false
  });
  const [tokenGenerated, setTokenGenerated] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const token = `#CR-2025-${Math.floor(1000 + Math.random() * 9000)}`;
    setTokenGenerated(token);
  };

  const handleClose = () => {
    setTokenGenerated(null);
    setFormData({
      fullName: '',
      mobile: '',
      district: 'Central Police District',
      category: initialCategory,
      statement: '',
      affirmed: false
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#14213D]/40 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest w-full max-w-xl rounded-lg border border-outline-variant shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-primary text-surface-container-lowest px-6 py-4 flex items-center justify-between border-b border-primary-container">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary-fixed-dim">edit_note</span>
            <h3 className="font-title-md font-bold">Lodge Incident Complaint — CaseSync</h3>
          </div>
          <button 
            type="button"
            onClick={handleClose}
            className="text-surface-variant hover:text-surface-container-lowest cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        {tokenGenerated ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl">verified</span>
            </div>
            <h4 className="font-headline-sm font-bold text-primary">Complaint Token Dispatched</h4>
            <div className="p-3 bg-surface-container rounded font-mono font-bold text-primary text-base">
              {tokenGenerated}
            </div>
            <p className="text-xs text-secondary leading-relaxed">
              Your formal complaint has been securely timestamped and registered in CaseSync. An official statutory SMS alert has been transmitted to your mobile number.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button 
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-outline-variant text-xs rounded hover:bg-surface-container cursor-pointer"
              >
                Close Window
              </button>
              <button 
                type="button"
                onClick={() => {
                  handleClose();
                  navigate('/login');
                }}
                className="px-5 py-2 bg-primary-container text-white text-xs font-semibold rounded hover:bg-primary cursor-pointer"
              >
                Sign In to Track Case
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-secondary mb-1">Complainant Full Name *</label>
              <input 
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="As per official government photo identity"
                className="w-full text-xs px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant rounded focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-secondary mb-1">Mobile Contact (for OTP) *</label>
                <input 
                  type="tel"
                  required
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full text-xs px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant rounded focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-secondary mb-1">Jurisdiction / District *</label>
                <select 
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant rounded focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  <option>Central Police District</option>
                  <option>South Police District</option>
                  <option>North-West Police District</option>
                  <option>Cyber Crime Command Cell</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-secondary mb-1">Incident Categorization *</label>
              <select 
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant rounded focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option>Theft / Property Loss (CrPC 379)</option>
                <option>Cyber Financial Fraud / Phishing</option>
                <option>Assault / Public Intimidation</option>
                <option>Harassment or Stalking</option>
                <option>Lost Mobile &amp; Items</option>
                <option>Women &amp; Child Safety / Harassment</option>
                <option>Document / Identity Misuse</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-secondary mb-1">Formal Statement of Facts *</label>
              <textarea 
                rows={3}
                required
                value={formData.statement}
                onChange={(e) => setFormData({ ...formData, statement: e.target.value })}
                placeholder="Clearly state date, time, location, suspect description, and sequence of events..."
                className="w-full text-xs px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant rounded focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex items-start gap-2 pt-1">
              <input 
                type="checkbox"
                id="modal-affirmation-check"
                required
                checked={formData.affirmed}
                onChange={(e) => setFormData({ ...formData, affirmed: e.target.checked })}
                className="mt-0.5 rounded-sm border-outline-variant text-primary focus:ring-primary cursor-pointer"
              />
              <label htmlFor="modal-affirmation-check" className="text-[11px] text-secondary leading-tight cursor-pointer">
                I solemnly affirm that the statement submitted is accurate to the best of my knowledge under penalty of Section 182 / 211 IPC (False Information to Public Servant).
              </label>
            </div>
            <div className="pt-3 border-t border-outline-variant flex items-center justify-end gap-3">
              <button 
                type="button" 
                onClick={handleClose}
                className="px-4 py-2 border border-outline-variant text-secondary text-xs rounded hover:bg-surface-container cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-5 py-2 bg-primary-container text-surface-container-lowest text-xs font-semibold rounded hover:bg-primary cursor-pointer"
              >
                Generate Complaint Token
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ComplaintModal;
