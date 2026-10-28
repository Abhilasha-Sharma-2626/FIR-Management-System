import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  Search, 
  ShieldCheck, 
  Scale, 
  FolderLock, 
  ArrowRight, 
  Bell, 
  ChevronRight, 
  UserCheck, 
  AlertTriangle,
  History,
  Stamp,
  Lock
} from 'lucide-react';

const JOURNEY_STAGES = [
  {
    id: 1,
    title: 'Report an Incident',
    subtitle: 'Citizen digital submission with instant verification',
    badge: 'Stage 01 • Citizen Submission',
    desc: 'Citizens file a structured digital incident report from any computer or smartphone. Enter incident specifics, occurrence timeline, location, and attach supporting media securely.',
    legalNote: 'Immediate electronic acknowledgment generated with a tamper-proof Reference ID.',
    highlights: [
      'Encrypted digital form with data minimization',
      'Instant tracking token generated (CMP-2026-8901)',
      'Upload supporting photos, videos, or documents',
    ],
  },
  {
    id: 2,
    title: 'Verification and Review',
    subtitle: 'Desk staff jurisdiction and cognizable offence review',
    badge: 'Stage 02 • Police Station Desk',
    desc: 'Authorized duty desk officers review the complaint to verify station jurisdiction, assess completeness, and evaluate whether the facts constitute a cognizable or non-cognizable offence.',
    legalNote: 'If outside territorial jurisdiction, Zero FIR transfer protocols are initiated without rejection.',
    highlights: [
      'Station jurisdiction validation (Vasant Vihar PS)',
      'Preliminary assessment of offence nature',
      'Direct citizen clarification request mechanism',
    ],
  },
  {
    id: 3,
    title: 'FIR Registration',
    subtitle: 'Formal FIR creation under Bharatiya Nyaya Sanhita (BNS)',
    badge: 'Stage 03 • SHO Approval & Registration',
    desc: 'When an incident discloses a cognizable offence, the Station House Officer (SHO) approves and transactionally registers an official First Information Report with a unique FIR sequence.',
    legalNote: 'Not every complaint automatically becomes an FIR. Non-cognizable matters follow NCR documentation.',
    highlights: [
      'Unique FIR sequence generated (FIR-2026-DEL-1049)',
      'Specific legal sections cataloged (e.g. BNS §303)',
      'Signed and certified by Station House Officer',
    ],
  },
  {
    id: 4,
    title: 'Investigation Workspace',
    subtitle: 'Assigned IO logging evidence with chain of custody',
    badge: 'Stage 04 • Investigating Officer (IO)',
    desc: 'An Investigating Officer (IO) is assigned to the case. All case diaries, witness statements, physical exhibits, and digital evidence are logged with an immutable chain of custody.',
    legalNote: 'Every custody transfer and evidence access action is permanently preserved in the audit log.',
    highlights: [
      'Designated Investigating Officer assignment',
      'Exhibits logged with verification checksums',
      'Chain of custody transfer tracking between labs and court',
    ],
  },
  {
    id: 5,
    title: 'Case Progress & Notifications',
    subtitle: 'Real-time transparent updates for the complainant',
    badge: 'Stage 05 • Citizen Monitoring',
    desc: 'Complainants monitor meaningful case milestones as authorized investigation stages conclude. Receive verified status notifications without visiting the police station repeatedly.',
    legalNote: 'Internal privileged police notes remain protected while public accountability milestones update.',
    highlights: [
      'Transparent milestone tracker with verified timestamps',
      'Automated SMS & portal status change notices',
      'Direct access to downloadable status summaries',
    ],
  },
  {
    id: 6,
    title: 'Outcome & Judicial Closure',
    subtitle: 'Final charge sheet or closure report submitted to court',
    badge: 'Stage 06 • Final Disposition',
    desc: 'Upon completing investigation, the final case disposition is recorded. An authorized Charge Sheet or Closure Report is forwarded to the competent judicial magistrate for trial or disposal.',
    legalNote: 'Closure or prosecution adheres strictly to statutory legal procedures under BNSS 2023.',
    highlights: [
      'Charge Sheet filed under Section 193 BNSS',
      'Complete immutable audit dossier generated',
      'Formal closure notification provided to complainant',
    ],
  },
];

