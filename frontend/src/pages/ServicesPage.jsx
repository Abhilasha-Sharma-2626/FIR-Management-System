import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileEdit, 
  Search, 
  Bell, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Button from '../components/ui/Button';
import { useLenis } from '../hooks/useLenis';

export function ServicesPage() {
  const [tokenInput, setTokenInput] = useState('');
  const [trackResult, setTrackResult] = useState(null);

  useLenis();

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    // Direct guidance based on entered reference
    setTrackResult({
      id: tokenInput.trim().toUpperCase(),
      message: 'To view detailed investigation milestones, assigned officer details, and evidence logs, please sign in with your registered citizen account.',
    });
  };

  return (
    <div className="min-h-screen bg-ivory text-ink flex flex-col antialiased selection:bg-navy selection:text-ivory">
      <Navbar />

      <main className="flex-1 pt-28 pb-16 lg:pt-36 lg:pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-saffron-dark bg-saffron/15 px-2.5 py-1 rounded inline-block mb-3">
              Citizen Actions
            </span>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-navy tracking-tight leading-tight">
              Citizen Services &amp; Case Tracking
            </h1>
            <p className="mt-4 text-base text-slate leading-relaxed">
              Access the digital public safety services supported by CaseSync. Submit incident reports, follow updates, and verify case status.
            </p>
          </div>

          {/* Quick Track Input Box */}
          <div className="bg-white rounded-2xl border border-borderSoft p-6 sm:p-8 shadow-subtle mb-14">
            <div className="max-w-2xl mx-auto text-center space-y-4">
              <div className="w-10 h-10 rounded-xl bg-navy/5 text-navy flex items-center justify-center mx-auto">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-navy">
                  Quick Complaint Status Check
                </h2>
                <p className="text-xs sm:text-sm text-slate mt-1">
                  Have an incident reference token (e.g. CMP-2026-8901)? Enter it below to check current intake status.
                </p>
              </div>

              <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto pt-2">
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Enter reference ID"
                  className="flex-1 px-4 py-2.5 text-sm border border-borderSoft rounded-lg bg-ivory/50 focus:outline-none focus:border-navy font-mono"
                  required
                />
                <Button type="submit" variant="primary" size="md">
                  Check Status
                </Button>
              </form>

              {trackResult && (
                <div className="p-4 rounded-xl bg-ivory border border-borderSoft text-left space-y-3 animate-fadeIn mt-4 text-xs sm:text-sm">
                  <div className="flex items-center justify-between pb-2 border-b border-borderSoft">
                    <span className="font-mono font-bold text-navy">Reference: {trackResult.id}</span>
                    <span className="text-xs font-semibold text-civicGreen bg-civicGreen/10 px-2 py-0.5 rounded">
                      Record Active
                    </span>
                  </div>
                  <p className="text-slate leading-relaxed">
                    {trackResult.message}
                  </p>
                  <div className="pt-1 flex gap-2">
                    <Link to="/login">
                      <Button variant="primary" size="sm">
                        Sign In to Access Record
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Core Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            
            <div className="bg-white rounded-2xl border border-borderSoft p-6 sm:p-7 shadow-subtle flex flex-col justify-between space-y-4">
              <div>
                <div className="w-10 h-10 rounded-lg bg-navy/5 text-navy flex items-center justify-center mb-4">
                  <FileEdit className="w-5 h-5" />
                </div>
                <h3 className="font-display text-lg font-bold text-navy mb-2">
                  Online Incident Filing
                </h3>
                <p className="text-xs sm:text-sm text-slate leading-relaxed">
                  Submit detailed incident reports online including date, time, physical location, witness descriptions, and optional media attachments.
                </p>
              </div>
              <Link to="/signup" className="pt-2">
                <Button variant="secondary" size="sm" className="w-full" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Start Report
                </Button>
              </Link>
            </div>

            <div className="bg-white rounded-2xl border border-borderSoft p-6 sm:p-7 shadow-subtle flex flex-col justify-between space-y-4">
              <div>
                <div className="w-10 h-10 rounded-lg bg-navy/5 text-navy flex items-center justify-center mb-4">
                  <Bell className="w-5 h-5" />
                </div>
                <h3 className="font-display text-lg font-bold text-navy mb-2">
                  Authorized Status Alerts
                </h3>
                <p className="text-xs sm:text-sm text-slate leading-relaxed">
                  Receive verifiable status notices when your report passes desk verification, registers as an FIR, or receives an Investigating Officer assignment.
                </p>
              </div>
              <Link to="/login" className="pt-2">
                <Button variant="secondary" size="sm" className="w-full" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  View Your Feed
                </Button>
              </Link>
            </div>

            <div className="bg-white rounded-2xl border border-borderSoft p-6 sm:p-7 shadow-subtle flex flex-col justify-between space-y-4">
              <div>
                <div className="w-10 h-10 rounded-lg bg-navy/5 text-navy flex items-center justify-center mb-4">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-display text-lg font-bold text-navy mb-2">
                  Citizen Privacy & Rights
                </h3>
                <p className="text-xs sm:text-sm text-slate leading-relaxed">
                  Strict PO7 data minimization: personal ID numbers are never saved in full (only the last 4 digits are recorded), protecting citizen identity.
                </p>
              </div>
              <Link to="/how-it-works" className="pt-2">
                <Button variant="secondary" size="sm" className="w-full" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Read Process Guide
                </Button>
              </Link>
            </div>

          </div>

          {/* Help Notice */}
          <div className="p-6 rounded-xl bg-ivory border border-borderSoft flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-navy shrink-0" />
              <p className="text-slate">
                Need clarification regarding whether your incident is cognizable? Review the <Link to="/how-it-works" className="font-semibold text-navy underline">How It Works guide</Link>.
              </p>
            </div>
            <Link to="/how-it-works" className="shrink-0">
              <Button variant="ghost" size="sm">
                Learn More
              </Button>
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

export default ServicesPage;
