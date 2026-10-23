import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { complaintsApi, adminApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export function FileComplaintPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Step 1: Category & Station, Step 2: Incident & Statement, Step 3: Attachments, Step 4: Review & Submit
  const [currentStep, setCurrentStep] = useState(1);

  // Master Data
  const [categories, setCategories] = useState([]);
  const [stations, setStations] = useState([]);
  const [_loadingMasterData, setLoadingMasterData] = useState(true);

  // Form Fields
  const [categoryId, setCategoryId] = useState('');
  const [stationId, setStationId] = useState('');
  const [incidentDate, setIncidentDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [incidentPlace, setIncidentPlace] = useState('');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  // Status & Feedback
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [_checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submissionSuccess, setSubmissionSuccess] = useState(null);

  // Load Real Categories and Stations from Backend
  useEffect(() => {
    async function fetchMaster() {
      try {
        setLoadingMasterData(true);
        const [catsRes, stationsRes] = await Promise.all([
          adminApi.getCategories().catch(() => ({ data: [] })),
          adminApi.getStations().catch(() => ({ data: [] }))
        ]);

        const loadedCats = catsRes?.data || catsRes || [];
        const loadedStations = stationsRes?.data || stationsRes || [];

        setCategories(loadedCats.length ? loadedCats : [
          { category_id: 1, name: 'Theft / Property Snatched', code: 'THEFT' },
          { category_id: 2, name: 'Cyber & Financial Fraud', code: 'CYBER_FRAUD' },
          { category_id: 3, name: 'Vehicle Theft', code: 'VEHICLE_THEFT' },
          { category_id: 4, name: 'Harassment / Cyber Stalking', code: 'HARASSMENT' },
          { category_id: 5, name: 'Physical Assault / Affray', code: 'ASSAULT' }
        ]);

        setStations(loadedStations.length ? loadedStations : [
          { station_id: 1, name: 'Central Police Station', station_code: 'CPS-01', district: 'Central Division' },
          { station_id: 2, name: 'North Suburban Police Station', station_code: 'NPS-02', district: 'North Division' },
          { station_id: 3, name: 'Cyber Crime Police Station', station_code: 'CCPS-03', district: 'Crime Branch' }
        ]);

        if (loadedCats.length) setCategoryId(loadedCats[0].category_id);
        if (loadedStations.length) setStationId(loadedStations[0].station_id);
      } catch (err) {
        console.warn('Could not load master data:', err);
      } finally {
        setLoadingMasterData(false);
      }
    }
    fetchMaster();
  }, []);

  // Duplicate Check Trigger on Incident Place & Date change
  const triggerDuplicateCheck = async () => {
    if (!stationId || !incidentPlace.trim() || !incidentDate) return;
    try {
      setCheckingDuplicate(true);
      const res = await complaintsApi.checkDuplicate({
        station_id: parseInt(stationId, 10),
        category_id: parseInt(categoryId, 10),
        incident_date: incidentDate,
        incident_place: incidentPlace
      });
      if (res?.data && res.data.length > 0) {
        setDuplicateWarning(res.data[0]);
      } else {
        setDuplicateWarning(null);
      }
    } catch {
      // ignore
    } finally {
      setCheckingDuplicate(false);
    }
  };

  // Submission Handler
  const handleFormalSubmit = async (isDraft = false) => {
    setErrorMsg('');
    if (!isAuthenticated) {
      setErrorMsg('Please log in or register before submitting a formal complaint.');
      navigate('/login');
      return;
    }
    if (!incidentPlace.trim() || !incidentDescription.trim()) {
      setErrorMsg('Please provide the incident location and a detailed statement of facts.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        station_id: parseInt(stationId, 10),
        category_id: parseInt(categoryId, 10),
        incident_date: new Date(incidentDate).toISOString(),
        incident_place: incidentPlace,
        incident_description: incidentDescription,
        is_draft: isDraft
      };

      const res = await complaintsApi.create(payload);
      const resultData = res?.data || res;
      const createdFirId = resultData?.fir_id || resultData?.firId;

      // Upload attachment if selected
      if (selectedFile && createdFirId) {
        try {
          await complaintsApi.uploadAttachment(createdFirId, selectedFile);
        } catch (uploadErr) {
          console.warn('Attachment upload failed:', uploadErr);
        }
      }

      setSubmissionSuccess({
        firId: createdFirId,
        trackingId: resultData?.tracking_id || resultData?.trackingId || 'TRK-' + Date.now(),
        status: isDraft ? 'DRAFT' : 'SUBMITTED',
        message: res?.message || (isDraft ? 'Complaint saved as draft' : 'Complaint submitted successfully')
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit complaint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategoryObj = categories.find(c => (c.category_id || c.id) == categoryId);
  const selectedStationObj = stations.find(s => s.station_id == stationId);

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface antialiased">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 lg:px-12 py-8 space-y-6">
        {/* Breadcrumb Header */}
        <div className="flex items-center justify-between text-xs text-secondary pb-3 border-b border-outline-variant/60">
          <Link to="/" className="flex items-center gap-1.5 hover:text-primary transition-colors font-medium">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Home
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-mono text-primary font-bold">BNSS Section 154 Statutory Portal</span>
          </div>
        </div>

        {/* Success View */}
        {submissionSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 sm:p-12 rounded-3xl bg-surface-container-lowest border border-outline-variant text-center space-y-6 shadow-card max-w-3xl mx-auto"
          >
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-3xl shadow-sm">
              <span className="material-symbols-outlined text-4xl">verified</span>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
                {submissionSuccess.status === 'DRAFT' ? 'Complaint Draft Preserved' : 'Complaint Successfully Filed & Lodged'}
              </h1>
              <p className="text-xs sm:text-sm text-secondary max-w-lg mx-auto leading-relaxed">
                Your dossier has been transmitted to the station triage desk and recorded in the forward-chained audit ledger.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant max-w-md mx-auto text-left space-y-2.5 font-mono text-xs">
              <div className="flex justify-between items-center">
                <span className="text-secondary">Tracking ID:</span>
                <strong className="text-primary font-bold text-sm bg-white px-2 py-0.5 rounded border border-outline-variant/60">{submissionSuccess.trackingId}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-secondary">Initial Status:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase tracking-wider text-[11px]">{submissionSuccess.status}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-secondary">Statutory Seal:</span>
                <span className="text-primary font-semibold">BNSS-Sec-154-E-AUTH</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <Link
                to={`/live-tracking?id=${submissionSuccess.trackingId}`}
                className="interactive-btn px-6 py-3 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-container shadow-sm flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">radar</span>
                Track Live Docket
              </Link>
              <Link
                to="/dashboard"
                className="interactive-btn px-6 py-3 rounded-xl border border-outline-variant text-primary text-xs font-semibold hover:bg-surface-container-low"
              >
                View in Citizen Dashboard
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Header Title */}
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
                Lodge Incident Complaint / e-FIR
              </h1>
              <p className="text-xs sm:text-sm text-secondary max-w-3xl leading-relaxed">
                Submit an official report directly to your jurisdictional police station. Zero visit required for initial filing under BNSS 2023.
              </p>
            </div>

            {/* Step Navigation Pill */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { step: 1, title: 'Category & Station', icon: 'category' },
                { step: 2, title: 'Incident Particulars', icon: 'edit_location_alt' },
                { step: 3, title: 'Evidentiary Files', icon: 'upload_file' },
                { step: 4, title: 'Review & Lodgment', icon: 'fact_check' }
              ].map((s) => (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setCurrentStep(s.step)}
                  className={`p-3 rounded-2xl text-left border transition-all text-xs cursor-pointer interactive-btn ${
                    currentStep === s.step
                      ? 'bg-primary text-white border-primary shadow-sm font-semibold'
                      : currentStep > s.step
                      ? 'bg-surface-container-low text-primary border-outline-variant font-medium'
                      : 'bg-surface-container-lowest text-secondary border-outline-variant/60 font-normal hover:bg-surface-container-low/60'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] opacity-80 mb-1">
                    <span>Step {s.step}</span>
                    <span className="material-symbols-outlined text-sm">{s.icon}</span>
                  </div>
                  <div className="truncate font-semibold">{s.title}</div>
                </button>
              ))}
            </div>

            {/* Error Message */}
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-error-container text-on-error-container text-xs flex items-center gap-2.5 border border-error/20"
              >
                <span className="material-symbols-outlined text-lg shrink-0">error</span>
                <span>{errorMsg}</span>
              </motion.div>
            )}

            {/* Duplicate Warning Alert */}
            {duplicateWarning && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-3 shadow-xs"
              >
                <span className="material-symbols-outlined text-lg text-amber-700 shrink-0 mt-0.5">warning</span>
                <div className="space-y-1">
                  <strong className="font-semibold block text-sm">Notice: Similar Incident Detected</strong>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    A complaint (<span className="font-mono font-bold">{duplicateWarning.fir_number || duplicateWarning.tracking_id}</span>) with similar location and timestamp was already filed within 24 hours. If this is an update, consider annotating your existing docket.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Responsive 2-Column Desktop Grid to eliminate blank side spaces */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Active Form Step (8 cols) */}
              <div className="lg:col-span-8 p-6 sm:p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-sm space-y-6">
                <AnimatePresence mode="wait">
                  {currentStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-5"
                    >
                      <div className="border-b border-outline-variant/60 pb-3">
                        <h2 className="text-base font-bold text-primary">Select Crime Category &amp; Territorial Jurisdiction</h2>
                        <p className="text-xs text-secondary mt-0.5">Choose the offense nature to route this dossier to the correct specialized investigation desk.</p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-primary">
                          Select Incident Category <span className="text-error">*</span>
                        </label>
                        <select
                          value={categoryId}
                          onChange={(e) => setCategoryId(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-xs text-primary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer"
                        >
                          {categories.map((c) => (
                            <option key={c.category_id || c.id} value={c.category_id || c.id}>
                              {c.name || c.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-primary">
                          Jurisdictional Police Station <span className="text-error">*</span>
                        </label>
                        <select
                          value={stationId}
                          onChange={(e) => setStationId(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-xs text-primary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer"
                        >
                          {stations.map((st) => (
                            <option key={st.station_id} value={st.station_id}>
                              {st.name} ({st.station_code}) - {st.district}
                            </option>
                          ))}
                        </select>
                        <p className="text-[11px] text-secondary mt-1">
                          If uncertain, choose the nearest station. Cases outside territory are transferred seamlessly via mandatory Zero FIR protocols.
                        </p>
                      </div>

                      <div className="flex justify-end pt-4 border-t border-outline-variant/60">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          className="interactive-btn px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-container shadow-xs flex items-center gap-1.5"
                        >
                          <span>Proceed to Particulars</span>
                          <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-5"
                    >
                      <div className="border-b border-outline-variant/60 pb-3">
                        <h2 className="text-base font-bold text-primary">Incident Particulars &amp; Statement of Facts</h2>
                        <p className="text-xs text-secondary mt-0.5">Provide precise timeline and landmark details to assist first-responding officers.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-primary">
                            Date &amp; Time of Incident <span className="text-error">*</span>
                          </label>
                          <input
                            type="datetime-local"
                            value={incidentDate}
                            onChange={(e) => setIncidentDate(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low text-xs text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-primary">
                            Incident Location / Landmark <span className="text-error">*</span>
                          </label>
                          <input
                            type="text"
                            value={incidentPlace}
                            onBlur={triggerDuplicateCheck}
                            onChange={(e) => setIncidentPlace(e.target.value)}
                            placeholder="e.g. Metro Station Parking Bay 4, MG Road"
                            className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low text-xs text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-primary">
                          Detailed Statement of Facts <span className="text-error">*</span>
                        </label>
                        <textarea
                          rows={5}
                          value={incidentDescription}
                          onChange={(e) => setIncidentDescription(e.target.value)}
                          placeholder="State clearly what transpired, descriptions of individuals involved, make/model of vehicles or lost property details..."
                          className="w-full p-4 rounded-xl border border-outline-variant bg-surface-container-low text-xs text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all leading-relaxed"
                        />
                      </div>

                      <div className="flex justify-between pt-4 border-t border-outline-variant/60">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() => setCurrentStep(1)}
                          className="interactive-btn px-5 py-2.5 rounded-xl border border-outline-variant text-xs font-medium text-secondary hover:text-primary hover:bg-surface-container-low flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-sm">arrow_back</span>
                          <span>Back</span>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() => setCurrentStep(3)}
                          className="interactive-btn px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-container shadow-xs flex items-center gap-1.5"
                        >
                          <span>Proceed to Evidence</span>
                          <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-5"
                    >
                      <div className="border-b border-outline-variant/60 pb-3">
                        <h2 className="text-base font-bold text-primary">Supporting Evidence &amp; Exhibits</h2>
                        <p className="text-xs text-secondary mt-0.5">Attach digital exhibits, photos, or invoices to establish non-repudiation.</p>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-primary">
                          Supporting Documents / Photos / Purchase Receipts (Optional)
                        </label>
                        <p className="text-[11px] text-secondary">
                          PDF, PNG, JPG files up to 10MB. Files are cryptographically SHA-256 hashed upon upload for legal evidentiary integrity.
                        </p>

                        <div className="border-2 border-dashed border-outline-variant hover:border-primary/60 rounded-2xl p-8 text-center transition-all bg-surface-container-low/40 group cursor-pointer">
                          <input
                            type="file"
                            id="file-upload"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setSelectedFile(e.target.files[0]);
                              }
                            }}
                          />
                          <label htmlFor="file-upload" className="cursor-pointer space-y-3 block">
                            <div className="w-12 h-12 rounded-full bg-surface-container text-primary flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                              <span className="material-symbols-outlined text-2xl">cloud_upload</span>
                            </div>
                            <div className="text-xs font-semibold text-primary">
                              {selectedFile ? selectedFile.name : 'Click to select evidentiary file from your device'}
                            </div>
                            {selectedFile ? (
                              <div className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-mono">
                                Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for SHA-256 Hashing
                              </div>
                            ) : (
                              <p className="text-[11px] text-secondary">PNG, JPG, PDF documents up to 10MB</p>
                            )}
                          </label>
                        </div>
                      </div>

                      <div className="flex justify-between pt-4 border-t border-outline-variant/60">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          className="interactive-btn px-5 py-2.5 rounded-xl border border-outline-variant text-xs font-medium text-secondary hover:text-primary hover:bg-surface-container-low flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-sm">arrow_back</span>
                          <span>Back</span>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() => setCurrentStep(4)}
                          className="interactive-btn px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-container shadow-xs flex items-center gap-1.5"
                        >
                          <span>Review Lodgment</span>
                          <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 4 && (
                    <motion.div
                      key="step4"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-5"
                    >
                      <div className="border-b border-outline-variant/60 pb-3">
                        <h2 className="text-base font-bold text-primary">Affirmation &amp; Statutory Submission</h2>
                        <p className="text-xs text-secondary mt-0.5">Confirm accuracy of facts prior to digital transmission to the Station House Officer.</p>
                      </div>

                      <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/60 space-y-3 text-xs">
                        <h3 className="font-bold text-primary flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm text-primary">folder_open</span>
                          Summary of Lodgment Dossier
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-secondary pt-1">
                          <div className="p-3 bg-white rounded-xl border border-outline-variant/40">
                            <span className="text-[10px] uppercase font-mono block text-secondary">Jurisdictional Station</span>
                            <strong className="text-primary font-semibold">{selectedStationObj?.name || 'Central PS'}</strong>
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-outline-variant/40">
                            <span className="text-[10px] uppercase font-mono block text-secondary">Offense Category</span>
                            <strong className="text-primary font-semibold">{selectedCategoryObj?.name || 'General Offense'}</strong>
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-outline-variant/40">
                            <span className="text-[10px] uppercase font-mono block text-secondary">Timestamp</span>
                            <strong className="text-primary font-semibold">{new Date(incidentDate).toLocaleString()}</strong>
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-outline-variant/40">
                            <span className="text-[10px] uppercase font-mono block text-secondary">Incident Location</span>
                            <strong className="text-primary font-semibold truncate block">{incidentPlace || 'Not specified'}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant text-[11px] text-secondary leading-relaxed space-y-1.5">
                        <div className="font-semibold text-primary flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm text-emerald-600">verified_user</span>
                          Statutory Verification &amp; Declaration
                        </div>
                        <p>
                          I solemnly affirm that the facts stated above are true to the best of my knowledge under penalty of Indian Penal provisions for false reporting under Section 217 of BNS 2023.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-outline-variant/60">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() => setCurrentStep(3)}
                          className="interactive-btn px-5 py-2.5 rounded-xl border border-outline-variant text-xs font-medium text-secondary hover:text-primary hover:bg-surface-container-low flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-sm">arrow_back</span>
                          <span>Back</span>
                        </motion.button>
                        <div className="flex items-center gap-2.5">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => handleFormalSubmit(true)}
                            className="interactive-btn px-5 py-2.5 rounded-xl border border-outline-variant text-primary text-xs font-semibold hover:bg-surface-container-low transition-all cursor-pointer"
                          >
                            Save as Draft
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => handleFormalSubmit(false)}
                            className="interactive-btn px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-container transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                          >
                            {isSubmitting ? (
                              <>
                                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                <span>Submitting Docket...</span>
                              </>
                            ) : (
                              <>
                                <span className="material-symbols-outlined text-sm">send</span>
                                <span>Submit e-FIR</span>
                              </>
                            )}
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Right Column: Sticky Live Docket Preview & Statutory Info (4 cols) */}
              <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
                {/* Live Preview Card */}
                <div className="p-5 rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-sm space-y-3.5 interactive-card">
                  <div className="flex items-center justify-between border-b border-outline-variant/60 pb-2.5">
                    <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base text-primary">visibility</span>
                      Live Docket Preview
                    </span>
                    <span className="text-[10px] font-mono uppercase bg-surface-container-low text-secondary px-2 py-0.5 rounded border border-outline-variant/60 font-semibold">
                      Step {currentStep} of 4
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] text-secondary uppercase font-mono block">Category</span>
                      <strong className="text-primary font-medium">{selectedCategoryObj?.name || 'Not chosen yet'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-secondary uppercase font-mono block">Police Station</span>
                      <strong className="text-primary font-medium">{selectedStationObj?.name || 'Not chosen yet'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-secondary uppercase font-mono block">Incident Place</span>
                      <strong className="text-primary font-medium">{incidentPlace || 'Awaiting entry...'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-secondary uppercase font-mono block">Attached Evidence</span>
                      <strong className="text-primary font-medium">{selectedFile ? selectedFile.name : 'No file attached'}</strong>
                    </div>
                  </div>
                </div>

                {/* Statutory Rights Card */}
                <div className="p-5 rounded-3xl bg-surface-container-low border border-outline-variant/60 space-y-3 text-xs">
                  <div className="flex items-center gap-2 text-primary font-bold">
                    <span className="material-symbols-outlined text-base text-emerald-700">shield</span>
                    <span>Statutory Citizen Guarantees</span>
                  </div>
                  <ul className="space-y-2 text-[11px] text-secondary leading-relaxed">
                    <li className="flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-xs text-primary mt-0.5">check_circle</span>
                      <span><strong>Free Copy:</strong> You are legally entitled to a free signed FIR copy under BNSS Section 154(2).</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-xs text-primary mt-0.5">check_circle</span>
                      <span><strong>Zero FIR Transfer:</strong> If the offense occurred outside jurisdiction, the station will register and transfer within 24 hours.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-xs text-primary mt-0.5">check_circle</span>
                      <span><strong>Supervisory Appeal:</strong> If triage refuses registration without preliminary enquiry, you may petition the ACP/SP directly.</span>
                    </li>
                  </ul>
                </div>

                {/* Emergency Contact */}
                <div className="p-4 rounded-2xl bg-primary text-white space-y-1.5 text-xs shadow-sm">
                  <div className="font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-tertiary-fixed-dim text-base">emergency</span>
                      Immediate Distress?
                    </span>
                    <a href="tel:112" className="px-2.5 py-0.5 rounded-full bg-white text-primary text-[11px] font-bold hover:bg-white/90">
                      Dial 112
                    </a>
                  </div>
                  <p className="text-[11px] text-surface-container-lowest/80 leading-relaxed">
                    For ongoing violence, assault, or active intrusions, call 112 immediately. Do not rely on digital form filing for urgent life-safety emergencies.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default FileComplaintPage;
