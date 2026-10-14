import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import Button from '../components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-white rounded-2xl border border-borderSoft p-8 text-center shadow-card space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-civicRed/10 text-civicRed flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        
        <h1 className="font-display text-2xl font-bold text-navy">
          Document or Page Not Found
        </h1>
        
        <p className="text-sm text-slate leading-relaxed">
          The requested page or case index record does not exist or has been relocated within the CaseSync directory.
        </p>

        <div className="pt-2 flex items-center justify-center gap-3">
          <Link to="/">
            <Button variant="primary" size="md" leftIcon={<Home className="w-4 h-4" />}>
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
