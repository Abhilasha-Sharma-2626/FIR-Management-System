import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FileEdit, 
  SearchCheck, 
  Scale, 
  BellRing, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Button from '../components/ui/Button';
import { useLenis } from '../hooks/useLenis';

const CITIZEN_STEPS = [
  {
    step: '1',
    icon: <FileEdit className="w-5 h-5 text-navy" />,
    title: 'Submit a Complaint',
    badge: 'Citizen Submission',
    desc: 'Provide clear, structured details about the incident: what took place, the date and time, the physical location, and any optional supporting evidence such as photos or document scans.',
    takeaway: 'Upon submission, you immediately receive a unique Reference ID to track progress.',
  },
  {
    step: '2',
    icon: <SearchCheck className="w-5 h-5 text-navy" />,
    title: 'Review and Verification',
    badge: 'Station Desk Intake',
    desc: 'Authorized duty desk personnel review the submission to verify police station jurisdiction and assess whether the reported facts constitute a cognizable offence.',
    takeaway: 'If the incident falls outside station jurisdiction, transfer procedures ensure it is directed to the correct precinct.',
  },
  {
    step: '3',
    icon: <Scale className="w-5 h-5 text-navy" />,
    title: 'Appropriate Next Steps',
    badge: 'Authorized Decision',
    desc: 'When an incident discloses a cognizable offence, an authorized officer (Station House Officer) initiates formal FIR registration. For non-cognizable matters, Non-Cognizable Report (NCR) documentation or civil remedies apply.',
    takeaway: 'Important: Complaint submission does not guarantee automatic FIR registration; legal evaluation is required.',
  },
  {
    step: '4',
    icon: <BellRing className="w-5 h-5 text-navy" />,
    title: 'Track Available Updates',
    badge: 'Citizen Monitoring',
    desc: 'Citizens follow authorized status transitions and milestone notifications through their registered dashboard, staying informed of major case events without unnecessary station visits.',
    takeaway: 'Sensitive internal notes are safeguarded while essential public progress is clearly shared.',
  },
];

export function HowItWorksPage() {
  useLenis();

  return (
    <div className="min-h-screen bg-ivory text-ink flex flex-col antialiased selection:bg-navy selection:text-ivory">
      <Navbar />

      <main className="flex-1 pt-28 pb-16 lg:pt-36 lg:pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-saffron-dark bg-saffron/15 px-2.5 py-1 rounded inline-block mb-3">
              Citizen Journey Guide
            </span>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-navy tracking-tight leading-tight">
              From Initial Report to Action
            </h1>
            <p className="mt-4 text-base text-slate leading-relaxed">
              Understand the transparent, step-by-step process your complaint follows through the police case management platform.
            </p>
          </div>

          {/* Legal Distinction Notice Box */}
          <div className="p-4 rounded-xl bg-white border border-borderSoft shadow-subtle mb-12 flex items-start gap-3 text-xs sm:text-sm text-slate leading-relaxed">
            <AlertCircle className="w-5 h-5 text-orangeAccent shrink-0 mt-0.5" />
            <p>
              <strong className="text-navy">Essential Distinction:</strong> Submitting a complaint initiates official review, but <em>does not automatically constitute an FIR</em>. Under Indian law (Bharatiya Nyaya Sanhita), formal FIR registration requires verification of a cognizable offence by authorized police officers.
            </p>
          </div>

          {/* Clean 4-Step Vertical Timeline */}
          <div className="relative pl-6 sm:pl-10 space-y-10 before:absolute before:left-3 sm:before:left-5 before:top-4 before:bottom-4 before:w-[2px] before:bg-borderSoft">
            {CITIZEN_STEPS.map((step) => (
              <div key={step.step} className="relative group">
                
                {/* Node Milestone */}
                <div className="absolute -left-[30px] sm:-left-[38px] top-1.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border-2 border-navy text-navy font-mono text-xs sm:text-sm font-bold flex items-center justify-center shadow-subtle group-hover:bg-navy group-hover:text-white transition-colors">
                  {step.step}
                </div>

                {/* Content Box */}
                <div className="bg-white rounded-xl border border-borderSoft p-6 sm:p-7 shadow-subtle hover:border-slate-light/60 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-saffron-dark">
                      {step.badge}
                    </span>
                    <div className="p-2 rounded-lg bg-ivory text-navy">
                      {step.icon}
                    </div>
                  </div>

                  <h2 className="font-display text-xl font-bold text-navy mb-2">
                    {step.title}
                  </h2>

                  <p className="text-sm text-slate leading-relaxed mb-4">
                    {step.desc}
                  </p>

                  <div className="p-3 rounded-lg bg-ivory border border-borderSoft/80 text-xs font-medium text-ink-soft flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-civicGreen shrink-0" />
                    <span>{step.takeaway}</span>
                  </div>
                </div>

              </div>
            ))}
          </div>

          {/* Action CTA Block */}
          <div className="mt-16 p-8 rounded-2xl bg-white border border-borderSoft text-center shadow-subtle space-y-4">
            <h3 className="font-display text-xl font-bold text-navy">
              Ready to submit an incident report?
            </h3>
            <p className="text-sm text-slate max-w-md mx-auto">
              Create a free citizen account in under a minute to start your submission.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link to="/signup">
                <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Submit a Complaint
                </Button>
              </Link>
              <Link to="/services">
                <Button variant="secondary" size="md">
                  Check Available Services
                </Button>
              </Link>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

export default HowItWorksPage;
