import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowRight, Search, CheckCircle2, Clock, FileText, ChevronRight } from 'lucide-react';
import Button from '../ui/Button';
import heroImage from '../../assets/images/hero_civic_service.jpg';

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-24 overflow-hidden bg-ivory">
      {/* Background Subtle Editorial Grid / Accents */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#14213D_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Editorial Copy (7 columns) */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Trust Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-borderSoft shadow-subtle">
              <span className="w-2 h-2 rounded-full bg-civicGreen animate-pulse" />
              <span className="text-xs font-semibold text-slate-muted uppercase tracking-wider">
                Digital Citizen Public Safety Initiative
              </span>
            </div>

            {/* Main Editorial Headline */}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-navy tracking-tight leading-[1.12]">
              Justice begins with <br />
              <span className="relative inline-block text-ink">
                being heard.
                <span className="absolute bottom-1 left-0 w-full h-1.5 bg-saffron/70 -z-10 rounded-sm" />
              </span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-slate leading-relaxed max-w-xl font-normal">
              Report incidents, follow your complaint's progress, and stay informed through a transparent, accountable case-management journey.
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link to="/signup">
                <Button
                  variant="primary"
                  size="lg"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="shadow-card"
                >
                  File a Complaint
                </Button>
              </Link>
              <a href="#preview">
                <Button
                  variant="secondary"
                  size="lg"
                  leftIcon={<Search className="w-4 h-4 text-slate" />}
                >
                  Track a Case
                </Button>
              </a>
            </div>

            {/* Trust & Transparency Footnote */}
            <div className="pt-4 border-t border-borderSoft/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-civicGreen shrink-0" />
                <span>Zero arbitrary delays</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-navy shrink-0" />
                <span>Tamper-evident audit trail</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orangeAccent shrink-0" />
                <span>Instant reference ID</span>
              </div>
            </div>
          </div>

          {/* Right Asymmetrical Visual Composition (5 columns) */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Primary Curated Civic Photograph */}
              <div className="relative rounded-2xl overflow-hidden border border-borderSoft shadow-elevated bg-white">
                <img
                  src={heroImage}
                  alt="Dignified citizen engagement at modern civic public service assistance desk in India"
                  className="w-full h-[380px] sm:h-[440px] object-cover object-center filter saturate-[0.92] contrast-[1.03]"
                  width="600"
                  height="440"
                  fetchPriority="high"
                />
                
                {/* Subtle Image Vignette / Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-navy/10 to-transparent pointer-events-none" />

                {/* Caption Tag */}
                <div className="absolute bottom-3 left-4 right-4 text-white text-xs flex items-center justify-between">
                  <span className="font-medium tracking-wide">Public Intake Desk &bull; Central Station</span>
                  <span className="text-[10px] bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded text-white">Active Service</span>
                </div>
              </div>

              {/* Floating Restrained Interface Preview Card */}
              <div className="absolute -bottom-8 -left-6 sm:-left-8 bg-white border border-borderSoft rounded-xl p-4 shadow-elevated max-w-[290px] sm:max-w-[320px] transition-transform duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between border-b border-borderSoft pb-2.5 mb-2.5">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-navy" />
                    <span className="font-mono text-xs font-bold text-navy">FIR-2026-DEL-1049</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-civicGreen/10 text-civicGreen">
                    REGISTERED
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate">
                    <span>Offence Class:</span>
                    <span className="font-medium text-ink">Cognizable (BNS §303)</span>
                  </div>
                  <div className="flex justify-between text-slate">
                    <span>Investigating Officer:</span>
                    <span className="font-medium text-ink">SI Rajesh Verma</span>
                  </div>
                  <div className="flex justify-between text-slate">
                    <span>Jurisdiction:</span>
                    <span className="font-medium text-ink">Vasant Vihar PS</span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-borderSoft flex items-center justify-between text-[11px] text-slate-muted">
                  <span className="flex items-center gap-1 text-civicGreen font-medium">
                    <CheckCircle2 className="w-3 h-3" /> Station House Officer Signed
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate" />
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

export default HeroSection;
