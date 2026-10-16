import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import deskOfficerImg from '../assets/images/stitch_desk_officer.jpg';

export function FileComplaintPage() {
  const navigate = useNavigate();

  // Current active step: 1 (Category), 2 (Incident & Jurisdiction), 3 (Narrative & Evidence), 4 (Attestation & Review)
  const [currentStep, setCurrentStep] = useState(2);

  // Form State
  const [category, setCategory] = useState('lost_mobile');
  const [incidentDate, setIncidentDate] = useState('2025-05-18');
  const [timeWindow, setTimeWindow] = useState('Evening');
  const [location, setLocation] = useState('Basement parking, Community Centre, Sector-C, Vasant Vihar, New Delhi');
  const [gpsDetected, setGpsDetected] = useState(true);
  const [statement, setStatement] = useState('While exiting the community market around 6:30 PM, my black leather sling bag containing an iPhone 14 (Blue, IMEI 358921094812341) and original driving license was snatched by an unidentified rider on a black scooter without license plate.');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // Evidence files
  const [evidenceFiles, setEvidenceFiles] = useState([
    { name: 'Invoice_Apple_Store_IMEI.pdf', size: '1.2 MB', type: 'doc' },
    { name: 'Parking_Ticket_Photo.jpg', size: '840 KB', type: 'img' }
  ]);

  // Step 4 Attestation
  const [affirmedTruth, setAffirmedTruth] = useState(true);
  const [affirmedPenalty, setAffirmedPenalty] = useState(true);

  // Submission Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [draftToast, setDraftToast] = useState(false);

  const categories = [
    { id: 'lost_mobile', title: 'Lost Mobile / Device', subtitle: 'Phone, laptop, IMEI tracking report', icon: 'phone_android' },
    { id: 'cyber_fraud', title: 'Financial / Cyber Fraud', subtitle: 'UPI, phishing, unauthorized debit', icon: 'account_balance' },
    { id: 'theft', title: 'House Theft / Burglary', subtitle: 'Trespass, stolen jewelry, cash', icon: 'home_work' },
    { id: 'vehicle', title: 'Vehicle Theft', subtitle: 'Two-wheeler, car, commercial auto', icon: 'directions_car' },
    { id: 'harassment', title: 'Harassment / Threat', subtitle: 'Online stalking, verbal abuse', icon: 'report' },
    { id: 'identity', title: 'Identity Theft', subtitle: 'Forged document, SIM cloning', icon: 'badge' }
  ];

  const handleGpsDetect = () => {
    setGpsDetected(true);
    setLocation('Community Centre, Sector-C, Vasant Vihar, New Delhi (GPS: 28.5603° N, 77.1620° E)');
  };

  const handleToggleRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      setRecordingSeconds(0);
    } else {
      setIsRecording(true);
      const interval = setInterval(() => {
        setRecordingSeconds(prev => {
          if (prev >= 15) {
            clearInterval(interval);
            setIsRecording(false);
            setStatement(curr => curr + ' [Voice statement transcribed: Complainant affirms physical scooter direction headed towards Outer Ring Road.]');
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
  };

  const handleRemoveFile = (indexToRemove) => {
    setEvidenceFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAddFile = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEvidenceFiles(prev => [
        ...prev,
        {
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          type: file.name.endsWith('.pdf') ? 'doc' : 'img'
        }
      ]);
    }
  };

  const handleSaveDraft = () => {
    setDraftToast(true);
    setTimeout(() => setDraftToast(false), 3000);
  };

  const handleSubmitFormal = (e) => {
    e.preventDefault();
    if (currentStep < 4) {
      setCurrentStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const generatedRef = `FIR-DL-2025-${Math.floor(4000 + Math.random() * 5000)}`;
      const token = `CR-2025-${Math.floor(1000 + Math.random() * 9000)}`;
      setSubmissionResult({
        firNo: generatedRef,
        token: token,
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        station: 'Vasant Vihar Police Station (Station Code: PS-04)',
        io: 'Inspector Rajesh K. Sharma (Badge #DL-4412)'
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 1500);
  };

  return (
    <div className="bg-background text-on-surface font-body-md text-body-md antialiased min-h-screen flex flex-col selection:bg-secondary-container selection:text-on-secondary-fixed">
      {/* Universal Sticky Navbar */}
      <Navbar />

      {/* SUB-HEADER / PROGRESS STEPPER */}
      <section className="bg-surface-container-lowest border-b border-outline-variant">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-5">
          {/* Breadcrumb and Assistance Badge */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-outline-variant">
            <div className="flex items-center gap-2 text-secondary font-label-md text-label-md">
              <Link className="hover:text-primary flex items-center gap-1 transition-colors" to="/">
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Back to Portal Overview
              </Link>
              <span className="text-outline-variant">/</span>
              <span className="text-primary font-medium">Guided Citizen e-FIR Lodgment</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-fixed font-label-sm text-label-sm font-semibold">
                <span className="material-symbols-outlined text-[14px]">shield</span>
                STATUTORY COMPLIANCE: BNSS / CrPC SEC 154
              </div>
              <span className="text-secondary font-label-sm text-label-sm hidden sm:inline">
                Session ID: <strong className="text-on-surface font-mono">EFIR-2025-DL901</strong>
              </span>
            </div>
          </div>

          {/* Page Titles */}
          <div className="pt-4 pb-5">
            <h1 className="font-headline-lg text-headline-lg font-bold text-primary tracking-tight">
              File a Complaint / e-FIR — Guided Citizen Submission
            </h1>
            <p className="font-body-md text-body-md text-secondary mt-1">
              A secure, legally recognized 4-step pathway to lodge your incident with your local jurisdiction.
            </p>
          </div>

          {/* 4-Step Visual Stepper */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {/* Step 1: Category */}
            <button 
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all cursor-pointer ${
                currentStep === 1 
                  ? 'border-2 border-primary-container bg-surface-container-lowest shadow-sm relative' 
                  : currentStep > 1 
                    ? 'border-outline-variant bg-surface-container-low' 
                    : 'border-outline-variant bg-surface-container-lowest opacity-75'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-label-md text-label-md font-bold shrink-0 ${
                currentStep > 1 
                  ? 'bg-primary-container text-on-primary' 
                  : currentStep === 1 
                    ? 'bg-primary text-on-primary' 
                    : 'bg-surface-container-high text-secondary'
              }`}>
                {currentStep > 1 ? <span className="material-symbols-outlined text-[18px]">check</span> : '1'}
              </div>
              <div className="min-w-0">
                <div className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">
                  {currentStep > 1 ? 'Step 1 • Done' : 'Step 1'}
                </div>
                <div className="font-title-md text-title-md text-primary font-semibold truncate">Category &amp; Triage</div>
              </div>
            </button>

            {/* Step 2: Incident & Jurisdiction */}
            <button 
              type="button"
              onClick={() => setCurrentStep(2)}
              className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all cursor-pointer ${
                currentStep === 2 
                  ? 'border-2 border-primary-container bg-surface-container-lowest shadow-sm relative' 
                  : currentStep > 2 
                    ? 'border-outline-variant bg-surface-container-low' 
                    : 'border-outline-variant bg-surface-container-lowest opacity-75'
              }`}
            >
              {currentStep === 2 && (
                <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-primary-container text-on-primary font-label-sm text-[10px] uppercase font-bold tracking-wider">
                  Current Stage
                </div>
              )}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-label-md text-label-md font-bold shrink-0 ${
                currentStep > 2 
                  ? 'bg-primary-container text-on-primary' 
                  : currentStep === 2 
                    ? 'bg-primary text-on-primary' 
                    : 'bg-surface-container-high text-secondary'
              }`}>
                {currentStep > 2 ? <span className="material-symbols-outlined text-[18px]">check</span> : '2'}
              </div>
              <div className="min-w-0">
                <div className={`font-label-sm text-label-sm uppercase tracking-wider ${currentStep === 2 ? 'text-primary font-bold' : 'text-secondary'}`}>
                  {currentStep === 2 ? 'Step 2 • Active' : currentStep > 2 ? 'Step 2 • Done' : 'Step 2'}
                </div>
                <div className="font-title-md text-title-md text-primary font-bold truncate">Incident &amp; Jurisdiction</div>
              </div>
            </button>

            {/* Step 3: Narrative & Evidence */}
            <button 
              type="button"
              onClick={() => setCurrentStep(3)}
              className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all cursor-pointer ${
                currentStep === 3 
                  ? 'border-2 border-primary-container bg-surface-container-lowest shadow-sm relative' 
                  : currentStep > 3 
                    ? 'border-outline-variant bg-surface-container-low' 
                    : 'border-outline-variant bg-surface-container-lowest opacity-75'
              }`}
            >
              {currentStep === 3 && (
                <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-primary-container text-on-primary font-label-sm text-[10px] uppercase font-bold tracking-wider">
                  Current Stage
                </div>
              )}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-label-md text-label-md font-semibold shrink-0 ${
                currentStep > 3 
                  ? 'bg-primary-container text-on-primary' 
                  : currentStep === 3 
                    ? 'bg-primary text-on-primary' 
                    : 'bg-surface-container-high text-secondary'
              }`}>
                {currentStep > 3 ? <span className="material-symbols-outlined text-[18px]">check</span> : '3'}
              </div>
              <div className="min-w-0">
                <div className={`font-label-sm text-label-sm uppercase tracking-wider ${currentStep === 3 ? 'text-primary font-bold' : 'text-secondary'}`}>
                  {currentStep === 3 ? 'Step 3 • Active' : 'Step 3'}
                </div>
                <div className="font-title-md text-title-md text-primary font-medium truncate">Narrative &amp; Evidence</div>
              </div>
            </button>

            {/* Step 4: Legal Attestation & Sign */}
            <button 
              type="button"
              onClick={() => setCurrentStep(4)}
              className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all cursor-pointer ${
                currentStep === 4 
                  ? 'border-2 border-primary-container bg-surface-container-lowest shadow-sm relative' 
                  : 'border-outline-variant bg-surface-container-lowest opacity-75'
              }`}
            >
              {currentStep === 4 && (
                <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-primary-container text-on-primary font-label-sm text-[10px] uppercase font-bold tracking-wider">
                  Final Stage
                </div>
              )}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-label-md text-label-md font-semibold shrink-0 ${
                currentStep === 4 ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-secondary'
              }`}>
                4
              </div>
              <div className="min-w-0">
                <div className={`font-label-sm text-label-sm uppercase tracking-wider ${currentStep === 4 ? 'text-primary font-bold' : 'text-secondary'}`}>
                  Step 4
                </div>
                <div className="font-title-md text-title-md text-primary font-medium truncate">Legal Attestation &amp; Sign</div>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Toast Notification */}
      {draftToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary-container text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-2.5 text-xs font-semibold animate-fadeIn">
          <span className="material-symbols-outlined text-tertiary-fixed-dim text-lg">bookmark</span>
          <span>Draft securely saved! Mobile link dispatched to registered SMS.</span>
        </div>
      )}

      {/* MAIN DOSSIER WORKSPACE */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 lg:px-12 py-8">
        
        {/* SUCCESS MODAL / BANNER IF SUBMITTED */}
        {submissionResult ? (
          <div className="bg-surface-container-lowest border-2 border-emerald-600 rounded-2xl p-8 sm:p-10 shadow-lg space-y-6 mb-8 relative overflow-hidden">
            <div className="h-2 bg-emerald-600 w-full absolute top-0 left-0"></div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-outline-variant">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-3xl">verified</span>
                </div>
                <div>
                  <span className="text-label-sm uppercase tracking-wider font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Officially Registered
                  </span>
                  <h2 className="font-headline-lg text-2xl font-bold text-primary mt-1">
                    FIR Successfully Lodged &amp; Transmitted
                  </h2>
                </div>
              </div>
              <div className="text-right sm:self-auto self-start">
                <span className="text-xs text-secondary font-mono">Reference Token:</span>
                <div className="font-mono text-lg font-bold text-primary">{submissionResult.token}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-surface-container-low border border-outline-variant text-xs">
              <div>
                <span className="text-secondary font-semibold uppercase">Official FIR Number</span>
                <p className="font-mono text-sm font-bold text-primary mt-0.5">{submissionResult.firNo}</p>
              </div>
              <div>
                <span className="text-secondary font-semibold uppercase">Lodgment Timestamp</span>
                <p className="font-semibold text-primary mt-0.5">{submissionResult.date}</p>
              </div>
              <div>
                <span className="text-secondary font-semibold uppercase">Jurisdiction Station</span>
                <p className="font-semibold text-primary mt-0.5">{submissionResult.station}</p>
              </div>
              <div>
                <span className="text-secondary font-semibold uppercase">Assigned IO</span>
                <p className="font-semibold text-primary mt-0.5">{submissionResult.io}</p>
              </div>
            </div>

            <p className="text-body-md text-secondary leading-relaxed">
              Your formal First Information Report has been stamped and cryptographically logged under Section 154 of the CrPC / Section 173 BNSS. An acknowledgment receipt has been dispatched to your verified mobile number and official email.
            </p>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <button 
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded bg-primary text-white text-xs font-semibold hover:bg-primary-container transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">print</span>
                Print Certified Copy (QR Seal)
              </button>
              <Link 
                to="/dashboard"
                className="px-5 py-2.5 rounded bg-surface-container-lowest border border-outline-variant text-primary text-xs font-semibold hover:bg-surface-container transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">dashboard</span>
                Track Live in Citizen Dashboard
              </Link>
              <button 
                type="button"
                onClick={() => { setSubmissionResult(null); setCurrentStep(1); }}
                className="text-xs text-secondary hover:text-primary underline ml-auto cursor-pointer"
              >
                File Another Incident
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* PRIMARY FORM COLUMN (8 Cols desktop) */}
            <section className="lg:col-span-8 flex flex-col gap-6">
              
              {/* Active Step Callout Card */}
              <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 flex items-start gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <span className="material-symbols-outlined text-[22px]">verified_user</span>
                </div>
                <div className="flex-1">
                  <h2 className="font-title-lg text-title-lg text-primary font-bold">
                    {currentStep === 1 && 'Step 1 of 4: Incident Category & Nature'}
                    {currentStep === 2 && 'Step 2 of 4: Incident Specifics & Jurisdiction'}
                    {currentStep === 3 && 'Step 3 of 4: Deposition Narrative & Digital Evidence'}
                    {currentStep === 4 && 'Step 4 of 4: Legal Attestation & Certified Seal'}
                  </h2>
                  <p className="font-body-md text-body-md text-secondary mt-1">
                    Don’t worry about legal terms or sections—our intake officers review your plain statement to determine proper statutory classification under Bharatiya Nyaya Sanhita (BNS) &amp; Cyber Protocols.
                  </p>
                </div>
              </div>

              {/* FORM DOSSIER SHEET */}
              <form className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden" onSubmit={handleSubmitFormal}>
                {/* Top certification accent bar */}
                <div className="h-1.5 w-full bg-primary-container"></div>

                <div className="p-6 md:p-8 flex flex-col gap-8">
                  
                  {/* SECTION A: Incident Classification & Primary Category */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="font-title-md text-title-md text-primary font-bold flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-primary-container text-on-primary flex items-center justify-center font-label-sm text-label-sm font-bold">A</span>
                        Incident Classification &amp; Primary Category
                      </label>
                      <span className="font-label-sm text-label-sm text-secondary">Mandatory Field</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-secondary mb-4">
                      Choose the closest nature of your loss or grievance. You may elaborate freely in the narrative below.
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" role="radiogroup">
                      {categories.map((cat) => {
                        const isSelected = category === cat.id;
                        return (
                          <label 
                            key={cat.id}
                            onClick={() => setCategory(cat.id)}
                            className={`cursor-pointer p-3.5 rounded-lg flex flex-col gap-2 transition-all ${
                              isSelected 
                                ? 'border-2 border-primary-container bg-surface-container-low shadow-sm' 
                                : 'border border-outline-variant hover:border-secondary bg-surface-container-lowest'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`material-symbols-outlined text-[24px] ${isSelected ? 'text-primary' : 'text-secondary'}`}>
                                {cat.icon}
                              </span>
                              <input 
                                type="radio" 
                                name="incident_type" 
                                value={cat.id} 
                                checked={isSelected}
                                onChange={() => setCategory(cat.id)}
                                className="text-primary-container focus:ring-primary-container w-4 h-4 cursor-pointer"
                              />
                            </div>
                            <span className={`font-label-lg text-label-lg ${isSelected ? 'font-bold text-primary' : 'font-semibold text-primary'}`}>
                              {cat.title}
                            </span>
                            <span className="font-body-sm text-[12px] text-secondary leading-tight">
                              {cat.subtitle}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* SECTION B: Chronology & Place of Occurrence */}
                  <div className="border-t border-outline-variant pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-title-md text-title-md text-primary font-bold flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-primary-container text-on-primary flex items-center justify-center font-label-sm text-label-sm font-bold">B</span>
                        Chronology &amp; Place of Occurrence
                      </label>
                    </div>
                    <p className="font-body-sm text-body-sm text-secondary mb-4">
                      Provide the estimated timeline and place so our dispatch network can align jurisdictional patrolling.
                    </p>

                    {/* Date & Time Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block font-label-md text-label-md font-semibold text-primary mb-1.5" htmlFor="incident_date">
                          Date of Occurrence *
                        </label>
                        <input 
                          id="incident_date"
                          type="date"
                          required
                          value={incidentDate}
                          onChange={(e) => setIncidentDate(e.target.value)}
                          className="w-full bg-surface-container-lowest border border-outline-variant rounded px-3.5 py-2.5 text-on-surface font-body-md text-body-md focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-label-md text-label-md font-semibold text-primary mb-1.5">
                          Approximate Time Window *
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { label: 'Morning', sub: '06:00-12:00' },
                            { label: 'Afternoon', sub: '12:00-17:00' },
                            { label: 'Evening', sub: '17:00-21:00' },
                            { label: 'Night', sub: '21:00-06:00' }
                          ].map((tw) => (
                            <button
                              key={tw.label}
                              type="button"
                              onClick={() => setTimeWindow(tw.label)}
                              className={`py-2 px-1 text-center rounded border transition-colors cursor-pointer ${
                                timeWindow === tw.label 
                                  ? 'border-2 border-primary-container bg-surface-container-low font-bold text-primary' 
                                  : 'border-outline-variant hover:bg-surface-container-low font-medium text-secondary'
                              }`}
                            >
                              <span className="font-label-sm text-label-sm block">{tw.label}</span>
                              <span className="text-[10px] opacity-80">{tw.sub}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Location Search & Detected Station */}
                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="block font-label-md text-label-md font-semibold text-primary mb-1.5" htmlFor="incident_location">
                          Occurrence Location (Street, Metro Station, Landmark) *
                        </label>
                        <div className="relative flex items-center">
                          <span className="material-symbols-outlined absolute left-3.5 text-[20px] text-secondary">pin_drop</span>
                          <input 
                            id="incident_location"
                            type="text"
                            required
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Specify location details..."
                            className="w-full pl-11 pr-28 py-2.5 bg-surface-container-lowest border border-outline-variant rounded text-on-surface font-body-md text-body-md focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 focus:outline-none"
                          />
                          <button 
                            type="button"
                            onClick={handleGpsDetect}
                            className="absolute right-2 px-2.5 py-1 rounded bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold hover:bg-surface-container-highest flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[14px]">my_location</span>
                            GPS Detect
                          </button>
                        </div>
                      </div>

                      {/* Interactive Jurisdictional Map Dossier & Zero-FIR Card */}
                      <div className="bg-surface-container-low border border-outline-variant rounded-lg p-4 flex flex-col md:flex-row gap-4 items-center">
                        {/* Map Thumbnail Graphic */}
                        <div className="w-full md:w-44 h-28 bg-surface-container-highest rounded border border-outline-variant relative overflow-hidden flex flex-col justify-end p-2 shrink-0">
                          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#14213d_1px,transparent_1px)] [background-size:8px_8px]"></div>
                          <div className="relative z-10 flex items-center gap-1.5 bg-surface-container-lowest/90 px-2 py-1 rounded text-primary font-label-sm text-[10px] font-bold">
                            <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
                            GPS: 28.5603° N, 77.1620° E
                          </div>
                        </div>

                        {/* Police Station Jurisdictional Details */}
                        <div className="flex-1 w-full">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-secondary">
                              Detected Police Station Jurisdiction
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-[10px] font-bold">
                              Verified Station
                            </span>
                          </div>
                          <h3 className="font-title-md text-title-md font-bold text-primary">
                            Vasant Vihar Police Station (Station Code: PS-04)
                          </h3>
                          <p className="font-body-sm text-body-sm text-secondary mt-0.5">
                            South West District • Investigating Liaison Unit • Tel: 011-26154100
                          </p>

                          {/* Zero FIR Assurance Banner */}
                          <div className="mt-2.5 flex items-center gap-1.5 text-on-surface font-label-sm text-label-sm bg-surface-container-lowest px-3 py-1.5 rounded border border-outline-variant">
                            <span className="material-symbols-outlined text-[16px] text-primary">gavel</span>
                            <span>
                              <strong>Zero-FIR Guarantee:</strong> Even if this occurrence sits outside station boundaries, your FIR is registered instantly and routed electronically.
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION C: Incident Narrative in Citizen's Words */}
                  <div className="border-t border-outline-variant pt-6">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <label className="font-title-md text-title-md text-primary font-bold flex items-center gap-2" htmlFor="statement_text">
                        <span className="w-6 h-6 rounded bg-primary-container text-on-primary flex items-center justify-center font-label-sm text-label-sm font-bold">C</span>
                        Incident Summary in Your Own Words
                      </label>

                      {/* Voice Recording Transcriber Action */}
                      <button 
                        type="button"
                        onClick={handleToggleRecord}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded border font-label-sm text-label-sm font-semibold transition-colors cursor-pointer ${
                          isRecording 
                            ? 'bg-error text-white border-error animate-pulse' 
                            : 'border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low text-primary'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">mic</span>
                        {isRecording ? `Recording Audio (${recordingSeconds}s)... Click to Stop` : 'Record Voice Statement (Audio Transcribed)'}
                      </button>
                    </div>

                    <p className="font-body-sm text-body-sm text-secondary mb-3">
                      Describe what happened in simple everyday words. Mention who was involved, what was taken or damaged, and any key witnesses.
                    </p>

                    <div className="relative">
                      <textarea 
                        id="statement_text"
                        rows={5}
                        required
                        value={statement}
                        onChange={(e) => setStatement(e.target.value)}
                        placeholder="Describe what happened in simple words..."
                        className="w-full bg-surface-container-lowest border border-outline-variant rounded p-3.5 text-on-surface font-body-md text-body-md focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 focus:outline-none"
                      />
                      {/* Watermark and Counter Bar */}
                      <div className="flex items-center justify-between mt-1 px-1 font-label-sm text-label-sm text-secondary">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">lock</span>
                          Encrypted Statutory Deposition Canvas
                        </span>
                        <span>{statement.length} / 2000 characters entered</span>
                      </div>
                    </div>
                  </div>

                  {/* SECTION D: Supporting Digital Evidence Upload */}
                  <div className="border-t border-outline-variant pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-title-md text-title-md text-primary font-bold flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-primary-container text-on-primary flex items-center justify-center font-label-sm text-label-sm font-bold">D</span>
                        Digital Supporting Evidence &amp; Proof of Ownership
                      </label>
                      <span className="font-label-sm text-label-sm text-secondary">Optional at this stage</span>
                    </div>

                    <p className="font-body-sm text-body-sm text-secondary mb-3">
                      Attach invoices, device IMEI invoices, bank transaction slips, or relevant photos to accelerate formal charge framing.
                    </p>

                    {/* Drag and Drop Zone */}
                    <label className="border-2 border-dashed border-outline-variant hover:border-secondary rounded-lg p-6 bg-surface-container-low text-center flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors block">
                      <input type="file" className="hidden" onChange={handleAddFile} />
                      <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-primary mx-auto">
                        <span className="material-symbols-outlined text-[26px]">cloud_upload</span>
                      </div>
                      <div className="font-title-md text-title-md text-primary font-semibold">Drop files here or click to browse</div>
                      <div className="font-body-sm text-body-sm text-secondary max-w-md mx-auto">
                        Accepted: JPG, PNG, PDF up to 25MB. Hashed with SHA-256 for court admissibility under Indian Evidence Act Sec 65B.
                      </div>
                      <span className="mt-2 inline-block px-4 py-1.5 rounded border border-outline-variant bg-surface-container-lowest font-label-md text-label-md font-semibold text-primary hover:bg-surface-container-low">
                        Select Document Files
                      </span>
                    </label>

                    {/* Attached Items Queue Preview */}
                    {evidenceFiles.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {evidenceFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant px-3 py-1.5 rounded text-primary font-label-sm text-label-sm shadow-sm">
                            <span className="material-symbols-outlined text-[16px] text-primary">
                              {file.type === 'doc' ? 'description' : 'image'}
                            </span>
                            <span>{file.name} ({file.size})</span>
                            <button 
                              type="button" 
                              onClick={() => handleRemoveFile(idx)}
                              className="material-symbols-outlined text-[14px] text-secondary cursor-pointer hover:text-error ml-1"
                            >
                              close
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* STEP 4 ATTESTATION ACCORDION (If at step 4) */}
                  {currentStep === 4 && (
                    <div className="border-t border-outline-variant pt-6 space-y-4 bg-surface-container-low p-5 rounded-xl border border-secondary-fixed-dim/60">
                      <h3 className="font-title-md text-title-md text-primary font-bold flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">gavel</span>
                        Final Legal Attestation &amp; Digital Signature
                      </h3>
                      <div className="space-y-3">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={affirmedTruth}
                            onChange={(e) => setAffirmedTruth(e.target.checked)}
                            className="w-4 h-4 mt-0.5 rounded text-primary focus:ring-0"
                          />
                          <span className="text-body-sm text-on-surface">
                            <strong>Solemn Attestation:</strong> I verify that the particulars narrated in this complaint are authentic to the best of my personal recollection.
                          </span>
                        </label>
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={affirmedPenalty}
                            onChange={(e) => setAffirmedPenalty(e.target.checked)}
                            className="w-4 h-4 mt-0.5 rounded text-primary focus:ring-0"
                          />
                          <span className="text-body-sm text-on-surface">
                            <strong>Statutory Warning Acknowledgment:</strong> I understand that knowingly filing false or malicious allegations is punishable under Section 217 / 238 BNS.
                          </span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* ACTION FOOTER OF FORM */}
                  <div className="border-t border-outline-variant pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <button 
                      type="button"
                      onClick={handleSaveDraft}
                      className="w-full sm:w-auto px-5 py-2.5 rounded border border-outline-variant bg-surface-container-lowest text-primary font-label-lg text-label-lg font-medium hover:bg-surface-container-low transition-colors duration-150 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">save</span>
                      Save as Draft (Mobile Link Sent)
                    </button>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      {currentStep < 4 ? (
                        <button 
                          type="button"
                          onClick={() => {
                            setCurrentStep(prev => Math.min(prev + 1, 4));
                            window.scrollTo({ top: 250, behavior: 'smooth' });
                          }}
                          className="w-full sm:w-auto px-6 py-2.5 rounded bg-primary-container text-on-primary font-label-lg text-label-lg font-semibold hover:bg-primary transition-colors duration-150 active:scale-[0.99] flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                        >
                          Proceed to Review &amp; Identity Attestation
                          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                        </button>
                      ) : (
                        <button 
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full sm:w-auto px-6 py-2.5 rounded bg-primary-container text-on-primary font-label-lg text-label-lg font-semibold hover:bg-primary transition-colors duration-150 active:scale-[0.99] flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                        >
                          {isSubmitting ? (
                            <>
                              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                              Generating Formal e-FIR Seal...
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-[18px]">verified</span>
                              Submit &amp; Generate Statutory e-FIR
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              </form>

              {/* Citizen Help Desk Officer Context Banner */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex flex-col sm:flex-row items-center gap-5 shadow-sm">
                <div className="w-full sm:w-44 h-32 rounded-lg overflow-hidden shrink-0 border border-outline-variant">
                  <img 
                    className="w-full h-full object-cover" 
                    alt="Female police desk officer providing digital citizen support." 
                    src={deskOfficerImg}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-[11px] font-bold">
                      STATION ASSISTANCE HELP DESK
                    </span>
                    <span className="text-secondary font-label-sm text-label-sm">Active Duty Shift</span>
                  </div>
                  <h4 className="font-title-md text-title-md font-bold text-primary mt-1">Need guided filing assistance in person?</h4>
                  <p className="font-body-sm text-body-sm text-secondary mt-1">
                    You may also visit Vasant Vihar Police Station's Civic Help Desk or summon a Mobile Civic Facilitation van via helpline 112 if you require assistance with statement recording or physical evidence sealing.
                  </p>
                </div>
              </div>

            </section>

            {/* CONTEXTUAL CITIZEN ASSISTANCE PANEL (4 Cols desktop) */}
            <aside className="lg:col-span-4 flex flex-col gap-6">
              
              {/* Card 1: Citizen Rights & Statutory Guarantee */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm relative overflow-hidden">
                <div className="h-1 w-full bg-primary-container absolute top-0 left-0"></div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-[22px] text-primary">balance</span>
                  <h3 className="font-title-md text-title-md font-bold text-primary">Citizen Rights &amp; Legal Protection</h3>
                </div>
                <ul className="space-y-3 font-body-sm text-body-sm text-secondary">
                  <li className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">check_circle</span>
                    <span><strong>Free Certified Copy:</strong> Section 154(2) CrPC / Section 173 BNSS mandates an immediate digitally signed copy of your e-FIR free of cost.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">check_circle</span>
                    <span><strong>Zero-Jurisdiction Mandate:</strong> Officers cannot reject any cognizable complaint citing station jurisdiction boundaries.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">check_circle</span>
                    <span><strong>Identity Protection:</strong> For sensitive matters involving women, minors, or cyber harassment, claimant identity is masked on public dockets.</span>
                  </li>
                </ul>
              </div>

              {/* Card 2: What Happens Next? Timeline */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
                <h3 className="font-title-md text-title-md font-bold text-primary mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-primary">timeline</span>
                  What Happens When You Submit?
                </h3>
                <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-outline-variant">
                  <div className="relative">
                    <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-primary-container border-2 border-surface-container-lowest"></div>
                    <div className="font-label-md text-label-md font-bold text-primary">1. Instant Acknowledgment Token</div>
                    <p className="font-body-sm text-body-sm text-secondary mt-0.5">Delivered via SMS &amp; WhatsApp within 30 seconds with statutory tracking hash.</p>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-primary-container border-2 border-surface-container-lowest"></div>
                    <div className="font-label-md text-label-md font-bold text-primary">2. Station House Officer (SHO) Review</div>
                    <p className="font-body-sm text-body-sm text-secondary mt-0.5">Assigned to an Investigating Officer (IO) within 24 hours for cognizable inquiry or FIR conversion.</p>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-primary-container border-2 border-surface-container-lowest"></div>
                    <div className="font-label-md text-label-md font-bold text-primary">3. Digital Certified Copy to DigiLocker</div>
                    <p className="font-body-sm text-body-sm text-secondary mt-0.5">Formal digitally verified FIR sheet pushed directly to your linked national DigiLocker wallet.</p>
                  </div>
                </div>
              </div>

              {/* Card 3: Emergency Direct Lines */}
              <div className="bg-surface-container-low border border-outline-variant rounded-xl p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[22px] text-error">contact_phone</span>
                  <h3 className="font-title-md text-title-md font-bold text-primary">Need Immediate Police Intervention?</h3>
                </div>
                <p className="font-body-sm text-body-sm text-secondary">
                  If a crime is in active progress or an individual is in immediate danger, do not wait for online form processing. Call central dispatch immediately.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <a className="p-3 bg-surface-container-lowest rounded-lg border border-outline-variant text-center hover:bg-surface-container-high transition-colors" href="tel:112">
                    <div className="font-label-sm text-label-sm text-secondary">All-India Emergency</div>
                    <div className="font-title-lg text-title-lg font-bold text-error">Dial 112</div>
                  </a>
                  <a className="p-3 bg-surface-container-lowest rounded-lg border border-outline-variant text-center hover:bg-surface-container-high transition-colors" href="tel:1930">
                    <div className="font-label-sm text-label-sm text-secondary">Cyber Financial Fraud</div>
                    <div className="font-title-lg text-title-lg font-bold text-primary">Dial 1930</div>
                  </a>
                </div>
                {/* Officer on Duty Details */}
                <div className="border-t border-outline-variant pt-3 flex items-center justify-between text-secondary font-label-sm text-label-sm">
                  <span>Duty Officer: <strong>Insp. R. K. Sharma</strong></span>
                  <span>Badge: <strong>DL-4091</strong></span>
                </div>
              </div>

              {/* Card 4: Statutory Legal Warning */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 text-secondary font-body-sm text-body-sm flex items-start gap-3 shadow-sm">
                <span className="material-symbols-outlined text-[20px] text-primary shrink-0 mt-0.5">info</span>
                <div>
                  <strong className="text-primary block font-label-md text-label-md">Statutory Warning under Sec 217 / 238 BNS</strong>
                  Lodging intentionally fictitious or misleading police complaints is punishable under law with fine and imprisonment. By continuing, you affirm that the narrated particulars are true to the best of your personal knowledge.
                </div>
              </div>

            </aside>

          </div>
        )}

      </main>

      {/* Universal Footer */}
      <Footer />
    </div>
  );
}

export default FileComplaintPage;
