import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function DashboardSidebar({ activeNav = 'dockets' }) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const displayName = user?.fullName || user?.email?.split('@')[0] || 'Citizen';
  const citizenId = user?.userId ? `CIT-${String(user.userId).padStart(5, '0')}` : 'CIT-PORTAL';
  const avatarInitials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('') || 'CS';

  return (
    <aside className="w-64 bg-navy-dark text-slate-200 border-r border-navy-light/30 flex flex-col shrink-0 min-h-screen sticky top-0 h-screen z-40 hidden md:flex">
      
      {/* Brand Header */}
      <div className="p-4 border-b border-navy-light/30 flex items-center gap-3">
        <Link to="/" className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-container to-primary flex items-center justify-center text-white ring-1 ring-white/10 shadow-xs shrink-0 focus-visible:ring-2 focus-visible:ring-tertiary-fixed focus-visible:outline-none">
          <span className="material-symbols-outlined text-xl text-tertiary-fixed">local_police</span>
        </Link>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Link to="/" className="text-sm font-bold text-white tracking-tight leading-tight hover:text-amber-300 transition-colors focus-visible:ring-2 focus-visible:ring-tertiary-fixed focus-visible:outline-none">
              CaseSync
            </Link>
            <span className="bg-primary-container text-tertiary-fixed border border-amber-400/30 text-[9px] px-1.5 py-0.5 rounded font-bold">
              GOV
            </span>
          </div>
          <p className="text-[10px] text-slate-400 truncate">
            Police Investigation System
          </p>
        </div>
      </div>

      {/* Authenticated User Badge Card */}
      <div className="mx-3 my-3 p-3 rounded-xl bg-navy-deep border border-navy-light/30 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-primary-container border border-amber-400/30 flex items-center justify-center font-bold text-amber-300 text-xs shrink-0">
            {avatarInitials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <p className="text-xs font-bold text-white truncate">{displayName}</p>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[9px] text-slate-400">{citizenId}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                {role || 'CITIZEN'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 space-y-4 text-xs font-medium py-2">
        {/* Group 1: Dossier Services */}
        <nav className="space-y-1">
          <p className="px-3 text-[11px] font-semibold text-slate-400 mb-1">
            Dossier Services
          </p>

          <Link 
            to="/dashboard"
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
              activeNav === 'dockets'
                ? 'bg-primary-container text-white border-l-2 border-amber-400 font-bold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-navy-deep'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-base text-amber-300">folder_open</span>
              <span>Dossiers &amp; Cases</span>
            </span>
          </Link>

          <Link 
            to="/dashboard/live-tracking"
            className={`flex items-center justify-between px-3 py-2 rounded-xl transition-colors active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
              activeNav === 'live-tracking'
                ? 'bg-primary-container text-white border-l-2 border-amber-400 font-bold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-navy-deep'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-base text-cyan-400">radar</span>
              <span>Live Case Tracking</span>
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 whitespace-nowrap">
              Live
            </span>
          </Link>

          <Link 
            to="/dashboard/evidence"
            className={`flex items-center justify-between px-3 py-2 rounded-xl transition-colors active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
              activeNav === 'evidence'
                ? 'bg-primary-container text-white border-l-2 border-amber-400 font-bold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-navy-deep'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-base text-amber-400">lock_person</span>
              <span>Evidence Vault</span>
            </span>
          </Link>

          <Link 
            to="/dashboard/file-fir"
            className={`flex items-center justify-between px-3 py-2 rounded-xl transition-colors active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
              activeNav === 'file-fir'
                ? 'bg-primary-container text-white border-l-2 border-amber-400 font-bold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-navy-deep'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-base text-amber-300">edit_document</span>
              <span>+ Lodge New e-FIR</span>
            </span>
          </Link>
        </nav>

        {/* Group 2: Statutory Citizen Services */}
        <nav className="space-y-1">
          <p className="px-3 text-[11px] font-semibold text-slate-400 mb-1">
            Statutory Services
          </p>

          <Link 
            to="/dashboard/court-notices" 
            className={`flex items-center justify-between px-3 py-2 rounded-xl transition-colors active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
              activeNav === 'summons' || activeNav === 'court-notices'
                ? 'bg-primary-container text-white border-l-2 border-amber-400 font-bold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-navy-deep'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-base text-indigo-400">gavel</span>
              <span>Summons &amp; Notices</span>
            </span>
          </Link>

          <Link 
            to="/dashboard/appointments" 
            className={`flex items-center justify-between px-3 py-2 rounded-xl transition-colors active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
              activeNav === 'appointments'
                ? 'bg-primary-container text-white border-l-2 border-amber-400 font-bold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-navy-deep'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-base text-emerald-400">event_available</span>
              <span>Desk Appointments</span>
            </span>
          </Link>

          <Link 
            to="/dashboard/grievance" 
            className={`flex items-center justify-between px-3 py-2 rounded-xl transition-colors active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
              activeNav === 'grievance'
                ? 'bg-primary-container text-white border-l-2 border-amber-400 font-bold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-navy-deep'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-base text-rose-400">campaign</span>
              <span>Grievances &amp; Appeals</span>
            </span>
          </Link>

          <Link 
            to="/dashboard/jurisdiction" 
            className={`flex items-center justify-between px-3 py-2 rounded-xl transition-colors active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
              activeNav === 'jurisdiction'
                ? 'bg-primary-container text-white border-l-2 border-amber-400 font-bold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-navy-deep'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-base text-teal-400">location_searching</span>
              <span>Station Locator</span>
            </span>
          </Link>
        </nav>

        {/* Group 3: Governance & Recourse */}
        <nav className="space-y-1">
          <p className="px-3 text-[11px] font-semibold text-slate-400 mb-1">
            Governance &amp; Recourse
          </p>

          <Link 
            to="/dashboard/profile" 
            className={`flex items-center justify-between px-3 py-2 rounded-xl transition-colors active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
              activeNav === 'profile'
                ? 'bg-primary-container text-white border-l-2 border-amber-400 font-bold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-navy-deep'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-base text-slate-300">account_circle</span>
              <span>Citizen Profile &amp; PII</span>
            </span>
          </Link>

          <Link 
            to="/dashboard/privacy" 
            className={`flex items-center justify-between px-3 py-2 rounded-xl transition-colors active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
              activeNav === 'privacy'
                ? 'bg-primary-container text-white border-l-2 border-amber-400 font-bold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-navy-deep'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-base text-slate-400">policy</span>
              <span>Privacy &amp; DPDP Act</span>
            </span>
          </Link>

          <Link 
            to="/dashboard/guidelines" 
            className={`flex items-center justify-between px-3 py-2 rounded-xl transition-colors active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
              activeNav === 'guidelines'
                ? 'bg-primary-container text-white border-l-2 border-amber-400 font-bold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-navy-deep'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-base text-slate-400">menu_book</span>
              <span>FIR Legal Guidelines</span>
            </span>
          </Link>
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-navy-light/30 space-y-2 bg-navy-dark">
        <a className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-error hover:bg-error/90 text-white text-xs font-bold transition-colors shadow-xs active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none" href="tel:112">
          <span className="material-symbols-outlined text-sm">emergency</span>
          <span className="whitespace-nowrap">Emergency SOS: 112</span>
        </a>
        
        <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
          <span>TLS 1.3 Active</span>
          <button 
            type="button"
            onClick={handleLogout} 
            className="text-slate-400 hover:text-white flex items-center gap-0.5 cursor-pointer transition-colors active:scale-95 focus-visible:ring-1 focus-visible:ring-white focus-visible:outline-none" 
          >
            <span>Exit</span>
            <span className="material-symbols-outlined text-xs">logout</span>
          </button>
        </div>
      </div>

    </aside>
  );
}

export default DashboardSidebar;
