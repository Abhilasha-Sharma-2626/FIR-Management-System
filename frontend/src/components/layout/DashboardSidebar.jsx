import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * CaseSync Professional Police Dashboard Sidebar
 * Restrained, high-contrast, officer-friendly navigation shared across all 7 roles.
 */
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

  const isAdmin = role === 'ADMIN';
  const isAuditor = role === 'AUDITOR';
  const isDeskOfficer = role === 'DESK_OFFICER';
  const isSho = role === 'SHO';
  const isIo = role === 'IO';
  const isSupervisor = role === 'SUPERVISOR';
  const isPoliceRole = isDeskOfficer || isSho || isIo || isSupervisor || isAdmin || isAuditor;

  const officerBadgeNo = user?.badgeNo || (
    isAdmin ? 'ADM-SYS-001' :
    isAuditor ? 'AUD-VIG-001' :
    isSupervisor ? 'SP-DIST-001' :
    isSho ? 'SHO-CPS-001' :
    isIo ? 'IO-CPS-101' : 'DO-CPS-201'
  );

  const officerRank = user?.rank || (
    isAdmin ? 'System Administrator' :
    isAuditor ? 'Statutory Auditor' :
    isSupervisor ? 'Superintendent of Police' :
    isSho ? 'Station House Officer' :
    isIo ? 'Investigating Officer' : 'Desk Officer'
  );

  const stationName = user?.stationName || (
    isAdmin ? 'State Police Command Center' :
    isAuditor ? 'Statutory Audit Directorate' :
    isSupervisor ? 'District Police Headquarters' :
    'Central Police Station'
  );

  const roleBadgeLabel = (
    isAdmin ? 'ADMIN' :
    isAuditor ? 'AUDITOR' :
    isSupervisor ? 'SUPERVISOR' :
    isSho ? 'SHO' :
    isIo ? 'IO' :
    isDeskOfficer ? 'DESK OFFICER' :
    'CITIZEN'
  );

  // Role Navigation Configuration
  const getNavSections = () => {
    if (isAdmin) {
      return [
        {
          title: 'System Management',
          items: [
            { id: 'overview', label: 'System Overview', to: '/dashboard', icon: 'dashboard' },
            { id: 'users', label: 'User Management', to: '/dashboard?tab=users', icon: 'manage_accounts' },
            { id: 'stations', label: 'Police Stations', to: '/dashboard?tab=stations', icon: 'apartment' },
          ]
        },
        {
          title: 'Master Data & Policy',
          items: [
            { id: 'master-data', label: 'Crime & Law Master Data', to: '/dashboard?tab=master-data&subtab=categories', icon: 'database' },
            { id: 'config', label: 'Service Rules & SLAs', to: '/dashboard?tab=config', icon: 'tune' },
            { id: 'audit', label: 'System Audit Log', to: '/dashboard?tab=audit', icon: 'history' },
          ]
        }
      ];
    }

    if (isSupervisor) {
      return [
        {
          title: 'District Command',
          items: [
            { id: 'overview', label: 'District Overview', to: '/dashboard', icon: 'dashboard' },
            { id: 'escalations', label: 'Station Escalations', to: '/dashboard?tab=escalations', icon: 'priority_high' },
            { id: 'appeals', label: 'Citizen Appeals', to: '/dashboard?tab=appeals', icon: 'gavel' },
            { id: 'overdue', label: 'Overdue Cases', to: '/dashboard?tab=overdue', icon: 'schedule' },
          ]
        },
        {
          title: 'Oversight & Audit',
          items: [
            { id: 'reports', label: 'Performance Reports', to: '/dashboard?tab=reports', icon: 'analytics' },
            { id: 'audit', label: 'Activity Audit Trail', to: '/dashboard?tab=audit', icon: 'history' },
          ]
        }
      ];
    }

    if (isSho) {
      return [
        {
          title: 'Station Operations',
          items: [
            { id: 'dockets', label: 'Review Queue', to: '/dashboard', icon: 'inbox' },
            { id: 'fir-registration', label: 'FIR Registration', to: '/dashboard?tab=fir-registration', icon: 'assignment_turned_in' },
            { id: 'io-assignment', label: 'Assign Officer', to: '/dashboard?tab=io-assignment', icon: 'person_add' },
            { id: 'approvals', label: 'Report Approvals', to: '/dashboard?tab=approvals', icon: 'fact_check' },
            { id: 'transfers', label: 'Case Transfers', to: '/dashboard?tab=transfers', icon: 'swap_horiz' },
          ]
        },
        {
          title: 'Custody & Evidence',
          items: [
            { id: 'evidence', label: 'Malkhana & Evidence', to: '/dashboard/evidence', icon: 'inventory_2' },
          ]
        }
      ];
    }

    if (isIo) {
      return [
        {
          title: 'Investigation',
          items: [
            { id: 'cases', label: 'Assigned Cases', to: '/dashboard', icon: 'folder_open' },
            { id: 'evidence', label: 'Case Exhibits', to: '/dashboard/evidence', icon: 'inventory_2' },
          ]
        }
      ];
    }

    if (isDeskOfficer) {
      return [
        {
          title: 'Station Counter',
          items: [
            { id: 'inbox', label: 'Station Inbox', to: '/dashboard', icon: 'inbox' },
            { id: 'appointments', label: 'Desk Appointments', to: '/appointments', icon: 'event' },
          ]
        }
      ];
    }

    if (isAuditor) {
      return [
        {
          title: 'Audit & Compliance',
          items: [
            { id: 'overview', label: 'Audit Overview', to: '/dashboard', icon: 'dashboard' },
            { id: 'explorer', label: 'Audit Log Explorer', to: '/dashboard?tab=explorer', icon: 'manage_search' },
            { id: 'integrity', label: 'Record Integrity Check', to: '/dashboard?tab=integrity', icon: 'verified_user' },
            { id: 'reports', label: 'Audit Reports & Export', to: '/dashboard?tab=reports', icon: 'description' },
          ]
        }
      ];
    }

    // Default: Citizen
    return [
      {
        title: 'Citizen Services',
        items: [
          { id: 'dockets', label: 'My Complaints', to: '/dashboard', icon: 'assignment' },
          { id: 'file-fir', label: 'File Complaint / e-FIR', to: '/dashboard/file-fir', icon: 'edit_note' },
          { id: 'live-tracking', label: 'Track Case Status', to: '/dashboard/live-tracking', icon: 'search' },
          { id: 'appointments', label: 'Station Appointments', to: '/appointments', icon: 'event' },
          { id: 'summons', label: 'Court Notices', to: '/court-notices', icon: 'gavel' },
        ]
      },
      {
        title: 'Account & Information',
        items: [
          { id: 'profile', label: 'My Profile', to: '/dashboard/profile', icon: 'person' },
          { id: 'guidelines', label: 'Legal Guidelines', to: '/dashboard/guidelines', icon: 'menu_book' },
          { id: 'privacy', label: 'Privacy Charter', to: '/dashboard/privacy', icon: 'policy' },
        ]
      }
    ];
  };

  const navSections = getNavSections();

  return (
    <aside className="w-64 bg-[#0B1323] text-slate-200 border-r border-slate-800 flex flex-col shrink-0 min-h-screen sticky top-0 h-screen z-40 hidden md:flex font-sans">
      
      {/* Brand Header */}
      <div className="px-4 py-3.5 border-b border-slate-800/80 flex items-center gap-3">
        <Link 
          to="/" 
          className="w-8 h-8 rounded-lg bg-navy border border-slate-700/80 flex items-center justify-center text-amber-400 shrink-0 hover:border-amber-400/60 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400"
          title="CaseSync Home"
        >
          <span className="material-symbols-outlined text-lg">local_police</span>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <Link to="/" className="text-sm font-bold text-white tracking-tight hover:text-amber-300 transition-colors">
              CaseSync
            </Link>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold border border-slate-700 tracking-wider">
              {roleBadgeLabel}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 truncate mt-0.5">
            {stationName}
          </p>
        </div>
      </div>

      {/* Authenticated Officer / User Summary */}
      <div className="mx-3 my-2.5 px-3 py-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-amber-400 shrink-0">
          {avatarInitials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-white truncate leading-tight">
            {displayName}
          </p>
          <p className="text-[10px] text-slate-400 truncate mt-0.5">
            {isPoliceRole ? `${officerRank} • ${officerBadgeNo}` : citizenId}
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-1 space-y-4 text-xs font-medium">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-0.5">
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              {section.title}
            </p>
            {section.items.map((item) => {
              const isActive = activeNav === item.id;
              return (
                <Link
                  key={item.id}
                  to={item.to}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400 ${
                    isActive
                      ? 'bg-slate-800 text-white font-semibold border-l-2 border-amber-400'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <span className={`material-symbols-outlined text-[18px] shrink-0 ${
                    isActive ? 'text-amber-400' : 'text-slate-400'
                  }`}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-slate-800 bg-[#0B1323] space-y-2">
        <a 
          href="tel:112"
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-200 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-400"
        >
          <span className="material-symbols-outlined text-sm text-rose-400">call</span>
          <span>Emergency Police: 112</span>
        </a>

        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1">
          <span className="text-[10px] text-slate-400">CaseSync Police Portal</span>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1 text-slate-300 hover:text-white cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white rounded px-1.5 py-0.5"
            title="Sign out of system"
          >
            <span>Sign Out</span>
            <span className="material-symbols-outlined text-xs">logout</span>
          </button>
        </div>
      </div>

    </aside>
  );
}

export default DashboardSidebar;
