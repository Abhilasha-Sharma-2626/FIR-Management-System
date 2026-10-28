import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowRight, Search } from 'lucide-react';
import Button from '../ui/Button';

export function FinalCTA() {
  return (
    <section className="py-20 lg:py-24 bg-ivory border-t border-borderSoft relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
        
        {/* Subtle Brand Shield */}
        <div className="w-12 h-12 rounded-2xl bg-navy text-saffron flex items-center justify-center mx-auto mb-6 shadow-card">
          <Shield className="w-6 h-6 fill-saffron/20 stroke-saffron" />
        </div>

        <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-navy tracking-tight leading-tight max-w-2xl mx-auto">
          Accountable Public Safety Starts with Transparent Action.
        </h2>

        <p className="mt-4 text-base sm:text-lg text-slate max-w-xl mx-auto leading-relaxed">
          Submit an incident report securely online or look up the verified progress of an active case with complete data transparency.
        </p>

        {/* Two Primary Actions */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
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

        <div className="mt-8 text-xs text-slate-muted">
          <span>Protected by tamper-evident audit logging &bull; PO7 Data Minimization</span>
        </div>

      </div>
    </section>
  );
}

export default FinalCTA;
