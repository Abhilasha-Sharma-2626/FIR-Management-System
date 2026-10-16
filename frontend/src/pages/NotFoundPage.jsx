import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col justify-between antialiased">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-surface-container-lowest rounded-2xl border border-outline-variant p-8 text-center shadow-card space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-error-container text-error flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-3xl">warning</span>
          </div>
          
          <h1 className="font-headline-lg font-bold text-primary">
            Document Not Found
          </h1>
          
          <p className="text-sm text-secondary leading-relaxed">
            The requested page or case index record does not exist or has been relocated within the CaseSync directory.
          </p>

          <div className="pt-2 flex items-center justify-center gap-3">
            <Link 
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-primary-container text-surface-container-lowest font-medium text-xs hover:bg-primary transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-base">home</span>
              Return to CaseSync Home
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default NotFoundPage;
