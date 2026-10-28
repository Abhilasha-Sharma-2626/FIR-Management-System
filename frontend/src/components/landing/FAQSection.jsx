import React from 'react';
import Accordion from '../ui/Accordion';
import { HelpCircle } from 'lucide-react';

const FAQ_ITEMS = [
  {
    title: 'How do I submit an incident report or complaint?',
    content: (
      <div className="space-y-2">
        <p>
          Citizens can submit a report by registering an account with their name, email, and optional phone/ID proof (last 4 digits only). Navigate to the "File a Complaint" portal, fill in incident details including date, location, category (e.g. theft, cybercrime, property damage), and attach supporting files like photos or video clips.
        </p>
        <p>
          Upon submission, you immediately receive a unique tracking token (e.g., <code className="font-mono bg-ivory px-1.5 py-0.5 rounded text-navy font-semibold">CMP-2026-XXXX</code>) to follow intake progress.
        </p>
      </div>
    ),
  },
  {
    title: 'Does every complaint automatically become an FIR?',
    content: (
      <div className="space-y-2">
        <p>
          <strong>No, and this distinction is legally critical.</strong> Under Indian criminal procedure, a First Information Report (FIR) is formally registered by police officers only when the reported incident discloses a <em>cognizable offence</em> (such as burglary, robbery, or severe assault).
        </p>
        <p>
          If an incident is non-cognizable, it is recorded as a Non-Cognizable Report (NCR) or addressed through appropriate civil/dispute mechanisms. In CaseSync, station desk officers conduct preliminary review before the Station House Officer (SHO) approves formal FIR registration.
        </p>
      </div>
    ),
  },
  {
    title: 'How can I track the progress of my complaint or case?',
    content: (
      <div className="space-y-2">
        <p>
          You can track status in two ways:
        </p>
        <ol className="list-decimal pl-5 space-y-1">
          <li><strong>Public Quick Lookup:</strong> Enter your complaint or FIR reference ID on the tracking portal to see public milestone status.</li>
          <li><strong>Citizen Dashboard:</strong> Log in with your registered account to see assigned officer details, verified chronological event logs, and download official status slips.</li>
        </ol>
      </div>
    ),
  },
  {
    title: 'Will I receive updates and notifications as the case progresses?',
    content: (
      <p>
        Yes. Whenever an authorized status change occurs—such as station desk acceptance, formal FIR registration, assignment of an Investigating Officer (IO), or dispatch of exhibits to forensic laboratories—an automated notification dispatch is generated in your portal feed and notification logs.
      </p>
    ),
  },
  {
    title: 'Who can access sensitive case and investigation details?',
    content: (
      <div className="space-y-2">
        <p>
          CaseSync enforces strict <strong>Role-Based Access Control (RBAC)</strong> backed by database integrity constraints:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Citizens:</strong> Can only view their own filed complaints and public-facing milestones.</li>
          <li><strong>Station Duty Staff:</strong> Can verify incoming intake reports within their police station's jurisdiction.</li>
          <li><strong>Investigating Officers (IO):</strong> Can view and update assigned cases, log evidence, and record witness statements.</li>
          <li><strong>Station House Officers (SHO):</strong> Approve FIR registration, assign IOs, and review final closure reports.</li>
          <li><strong>System Administrators:</strong> Manage station jurisdictions and officer accounts; cannot tamper with immutable audit logs.</li>
        </ul>
      </div>
    ),
  },
  {
    title: 'Is CaseSync an official government or police department portal?',
    content: (
      <div className="p-3.5 bg-ivory rounded-lg border border-borderSoft text-xs space-y-2 text-ink">
        <p>
          <strong>No. CaseSync is an academic demonstration project</strong> developed for a Database Management Systems (DBMS) university curriculum, demonstrating state machines, transactional integrity (ACID), indexing, and audit logging.
        </p>
        <p>
          It is not affiliated with or endorsed by any government entity or state police force. For real emergency assistance in India, always dial <strong>112</strong> or visit your local police station in person.
        </p>
      </div>
    ),
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="py-20 lg:py-28 bg-white border-t border-borderSoft">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ivory border border-borderSoft shadow-subtle mb-4">
            <HelpCircle className="w-3.5 h-3.5 text-navy" />
            <span className="text-xs font-semibold text-slate-muted uppercase tracking-wider">
              Citizen Knowledge Base
            </span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-navy tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate leading-relaxed">
            Essential information regarding complaint submission, statutory FIR thresholds, and role-based privacy standards.
          </p>
        </div>

        {/* Accordion Component */}
        <Accordion items={FAQ_ITEMS} allowMultiple={false} />

      </div>
    </section>
  );
}

export default FAQSection;
