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
      setErrorMsg('Please provide the incident location and a brief description.');
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

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface antialiased">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-6 py-8 w-full space-y-6">
        {/* Breadcrumb Header */}
        <div className="flex items-center justify-between text-xs text-secondary pb-2 border-b border-outline-variant/60">
          <Link to="/" className="flex items-center gap-1 hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Home
          </Link>
          <span className="font-mono text-primary font-bold">BNSS Section 154 Statutory Portal</span>
        </div>

        {/* Success View */}
        {submissionSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 rounded-2xl bg-surface-container-lowest border border-outline-variant text-center space-y-6 shadow-sm"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-2xl">
              <span className="material-symbols-outlined text-3xl">verified</span>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-primary">
                {submissionSuccess.status === 'DRAFT' ? 'Complaint Draft Preserved' : 'Complaint Successfully Filed'}
              </h1>
              <p className="text-xs sm:text-sm text-secondary max-w-lg mx-auto">
                Your docket has been transmitted to the station triage desk and recorded in the forward-chained audit ledger.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant max-w-md mx-auto text-left space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-secondary">Tracking ID:</span>
                <strong className="text-primary font-bold">{submissionSuccess.trackingId}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Initial Status:</span>
                <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-800 font-bold">{submissionSuccess.status}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <Link
                to={`/live-tracking`}
                className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-container transition-all shadow-xs"
              >
                Track Live Docket
              </Link>
              <Link
                to="/dashboard"
                className="px-5 py-2.5 rounded-xl border border-outline-variant text-primary text-xs font-semibold hover:bg-surface-container-low transition-all"
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
              <p className="text-xs sm:text-sm text-secondary">
                Submit an official report directly to your jurisdictional police station. No in-person visit required for initial filing.
              </p>
            </div>

            {/* Step Navigation Pill */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { step: 1, title: 'Category & Station' },
                { step: 2, title: 'Incident Particulars' },
                { step: 3, title: 'Evidentiary Files' },
                { step: 4, title: 'Review & Lodgment' }
              ].map((s) => (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setCurrentStep(s.step)}
                  className={`p-2.5 rounded-xl text-left border transition-all text-xs ${
                    currentStep === s.step
                      ? 'bg-primary text-white border-primary shadow-xs font-semibold'
                      : currentStep > s.step
                      ? 'bg-surface-container-low text-primary border-outline-variant font-medium'
                      : 'bg-surface-container-lowest text-secondary border-outline-variant/60 font-normal'
                  }`}
                >
                  <div className="text-[10px] opacity-75">Step {s.step}</div>
                  <div className="truncate">{s.title}</div>
                </button>
              ))}
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-error-container text-on-error-container text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Duplicate Warning Alert */}
            {duplicateWarning && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2.5">
                <span className="material-symbols-outlined text-base text-amber-700 shrink-0">warning</span>
                <div>
                  <strong className="font-semibold">Notice: Similar Incident Detected</strong>
                  <p className="text-[11px] mt-0.5 text-amber-800">
                    A complaint ({duplicateWarning.fir_number || duplicateWarning.tracking_id}) with similar incident location and timestamp was already filed within 24 hours. If this is an update, consider annotating your existing docket.
                  </p>
                </div>
              </div>
            )}

            {/* Form Steps */}
            <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant shadow-xs">
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-5"
                  >
                    <div>
                      <label className="block text-xs font-bold text-primary mb-1.5">
                        Select Incident Category *
                      </label>
                      <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low text-xs text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      >
                        {categories.map((c) => (
                          <option key={c.category_id || c.id} value={c.category_id || c.id}>
                            {c.name || c.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-primary mb-1.5">
                        Jurisdictional Police Station *
                      </label>
                      <select
                        value={stationId}
                        onChange={(e) => setStationId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low text-xs text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      >
                        {stations.map((st) => (
                          <option key={st.station_id} value={st.station_id}>
                            {st.name} ({st.station_code}) - {st.district}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-secondary mt-1">
                        If uncertain, select the nearest station. Cases outside jurisdiction are transferred seamlessly via Zero FIR protocols.
                      </p>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-container transition-all"
                      >
                        Proceed to Particulars →
                      </button>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-primary mb-1.5">
                          Date &amp; Time of Incident *
                        </label>
                        <input
                          type="datetime-local"
                          value={incidentDate}
                          onChange={(e) => setIncidentDate(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low text-xs text-primary outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-primary mb-1.5">
                          Incident Location / Landmark *
                        </label>
                        <input
                          type="text"
                          value={incidentPlace}
                          onBlur={triggerDuplicateCheck}
                          onChange={(e) => setIncidentPlace(e.target.value)}
                          placeholder="e.g. Metro Station Parking Bay 4, MG Road"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low text-xs text-primary outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-primary mb-1.5">
                        Detailed Statement of Facts *
                      </label>
                      <textarea
                        rows={4}
                        value={incidentDescription}
                        onChange={(e) => setIncidentDescription(e.target.value)}
                        placeholder="State clearly what transpired, descriptions of individuals involved, make/model of vehicles or lost property details..."
                        className="w-full p-3.5 rounded-xl border border-outline-variant bg-surface-container-low text-xs text-primary outline-none focus:border-primary leading-relaxed"
                      />
                    </div>

                    <div className="flex justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="px-4 py-2 rounded-xl border border-outline-variant text-xs text-secondary hover:text-primary"
                      >
                        ← Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-container"
                      >
                        Proceed to Evidence →
                      </button>
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
                    <div>
                      <label className="block text-xs font-bold text-primary mb-1">
                        Supporting Documents / Photos / Purchase Receipts (Optional)
                      </label>
                      <p className="text-[11px] text-secondary mb-3">
                        PDF, PNG, JPG files up to 10MB. Files are cryptographically SHA-256 hashed upon upload for legal evidentiary integrity.
                      </p>

                      <div className="border-2 border-dashed border-outline-variant/80 rounded-2xl p-6 text-center hover:border-primary/50 transition-colors bg-surface-container-low/50">
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
                        <label htmlFor="file-upload" className="cursor-pointer space-y-2 block">
                          <span className="material-symbols-outlined text-3xl text-secondary">
                            cloud_upload
                          </span>
                          <div className="text-xs font-semibold text-primary">
                            {selectedFile ? selectedFile.name : 'Click to select evidentiary file from device'}
                          </div>
                          {selectedFile && (
                            <div className="text-[10px] text-secondary">
                              Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                            </div>
                          )}
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="px-4 py-2 rounded-xl border border-outline-variant text-xs text-secondary hover:text-primary"
                      >
                        ← Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(4)}
                        className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-container"
                      >
                        Review Lodgment →
                      </button>
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
                    <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/60 space-y-2 text-xs">
                      <h3 className="font-bold text-primary border-b pb-1 border-outline-variant/60">
                        Summary of Complaint Dossier
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-secondary pt-1">
                        <div>Station: <strong className="text-primary">{stations.find(s => s.station_id == stationId)?.name || 'Central PS'}</strong></div>
                        <div>Date: <strong className="text-primary">{new Date(incidentDate).toLocaleString()}</strong></div>
                        <div className="sm:col-span-2">Location: <strong className="text-primary">{incidentPlace || 'Not specified'}</strong></div>
                        <div className="sm:col-span-2">Attachment: <strong className="text-primary">{selectedFile ? selectedFile.name : 'None'}</strong></div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant text-[11px] text-secondary leading-relaxed space-y-1">
                      <div className="font-semibold text-primary flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">verified_user</span>
                        Statutory Verification &amp; Declaration
                      </div>
                      <p>
                        I solemnly affirm that the facts stated above are true to the best of my knowledge under penalty of Indian Penal provisions for false reporting.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        className="px-4 py-2 rounded-xl border border-outline-variant text-xs text-secondary hover:text-primary"
                      >
                        ← Back
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => handleFormalSubmit(true)}
                          className="px-4 py-2.5 rounded-xl border border-outline-variant text-primary text-xs font-semibold hover:bg-surface-container-low transition-all"
                        >
                          Save as Draft
                        </button>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => handleFormalSubmit(false)}
                          className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-container transition-all shadow-sm flex items-center gap-1.5"
                        >
                          {isSubmitting ? (
                            <>
                              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                              <span>Submitting...</span>
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-sm">send</span>
                              <span>Submit e-FIR</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default FileComplaintPage;
