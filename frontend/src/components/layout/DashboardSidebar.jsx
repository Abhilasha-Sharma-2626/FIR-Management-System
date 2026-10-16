import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function DashboardSidebar({ activeNav = 'dockets' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const displayName = user?.fullName || 'Ramesh Kumar Sundaram';
  const citizenId = user?.userId ? `CIT-${user.userId.toUpperCase()}` : 'CIT-DEL-984210';
  const avatarInitials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('') || 'RK';

  return (
    <aside className="w-72 bg-[#000a24] text-slate-200 border-r border-[#1a2542] flex flex-col shrink-0 min-h-screen sticky top-0 h-screen z-40 hidden md:flex">
      
      {/* Brand & Ministry Header */}
      <div className="p-5 border-b border-[#172342] flex items-center gap-3.5">
        <Link to="/" className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#14213d] to-[#081226] flex items-center justify-center text-white ring-1 ring-white/10 shadow-md shrink-0">
          <span className="material-symbols-outlined text-2xl text-tertiary-fixed">shield</span>
        </Link>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Link to="/" className="font-headline-sm text-base font-bold text-white tracking-tight leading-tight hover:text-tertiary-fixed transition-colors">
              CaseSync
            </Link>
            <span className="bg-[#14213d] text-tertiary-fixed border border-tertiary-fixed/30 text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase tracking-wider">
              MHA
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-label-sm truncate mt-0.5">
            National Police Service • Govt. of India
          </p>
        </div>
      </div>

      {/* Verified Citizen Identity Profile Card */}
      <div className="mx-3.5 my-4 p-3 rounded-lg bg-[#0c1630] border border-[#1e2e54] shadow-sm">
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full bg-primary-container border border-tertiary-fixed/30 flex items-center justify-center font-bold text-tertiary-fixed text-sm font-title-md">
              {avatarInitials}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0c1630]" title="DigiLocker Authenticated Active"></span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <p className="font-title-md text-xs font-semibold text-white truncate">{displayName}</p>
              <span className="material-symbols-outlined text-sm text-tertiary-fixed-dim" title="DigiLocker Tier-1 Identity Verified">verified</span>
            </div>
            <p className="font-mono text-[10px] text-slate-400 mt-0.5">{citizenId}</p>
            <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] bg-emerald-950/70 text-emerald-300 border border-emerald-700/50 px-1.5 py-0.5 rounded font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Tier-1 Verified
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Groups (Scrollable) */}
      <div className="flex-1 overflow-y-auto px-3 space-y-6">
        {/* Primary Navigation Group */}
        <nav className="space-y-1">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-label-sm mb-2">
            Core Case Services
          </p>

          {/* 1. Dashboard & Dockets */}
          <Link 
            to="/dashboard"
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium text-xs transition-colors ${
              activeNav === 'dockets'
                ? 'bg-[#14213d] text-white border-l-4 border-tertiary-fixed shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-[#0c1630]'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-lg text-tertiary-fixed">dashboard</span>
              <span>Dashboard &amp; Dockets</span>
            </span>
            <span className="text-[10px] bg-[#000a24] text-slate-300 font-mono px-1.5 py-0.5 rounded border border-white/10">02</span>
          </Link>

          {/* 2. Live Case Tracking */}
          <Link 
            to="/dashboard/live-tracking"
            className={`flex items-center justify-between px-3 py-2 rounded-lg font-medium text-xs transition-colors ${
              activeNav === 'live-tracking'
                ? 'bg-[#14213d] text-white border-l-4 border-tertiary-fixed shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-[#0c1630]'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-lg text-slate-400">timeline</span>
              <span>Live Case Tracking</span>
            </span>
            <span className="flex items-center gap-1 text-[10px] bg-emerald-900/60 text-emerald-300 font-mono px-1.5 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              1 Active
            </span>
          </Link>

          {/* 3. Police Station Jurisdiction */}
          <Link 
            to="/dashboard/jurisdiction"
            className={`flex items-center justify-between px-3 py-2 rounded-lg font-medium text-xs transition-colors ${
              activeNav === 'jurisdiction'
                ? 'bg-[#14213d] text-white border-l-4 border-tertiary-fixed shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-[#0c1630]'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-lg text-slate-400">apartment</span>
              <span>Station Jurisdiction</span>
            </span>
            <span className="text-[10px] text-tertiary-fixed font-mono">0.8 km</span>
          </Link>

          {/* 4. Evidence & Vault */}
          <Link 
            to="/dashboard/evidence"
            className={`flex items-center justify-between px-3 py-2 rounded-lg font-medium text-xs transition-colors ${
              activeNav === 'vault'
                ? 'bg-[#14213d] text-white border-l-4 border-tertiary-fixed shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-[#0c1630]'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-lg text-slate-400">verified_user</span>
              <span>Evidence &amp; Vault</span>
            </span>
            <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-1.5 py-0.5 rounded">5 files</span>
          </Link>

          {/* 5. Summons & Court Notices */}
          <Link 
            to="/dashboard/court-notices"
            className={`flex items-center justify-between px-3 py-2 rounded-lg font-medium text-xs transition-colors ${
              activeNav === 'summons'
                ? 'bg-[#14213d] text-white border-l-4 border-tertiary-fixed shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-[#0c1630]'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-lg text-slate-400">gavel</span>
              <span>Court &amp; Legal Notices</span>
            </span>
            <span className="text-[10px] bg-error/90 text-white font-mono px-1.5 py-0.5 rounded font-bold">1 Notice</span>
          </Link>

          {/* 6. Desk Appointments */}
          <Link 
            to="/dashboard/appointments" 
            className={`flex items-center justify-between px-3 py-2 rounded-lg font-medium text-xs transition-colors ${
              activeNav === 'appointments'
                ? 'bg-[#14213d] text-white border-l-4 border-tertiary-fixed shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-[#0c1630]'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-lg text-slate-400">calendar_month</span>
              <span>Desk Appointments</span>
            </span>
            <span className="text-[10px] text-tertiary-fixed font-mono">Book Desk</span>
          </Link>
        </nav>

        {/* Secondary / Governance Navigation Group */}
        <nav className="space-y-1">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-label-sm mb-2">
            Statutory &amp; Support
          </p>

          {/* Citizen Profile & DigiLocker */}
          <Link 
            to="/dashboard/profile"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-xs transition-colors ${
              activeNav === 'profile'
                ? 'bg-[#14213d] text-white border-l-4 border-tertiary-fixed shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-[#0c1630]'
            }`}
          >
            <span className="material-symbols-outlined text-lg text-slate-400">manage_accounts</span>
            <span>Citizen Profile &amp; DigiLocker</span>
          </Link>

          {/* Supervisory Grievance (ACP) */}
          <Link 
            to="/dashboard/grievance" 
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-xs transition-colors ${
              activeNav === 'grievance'
                ? 'bg-[#14213d] text-white border-l-4 border-tertiary-fixed shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-[#0c1630]'
            }`}
          >
            <span className="material-symbols-outlined text-lg text-slate-400">flag</span>
            <span>Supervisory Grievance (ACP)</span>
          </Link>

          <Link 
            to="/how-it-works" 
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-[#0c1630] font-medium text-xs transition-colors"
          >
            <span className="material-symbols-outlined text-lg text-slate-400">menu_book</span>
            <span>BNSS Sec. 173 Guidelines</span>
          </Link>

          <Link 
            to="/#faq" 
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-[#0c1630] font-medium text-xs transition-colors"
          >
            <span className="material-symbols-outlined text-lg text-slate-400">contact_support</span>
            <span>Helpdesk &amp; FAQs</span>
          </Link>
        </nav>
      </div>

      {/* Sidebar Footer: Emergency SOS & Encrypted Session Strip */}
      <div className="p-3.5 border-t border-[#172342] space-y-2 bg-[#050e21]">
        {/* SOS 112 Button */}
        <a className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-error hover:bg-error/90 text-white font-label-md text-xs font-bold transition-all shadow-sm" href="tel:112">
          <span className="material-symbols-outlined text-base">emergency</span>
          <span>EMERGENCY SOS : 112</span>
        </a>
        
        {/* Security & Signout Row */}
        <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 font-mono px-1">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px] text-emerald-400">lock</span>
            256-Bit TLS Sec. 173
          </span>
          <button 
            type="button"
            onClick={handleLogout} 
            className="text-slate-400 hover:text-white flex items-center gap-0.5 cursor-pointer" 
            title="Secure Exit"
          >
            <span>Logout</span>
            <span className="material-symbols-outlined text-[13px]">logout</span>
          </button>
        </div>
      </div>

    </aside>
  );
}

export default DashboardSidebar;
