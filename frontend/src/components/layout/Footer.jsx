import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Scale, CheckCircle2 } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-navy text-ivory border-t border-navy-light/40 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-10">
          
          {/* Brand & Purpose */}
          <div className="md:col-span-2 space-y-3.5">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-navy-light flex items-center justify-center text-saffron border border-saffron/30">
                <Shield className="w-3.5 h-3.5 fill-saffron/20 stroke-saffron" />
              </div>
              <span className="font-display font-bold text-lg text-white tracking-tight">
                CaseSync
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm">
              A transparent, minimal citizen-first platform for filing complaints, understanding FIR processes, and tracking available case updates with institutional accountability.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-saffron font-medium">
              <Scale className="w-3.5 h-3.5 shrink-0" />
              <span>Aligned with UN SDG 16: Equal Access to Justice for All</span>
            </div>
          </div>

          {/* Quick Multi-Page Navigation */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-saffron">
              Public Portal
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Home Overview
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-white transition-colors">
                  How It Works (Citizen Guide)
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white transition-colors">
                  Citizen Services & Tracking
                </Link>
              </li>
              <li>
                <Link to="/signup" className="hover:text-white transition-colors">
                  Submit a Complaint
                </Link>
              </li>
            </ul>
          </div>

          {/* Institutional Integrity & Sign In */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-saffron">
              Access & Integrity
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Citizen & Officer Sign In
                </Link>
              </li>
              <li className="flex items-center gap-1.5 text-xs text-slate-400 pt-1">
                <CheckCircle2 className="w-3 h-3 text-civicGreen shrink-0" />
                <span>PO7 Data Minimization</span>
              </li>
              <li className="flex items-center gap-1.5 text-xs text-slate-400">
                <CheckCircle2 className="w-3 h-3 text-civicGreen shrink-0" />
                <span>Bharatiya Nyaya Sanhita (BNS)</span>
              </li>
              <li className="flex items-center gap-1.5 text-xs text-slate-400">
                <CheckCircle2 className="w-3 h-3 text-civicGreen shrink-0" />
                <span>Role-Based Isolation (RBAC)</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Academic Disclaimer Notice */}
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p className="text-center sm:text-left leading-relaxed max-w-2xl">
            <strong className="text-white">Academic Project Notice:</strong> CaseSync is an educational demonstration prototype developed for an academic database curriculum. It is not an official government or police portal. For emergencies in India, dial <strong>112</strong>.
          </p>
          <p className="shrink-0 text-slate-500">
            &copy; {new Date().getFullYear()} CaseSync.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
