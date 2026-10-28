import React from 'react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="w-full bg-primary border-t border-primary-container text-primary-fixed mt-auto">
      <div className="w-full px-6 lg:px-12 py-10 flex flex-col md:flex-row justify-between items-center gap-6 mx-auto max-w-7xl">
        {/* Brand & Purpose */}
        <div className="space-y-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="material-symbols-outlined text-tertiary-fixed-dim">local_police</span>
            <span className="font-bold text-surface-container-lowest text-lg tracking-tight">CaseSync</span>
            <span className="text-[11px] text-on-primary-container px-2 py-0.5 rounded border border-outline/50 font-mono">v1.0 Production</span>
          </div>
          <p className="text-xs text-on-primary-container max-w-xl leading-relaxed">
            CaseSync Police FIR &amp; Criminal Investigation Management System. Built in compliance with Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023 and IT Act 2000.
          </p>
        </div>

        {/* Statutory Links */}
        <div className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-2 text-xs">
          <Link className="text-on-primary-container hover:text-white transition-colors" to="/fir-journey">
            FIR Journey
          </Link>
          <Link className="text-on-primary-container hover:text-white transition-colors" to="/services">
            Citizen Services
          </Link>
          <Link className="text-on-primary-container hover:text-white transition-colors" to="/live-tracking">
            Track Docket
          </Link>
          <Link className="text-tertiary-fixed font-semibold hover:underline transition-colors" to="/privacy-policy">
            Privacy Policy &amp; PII Charter
          </Link>
          <a className="text-white font-medium hover:text-tertiary-fixed transition-colors flex items-center gap-1" href="tel:112">
            <span className="material-symbols-outlined text-sm text-tertiary-fixed-dim">emergency</span>
            Helpline 112
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
