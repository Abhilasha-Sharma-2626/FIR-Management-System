import React from 'react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="docked full-width bottom-0 bg-primary border-t border-primary-container flat text-primary-fixed mt-auto">
      <div className="w-full px-6 lg:px-12 py-12 flex flex-col md:flex-row justify-between items-center gap-6 mx-auto max-w-7xl">
        {/* Brand & Purpose */}
        <div className="space-y-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="material-symbols-outlined text-tertiary-fixed-dim">local_police</span>
            <span className="font-headline-sm text-headline-sm font-bold text-surface-container-lowest">CaseSync</span>
            <span className="text-xs text-on-primary-container px-2 py-0.5 rounded border border-outline">v2.5 Gov-Sim</span>
          </div>
          <p className="font-body-sm text-body-sm text-on-primary-container max-w-xl">
            © 2025 CaseSync • National Police Service &amp; Law Enforcement Technical Directorate. Academic Demonstration Prototype under Statutory Governance Framework.
          </p>
        </div>

        {/* Statutory Links */}
        <div className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-2 text-xs">
          <Link className="text-on-primary-container hover:text-surface-container-lowest transition-colors duration-150 underline decoration-tertiary-fixed-dim decoration-2 underline-offset-4" to="/how-it-works">
            FIR Journey
          </Link>
          <Link className="text-on-primary-container hover:text-surface-container-lowest transition-colors duration-150 underline decoration-tertiary-fixed-dim decoration-2 underline-offset-4" to="/services">
            Citizen Services
          </Link>
          <a className="text-on-primary-container hover:text-surface-container-lowest transition-colors duration-150 underline decoration-tertiary-fixed-dim decoration-2 underline-offset-4" href="/#transparency">
            Public Disclosure Log
          </a>
          <a className="text-on-primary-container hover:text-surface-container-lowest transition-colors duration-150 underline decoration-tertiary-fixed-dim decoration-2 underline-offset-4" href="/#faq">
            Citizen Privacy Charter
          </a>
          <a className="text-surface-container-lowest font-medium hover:text-tertiary-fixed transition-colors duration-150 underline decoration-tertiary-fixed-dim decoration-2 underline-offset-4" href="tel:112">
            Emergency 112
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
