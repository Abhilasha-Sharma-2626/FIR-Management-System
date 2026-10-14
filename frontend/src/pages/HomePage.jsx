import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Search, 
  ShieldCheck, 
  FileText, 
  Clock, 
  CheckCircle2, 
  HelpCircle,
  FileEdit,
  Activity,
  BellRing,
  ExternalLink
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Button from '../components/ui/Button';
import Accordion from '../components/ui/Accordion';
import heroImage from '../assets/images/hero_civic_service.jpg';
import { useLenis } from '../hooks/useLenis';

const HOME_FAQ = [
  {
    title: 'How do I submit an incident report?',
    content: (
      <p>
        Create a citizen account or sign in, then navigate to "Submit a Complaint". Provide the incident details, date, location, and optional evidence attachments. You will instantly receive a digital reference ID to monitor progress.
      </p>
    ),
  },
  {
    title: 'Does every complaint automatically become an FIR?',
    content: (
      <p>
        <strong>No.</strong> An FIR is formally registered by police officers only when the complaint discloses a <em>cognizable offence</em> under the Bharatiya Nyaya Sanhita (BNS). Non-cognizable matters follow Non-Cognizable Report (NCR) documentation or appropriate civil procedures.
      </p>
    ),
  },
  {
    title: 'How can I track the status of my complaint?',
    content: (
      <p>
        Use your reference token on the <Link to="/services" className="text-navy font-semibold underline">Services page</Link> or log into your citizen dashboard to view assigned investigating officer information and authorized milestone notices.
      </p>
    ),
  },
  {
    title: 'Is this an official government police website?',
    content: (
      <p>
        <strong>No. CaseSync is an academic demonstration prototype</strong> developed for a university database management systems curriculum. For immediate real-world emergency assistance in India, please dial <strong>112</strong> or visit your local police station.
      </p>
    ),
  },
];

