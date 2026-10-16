import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import heroOfficerImg from '../assets/images/stitch_hero_officer.jpg';
import publicHallImg from '../assets/images/stitch_public_hall.jpg';

export function HomePage() {
  const navigate = useNavigate();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalFormData, setModalFormData] = useState({
    fullName: '',
    mobile: '',
    district: 'Central Police District',
    category: 'Theft / Property Loss (CrPC 379)',
    statement: '',
    affirmed: false
  });
  const [complaintSuccessToken, setComplaintSuccessToken] = useState(null);

  // 6-Stage FIR Journey State
  const [currentStage, setCurrentStage] = useState(1);
  const totalStages = 6;

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(null);

  // Case Tracker Simulation State
  const [searchQuery, setSearchQuery] = useState('CR-2025-0982');
  const [trackingResult, setTrackingResult] = useState({
    token: 'CR-2025-0982',
    status: 'UNDER SUPERVISORY REVIEW',
    statusClass: 'bg-[#FFB703]/20 text-[#9A6C00]',
    subtitle: 'Preliminary Inquest Stage • Central Division Station Desk #3',
    section: 'Sec. 420 IPC / Sec. 318 BNS (Fraud Inquiry)',
    officer: 'SI M. Verma (Supervisory Desk)',
    nextStep: 'Bank Transaction Trace Verification',
    date: '22 November 2025'
  });

  const handleSimulateSearch = (customVal) => {
    const val = (customVal !== undefined ? customVal : searchQuery).trim().toUpperCase();
    if (val.includes('0982')) {
      setTrackingResult({
        token: 'CR-2025-0982',
        status: 'UNDER SUPERVISORY REVIEW',
        statusClass: 'bg-[#FFB703]/20 text-[#9A6C00]',
        subtitle: 'Preliminary Inquest Stage • Central Division Station Desk #3',
        section: 'Sec. 420 IPC / Sec. 318 BNS (Fraud Inquiry)',
        officer: 'SI M. Verma (Supervisory Desk)',
        nextStep: 'Bank Transaction Trace Verification',
        date: '22 November 2025'
      });
    } else {
      setTrackingResult({
        token: val || 'FIR-DL-2025-4401',
        status: 'FIR REGISTERED',
        statusClass: 'bg-[#15803D]/15 text-[#15803D]',
        subtitle: 'Under Active Police Investigation • Jurisdictional Police Station Vasant Vihar',
        section: 'Sec. 379 IPC / Sec. 303(2) BNS',
        officer: 'Inspector Rajesh K. (Badge #894)',
        nextStep: 'Forensic Device Report Dispatch',
        date: '30 November 2025'
      });
    }
  };

  const handleStageStep = (delta) => {
    let next = currentStage + delta;
    if (next > totalStages) next = 1;
    if (next < 1) next = 1;
    setCurrentStage(next);
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleComplaintSubmit = (e) => {
    e.preventDefault();
    const token = `#CR-2025-${Math.floor(1000 + Math.random() * 9000)}`;
    setComplaintSuccessToken(token);
  };

  const resetModal = () => {
    setIsModalOpen(false);
    setComplaintSuccessToken(null);
    setModalFormData({
      fullName: '',
      mobile: '',
      district: 'Central Police District',
      category: 'Theft / Property Loss (CrPC 379)',
      statement: '',
      affirmed: false
    });
  };

  return (
    <div className="bg-background text-on-background font-body-md antialiased selection:bg-primary selection:text-on-primary min-h-screen flex flex-col">
      
      {/* Universal CaseSync Navigation Bar */}
      <Navbar onOpenFileComplaint={() => setIsModalOpen(true)} />

      {/* ========================================================================= */}
      {/* 3. HERO SECTION                                                           */}
      {/* ========================================================================= */}
      <section className="relative bg-surface py-12 lg:py-20 border-b border-outline-variant overflow-hidden">
        {/* Subtle civic watermarks */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] flex items-center justify-center">
          <span className="material-symbols-outlined text-[720px] select-none text-primary">gavel</span>
        </div>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Editorial Column (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-high border border-outline-variant text-primary text-xs font-medium shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#15803D] animate-pulse"></span>
                <span>Official Citizen First Information System • Zero Station Queues</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl lg:text-[44px] lg:leading-[52px] text-primary font-bold tracking-tight">
                Help is here. <br/>
                <span className="underline decoration-tertiary-fixed-dim decoration-4 underline-offset-8">
                  File your complaint safely
                </span> from home.
              </h1>
              <p className="font-body-lg text-body-lg text-secondary max-w-2xl">
                You are not alone. Whether you lost a device, faced cyber fraud, or need statutory police assistance, our digital portal ensures your voice is recorded instantly, securely, and transparently without backroom delays.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="px-6 py-3.5 bg-primary-container text-surface-container-lowest font-title-md rounded hover:bg-primary transition-all duration-150 shadow-md flex items-center gap-2 border-l-4 border-tertiary-fixed-dim text-base cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xl text-tertiary-fixed-dim">edit_document</span>
                  File a Complaint
                </button>
                <a 
                  className="px-6 py-3.5 bg-surface-container-lowest text-primary font-title-md border border-outline-variant rounded hover:bg-surface-container-low transition-colors duration-150 flex items-center gap-2 shadow-sm text-base" 
                  href="#fir-journey"
                >
                  <span className="material-symbols-outlined text-xl text-secondary">account_tree</span>
                  Explore FIR Journey
                </a>
                <Link 
                  to="/login"
                  className="px-4 py-3.5 text-secondary hover:text-primary font-title-md transition-colors text-sm flex items-center gap-1.5"
                >
                  <span>Sign In to Track Case</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </Link>
              </div>
              <div className="p-3.5 rounded bg-surface-container-low border border-outline-variant/80 text-xs flex items-center gap-3 text-secondary">
                <span className="material-symbols-outlined text-[#15803D] text-xl">shield_locked</span>
                <span><strong>Citizen Peace-of-Mind Guarantee:</strong> Digital acknowledgments carry statutory legal validity under CrPC Sec. 154 / BNSS. Complainant identities are strictly shielded.</span>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-1">
                <div className="p-3 bg-surface-container-lowest rounded border border-outline-variant shadow-sm">
                  <div className="font-headline-sm text-primary font-bold">&lt; 4 Mins</div>
                  <div className="font-label-sm text-secondary uppercase">Filing Time</div>
                </div>
                <div className="p-3 bg-surface-container-lowest rounded border border-outline-variant shadow-sm">
                  <div className="font-headline-sm text-primary font-bold">Instant</div>
                  <div className="font-label-sm text-secondary uppercase">SMS &amp; PDF Receipt</div>
                </div>
                <div className="p-3 bg-surface-container-lowest rounded border border-outline-variant shadow-sm">
                  <div className="font-headline-sm text-[#15803D] font-bold">100% Free</div>
                  <div className="font-label-sm text-secondary uppercase">Statutory Rights</div>
                </div>
              </div>
            </div>

            {/* Right Visual Dossier Column (5 Cols) */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-lg overflow-hidden border-2 border-outline-variant bg-surface-container-lowest shadow-md">
                <div className="h-3 bg-primary-container w-full"></div>
                <img 
                  alt="Police Sub-Inspector listening to and documenting an elder citizen complaint at modern public police station desk" 
                  className="w-full h-80 object-cover object-top" 
                  src={heroOfficerImg}
                />
                <div className="p-4 bg-surface-container-lowest border-t border-outline-variant flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#15803D]"></span>
                    <span className="text-xs font-semibold text-primary">Station Front-Desk Verified</span>
                  </div>
                  <span className="text-xs text-secondary font-mono">Sec. 154 CrPC Subsystem</span>
                </div>
              </div>

              {/* Floating Interactive Quick-Check Dossier Card */}
              <div className="absolute -bottom-6 -left-4 sm:-left-8 right-4 sm:right-6 bg-surface-container-lowest rounded-md p-4 border border-outline-variant shadow-lg backdrop-blur-sm">
                <div className="flex items-center justify-between border-b border-outline-variant pb-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary">#CR-2025-0982</span>
                    <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider rounded-full bg-[#FFB703]/20 text-[#9A6C00] uppercase">
                      Under Review
                    </span>
                  </div>
                  <span className="text-[11px] text-secondary font-mono">Today, 10:24 AM</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-secondary block text-[10px] uppercase">Jurisdiction</span>
                    <span className="font-medium text-primary">Central Division (PS-04)</span>
                  </div>
                  <div>
                    <span className="text-secondary block text-[10px] uppercase">Designated Officer</span>
                    <span className="font-medium text-primary">SI M. Verma (Desk #3)</span>
                  </div>
                </div>
                <div className="mt-2.5 pt-2 border-t border-outline-variant/60 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-[#15803D]">
                    <span className="material-symbols-outlined text-sm">lock</span>
                    <span className="text-[11px]">Cryptographic Token Assigned</span>
                  </div>
                  <Link 
                    to="/login"
                    className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-0.5"
                  >
                    Citizen Login <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </Link>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. QUICK-ACTION GATEWAY                                                   */}
      {/* ========================================================================= */}
      <section className="py-12 bg-surface-container-low border-b border-outline-variant" id="quick-gateway">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs uppercase font-label-md tracking-wider font-semibold text-secondary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-[#15803D]">bolt</span> Citizen Quick-Action Gateway
              </span>
              <h2 className="font-headline-lg text-headline-lg text-primary font-bold mt-1 tracking-tight">
                Select Your Complaint Category
              </h2>
              <p className="font-body-md text-secondary mt-1 max-w-2xl">
                Select your issue below for a streamlined, step-by-step form tailored specifically to your circumstances.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-surface-container border border-outline-variant text-xs text-primary font-medium">
              <span className="material-symbols-outlined text-sm text-tertiary-fixed-dim">info</span>
              <span>Zero station visit required for non-heinous loss reports</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Category 1 */}
            <div 
              onClick={() => {
                setModalFormData(prev => ({ ...prev, category: 'Lost Mobile & Items' }));
                setIsModalOpen(true);
              }}
              className="bg-surface-container-lowest rounded-lg p-5 border border-outline-variant hover:border-primary shadow-sm hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-full bg-secondary-container/40 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-surface-container-lowest transition-colors">
                  <span className="material-symbols-outlined text-2xl">phone_iphone</span>
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="font-title-md font-semibold text-primary">Lost Mobile &amp; Items</h3>
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-[#15803D]/10 text-[#15803D]">Instant Seal</span>
                </div>
                <p className="text-secondary text-xs leading-relaxed">
                  Lost smartphone, SIM card, laptop, driver's license, or passport. Receive an instant unalterable digitally signed lost article report.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-outline-variant flex items-center justify-between text-xs text-primary font-medium font-title-md">
                <span>File Lost Report</span>
                <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </div>
            </div>

            {/* Category 2 */}
            <div 
              onClick={() => {
                setModalFormData(prev => ({ ...prev, category: 'Cyber Financial Fraud / Phishing' }));
                setIsModalOpen(true);
              }}
              className="bg-surface-container-lowest rounded-lg p-5 border border-outline-variant hover:border-primary shadow-sm hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-full bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center group-hover:bg-[#ba1a1a] group-hover:text-surface-container-lowest transition-colors">
                  <span className="material-symbols-outlined text-2xl">account_balance</span>
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="font-title-md font-semibold text-primary">Cyber &amp; Banking Fraud</h3>
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-[#ba1a1a]/10 text-[#ba1a1a] font-mono">Helpline 1930</span>
                </div>
                <p className="text-secondary text-xs leading-relaxed">
                  Unauthorized UPI debit, credit card scams, phishing, or crypto swindle. Instant link to National Cyber Crime reporting and bank freeze request.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-outline-variant flex items-center justify-between text-xs text-error font-medium font-title-md">
                <span>Report Financial Fraud</span>
                <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </div>
            </div>

            {/* Category 3 */}
            <div 
              onClick={() => {
                setModalFormData(prev => ({ ...prev, category: 'Theft / Property Loss (CrPC 379)' }));
                setIsModalOpen(true);
              }}
              className="bg-surface-container-lowest rounded-lg p-5 border border-outline-variant hover:border-primary shadow-sm hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-full bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-surface-container-lowest transition-colors">
                  <span className="material-symbols-outlined text-2xl">home_work</span>
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="font-title-md font-semibold text-primary">Theft &amp; Burglary</h3>
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-surface-container text-secondary font-mono">Sec. 379 IPC</span>
                </div>
                <p className="text-secondary text-xs leading-relaxed">
                  House theft, vehicle robbery, or stolen luggage. Guided step-by-step checklist to record property value, vehicle registration, and CCTV leads.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-outline-variant flex items-center justify-between text-xs text-primary font-medium font-title-md">
                <span>Lodge Theft Case</span>
                <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </div>
            </div>

            {/* Category 4 */}
            <div 
              onClick={() => {
                setModalFormData(prev => ({ ...prev, category: 'Women & Child Safety / Harassment' }));
                setIsModalOpen(true);
              }}
              className="bg-surface-container-lowest rounded-lg p-5 border border-outline-variant hover:border-primary shadow-sm hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-full bg-[#cee1fd] text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-surface-container-lowest transition-colors">
                  <span className="material-symbols-outlined text-2xl">shield_person</span>
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="font-title-md font-semibold text-primary">Women &amp; Child Safety</h3>
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-[#15803D]/10 text-[#15803D]">100% Confidential</span>
                </div>
                <p className="text-secondary text-xs leading-relaxed">
                  Stalking, online harassment, or safety intimidation. Strict zero-disclosure protocol; complaints route exclusively to designated Special Women Officers.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-outline-variant flex items-center justify-between text-xs text-primary font-medium font-title-md">
                <span>Confidential Filing</span>
                <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </div>
            </div>
          </div>

          {/* 30-Second Check Bar */}
          <div className="mt-8 p-6 bg-surface-container-lowest rounded-lg border border-outline-variant shadow-sm flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-primary flex-shrink-0">
                <span className="material-symbols-outlined text-2xl">quiz</span>
              </div>
              <div>
                <span className="text-xs font-semibold text-secondary uppercase font-mono">30-Second Check</span>
                <h4 className="font-title-md font-bold text-primary">Unsure if your case qualifies for an e-FIR?</h4>
                <p className="text-xs text-secondary mt-0.5">Answer three quick questions to get immediate instructions on whether to file digitally or seek immediate patrol intervention.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <button 
                onClick={() => alert("Emergency Check: If you or anyone else is currently in immediate danger, dial 112 immediately. If the incident has already concluded, you may safely proceed with our digital e-Filing.")}
                className="px-4 py-2 text-xs font-semibold bg-surface-container hover:bg-surface-variant text-primary rounded transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">check_circle</span> 1. Immediate Danger?
              </button>
              <button 
                onClick={() => alert("Jurisdiction Check: Under Zero-FIR provisions, any police station or online gateway in India must register your cognizable offense regardless of territorial borders.")}
                className="px-4 py-2 text-xs font-semibold bg-surface-container hover:bg-surface-variant text-primary rounded transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">pin_drop</span> 2. Jurisdiction Rules?
              </button>
              <button 
                onClick={() => alert("ID Requirement: You only need a mobile number capable of receiving SMS OTP and an approximate date, time, and location.")}
                className="px-4 py-2 text-xs font-semibold bg-surface-container hover:bg-surface-variant text-primary rounded transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">id_card</span> 3. Required Documents?
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. SIMPLE CITIZEN PREPARATION & RESPONSE SEQUENCE                         */}
      {/* ========================================================================= */}
      <section className="py-14 bg-surface border-b border-outline-variant">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            
            {/* Box 1: Preparation */}
            <div className="p-6 lg:p-8 bg-surface-container-lowest rounded-lg border border-outline-variant shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <span className="text-xs uppercase font-label-md tracking-wider font-semibold text-secondary">Simple Citizen Preparation</span>
                  <h3 className="font-headline-sm text-headline-sm text-primary font-bold mt-1">3 Things You Need Before You Start</h3>
                  <p className="text-xs text-secondary">No legal jargon or cumbersome paperwork required. Gathering these takes less than 2 minutes:</p>
                </div>
                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-3 p-3 rounded bg-surface border border-outline-variant">
                    <span className="w-7 h-7 rounded-full bg-primary text-surface-container-lowest flex items-center justify-center font-bold text-xs flex-shrink-0">1</span>
                    <div>
                      <h4 className="text-xs font-bold text-primary">Working Mobile Number</h4>
                      <p className="text-[11px] text-secondary mt-0.5">Used to verify your identity through a 6-digit OTP. Keeps your file private and connected to your SMS inbox.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded bg-surface border border-outline-variant">
                    <span className="w-7 h-7 rounded-full bg-primary text-surface-container-lowest flex items-center justify-center font-bold text-xs flex-shrink-0">2</span>
                    <div>
                      <h4 className="text-xs font-bold text-primary">Approximate Incident Date &amp; Location</h4>
                      <p className="text-[11px] text-secondary mt-0.5">Street name, landmark, or approximate neighborhood. Exact GPS coordinates are not mandatory.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded bg-surface border border-outline-variant">
                    <span className="w-7 h-7 rounded-full bg-primary text-surface-container-lowest flex items-center justify-center font-bold text-xs flex-shrink-0">3</span>
                    <div>
                      <h4 className="text-xs font-bold text-primary">Brief Description of What Happened</h4>
                      <p className="text-[11px] text-secondary mt-0.5">In your own everyday words in English or Hindi. Supporting photos or invoices are optional additions.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-4 mt-4 border-t border-outline-variant flex items-center justify-between">
                <span className="text-xs font-medium text-secondary">Estimated completion: <strong>3 to 5 minutes</strong></span>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 bg-primary-container text-surface-container-lowest text-xs font-semibold rounded hover:bg-primary transition-colors cursor-pointer"
                >
                  Proceed to Form
                </button>
              </div>
            </div>

            {/* Box 2: Response Sequence */}
            <div className="p-6 lg:p-8 bg-surface-container-lowest rounded-lg border border-outline-variant shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <span className="text-xs uppercase font-label-md tracking-wider font-semibold text-[#15803D]">Statutory Accountability</span>
                  <h3 className="font-headline-sm text-headline-sm text-primary font-bold mt-1">What Happens Right After You Submit?</h3>
                  <p className="text-xs text-secondary">We believe citizens deserve zero uncertainty. Here is the legally mandated response sequence:</p>
                </div>
                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-3 p-3 rounded bg-surface border border-outline-variant">
                    <span className="material-symbols-outlined text-[#15803D] text-2xl flex-shrink-0">receipt_long</span>
                    <div>
                      <h4 className="text-xs font-bold text-primary">Instant Certified Digital PDF with QR Code</h4>
                      <p className="text-[11px] text-secondary mt-0.5">Generated immediately on your screen. Carries digital signature and token for banking or telecom claims.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded bg-surface border border-outline-variant">
                    <span className="material-symbols-outlined text-[#15803D] text-2xl flex-shrink-0">sms</span>
                    <div>
                      <h4 className="text-xs font-bold text-primary">Direct SMS Milestone Notifications</h4>
                      <p className="text-[11px] text-secondary mt-0.5">Every review milestone sends an automated SMS alert with the SHO badge number and verification stamp.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded bg-surface border border-outline-variant">
                    <span className="material-symbols-outlined text-[#15803D] text-2xl flex-shrink-0">no_meeting_room</span>
                    <div>
                      <h4 className="text-xs font-bold text-primary">No Unnecessary Police Station Inconvenience</h4>
                      <p className="text-[11px] text-secondary mt-0.5">For standard loss declarations, your case is officially certified without mandatory station visits.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-4 mt-4 border-t border-outline-variant flex items-center gap-2 text-xs text-secondary">
                <span className="material-symbols-outlined text-base text-[#15803D]">verified</span>
                <span>Guaranteed pursuant to Citizen Police Services Standard Operating Protocol</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. SIGNATURE 6-STAGE FIR JOURNEY                                          */}
      {/* ========================================================================= */}
      <section className="py-16 lg:py-24 bg-surface-container-lowest border-b border-outline-variant" id="fir-journey">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          
          {/* Section Header */}
          <div className="max-w-3xl mb-12">
            <span className="text-xs uppercase font-label-md tracking-wider font-semibold text-secondary">Structured Procedural Pathway</span>
            <h2 className="font-headline-lg text-headline-lg text-primary font-bold mt-1 tracking-tight">
              From Your First Report to Resolution.
            </h2>
            <p className="font-body-lg text-body-lg text-secondary mt-2">
              Every report follows a clear, accountable journey. Understand what happens next, track meaningful updates, and stay informed at every stage without jurisdictional ambiguity.
            </p>
          </div>

          {/* Dossier Split Layout: 4-Column Stepper Rail + 8-Column Canvas */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: 4-Column Timeline Navigation Rail */}
            <div className="lg:col-span-4 bg-surface rounded border border-outline-variant p-4 space-y-2 sticky top-24">
              <div className="px-3 py-2 border-b border-outline-variant flex items-center justify-between">
                <span className="font-title-md text-xs uppercase tracking-wider text-secondary font-semibold">Statutory Milestones</span>
                <span className="text-xs font-mono text-primary font-bold">6 Stages</span>
              </div>
              
              <div className="space-y-1.5 pt-1">
                {[
                  { id: 1, title: 'Incident Submission', sub: 'E-filing & digital receipt' },
                  { id: 2, title: 'Verification & Jurisdictional Review', sub: 'Preliminary inquiry by SHO' },
                  { id: 3, title: 'FIR Registration', sub: 'Statutory FIR Number & Seal' },
                  { id: 4, title: 'Investigation & Chain of Custody', sub: 'Officer assignment & evidence log' },
                  { id: 5, title: 'Citizen Case Progress', sub: 'Live milestones & SMS alerts' },
                  { id: 6, title: 'Outcome & Statutory Closure', sub: 'Final charge sheet or closure note' },
                ].map((s) => {
                  const isActive = currentStage === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setCurrentStage(s.id)}
                      className={`w-full text-left p-3 rounded flex items-center gap-3 transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-surface-container text-primary font-semibold border-l-4 border-primary'
                          : 'hover:bg-surface-container-low text-secondary'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono ${
                        isActive ? 'bg-primary text-surface-container-lowest' : 'bg-surface-variant text-primary'
                      }`}>
                        {s.id}
                      </span>
                      <div>
                        <div className="text-sm font-medium">{s.title}</div>
                        <div className="text-[11px] text-secondary">{s.sub}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="p-3 bg-surface-container-low rounded text-xs text-secondary mt-3">
                <span className="font-semibold text-primary block mb-0.5">Note on Cognizability:</span>
                Non-cognizable complaints require formal Judicial Magistrate endorsement before FIR escalation.
              </div>
            </div>

            {/* Right: 8-Column Document Canvas */}
            <div className="lg:col-span-8 bg-surface-container-lowest rounded-lg border border-outline-variant shadow-sm overflow-hidden">
              <div className="h-1.5 bg-primary-container w-full"></div>

              <div className="p-6 lg:p-8">
                {currentStage === 1 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-outline-variant pb-4">
                      <div>
                        <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-surface-container text-primary">STAGE 01 / 06</span>
                        <h3 className="font-headline-md text-headline-md text-primary font-bold mt-1">Incident Submission</h3>
                      </div>
                      <span className="material-symbols-outlined text-3xl text-secondary">note_add</span>
                    </div>
                    <p className="text-secondary font-body-md">
                      Citizen submits initial complaint via e-Filing desk or station kiosk. The system logs geo-coordinates, identity affirmation, chronology of events, and generates an unalterable preliminary complaint token.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded border border-outline-variant bg-surface">
                        <span className="font-label-sm text-secondary uppercase block mb-1">Required Citizen Data</span>
                        <ul className="text-xs space-y-2 text-primary">
                          <li className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm text-[#15803D]">check_circle</span> Aadhaar / Voter ID electronic affirmation</li>
                          <li className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm text-[#15803D]">check_circle</span> Date, approximate hour, and precise location</li>
                          <li className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm text-[#15803D]">check_circle</span> Witness particulars or digital photo/video upload</li>
                        </ul>
                      </div>
                      <div className="p-4 rounded border border-dashed border-outline bg-surface-container-low flex flex-col justify-between">
                        <div>
                          <span className="font-label-sm text-secondary uppercase block mb-1">System Security Watermark</span>
                          <p className="text-xs text-primary font-mono">Timestamped: ISO-8601 UTC+05:30</p>
                          <p className="text-[11px] text-secondary mt-1">Directly feeds to District Police Headquarters supervisory audit server.</p>
                        </div>
                        <div className="mt-3 text-xs font-semibold text-primary flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm text-tertiary-fixed-dim">verified</span> Immediate SMS &amp; PDF Acknowledgment
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-surface-container rounded border border-outline-variant flex items-center justify-between">
                      <div className="text-xs">
                        <span className="font-semibold text-primary">Ready to submit a formal incident?</span>
                        <p className="text-secondary">Takes under 6 minutes with valid mobile authentication.</p>
                      </div>
                      <button 
                        onClick={() => setIsModalOpen(true)}
                        className="px-4 py-2 bg-primary-container text-surface-container-lowest text-xs font-semibold rounded hover:bg-primary cursor-pointer"
                      >
                        Launch e-Filing
                      </button>
                    </div>
                  </div>
                )}

                {currentStage === 2 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-outline-variant pb-4">
                      <div>
                        <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-surface-container text-primary">STAGE 02 / 06</span>
                        <h3 className="font-headline-md text-headline-md text-primary font-bold mt-1">Verification &amp; Jurisdictional Review</h3>
                      </div>
                      <span className="material-symbols-outlined text-3xl text-secondary">fact_check</span>
                    </div>
                    <p className="text-secondary font-body-md">
                      The Station House Officer (SHO) examines the complaint against territorial jurisdiction and statutory legal thresholds under the Criminal Procedure Code / Bharatiya Nagarik Suraksha Sanhita.
                    </p>
                    <div className="p-4 rounded bg-[#FFB703]/10 border-l-4 border-[#FFB703] text-on-surface">
                      <div className="font-title-md text-xs font-semibold text-[#9A6C00] uppercase mb-1">Important Statutory Safeguard</div>
                      <p className="text-xs leading-relaxed">
                        <strong>Not every complaint automatically becomes an FIR.</strong> If the matter is non-cognizable (e.g., civil disputes, simple lost items), the police will register a Non-Cognizable Report (NCR) and guide the citizen regarding Judicial Magistrate petition rights.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 border border-outline-variant rounded bg-surface">
                        <span className="font-semibold text-primary block">Territorial Check</span>
                        <span className="text-secondary text-[11px]">Boundary mapping to appropriate station house.</span>
                      </div>
                      <div className="p-3 border border-outline-variant rounded bg-surface">
                        <span className="font-semibold text-primary block">Preliminary Inquest</span>
                        <span className="text-secondary text-[11px]">Strict 7-day cap for preliminary assessment.</span>
                      </div>
                      <div className="p-3 border border-outline-variant rounded bg-surface">
                        <span className="font-semibold text-primary block">Supervisory Audit</span>
                        <span className="text-secondary text-[11px]">DCP / SP oversight on rejected complaints.</span>
                      </div>
                    </div>
                  </div>
                )}

                {currentStage === 3 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-outline-variant pb-4">
                      <div>
                        <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-surface-container text-primary">STAGE 03 / 06</span>
                        <h3 className="font-headline-md text-headline-md text-primary font-bold mt-1">FIR Registration</h3>
                      </div>
                      <span className="material-symbols-outlined text-3xl text-secondary">verified_user</span>
                    </div>
                    <p className="text-secondary font-body-md">
                      Upon establishing prima facie cognizable offense, the formal First Information Report is registered. The entry is recorded in the General Diary, signed digitally, and transmitted to the jurisdictional court within 24 hours.
                    </p>
                    <div className="p-5 border border-outline-variant rounded bg-surface font-mono text-xs space-y-2">
                      <div className="flex justify-between border-b border-outline-variant pb-2">
                        <span className="text-secondary">STATUTORY FORM 154</span>
                        <span className="text-[#15803D] font-bold">CERTIFIED OFFICIAL ENTRY</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-1">
                        <div>
                          <span className="text-secondary block text-[10px]">FIR NUMBER</span>
                          <span className="text-primary font-bold">FIR-0198/2025/CENTRAL</span>
                        </div>
                        <div>
                          <span className="text-secondary block text-[10px]">SECTIONS APPLIED</span>
                          <span className="text-primary font-bold">Sec. 379 IPC / Sec. 303 BNS</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-secondary flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-[#15803D]">download</span>
                      Free statutory copy issued immediately to complainant under CrPC Section 154(2).
                    </div>
                  </div>
                )}

                {currentStage === 4 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-outline-variant pb-4">
                      <div>
                        <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-surface-container text-primary">STAGE 04 / 06</span>
                        <h3 className="font-headline-md text-headline-md text-primary font-bold mt-1">Investigation &amp; Chain of Custody</h3>
                      </div>
                      <span className="material-symbols-outlined text-3xl text-secondary">search</span>
                    </div>
                    <p className="text-secondary font-body-md">
                      An Investigating Officer (IO) is assigned with full statutory authority. The investigation involves scene inspection, electronic evidence collection, witness depositions, and physical seizure records.
                    </p>
                    <div className="border border-outline-variant rounded p-4 bg-surface">
                      <span className="text-xs font-semibold text-primary block mb-3">Immutable Chain of Custody Flow</span>
                      <div className="flex items-center justify-between text-xs font-mono">
                        <div className="text-center">
                          <div className="w-8 h-8 rounded-full bg-primary text-surface-container-lowest mx-auto flex items-center justify-center text-xs">IO</div>
                          <span className="mt-1 block text-[10px] text-secondary">Officer Assigned</span>
                        </div>
                        <div className="h-0.5 flex-1 bg-outline-variant mx-2"></div>
                        <div className="text-center">
                          <div className="w-8 h-8 rounded-full bg-surface-container-high text-primary mx-auto flex items-center justify-center text-xs">EV</div>
                          <span className="mt-1 block text-[10px] text-secondary">Evidence Logged</span>
                        </div>
                        <div className="h-0.5 flex-1 bg-outline-variant mx-2"></div>
                        <div className="text-center">
                          <div className="w-8 h-8 rounded-full bg-surface-container-high text-primary mx-auto flex items-center justify-center text-xs">WT</div>
                          <span className="mt-1 block text-[10px] text-secondary">Witness Recorded</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStage === 5 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-outline-variant pb-4">
                      <div>
                        <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-surface-container text-primary">STAGE 05 / 06</span>
                        <h3 className="font-headline-md text-headline-md text-primary font-bold mt-1">Citizen Case Progress</h3>
                      </div>
                      <span className="material-symbols-outlined text-3xl text-secondary">radar</span>
                    </div>
                    <p className="text-secondary font-body-md">
                      No need to make physical visits to verify progress. The citizen portal delivers automated notifications at critical milestones, preserving transparency while shielding classified operational techniques.
                    </p>
                    <div className="space-y-2">
                      <div className="p-3 bg-surface-container rounded border border-outline-variant flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-base text-[#15803D]">mark_email_read</span>
                          <span>SMS / Email Notification sent at every milestone</span>
                        </div>
                        <span className="text-secondary font-mono">Automated</span>
                      </div>
                      <div className="p-3 bg-surface-container rounded border border-outline-variant flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-base text-[#15803D]">lock</span>
                          <span>Privacy Safeguard: Accused details redacted until charge file</span>
                        </div>
                        <span className="text-secondary font-mono">Statutory</span>
                      </div>
                    </div>
                  </div>
                )}

                {currentStage === 6 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-outline-variant pb-4">
                      <div>
                        <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-surface-container text-primary">STAGE 06 / 06</span>
                        <h3 className="font-headline-md text-headline-md text-primary font-bold mt-1">Outcome &amp; Statutory Closure</h3>
                      </div>
                      <span className="material-symbols-outlined text-3xl text-secondary">assignment_turned_in</span>
                    </div>
                    <p className="text-secondary font-body-md">
                      Investigation concludes with submission of a Final Report under CrPC Section 173 to the Court of Judicial Magistrate. Complainant is notified to review either the Charge Sheet or Closure Report.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="p-4 border border-outline-variant rounded bg-[#15803D]/10">
                        <div className="font-semibold text-[#15803D] uppercase mb-1">Charge Sheet Filed</div>
                        <p className="text-secondary">Prima facie evidence established; matter transferred to judicial court for trial and prosecution.</p>
                      </div>
                      <div className="p-4 border border-outline-variant rounded bg-surface">
                        <div className="font-semibold text-primary uppercase mb-1">Closure / Protest Petition</div>
                        <p className="text-secondary">If no evidence is discovered, citizen has statutory right to file a Protest Petition before the Magistrate.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Controls */}
              <div className="bg-surface px-6 py-4 border-t border-outline-variant flex items-center justify-between">
                <button 
                  onClick={() => handleStageStep(-1)}
                  disabled={currentStage === 1}
                  className="px-4 py-1.5 text-xs font-semibold text-secondary hover:text-primary border border-outline-variant rounded disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">west</span> Previous Stage
                </button>
                <span className="text-xs text-secondary font-mono">
                  Stage {currentStage} of {totalStages}
                </span>
                <button 
                  onClick={() => handleStageStep(1)}
                  className="px-4 py-1.5 text-xs font-semibold bg-primary text-surface-container-lowest rounded hover:bg-primary-container flex items-center gap-1 cursor-pointer"
                >
                  {currentStage === totalStages ? 'Restart Journey' : (
                    <>Next Stage <span className="material-symbols-outlined text-sm">east</span></>
                  )}
                </button>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. PLATFORM CORE CAPABILITIES                                             */}
      {/* ========================================================================= */}
      <section className="py-16 bg-surface border-b border-outline-variant">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs uppercase font-label-md tracking-wider font-semibold text-secondary">Institutional Standards</span>
            <h2 className="font-headline-lg text-headline-lg text-primary font-bold mt-1">Platform Core Capabilities</h2>
            <p className="font-body-md text-body-md text-secondary mt-2">
              Engineered to satisfy high-reliability police operations, judicial compliance, and effortless accessibility for citizens.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-surface-container-lowest p-6 rounded-lg border border-outline-variant hover:border-primary transition-all duration-150 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded bg-surface-container flex items-center justify-center text-primary mb-4">
                  <span className="material-symbols-outlined text-2xl">electric_bolt</span>
                </div>
                <h3 className="font-title-md text-primary font-semibold">Zero-Friction E-Filing</h3>
                <p className="text-secondary font-body-sm text-body-sm mt-2">
                  Citizen complaints recorded with geo-tagging, audio-statement transcription, and instant digital tokens 24/7 without desk delays.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-outline-variant text-[11px] font-mono text-secondary">
                Statutory Art. 21 Compliance
              </div>
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-lg border border-outline-variant hover:border-primary transition-all duration-150 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded bg-surface-container flex items-center justify-center text-primary mb-4">
                  <span className="material-symbols-outlined text-2xl">timeline</span>
                </div>
                <h3 className="font-title-md text-primary font-semibold">Verifiable Audit Trail</h3>
                <p className="text-secondary font-body-sm text-body-sm mt-2">
                  Every supervisor review, station endorsement, and evidence handover creates an immutable, timestamped ledger record.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-outline-variant text-[11px] font-mono text-secondary">
                Anti-Tamper Protocol
              </div>
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-lg border border-outline-variant hover:border-primary transition-all duration-150 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded bg-surface-container flex items-center justify-center text-primary mb-4">
                  <span className="material-symbols-outlined text-2xl">menu_book</span>
                </div>
                <h3 className="font-title-md text-primary font-semibold">Citizen Rights &amp; Guidance</h3>
                <p className="text-secondary font-body-sm text-body-sm mt-2">
                  Integrated legal plain-language explainers clarifying bail rights, zero-FIR protocols, and women-safety protections.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-outline-variant text-[11px] font-mono text-secondary">
                Free Legal Advisory Link
              </div>
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-lg border border-outline-variant hover:border-primary transition-all duration-150 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded bg-surface-container flex items-center justify-center text-primary mb-4">
                  <span className="material-symbols-outlined text-2xl">lock_clock</span>
                </div>
                <h3 className="font-title-md text-primary font-semibold">Cryptographic Integrity</h3>
                <p className="text-secondary font-body-sm text-body-sm mt-2">
                  Digital evidence files hashed at ingestion with SHA-256 ensuring admissibility under Section 65B of Evidence Act.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-outline-variant text-[11px] font-mono text-secondary">
                Sec. 65B Certified
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. TRANSPARENCY & PUBLIC SERVICE ACCOUNTABILITY                            */}
      {/* ========================================================================= */}
      <section className="py-16 lg:py-24 bg-surface-container-lowest border-b border-outline-variant" id="transparency">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs uppercase font-label-md tracking-wider font-semibold text-secondary">Open Public Oversight</span>
              <h2 className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">
                Designed for public trust. Built on statutory transparency.
              </h2>
              <p className="font-body-lg text-body-lg text-secondary">
                Modern policing requires an open civic contract. Citizen Service Centers operate with real-time electronic queue monitors, eliminating backroom ambiguity and empowering every individual with certified records.
              </p>
              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3.5 p-3.5 rounded border border-outline-variant bg-surface">
                  <span className="material-symbols-outlined text-primary text-xl mt-0.5">timer</span>
                  <div>
                    <h4 className="font-title-md text-sm font-semibold text-primary">Mandatory 48-Hour Response SLA</h4>
                    <p className="text-xs text-secondary mt-0.5">Every non-emergency complaint receives an official action note or summons update within statutory timeline caps.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3.5 p-3.5 rounded border border-outline-variant bg-surface">
                  <span className="material-symbols-outlined text-primary text-xl mt-0.5">policy</span>
                  <div>
                    <h4 className="font-title-md text-sm font-semibold text-primary">Zero-FIR Protocol Across Any Jurisdiction</h4>
                    <p className="text-xs text-secondary mt-0.5">Lodging cannot be declined due to territorial boundary limits; files are auto-transferred through the backend gateway.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3.5 p-3.5 rounded border border-outline-variant bg-surface">
                  <span className="material-symbols-outlined text-primary text-xl mt-0.5">fingerprint</span>
                  <div>
                    <h4 className="font-title-md text-sm font-semibold text-primary">Role-Based Evidence Vault</h4>
                    <p className="text-xs text-secondary mt-0.5">Complainant personal telephone and address data are restricted to investigating ranks to protect civic privacy.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Real Public Hall Image */}
            <div className="lg:col-span-6">
              <div className="relative rounded-lg overflow-hidden border-2 border-outline-variant bg-surface-container-lowest shadow-md">
                <div className="h-3 bg-primary w-full"></div>
                <img 
                  alt="Citizen service center reception counter with open public desks, digital queue display, and citizens receiving transparent assistance from public service officials" 
                  className="w-full h-96 object-cover" 
                  src={publicHallImg}
                />
                <div className="p-5 bg-surface-container-lowest border-t border-outline-variant">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-primary block">Citizen Service Center — Information &amp; Guidance Desks</span>
                      <span className="text-secondary text-[11px]">Real-time token display system and direct public accountability counter</span>
                    </div>
                    <span className="px-2.5 py-1 bg-surface-container text-primary font-mono text-[10px] font-semibold rounded">ISO-9001:2015</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. JURISDICTIONAL DIRECTORY & STATION ASSIGNMENT                          */}
      {/* ========================================================================= */}
      <section className="py-12 bg-surface-container-low border-b border-outline-variant" id="sho-lookup">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="bg-surface-container-lowest p-6 lg:p-8 rounded-lg border border-outline-variant shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-2">
                <span className="text-xs uppercase font-label-md tracking-wider font-semibold text-secondary flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-primary">location_city</span>
                  Secure Jurisdictional Mapping &amp; SHO Directory
                </span>
                <h3 className="font-headline-sm text-headline-sm text-primary font-bold">
                  Jurisdictional Directory &amp; Station Assignment
                </h3>
                <p className="text-xs text-secondary leading-relaxed">
                  Under statutory Zero-FIR guidelines, your complaint is automatically routed to the correct territorial police station upon submission. Sign in to your citizen portal to review your designated Station House Officer (SHO), direct duty lines, and station contact logs.
                </p>
              </div>
              <div className="lg:col-span-6 flex flex-col sm:flex-row items-center gap-4 lg:justify-end">
                <Link 
                  to="/login"
                  className="w-full sm:w-auto px-5 py-2.5 bg-primary text-surface-container-lowest font-medium text-xs rounded hover:bg-primary-container transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm">login</span>
                  Sign In for Jurisdictional Directory
                </Link>
                <Link 
                  to="/signup"
                  className="w-full sm:w-auto px-4 py-2.5 bg-surface-container-lowest text-primary border border-outline-variant rounded font-medium text-xs hover:bg-surface-container transition-colors flex items-center justify-center gap-1.5"
                >
                  Create Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. LIVE INTERACTIVE CASE TRACKING PREVIEW                                */}
      {/* ========================================================================= */}
      <section className="py-16 lg:py-24 bg-surface border-b border-outline-variant" id="live-tracker">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs uppercase font-label-md tracking-wider font-semibold text-secondary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-[#15803D]">verified_user</span>
                Protected Citizen Dashboard &amp; Case Milestones
              </span>
              <h2 className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">
                Secure Case Tracking &amp; Real-Time Procedural Audits
              </h2>
              <p className="font-body-md text-body-md text-secondary leading-relaxed">
                To protect complainant privacy and satisfy statutory data security mandates, active case dockets, IO assignments, and evidence records are accessed securely inside the verified Citizen Dashboard. Sign in or register to follow your complaint from lodging to court closure.
              </p>
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3 p-3 bg-surface-container-lowest rounded border border-outline-variant shadow-sm">
                  <span className="material-symbols-outlined text-[#15803D] text-xl mt-0.5">shield</span>
                  <div>
                    <h4 className="text-xs font-bold text-primary">End-to-End Privacy Protection</h4>
                    <p className="text-[11px] text-secondary mt-0.5">Personal identifiers and complaint narratives are protected under role-based judicial access.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-surface-container-lowest rounded border border-outline-variant shadow-sm">
                  <span className="material-symbols-outlined text-primary text-xl mt-0.5">notifications_active</span>
                  <div>
                    <h4 className="text-xs font-bold text-primary">Real-Time Procedural Alerts</h4>
                    <p className="text-[11px] text-secondary mt-0.5">Receive instant SMS and in-app milestone alerts whenever an Investigating Officer updates your file.</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-3">
                <Link 
                  to="/login"
                  className="px-6 py-2.5 bg-primary-container text-surface-container-lowest font-title-md text-xs font-semibold rounded hover:bg-primary transition-colors flex items-center gap-2 shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm text-tertiary-fixed-dim">login</span>
                  Sign In to Track Case
                </Link>
                <Link 
                  to="/signup"
                  className="px-5 py-2.5 bg-surface-container-lowest text-primary border border-outline-variant rounded font-title-md text-xs font-semibold hover:bg-surface-container transition-colors"
                >
                  Sign Up for Digital Updates
                </Link>
              </div>
            </div>

            {/* Interactive Preview Card */}
            <div className="lg:col-span-6 bg-surface-container-lowest rounded-lg border border-outline-variant p-6 shadow-sm">
              <div className="border-b border-outline-variant pb-3 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#15803D]"></div>
                  <span className="text-xs font-bold text-primary uppercase tracking-wide">Citizen Dashboard Preview</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-container text-secondary font-semibold">CrPC Sec. 154 Compliant</span>
              </div>
              
              {/* Quick interactive test input */}
              <div className="flex gap-2 mb-4">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter Token (e.g. CR-2025-0982)"
                  className="text-xs px-3 py-1.5 border border-outline-variant rounded flex-1 font-mono focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <button 
                  onClick={() => handleSimulateSearch()}
                  className="px-3 py-1.5 bg-surface-container text-primary text-xs font-medium rounded hover:bg-surface-variant cursor-pointer"
                >
                  Inspect
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded bg-surface border border-outline-variant flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-secondary uppercase block">Active Case Token</span>
                    <span className="text-xs font-bold font-mono text-primary">#{trackingResult.token}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-full uppercase font-mono ${trackingResult.statusClass}`}>
                    {trackingResult.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded bg-surface border border-outline-variant">
                    <span className="text-[10px] text-secondary uppercase block">Assigned IO</span>
                    <span className="font-medium text-primary">{trackingResult.officer}</span>
                  </div>
                  <div className="p-3 rounded bg-surface border border-outline-variant">
                    <span className="text-[10px] text-secondary uppercase block">Current Next Step</span>
                    <span className="font-medium text-primary">{trackingResult.nextStep}</span>
                  </div>
                </div>
                <div className="p-3 bg-surface-container-low rounded border border-dashed border-outline text-xs text-secondary flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base">lock</span>
                  <span>Complete chronology, summon details, and digital certified PDF available upon citizen sign in.</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11. FAQ SECTION                                                           */}
      {/* ========================================================================= */}
      <section className="py-16 bg-surface-container-lowest border-b border-outline-variant" id="faq">
        <div className="max-w-4xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-12">
            <span className="text-xs uppercase font-label-md tracking-wider font-semibold text-secondary">Frequently Asked Legal Questions</span>
            <h2 className="font-headline-lg text-headline-lg text-primary font-bold mt-1">
              Statutory Inquiries &amp; Guidance
            </h2>
            <p className="font-body-md text-body-md text-secondary mt-1">
              Clear answers to common questions regarding filing rules, personal privacy, and citizen rights.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                id: 1,
                q: 'How do I submit an online complaint?',
                a: "Click on 'File Complaint' on this portal. Authenticate using your mobile OTP and provide details: incident location, date, time, and witness statement. Upon submission, an acknowledgment token is generated immediately with zero queue time."
              },
              {
                id: 2,
                q: 'Does every complaint automatically become an FIR?',
                a: 'No. Under the Code of Criminal Procedure (CrPC) and Bharatiya Nagarik Suraksha Sanhita (BNSS), an FIR is registered strictly for cognizable offenses (such as burglary, assault, cyber extortion). Non-cognizable matters are registered as Non-Cognizable Reports (NCR) and require permission from a Judicial Magistrate to investigate.'
              },
              {
                id: 3,
                q: 'How can I track my complaint without visiting the police station?',
                a: "Use the 'Live Status' tracker on this page. Enter your unique acknowledgment token to check the current stage, assigned Investigating Officer badge number, and statutory milestones. You also receive SMS notifications at every supervisory checkpoint."
              },
              {
                id: 4,
                q: 'Who has access to view my personal details?',
                a: 'Personal identity credentials and contact information are encrypted under role-based access controls. Only the Investigating Officer, the Station House Officer, and the designated Judicial Magistrate can access unredacted identity files. Complainant details in sensitive matters are shielded under Section 228A protections.'
              },
              {
                id: 5,
                q: 'Is this an official government website?',
                a: 'This platform is an authoritative academic demonstration and UI prototype illustrating modern civic public management, digital governance standards, and criminal procedure transparency. For live emergencies, always dial 112 directly.'
              }
            ].map((faq) => {
              const isOpen = openFaq === faq.id;
              return (
                <div key={faq.id} className="border border-outline-variant rounded overflow-hidden bg-surface">
                  <button 
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full p-4 text-left font-title-md text-sm font-semibold text-primary flex items-center justify-between hover:bg-surface-container-low transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <span className="material-symbols-outlined text-secondary transition-transform duration-200">
                      {isOpen ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="p-4 pt-0 text-xs text-secondary border-t border-outline-variant/60 bg-surface-container-lowest leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 12. EMERGENCY HELPLINE & IMMEDIATE CONTACT STRIP                          */}
      {/* ========================================================================= */}
      <section className="bg-primary-container text-surface-container-lowest py-10 border-t border-outline" id="helpline">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded bg-tertiary-fixed-dim text-primary flex items-center justify-center font-bold text-xl">
              112
            </div>
            <div>
              <h3 className="font-headline-sm text-headline-sm font-bold text-surface-container-lowest">Immediate Emergency Support</h3>
              <p className="text-xs text-surface-variant">National Emergency Response Support System (ERSS) operates 24x7 across all states.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a className="px-5 py-2.5 bg-error text-surface-container-lowest font-medium text-xs rounded hover:opacity-90 flex items-center gap-1.5" href="tel:112">
              <span className="material-symbols-outlined text-base">call</span> Dial 112 (Police)
            </a>
            <a className="px-4 py-2.5 bg-surface-container-lowest text-primary font-medium text-xs rounded hover:bg-surface-container-low flex items-center gap-1.5" href="tel:1091">
              <span className="material-symbols-outlined text-base">support_agent</span> Women Helpline 1091
            </a>
            <a className="px-4 py-2.5 bg-surface-container-lowest text-primary font-medium text-xs rounded hover:bg-surface-container-low flex items-center gap-1.5" href="tel:1930">
              <span className="material-symbols-outlined text-base">lock</span> Cyber Fraud 1930
            </a>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 13. FOOTER                                                                */}
      {/* ========================================================================= */}
      <footer className="docked full-width bottom-0 bg-primary border-t border-primary-container flat text-primary-fixed">
        <div className="w-full px-6 lg:px-12 py-12 flex flex-col md:flex-row justify-between items-center gap-6 mx-auto">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="font-headline-sm text-headline-sm font-bold text-surface-container-lowest">CaseSync</span>
              <span className="text-xs text-on-primary-container px-2 py-0.5 rounded border border-outline">v2.5 Gov-Sim</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-primary-container max-w-xl">
              © 2025 CaseSync • National Police Service &amp; Law Enforcement Technical Directorate. Academic Demonstration Prototype under Statutory Governance Framework.
            </p>
          </div>
          <div className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-2 text-xs">
            <a className="text-on-primary-container hover:text-surface-container-lowest transition-colors duration-150 underline decoration-tertiary-fixed-dim decoration-2 underline-offset-4" href="#fir-journey">Statutory Guidelines</a>
            <a className="text-on-primary-container hover:text-surface-container-lowest transition-colors duration-150 underline decoration-tertiary-fixed-dim decoration-2 underline-offset-4" href="#transparency">Public Disclosure Log</a>
            <a className="text-on-primary-container hover:text-surface-container-lowest transition-colors duration-150 underline decoration-tertiary-fixed-dim decoration-2 underline-offset-4" href="#fir-journey">Chain of Custody Protocol</a>
            <a className="text-on-primary-container hover:text-surface-container-lowest transition-colors duration-150 underline decoration-tertiary-fixed-dim decoration-2 underline-offset-4" href="#faq">Citizen Privacy Charter</a>
            <a className="text-surface-container-lowest font-medium hover:text-tertiary-fixed transition-colors duration-150 underline decoration-tertiary-fixed-dim decoration-2 underline-offset-4" href="tel:112">Helpline 112</a>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 14. MODAL: FILE COMPLAINT DIALOGUE                                        */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#14213D]/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-xl rounded-lg border border-outline-variant shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-primary text-surface-container-lowest px-6 py-4 flex items-center justify-between border-b border-primary-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary-fixed-dim">edit_note</span>
                <h3 className="font-title-md font-bold">Lodge Incident Complaint</h3>
              </div>
              <button 
                onClick={resetModal}
                className="text-surface-variant hover:text-surface-container-lowest cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Body */}
            {complaintSuccessToken ? (
              <div className="p-6 text-center space-y-4">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-3xl">verified</span>
                </div>
                <h4 className="font-headline-sm font-bold text-primary">Complaint Token Dispatched</h4>
                <div className="p-3 bg-surface-container rounded font-mono font-bold text-primary text-base">
                  {complaintSuccessToken}
                </div>
                <p className="text-xs text-secondary leading-relaxed">
                  Your formal complaint has been securely timestamped and entered into the Central Police Dispatch Registry. An SMS alert has been transmitted to your mobile number.
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <button 
                    onClick={resetModal}
                    className="px-4 py-2 border border-outline-variant text-xs rounded hover:bg-surface-container"
                  >
                    Close Window
                  </button>
                  <button 
                    onClick={() => {
                      resetModal();
                      navigate('/login');
                    }}
                    className="px-5 py-2 bg-primary-container text-white text-xs font-semibold rounded hover:bg-primary"
                  >
                    Sign In to Track
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleComplaintSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-secondary mb-1">Complainant Full Name *</label>
                  <input 
                    type="text"
                    required
                    value={modalFormData.fullName}
                    onChange={(e) => setModalFormData({ ...modalFormData, fullName: e.target.value })}
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
                      value={modalFormData.mobile}
                      onChange={(e) => setModalFormData({ ...modalFormData, mobile: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full text-xs px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant rounded focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-secondary mb-1">Jurisdiction / District *</label>
                    <select 
                      value={modalFormData.district}
                      onChange={(e) => setModalFormData({ ...modalFormData, district: e.target.value })}
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
                    value={modalFormData.category}
                    onChange={(e) => setModalFormData({ ...modalFormData, category: e.target.value })}
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
                    value={modalFormData.statement}
                    onChange={(e) => setModalFormData({ ...modalFormData, statement: e.target.value })}
                    placeholder="Clearly state date, time, location, suspect description, and sequence of events..."
                    className="w-full text-xs px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant rounded focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="flex items-start gap-2 pt-1">
                  <input 
                    type="checkbox"
                    id="affirmation-check"
                    required
                    checked={modalFormData.affirmed}
                    onChange={(e) => setModalFormData({ ...modalFormData, affirmed: e.target.checked })}
                    className="mt-0.5 rounded-sm border-outline-variant text-primary focus:ring-primary"
                  />
                  <label htmlFor="affirmation-check" className="text-[11px] text-secondary leading-tight cursor-pointer">
                    I solemnly affirm that the statement submitted is accurate to the best of my knowledge under penalty of Section 182 / 211 IPC (False Information to Public Servant).
                  </label>
                </div>
                <div className="pt-3 border-t border-outline-variant flex items-center justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={resetModal}
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
      )}

    </div>
  );
}

export default HomePage;
