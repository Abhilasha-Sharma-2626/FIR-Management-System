import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import { complaintsApi, adminApi } from '../lib/api';

export function DashboardFileComplaintPage() {
  const navigate = useNavigate();

  // Wizard Step: 1 -> 2 -> 3 -> 4
  const [currentStep, setCurrentStep] = useState(1);

  // Master Data
  const [categories, setCategories] = useState([]);
  const [stations, setStations] = useState([]);
  const [loadingMaster, setLoadingMaster] = useState(true);

  // Form Fields
  const [categoryId, setCategoryId] = useState('');
  const [stationId, setStationId] = useState('');
  const [isZeroFir, setIsZeroFir] = useState(false);
  const [incidentDate, setIncidentDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [incidentPlace, setIncidentPlace] = useState('');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [priority, setPriority] = useState(2);
  const [selectedFile, setSelectedFile] = useState(null);

  // Persons Tagged
  const [accusedName, setAccusedName] = useState('');
  const [accusedContact, setAccusedContact] = useState('');
  const [witnessName, setWitnessName] = useState('');
  const [witnessContact, setWitnessContact] = useState('');

  // Status & Feedback
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submissionSuccess, setSubmissionSuccess] = useState(null);

  // Load Real Categories & Stations
  useEffect(() => {
    async function fetchMaster() {
      try {
        setLoadingMaster(true);
        const [catsRes, stationsRes] = await Promise.all([
          adminApi.getCategories().catch(() => ({ data: [] })),
          adminApi.getStations().catch(() => ({ data: [] }))
        ]);

        const loadedCats = catsRes?.data || catsRes || [];
        const loadedStations = stationsRes?.data || stationsRes || [];

        setCategories(loadedCats.length ? loadedCats : [
          { category_id: 1, name: 'Theft / Burglary', code: 'THEFT' },
          { category_id: 2, name: 'Cyber & Online Financial Fraud', code: 'CYBER_FRAUD' },
          { category_id: 3, name: 'Vehicle Theft', code: 'VEHICLE_THEFT' },
          { category_id: 4, name: 'Harassment / Cyber Stalking', code: 'HARASSMENT' },
          { category_id: 5, name: 'Physical Assault / Affray', code: 'ASSAULT' }
        ]);

        setStations(loadedStations.length ? loadedStations : [
          { station_id: 1, name: 'Central Police Station', code: 'CPS-01', district: 'Central District' },
          { station_id: 2, name: 'North Suburban Police Station', code: 'NPS-02', district: 'North District' }
        ]);

        if (loadedCats.length > 0) setCategoryId(String(loadedCats[0].category_id));
        if (loadedStations.length > 0) setStationId(String(loadedStations[0].station_id));
      } catch (err) {
        console.warn('Master data load warning:', err);
      } finally {
        setLoadingMaster(false);
      }
    }
    fetchMaster();
  }, []);

  // Duplicate Check Hint (FR-C4)
  const runDuplicateCheck = async () => {
    if (!categoryId || !incidentPlace || !incidentDate) return;
    try {
      setCheckingDuplicate(true);
      setDuplicateWarning(null);
      const res = await complaintsApi.checkDuplicate({
        categoryId: parseInt(categoryId),
        locationText: incidentPlace,
        incidentDt: new Date(incidentDate).toISOString()
      });
      if (res?.data?.isPotentialDuplicate) {
        setDuplicateWarning(res.data.matches?.[0] || { message: 'Potential duplicate complaint detected with same place and category.' });
      }
    } catch {
      // Non-blocking duplicate check
    } finally {
      setCheckingDuplicate(false);
    }
  };

  // Submit Complaint
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const payload = {
        categoryId: parseInt(categoryId),
        stationId: isZeroFir ? null : (stationId ? parseInt(stationId) : null),
        incidentDt: new Date(incidentDate).toISOString(),
        locationText: incidentPlace.trim(),
        description: incidentDescription.trim(),
        priority: parseInt(priority) || 2,
        submitImmediately: true,
        persons: []
      };

      if (accusedName.trim()) {
        payload.persons.push({
          role: 'ACCUSED',
          fullName: accusedName.trim(),
          contact: accusedContact.trim()
        });
      }

      if (witnessName.trim()) {
        payload.persons.push({
          role: 'WITNESS',
          fullName: witnessName.trim(),
          contact: witnessContact.trim()
        });
      }

      const res = await complaintsApi.create(payload);
      const newDocket = res?.data || res;

      // Upload attachment if selected
      if (selectedFile && newDocket?.fir_id) {
        try {
          await complaintsApi.uploadAttachment(newDocket.fir_id, selectedFile);
        } catch (uploadErr) {
          console.warn('Attachment upload failed, but complaint was saved:', uploadErr);
        }
      }

      setSubmissionSuccess(newDocket);
    } catch (err) {
      setErrorMsg(err.message || 'Submission failed. Please verify required fields.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-ivory text-slate-900 antialiased font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Sidebar Navigation */}
      <DashboardSidebar activeNav="file-fir" />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Minimal Bar */}
        <header className="top-0 sticky z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2 text-xs">
            <Link to="/" className="text-slate-500 hover:text-blue-900 transition-colors font-medium">Home</Link>
            <span className="text-slate-300">/</span>
            <Link to="/dashboard" className="text-slate-500 hover:text-blue-900 transition-colors font-medium">Portal Workspace</Link>
            <span className="text-slate-300">/</span>
            <span className="text-blue-950 font-bold">Lodge e-FIR / Complaint</span>
          </div>

          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Back to Dossiers</span>
          </Link>
        </header>

        {/* Form Container */}
        <main className="flex-grow w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          
          {/* Header Title Banner */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-blue-900 text-white flex items-center justify-center">
                <span className="material-symbols-outlined text-xl text-amber-300">edit_document</span>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900">
                  Electronic First Information Report (e-FIR) Intake
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Statutory intake pursuant to Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023 Section 173
                </p>
              </div>
            </div>

            {/* Stepper Wizard Indicator */}
            <div className="grid grid-cols-4 gap-2 pt-4 border-t border-slate-100 text-xs">
              {[
                { step: 1, label: 'Jurisdiction & Offence' },
                { step: 2, label: 'Incident Statement' },
                { step: 3, label: 'Evidence Attachments' },
                { step: 4, label: 'Review & Submit' }
              ].map((s) => (
                <div
                  key={s.step}
                  className={`p-2.5 rounded-xl border text-center transition-colors ${
                    currentStep === s.step
                      ? 'bg-blue-900 text-white border-blue-900 font-bold shadow-xs'
                      : currentStep > s.step
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold'
                      : 'bg-slate-50 text-slate-400 border-slate-200'
                  }`}
                >
                  <span className="block text-[10px] font-semibold opacity-80">Step {s.step}</span>
                  <span className="text-[11px] truncate block">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Submission Success View */}
          {submissionSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 rounded-3xl bg-white border-2 border-emerald-500 shadow-xl text-center space-y-5"
            >
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                <span className="material-symbols-outlined text-3xl">check_circle</span>
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-black text-slate-900">e-FIR Successfully Lodged</h2>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Your formal complaint has been officially registered in the police intake register.
                </p>
              </div>

              {/* Issued Tracking ID Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 max-w-sm mx-auto space-y-1">
                <span className="text-[10px] text-slate-500 block font-semibold">Official Tracking ID</span>
                <span className="text-lg font-black font-mono text-blue-950 block">
                  {submissionSuccess.tracking_id || submissionSuccess.fir_number}
                </span>
                <span className="text-[11px] text-emerald-700 font-medium block">Status: SUBMITTED (Awaiting Station Triage)</span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                <Link
                  to={`/dashboard/live-tracking?id=${encodeURIComponent(submissionSuccess.tracking_id || submissionSuccess.fir_id)}`}
                  className="px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm text-cyan-400">radar</span>
                  <span>Track Live Status</span>
                </Link>

                <Link
                  to="/dashboard"
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                >
                  Return to Dossiers
                </Link>
              </div>
            </motion.div>
          ) : (
            /* Multi-Step Interactive Form */
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-6">
              
              {/* Error Notice */}
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-rose-600">error</span>
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* STEP 1: Station & Category */}
              {currentStep === 1 && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h2 className="text-sm font-bold text-slate-900">Jurisdiction &amp; Crime Classification</h2>
                    <p className="text-xs text-slate-500">Choose the relevant police station or file under Zero-FIR jurisdiction pool.</p>
                  </div>

                  {/* Zero-FIR Toggle per BNSS 173 */}
                  <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="zeroFirToggle"
                      checked={isZeroFir}
                      onChange={(e) => setIsZeroFir(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-blue-900 focus:ring-blue-900 cursor-pointer"
                    />
                    <label htmlFor="zeroFirToggle" className="text-xs text-slate-700 cursor-pointer">
                      <strong className="text-blue-950 block">File as Zero-FIR (Jurisdiction Unknown / Outside Local Station)</strong>
                      Under BNSS Section 173, an e-FIR can be registered at any station or central intake pool regardless of territorial boundaries and subsequently transferred.
                    </label>
                  </div>

                  {/* Police Station Dropdown */}
                  {!isZeroFir && (
                    <div className="space-y-1.5 text-xs">
                      <label className="font-bold text-slate-900">Territorial Police Station <span className="text-red-500">*</span></label>
                      <select
                        value={stationId}
                        onChange={(e) => setStationId(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 bg-white text-slate-900 outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-900/10 text-xs"
                      >
                        {stations.map((st) => (
                          <option key={st.station_id} value={st.station_id}>
                            {st.name} ({st.code || 'PS'}) - {st.district || 'General Division'}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Category Dropdown */}
                  <div className="space-y-1.5 text-xs">
                    <label className="font-bold text-slate-900">Crime / Incident Category <span className="text-red-500">*</span></label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 bg-white text-slate-900 outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-900/10 text-xs"
                    >
                      {categories.map((c) => (
                        <option key={c.category_id} value={c.category_id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Priority Level */}
                  <div className="space-y-1.5 text-xs">
                    <label className="font-bold text-slate-900">Initial Priority Estimation</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { val: 1, label: 'P1 - High / Severe Loss', desc: 'Active threat, heavy financial theft' },
                        { val: 2, label: 'P2 - Standard', desc: 'Ordinary property offence, theft' },
                        { val: 3, label: 'P3 - Routine Inquiry', desc: 'Lost article, document recovery' }
                      ].map((p) => (
                        <button
                          key={p.val}
                          type="button"
                          onClick={() => setPriority(p.val)}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-colors active:scale-98 ${
                            priority === p.val
                              ? 'bg-blue-50 border-blue-900 text-blue-950 font-bold shadow-2xs'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span className="block font-bold text-xs">{p.label}</span>
                          <span className="text-[10px] text-slate-400 block font-normal">{p.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="px-5 py-2.5 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-800 active:bg-blue-950 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                    >
                      <span>Continue to Statement</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Incident Details & Accused/Witness */}
              {currentStep === 2 && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h2 className="text-sm font-bold text-slate-900">Incident Statement &amp; Persons Involved</h2>
                    <p className="text-xs text-slate-500">Provide chronological facts and exact location details.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-900">Date &amp; Time of Incident <span className="text-red-500">*</span></label>
                      <input
                        type="datetime-local"
                        required
                        value={incidentDate}
                        onChange={(e) => setIncidentDate(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:border-blue-900 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-900">Location / Landmark <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={incidentPlace}
                        onChange={(e) => setIncidentPlace(e.target.value)}
                        placeholder="e.g. Near Sector 17 Market Outer Circle"
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:border-blue-900"
                      />
                    </div>
                  </div>

                  {/* Detailed Description */}
                  <div className="space-y-1 text-xs">
                    <label className="font-bold text-slate-900">Detailed Statement of Facts <span className="text-red-500">*</span></label>
                    <textarea
                      rows={5}
                      required
                      value={incidentDescription}
                      onChange={(e) => setIncidentDescription(e.target.value)}
                      placeholder="Narrate the facts clearly: What occurred, suspected motives, stolen property descriptions, vehicle numbers, digital transaction IDs..."
                      className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 outline-none focus:border-blue-900 leading-relaxed"
                    />
                  </div>

                  {/* Accused & Witness Optional Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                      <span className="font-bold text-slate-900 block text-[11px]">Suspect / Accused Details (Optional)</span>
                      <input
                        type="text"
                        value={accusedName}
                        onChange={(e) => setAccusedName(e.target.value)}
                        placeholder="Name, alias, or physical description"
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                      />
                      <input
                        type="text"
                        value={accusedContact}
                        onChange={(e) => setAccusedContact(e.target.value)}
                        placeholder="Contact number / vehicle no. / UPI ID"
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-mono"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                      <span className="font-bold text-slate-900 block text-[11px]">Witness Details (Optional)</span>
                      <input
                        type="text"
                        value={witnessName}
                        onChange={(e) => setWitnessName(e.target.value)}
                        placeholder="Witness full name"
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                      />
                      <input
                        type="text"
                        value={witnessContact}
                        onChange={(e) => setWitnessContact(e.target.value)}
                        placeholder="Witness phone number"
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!incidentPlace.trim() || !incidentDescription.trim()) {
                          setErrorMsg('Please specify the incident location and detailed statement.');
                          return;
                        }
                        setErrorMsg('');
                        setCurrentStep(3);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-800 active:bg-blue-950 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                    >
                      <span>Continue to Evidence</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Evidence Attachments */}
              {currentStep === 3 && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h2 className="text-sm font-bold text-slate-900">Evidentiary Supporting Attachments</h2>
                    <p className="text-xs text-slate-500">Upload bank statements, photos, invoices, or cyber chat logs (PDF, PNG, JPG).</p>
                  </div>

                  <div className="p-6 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-400 bg-slate-50/50 text-center space-y-2">
                    <span className="material-symbols-outlined text-3xl text-slate-400">cloud_upload</span>
                    <div className="text-xs font-bold text-slate-800">
                      {selectedFile ? selectedFile.name : 'Choose file to attach to dossier'}
                    </div>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                      Uploaded files are securely verified and recorded in the evidence custody register.
                    </p>
                    <label className="inline-block px-4 py-2 rounded-xl bg-white border border-slate-200 hover:border-blue-900 text-blue-950 font-bold text-xs cursor-pointer shadow-2xs transition-colors">
                      Browse File
                      <input
                        type="file"
                        onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {selectedFile && (
                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-950 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base text-blue-900">attach_file</span>
                        <span className="font-semibold">{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="text-slate-400 hover:text-red-600 text-xs cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 active:bg-slate-100 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        runDuplicateCheck();
                        setCurrentStep(4);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-800 active:bg-blue-950 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                    >
                      <span>Review &amp; Verify</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 4: Review, Duplicate Check Hint & Statutory Submission */}
              {currentStep === 4 && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h2 className="text-sm font-bold text-slate-900">Review &amp; Statutory Affirmation</h2>
                    <p className="text-xs text-slate-500">Please verify all details carefully before submitting your complaint.</p>
                  </div>

                  {/* Potential Duplicate Warning Hint (FR-C4) */}
                  {duplicateWarning && (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-900 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="material-symbols-outlined text-sm text-amber-600">warning</span>
                        <span>Duplicate Detection Hint (FR-C4)</span>
                      </div>
                      <p className="text-[11px] text-amber-800">
                        Our database detected a similar complaint previously registered under your profile in this vicinity. 
                        If this is an addendum to an ongoing case, please consult your existing Tracking ID.
                      </p>
                    </div>
                  )}

                  {/* Summary Box */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div><span className="text-slate-400 text-[10px] block">Jurisdiction Mode</span> <strong>{isZeroFir ? 'Zero-FIR Pool' : 'Station Jurisdictional Triage'}</strong></div>
                      <div><span className="text-slate-400 text-[10px] block">Incident Time</span> <strong>{new Date(incidentDate).toLocaleString()}</strong></div>
                      <div><span className="text-slate-400 text-[10px] block">Location</span> <strong>{incidentPlace}</strong></div>
                      <div><span className="text-slate-400 text-[10px] block">Priority</span> <strong>Priority {priority}</strong></div>
                    </div>
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-slate-400 text-[10px] block">Statement Gist</span>
                      <p className="text-slate-700 italic line-clamp-3">{incidentDescription}</p>
                    </div>
                  </div>

                  {/* Statutory Affirmation */}
                  <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200 text-xs text-slate-700 space-y-1">
                    <div className="flex items-start gap-2">
                      <input type="checkbox" required id="statutoryAffirmation" className="mt-0.5 rounded text-blue-900 cursor-pointer" />
                      <label htmlFor="statutoryAffirmation" className="cursor-pointer text-[11px]">
                        <strong>Statutory Affirmation under BNSS Section 173 &amp; BNS Section 217:</strong> I solemnly declare that the facts stated herein are true to the best of my knowledge. I understand that submitting false criminal complaints is a punishable offence.
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 active:bg-slate-100 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 active:bg-blue-950 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-2 disabled:opacity-50 whitespace-nowrap cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin motion-reduce:animate-none"></span>
                          <span>Submitting Complaint…</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-sm text-amber-300">verified</span>
                          <span>Submit Official e-FIR</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </form>
          )}
        </main>
      </div>
    </div>
  );
}

export default DashboardFileComplaintPage;