export function HomePage() {
  useLenis();

  return (
    <div className="min-h-screen bg-ivory text-ink flex flex-col antialiased selection:bg-navy selection:text-ivory">
      <Navbar />

      <main className="flex-1">
        
        {/* ================= 1. HERO SECTION ================= */}
        <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-20 overflow-hidden bg-ivory">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
              
              {/* Left Column: Editorial Headline & Actions */}
              <div className="lg:col-span-7 space-y-6 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-borderSoft shadow-subtle">
                  <span className="w-2 h-2 rounded-full bg-civicGreen" />
                  <span className="text-[11px] font-semibold text-slate-muted uppercase tracking-wider">
                    Online Police Case Management
                  </span>
                </div>

                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-navy tracking-tight leading-[1.12]">
                  Justice begins with <br />
                  <span className="relative inline-block text-ink">
                    being heard.
                    <span className="absolute bottom-1 left-0 w-full h-1.5 bg-saffron/70 -z-10 rounded-sm" />
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-slate leading-relaxed max-w-xl font-normal">
                  Submit a complaint, understand the next steps, and stay informed about available updates through a transparent digital experience.
                </p>

                {/* Clear Citizen CTAs */}
                <div className="flex flex-wrap items-center gap-3.5 pt-2">
                  <Link to="/signup">
                    <Button
                      variant="primary"
                      size="lg"
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                      className="shadow-card font-semibold"
                    >
                      Submit a Complaint
                    </Button>
                  </Link>
                  <Link to="/services">
                    <Button
                      variant="secondary"
                      size="lg"
                      leftIcon={<Search className="w-4 h-4 text-slate" />}
                      className="font-medium"
                    >
                      Track a Complaint
                    </Button>
                  </Link>
                </div>

                {/* Subtle Trust Indicators */}
                <div className="pt-4 border-t border-borderSoft/80 flex flex-wrap gap-5 text-xs text-slate-muted">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-civicGreen shrink-0" />
                    Instant Reference Token
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-navy shrink-0" />
                    PO7 Data Minimization
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-orangeAccent shrink-0" />
                    Transparent Status Alerts
                  </span>
                </div>
              </div>

              {/* Right Column: Restrained Editorial Visual */}
              <div className="lg:col-span-5 relative">
                <div className="relative mx-auto max-w-md lg:max-w-none">
                  <div className="rounded-2xl overflow-hidden border border-borderSoft shadow-elevated bg-white">
                    <img
                      src={heroImage}
                      alt="Dignified citizen engagement at modern civic public assistance desk"
                      className="w-full h-[360px] sm:h-[420px] object-cover object-center filter saturate-[0.92] contrast-[1.03]"
                      width="600"
                      height="420"
                      fetchPriority="high"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-3 left-4 right-4 text-white text-xs flex items-center justify-between">
                      <span className="font-medium">Public Assistance Desk &bull; Central Station</span>
                      <span className="text-[10px] bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded text-white">Active Service</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>


        {/* ================= 2. CITIZEN JOURNEY OVERVIEW ================= */}
        <section className="py-16 lg:py-20 bg-white border-y border-borderSoft">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div className="max-w-2xl">
                <span className="text-xs font-bold uppercase tracking-wider text-saffron-dark block mb-1.5">
                  Citizen-First Workflow
                </span>
                <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-navy tracking-tight">
                  How Your Report Progresses
                </h2>
              </div>
              <Link to="/how-it-works">
                <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  View Detailed 4-Step Process
                </Button>
              </Link>
            </div>

            {/* 4 Clean Steps Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  step: '01',
                  title: 'Submit Incident',
                  desc: 'Provide incident details, location, and optional media securely through the online intake portal.',
                },
                {
                  step: '02',
                  title: 'Desk Verification',
                  desc: 'Station personnel verify territorial jurisdiction and assess the offence parameters.',
                },
                {
                  step: '03',
                  title: 'Appropriate Action',
                  desc: 'If cognizable, formal FIR registration is initiated with SHO approval and IO assignment.',
                },
                {
                  step: '04',
                  title: 'Track Available Updates',
                  desc: 'Follow status changes and notifications directly from your citizen account without station visits.',
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="p-6 rounded-xl bg-ivory border border-borderSoft hover:border-slate-light/60 transition-colors"
                >
                  <span className="font-mono text-xs font-bold text-saffron-dark bg-saffron/15 px-2 py-0.5 rounded inline-block mb-3">
                    Step {item.step}
                  </span>
                  <h3 className="font-display text-base font-bold text-navy mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ================= 3. SUPPORTED CITIZEN SERVICES ================= */}
        <section className="py-16 lg:py-20 bg-ivory">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-saffron-dark block mb-1.5">
                Core Capabilities
              </span>
              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-navy tracking-tight">
                Built for Clarity, Not Complexity
              </h2>
              <p className="mt-2 text-sm text-slate leading-relaxed">
                The public portal gives citizens the essential tools needed to interact with public safety services transparently.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-7 rounded-2xl bg-white border border-borderSoft shadow-subtle space-y-3">
                <div className="w-10 h-10 rounded-lg bg-navy/5 text-navy flex items-center justify-center">
                  <FileEdit className="w-5 h-5" />
                </div>
                <h3 className="font-display text-lg font-bold text-navy">
                  Digital Incident Filing
                </h3>
                <p className="text-xs sm:text-sm text-slate leading-relaxed">
                  Structured reporting capturing time, location, witness notes, and file attachments without repetitive paperwork.
                </p>
              </div>

              <div className="p-7 rounded-2xl bg-white border border-borderSoft shadow-subtle space-y-3">
                <div className="w-10 h-10 rounded-lg bg-navy/5 text-navy flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="font-display text-lg font-bold text-navy">
                  Milestone Tracking
                </h3>
                <p className="text-xs sm:text-sm text-slate leading-relaxed">
                  Real-time visibility into whether your complaint is under review, registered, or assigned to an officer.
                </p>
              </div>

              <div className="p-7 rounded-2xl bg-white border border-borderSoft shadow-subtle space-y-3">
                <div className="w-10 h-10 rounded-lg bg-navy/5 text-navy flex items-center justify-center">
                  <BellRing className="w-5 h-5" />
                </div>
                <h3 className="font-display text-lg font-bold text-navy">
                  Status Notifications
                </h3>
                <p className="text-xs sm:text-sm text-slate leading-relaxed">
                  Stay updated when authorized transitions take place, ensuring institutional accountability at every step.
                </p>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Link to="/services" className="text-xs font-semibold text-navy hover:text-orangeAccent inline-flex items-center gap-1">
                Explore all available citizen services &rarr;
              </Link>
            </div>
          </div>
        </section>


        {/* ================= 4. COMPACT FAQ ================= */}
        <section className="py-16 lg:py-20 bg-white border-t border-borderSoft">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-ivory border border-borderSoft text-xs font-semibold text-slate-muted mb-2">
                <HelpCircle className="w-3.5 h-3.5 text-navy" />
                <span>Frequently Asked Questions</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-navy">
                Clear Answers for Citizens
              </h2>
            </div>

            <Accordion items={HOME_FAQ} allowMultiple={false} />
          </div>
        </section>


        {/* ================= 5. MINIMAL CLOSING CTA ================= */}
        <section className="py-16 bg-ivory border-t border-borderSoft text-center">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-navy">
              Ready to submit or check a complaint?
            </h2>
            <p className="text-sm text-slate max-w-lg mx-auto">
              Get started by creating an account or check available services in seconds.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link to="/signup">
                <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Submit a Complaint
                </Button>
              </Link>
              <Link to="/services">
                <Button variant="secondary" size="md">
                  Track a Complaint
                </Button>
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}

export default HomePage;
