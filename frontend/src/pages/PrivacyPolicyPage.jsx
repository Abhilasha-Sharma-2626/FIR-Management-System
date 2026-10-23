import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

export function PrivacyPolicyPage() {
  const sections = [
    {
      id: 'pii-masking',
      title: '1. Personally Identifiable Information (PII) Redaction & Masking',
      icon: 'shield',
      content: `In strict compliance with statutory law-enforcement standards and the Digital Personal Data Protection (DPDP) Act 2023, national identifiers such as Aadhaar Numbers, Passports, and Voter IDs are masked at the service boundary. Only the trailing 4 characters (e.g. XXXX-XXXX-9941) are ever displayed or recorded in non-privileged operational views. Complainant phone numbers and private addresses are strictly excluded from public tracking endpoints.`
    },
    {
      id: 'audit-trail',
      title: '2. Cryptographic SHA-256 Tamper-Evident Audit Trail',
      icon: 'lock',
      content: `Every read of sensitive files, status transition, case diary submission, and evidence custody handoff is recorded into an immutable, forward-chained audit ledger. Each audit log row incorporates the SHA-256 hash of its predecessor. Database procedural triggers reject any SQL-level UPDATE or DELETE operations on historical criminal records.`
    },
    {
      id: 'rbac-jurisdiction',
      title: '3. Role-Based Access Control & Station Jurisdictional Scoping',
      icon: 'admin_panel_settings',
      content: `Access to criminal investigation files is governed by the Principle of Least Privilege across 7 canonical roles (CITIZEN, DESK_OFFICER, IO, SHO, SUPERVISOR, AUDITOR, ADMIN). Non-supervisory police personnel are cryptographically restricted to their assigned police station jurisdiction. Cross-station queries trigger immediate 403 Forbidden events logged to vigilance audit registers.`
    },
    {
      id: 'data-encryption',
      title: '4. Data In-Transit and At-Rest Encryption',
      icon: 'enhanced_encryption',
      content: `All traffic exchanged with CaseSync endpoints requires TLS 1.3 cipher suites with Strict-Transport-Security (HSTS) headers. Passwords are salted and hashed using bcrypt (work factor 12). Evidentiary digital exhibits uploaded to the Malkhana vault are hashed with SHA-256 upon intake and stored with strict checksum verification.`
    },
    {
      id: 'statutory-rights',
      title: '5. Citizen Statutory Rights & Transparent Recourse',
      icon: 'gavel',
      content: `Under the Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023 and CrPC Section 154, every citizen who files an electronic complaint receives an immutable Tracking ID and an official Acknowledgement Slip with a verification seal. If a complaint is rejected by station triage, citizens possess a statutory right to submit a Rejection Appeal directly to the supervisory Station House Officer and Assistant Commissioner of Police.`
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface antialiased selection:bg-secondary-container selection:text-on-secondary-fixed">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-6 py-12 w-full space-y-10">
        {/* Header Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-secondary font-medium">
          <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">home</span>
            Home
          </Link>
          <span>/</span>
          <span className="text-primary font-semibold">Statutory Governance &amp; Privacy Policy</span>
        </div>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-3"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-fixed text-xs font-semibold font-mono tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            DPDP ACT 2023 &amp; BNSS COMPLIANT
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-primary">
            Statutory Privacy Policy &amp; Evidentiary Data Integrity
          </h1>
          <p className="text-secondary text-sm sm:text-base leading-relaxed max-w-3xl">
            CaseSync operates as a secure law-enforcement and citizen justice platform. We adhere to rigorous standards of digital non-repudiation, tamper-evidence, and strict privacy safeguards.
          </p>
        </motion.div>

        {/* Policy Sections */}
        <div className="space-y-4">
          {sections.map((sec, idx) => (
            <motion.div
              key={sec.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.3 }}
              className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/70 shadow-sm hover:border-primary/40 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-surface-container-low text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-xl">{sec.icon}</span>
                </div>
                <div className="space-y-2">
                  <h2 className="text-base sm:text-lg font-bold text-primary tracking-tight">
                    {sec.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-secondary leading-relaxed font-normal">
                    {sec.content}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Institutional Contact & Oversight Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant text-xs text-secondary space-y-2"
        >
          <div className="flex items-center gap-2 text-primary font-bold">
            <span className="material-symbols-outlined text-base">verified</span>
            Vigilance &amp; Data Protection Officer Contact
          </div>
          <p className="leading-relaxed">
            For statutory inquiries regarding evidentiary records, chain of custody logs, or correction of citizen profile details, citizens may petition the jurisdictional Station House Officer or contact the State Crime Records Bureau (SCRB) Data Privacy Cell at <strong className="text-primary font-mono">dpo@casesync.police.gov.in</strong>.
          </p>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}

export default PrivacyPolicyPage;
