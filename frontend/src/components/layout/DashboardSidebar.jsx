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
    <aside className="w-64 bg-primary text-slate-200 border-r border-[#1a2542] flex flex-col shrink-0 min-h-screen sticky top-0 h-screen z-40 hidden md:flex">
      
      {/* Brand Header */}
      <div className="p-4 border-b border-[#172342] flex items-center gap-3">
        <Link to="/" className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-container to-primary flex items-center justify-center text-white ring-1 ring-white/10 shadow-xs shrink-0">
          <span className="material-symbols-outlined text-xl text-tertiary-fixed">local_police</span>
        </Link>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Link to="/" className="text-sm font-bold text-white tracking-tight leading-tight hover:text-tertiary-fixed transition-colors">
              CaseSync
            </Link>
            <span className="bg-[#14213d] text-tertiary-fixed border border-tertiary-fixed/30 text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase">
              GOV
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono truncate">
            Police Investigation System
          </p>
        </div>
      </div>

      {/* Authenticated User Badge Card */}
      <div className="mx-3 my-3 p-3 rounded-xl bg-[#0c1630] border border-[#1e2e54] shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-primary-container border border-tertiary-fixed/30 flex items-center justify-center font-bold text-tertiary-fixed text-xs font-mono shrink-0">
            {avatarInitials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <p className="text-xs font-bold text-white truncate">{displayName}</p>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono text-[9px] text-slate-400">{citizenId}</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded font-bold font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                {role || 'CITIZEN'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 space-y-4 text-xs font-medium">
        <nav className="space-y-1">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            Dossier Services
          </p>

          <Link 
            to="/dashboard"
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors ${
              activeNav === 'dockets'
                ? 'bg-[#14213d] text-white border-l-2 border-tertiary-fixed font-bold'
                : 'text-slate-300 hover:text-white hover:bg-[#0c1630]'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-base text-tertiary-fixed">dashboard</span>
              <span>Dossiers &amp; Cases</span>
            </span>
          </Link>

          <Link 
            to="/live-tracking"
            className={`flex items-center justify-between px-3 py-2 rounded-xl transition-colors ${
              activeNav === 'live-tracking'
                ? 'bg-[#14213d] text-white border-l-2 border-tertiary-fixed font-bold'
                : 'text-slate-300 hover:text-white hover:bg-[#0c1630]'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-base text-slate-400">timeline</span>
              <span>Live Case Tracking</span>
            </span>
          </Link>

          <Link 
            to="/dashboard/evidence"
            className={`flex items-center justify-between px-3 py-2 rounded-xl transition-colors ${
              activeNav === 'evidence'
                ? 'bg-[#14213d] text-white border-l-2 border-tertiary-fixed font-bold'
                : 'text-slate-300 hover:text-white hover:bg-[#0c1630]'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-base text-slate-400">verified_user</span>
              <span>Evidence Vault</span>
            </span>
          </Link>

          <Link 
            to="/file-complaint"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-[#0c1630] transition-colors"
          >
            <span className="material-symbols-outlined text-base text-tertiary-fixed-dim">edit_document</span>
            <span>+ Lodge e-FIR</span>
          </Link>
        </nav>

        <nav className="space-y-1">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            Governance &amp; Recourse
          </p>

          <Link 
            to="/privacy-policy" 
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-[#0c1630] transition-colors"
          >
            <span className="material-symbols-outlined text-base text-slate-400">policy</span>
            <span>Privacy Policy &amp; PII</span>
          </Link>

          <Link 
            to="/fir-journey" 
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-[#0c1630] transition-colors"
          >
            <span className="material-symbols-outlined text-base text-slate-400">menu_book</span>
            <span>FIR Legal Guidelines</span>
          </Link>
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-[#172342] space-y-2 bg-[#050e21]">
        <a className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-error hover:bg-error/90 text-white text-xs font-bold transition-all shadow-xs" href="tel:112">
          <span className="material-symbols-outlined text-sm">emergency</span>
          <span>EMERGENCY SOS : 112</span>
        </a>
        
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono px-1">
          <span>TLS 1.3 Active</span>
          <button 
            type="button"
            onClick={handleLogout} 
            className="text-slate-400 hover:text-white flex items-center gap-0.5 cursor-pointer" 
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