export function FIRJourneySection() {
  const [activeStage, setActiveStage] = useState(1);
  const stageRefs = useRef([]);

  // Scroll observer to update active stage naturally as the user scrolls
  useEffect(() => {
    const observers = [];
    const options = {
      root: null,
      rootMargin: '-20% 0px -40% 0px',
      threshold: 0.2,
    };

    stageRefs.current.forEach((el, index) => {
      if (!el) return;
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveStage(index + 1);
          }
        });
      }, options);
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((obs) => obs.disconnect());
  }, []);

  const scrollToStage = (stageId) => {
    setActiveStage(stageId);
    const target = stageRefs.current[stageId - 1];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <section id="journey" className="py-20 lg:py-28 bg-ivory-subtle border-y border-borderSoft relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-borderSoft shadow-subtle mb-4">
            <Scale className="w-3.5 h-3.5 text-saffron-dark" />
            <span className="text-xs font-semibold text-slate-muted uppercase tracking-wider">
              Signature Scroll-Driven FIR Lifecycle
            </span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-navy tracking-tight leading-tight">
            From Your First Report to Resolution.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate leading-relaxed">
            Every report follows a clear, accountable journey. Understand what happens next, track meaningful updates, and stay informed at every stage.
          </p>
        </div>

        {/* Interactive Stage Step Indicator Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none border-b border-borderSoft">
          {JOURNEY_STAGES.map((s) => (
            <button
              key={s.id}
              onClick={() => scrollToStage(s.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                activeStage === s.id
                  ? 'bg-navy text-white shadow-subtle'
                  : 'bg-white text-slate hover:text-navy border border-borderSoft'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                  activeStage === s.id ? 'bg-saffron text-navy font-bold' : 'bg-slate-soft text-slate'
                }`}
              >
                {s.id}
              </span>
              <span>{s.title}</span>
            </button>
          ))}
        </div>

        {/* Journey Grid: Left Narrative + Right Sticky Dynamic Canvas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start relative">
          
          {/* Left Column: 6 Sequential Stages with Vertical Progress Path */}
          <div className="lg:col-span-6 space-y-12 lg:space-y-24 relative pl-8 lg:pl-10">
            {/* Continuous Vertical Connecting Line */}
            <div className="absolute left-[15px] top-4 bottom-8 w-[2px] bg-borderSoft">
              <div
                className="w-full bg-saffron transition-all duration-500 ease-out"
                style={{
                  height: `${((activeStage - 1) / (JOURNEY_STAGES.length - 1)) * 100}%`,
                }}
              />
            </div>

            {JOURNEY_STAGES.map((stage, idx) => {
              const isActive = activeStage === stage.id;
              const isPast = activeStage > stage.id;

              return (
                <div
                  key={stage.id}
                  ref={(el) => (stageRefs.current[idx] = el)}
                  className={`relative transition-all duration-300 ${
                    isActive ? 'opacity-100' : 'opacity-65 hover:opacity-90'
                  }`}
                >
                  {/* Milestone Node on the Line */}
                  <div
                    className={`absolute -left-[31px] lg:-left-[33px] top-1.5 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2 ${
                      isActive
                        ? 'bg-navy border-saffron text-saffron scale-110 shadow-card'
                        : isPast
                        ? 'bg-civicGreen border-civicGreen text-white'
                        : 'bg-white border-borderSoft text-slate'
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="w-4 h-4" /> : stage.id}
                  </div>

                  {/* Stage Narrative Card */}
                  <div
                    className={`p-6 sm:p-7 rounded-2xl transition-all duration-300 border ${
                      isActive
                        ? 'bg-white border-borderSoft shadow-card'
                        : 'bg-transparent border-transparent'
                    }`}
                  >
                    <span className="text-xs font-bold uppercase tracking-wider text-saffron-dark block mb-1">
                      {stage.badge}
                    </span>
                    <h3 className="font-display text-2xl font-bold text-navy mb-2">
                      {stage.title}
                    </h3>
                    <p className="text-sm font-medium text-ink-muted mb-3">
                      {stage.subtitle}
                    </p>
                    <p className="text-sm text-slate leading-relaxed mb-4">
                      {stage.desc}
                    </p>

                    {/* Highlights Checklist */}
                    <div className="space-y-2 mb-4">
                      {stage.highlights.map((h, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-ink-soft">
                          <CheckCircle2 className="w-3.5 h-3.5 text-civicGreen mt-0.5 shrink-0" />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>

                    {/* Legal / Policy Note */}
                    <div className="p-3 rounded-lg bg-ivory border border-borderSoft/80 text-xs text-slate-muted italic">
                      {stage.legalNote}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Sticky Dynamic Mockup Showcase (Desktop Pinned) */}
          <div className="lg:col-span-6 lg:sticky lg:top-28">
            <div className="bg-white border border-borderSoft rounded-2xl p-5 sm:p-6 shadow-elevated transition-all duration-500 overflow-hidden relative min-h-[510px]">
              
              {/* Mockup Canvas Header */}
              <div className="flex items-center justify-between border-b border-borderSoft pb-4 mb-5">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-civicRed/70" />
                  <span className="w-3 h-3 rounded-full bg-saffron/70" />
                  <span className="w-3 h-3 rounded-full bg-civicGreen/70" />
                  <span className="ml-2 font-mono text-xs text-slate-muted">
                    CaseSync Engine &bull; Stage {activeStage} of 6
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-navy bg-navy/5 px-2.5 py-0.5 rounded-full">
                  Verified Demonstration Flow
                </span>
              </div>

              {/* Dynamic View: Rendered based on activeStage */}
              <div className="transition-opacity duration-300">
                {activeStage === 1 && <Stage1ReportPreview />}
                {activeStage === 2 && <Stage2ReviewPreview />}
                {activeStage === 3 && <Stage3FIRDocumentPreview />}
                {activeStage === 4 && <Stage4InvestigationPreview />}
                {activeStage === 5 && <Stage5TrackingPreview />}
                {activeStage === 6 && <Stage6ClosurePreview />}
              </div>

              {/* Progress Summary Footer */}
              <div className="mt-6 pt-4 border-t border-borderSoft flex items-center justify-between text-xs text-slate">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-civicGreen" />
                  ACID Workflow &bull; Role-Based Isolation
                </span>
                <span className="font-mono text-[11px] text-slate-muted">
                  BNS-Compliant Model
                </span>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

// ---------------- STAGE 1: COMPLAINT FORM PREVIEW ----------------
function Stage1ReportPreview() {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between bg-ivory p-3 rounded-lg border border-borderSoft">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-muted block">
            Digital Intake Portal
          </span>
          <span className="font-semibold text-sm text-navy">Online Incident Submission</span>
        </div>
        <span className="text-xs font-mono font-bold text-saffron-dark bg-saffron/10 px-2.5 py-1 rounded">
          CMP-2026-8901
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-white p-3 rounded-lg border border-borderSoft">
          <label className="text-[11px] font-semibold text-slate-muted block mb-1">Incident Classification</label>
          <div className="font-medium text-ink flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orangeAccent" />
            Residential Trespass / Burglary
          </div>
        </div>
        <div className="bg-white p-3 rounded-lg border border-borderSoft">
          <label className="text-[11px] font-semibold text-slate-muted block mb-1">Occurrence Time</label>
          <div className="font-medium text-ink">14 Oct 2026, 21:45 IST</div>
        </div>
      </div>

      <div className="bg-white p-3 rounded-lg border border-borderSoft text-xs">
        <label className="text-[11px] font-semibold text-slate-muted block mb-1">Incident Location</label>
        <div className="font-medium text-ink">Flat 402, Block C, Vasant Vihar, New Delhi - 110057</div>
      </div>

      <div className="bg-white p-3 rounded-lg border border-borderSoft text-xs">
        <label className="text-[11px] font-semibold text-slate-muted block mb-1">Brief Description</label>
        <p className="text-slate line-clamp-2">
          Upon returning from work, complainant found rear balcony grille forced open. Electronic devices and locked storage locker disturbed.
        </p>
      </div>

      <div className="bg-ivory p-3 rounded-lg border border-dashed border-borderSoft flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate">
          <FileText className="w-4 h-4 text-navy" />
          <span>cctv_exterior_hallway.mp4 (14.2 MB)</span>
        </div>
        <span className="text-[11px] font-bold text-civicGreen">Attached &bull; File Verified</span>
      </div>

      <div className="bg-civicGreen/10 border border-civicGreen/20 p-2.5 rounded-lg flex items-center justify-between text-xs text-civicGreen">
        <span className="flex items-center gap-1.5 font-semibold">
          <CheckCircle2 className="w-4 h-4" /> Verification Token Ready
        </span>
        <span className="text-[11px]">Instant SMS Sent</span>
      </div>
    </div>
  );
}

// ---------------- STAGE 2: DESK REVIEW PREVIEW ----------------
function Stage2ReviewPreview() {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between bg-ivory p-3 rounded-lg border border-borderSoft">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-muted block">
            Station Duty Officer Desk
          </span>
          <span className="font-semibold text-sm text-navy">Preliminary Intake Verification</span>
        </div>
        <span className="text-xs font-bold text-orangeAccent bg-orangeAccent/10 px-2.5 py-1 rounded">
          STATUS: UNDER REVIEW
        </span>
      </div>

      <div className="bg-white p-3 rounded-lg border border-borderSoft space-y-2 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-slate">Reviewing Officer:</span>
          <span className="font-medium text-ink">Head Constable M. Sharma (Badge #883)</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate">Police Station Jurisdiction:</span>
          <span className="font-medium text-ink flex items-center gap-1 text-civicGreen">
            <CheckCircle2 className="w-3.5 h-3.5" /> Vasant Vihar PS (Confirmed)
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate">Offence Threshold:</span>
          <span className="font-medium text-ink">Cognizable Offence Disclosed</span>
        </div>
      </div>

      {/* Review Checklist */}
      <div className="space-y-2">
        <div className="p-2.5 rounded bg-white border border-borderSoft flex items-center justify-between text-xs">
          <span className="text-slate">Complainant Identity Proof Verified:</span>
          <span className="font-mono text-ink font-semibold">AADHAAR-XX-7819</span>
        </div>
        <div className="p-2.5 rounded bg-white border border-borderSoft flex items-center justify-between text-xs">
          <span className="text-slate">Cognizable Check (Section 173 BNSS):</span>
          <span className="text-civicGreen font-semibold">Recommended for Formal FIR</span>
        </div>
        <div className="p-2.5 rounded bg-white border border-borderSoft flex items-center justify-between text-xs">
          <span className="text-slate">Forwarded to Station House Officer:</span>
          <span className="text-navy font-semibold">Inspector V. K. Tyagi (SHO)</span>
        </div>
      </div>

      <div className="bg-navy/5 border border-navy/10 p-3 rounded-lg text-xs text-navy flex items-start gap-2">
        <UserCheck className="w-4 h-4 text-navy mt-0.5 shrink-0" />
        <p className="leading-snug">
          Desk verification completed in 14 minutes. Complaint forwarded to SHO approval queue for transactional registration.
        </p>
      </div>
    </div>
  );
}

// ---------------- STAGE 3: FIR DOCUMENT PREVIEW ----------------
function Stage3FIRDocumentPreview() {
  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Official FIR Header */}
      <div className="bg-navy text-white p-4 rounded-xl shadow-subtle text-xs relative overflow-hidden">
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="text-[10px] tracking-widest uppercase text-saffron font-bold">
              Formal First Information Report
            </span>
            <h4 className="font-mono text-base font-bold">FIR NO: FIR-2026-DEL-1049</h4>
          </div>
          <span className="text-[10px] font-bold bg-civicGreen text-white px-2.5 py-0.5 rounded">
            OFFICIALLY REGISTERED
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-slate-300 text-[11px] pt-2 border-t border-white/10">
          <div>Station: Vasant Vihar PS (SW Dist)</div>
          <div>Registered: 15 Oct 2026, 09:30 IST</div>
        </div>
      </div>

      {/* Legal Sections Invoked */}
      <div className="bg-white p-3.5 rounded-lg border border-borderSoft text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-muted uppercase tracking-wider text-[11px]">
            Statutory Sections Invoked
          </span>
          <span className="text-[11px] text-navy font-medium">BNS 2023 Scheme</span>
        </div>
        <div className="space-y-1.5 pt-1">
          <div className="p-2 rounded bg-ivory flex justify-between items-center font-medium">
            <span className="text-navy">Bharatiya Nyaya Sanhita (BNS) §303</span>
            <span className="text-slate-muted text-[11px]">Theft in Dwelling House</span>
          </div>
          <div className="p-2 rounded bg-ivory flex justify-between items-center font-medium">
            <span className="text-navy">Bharatiya Nyaya Sanhita (BNS) §331(4)</span>
            <span className="text-slate-muted text-[11px]">Lurking House-Trespass</span>
          </div>
        </div>
      </div>

      {/* Station Authority Stamp */}
      <div className="bg-white p-3 rounded-lg border border-borderSoft flex items-center justify-between text-xs">
        <div className="space-y-0.5">
          <span className="text-[10px] uppercase font-bold text-slate-muted">Endorsed By</span>
          <p className="font-semibold text-ink">Inspector V. K. Tyagi, SHO</p>
          <p className="text-[11px] text-slate">Digital Signature Verified (Token #SG-9014)</p>
        </div>
        <div className="w-14 h-14 rounded-full border-2 border-navy text-navy flex flex-col items-center justify-center rotate-[-12deg] opacity-80">
          <Stamp className="w-5 h-5 text-navy" />
          <span className="text-[8px] font-bold uppercase tracking-tighter">REGISTERED</span>
        </div>
      </div>
    </div>
  );
}

// ---------------- STAGE 4: INVESTIGATION PREVIEW ----------------
function Stage4InvestigationPreview() {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between bg-ivory p-3 rounded-lg border border-borderSoft">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-muted block">
            Investigation & Chain of Custody
          </span>
          <span className="font-semibold text-sm text-navy">IO: SI Rajesh Verma (Badge #418)</span>
        </div>
        <span className="text-xs font-bold text-navy bg-navy/10 px-2.5 py-1 rounded">
          IN PROGRESS
        </span>
      </div>

      {/* Evidence Exhibits Table */}
      <div className="bg-white rounded-lg border border-borderSoft overflow-hidden text-xs">
        <div className="bg-ivory px-3 py-2 border-b border-borderSoft font-semibold text-slate-muted flex justify-between">
          <span>Logged Exhibits</span>
          <span>Custody Status</span>
        </div>
        <div className="divide-y divide-borderSoft">
          <div className="p-2.5 flex justify-between items-center">
            <div>
              <span className="font-medium text-ink block">EX-01: USB Flash (CCTV Video)</span>
              <span className="text-[10px] font-mono text-slate">Checksum: 4a9f...e108</span>
            </div>
            <span className="text-[11px] font-bold text-civicGreen bg-civicGreen/10 px-2 py-0.5 rounded">
              Forensic Lab Dispatched
            </span>
          </div>
          <div className="p-2.5 flex justify-between items-center">
            <div>
              <span className="font-medium text-ink block">EX-02: Fingerprint Lift Impressions</span>
              <span className="text-[10px] text-slate">Balcony window frame sample</span>
            </div>
            <span className="text-[11px] font-bold text-navy bg-navy/10 px-2 py-0.5 rounded">
              Malkhana Locker #12
            </span>
          </div>
        </div>
      </div>

      {/* Chain of Custody Audit Log */}
      <div className="bg-white p-3 rounded-lg border border-borderSoft space-y-2 text-xs">
        <div className="flex items-center gap-1.5 text-navy font-semibold">
          <History className="w-3.5 h-3.5" />
          <span>Chain of Custody Events</span>
        </div>
        <div className="space-y-1.5 text-[11px] text-slate pl-2 border-l border-navy/20">
          <div>&bull; 15 Oct, 11:30 - Recovered by SI Verma from scene.</div>
          <div>&bull; 15 Oct, 14:15 - Handed over to Malkhana In-Charge HC Singh.</div>
          <div>&bull; 16 Oct, 10:00 - Requisitioned for State Cyber Laboratory analysis.</div>
        </div>
      </div>
    </div>
  );
}

// ---------------- STAGE 5: CITIZEN TRACKING PREVIEW ----------------
function Stage5TrackingPreview() {
  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Tracking Header */}
      <div className="bg-ivory p-3.5 rounded-lg border border-borderSoft flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-muted block">
            Citizen Case Tracking
          </span>
          <span className="font-mono text-sm font-bold text-navy">FIR-2026-DEL-1049</span>
        </div>
        <span className="text-xs font-bold text-civicGreen bg-civicGreen/10 px-2.5 py-1 rounded">
          Active Investigation
        </span>
      </div>

      {/* Citizen Viewable Milestones */}
      <div className="space-y-2 text-xs">
        <div className="p-2.5 rounded-lg bg-white border border-borderSoft flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-civicGreen shrink-0" />
            <span className="text-ink font-medium">Incident Report Submitted</span>
          </div>
          <span className="text-slate text-[11px]">14 Oct, 21:50</span>
        </div>
        <div className="p-2.5 rounded-lg bg-white border border-borderSoft flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-civicGreen shrink-0" />
            <span className="text-ink font-medium">Station Intake & Jurisdiction Approved</span>
          </div>
          <span className="text-slate text-[11px]">15 Oct, 09:15</span>
        </div>
        <div className="p-2.5 rounded-lg bg-white border border-borderSoft flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-civicGreen shrink-0" />
            <span className="text-ink font-medium">FIR Officially Registered & Sections Attached</span>
          </div>
          <span className="text-slate text-[11px]">15 Oct, 09:30</span>
        </div>
        <div className="p-2.5 rounded-lg bg-white border border-borderSoft flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-orangeAccent shrink-0" />
            <span className="text-navy font-semibold">Forensic Lab Analysis Pending</span>
          </div>
          <span className="text-orangeAccent text-[11px] font-medium">In Progress</span>
        </div>
      </div>

      {/* Simulated Notification Alert */}
      <div className="p-3 rounded-lg bg-saffron/10 border border-saffron/30 flex items-start gap-2.5 text-xs text-navy">
        <Bell className="w-4 h-4 text-orangeAccent mt-0.5 shrink-0" />
        <div>
          <span className="font-semibold block">Automated Notification</span>
          <span className="text-slate">
            "Your case FIR-2026-DEL-1049 status updated: Investigating Officer has collected forensic exhibits."
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------- STAGE 6: CLOSURE PREVIEW ----------------
function Stage6ClosurePreview() {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between bg-ivory p-3 rounded-lg border border-borderSoft">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-muted block">
            Statutory Judicial Disposition
          </span>
          <span className="font-semibold text-sm text-navy">Investigation Concluded</span>
        </div>
        <span className="text-xs font-bold text-civicGreen bg-civicGreen/10 px-2.5 py-1 rounded">
          DISPOSITION FILED
        </span>
      </div>

      {/* Final Report Details */}
      <div className="bg-white p-3.5 rounded-lg border border-borderSoft space-y-2.5 text-xs">
        <div className="flex justify-between items-center pb-2 border-b border-borderSoft">
          <span className="text-slate">Statutory Final Report:</span>
          <span className="font-semibold text-navy">Charge Sheet (Section 193 BNSS)</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate">Competent Court:</span>
          <span className="font-medium text-ink">Metropolitan Magistrate Court #04, Patiala House</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate">Accused Apprehended & Named:</span>
          <span className="font-medium text-ink">1 Charged, Property Recovered</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate">Case File Audit Trail:</span>
          <span className="font-mono text-civicGreen font-semibold">Verified Intact</span>
        </div>
      </div>

      {/* Integrity Badge */}
      <div className="bg-navy text-white p-3.5 rounded-xl shadow-subtle flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-saffron" />
          <div>
            <span className="font-bold block">Accountable Citizen Justice</span>
            <span className="text-slate-300 text-[11px]">Full transparency from report to court trial</span>
          </div>
        </div>
        <span className="bg-white/10 px-2.5 py-1 rounded text-saffron font-bold text-[11px]">
          SDG 16
        </span>
      </div>
    </div>
  );
}

export default FIRJourneySection;
