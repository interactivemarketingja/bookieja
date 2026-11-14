import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Calendar,
  User,
  ChevronDown,
  Settings,
  Shield,
  DollarSign,
  FileText,
  LogOut,
  Building2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NotificationCenter } from './NotificationCenter';
import { PageId } from './Sidebar';
import { cn } from '../lib/utils';

export type SettingsSection = 'profile' | 'notifications' | 'security' | 'api' | 'billing';

interface TopBarProps {
  user: any;
  activePage: string;
  onNavigate?: (page: PageId, settingsSection?: SettingsSection) => void;
  onLogout?: () => void;
  children?: React.ReactNode;
}

export const TopBar: React.FC<TopBarProps> = ({
  user,
  activePage,
  onNavigate,
  onLogout,
  children,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  const getPageTitle = (id: string) => {
    const titles: Record<string, string> = {
      dashboard: 'Financial Dashboard',
      analytics: 'Business Analytics',
      'data-sources': 'Data Sources',
      settings: 'System Settings',
      visualisation: 'Data Visualisation',
      import: 'Data Import',
      invoices: 'Invoice Management',
      expenses: 'Expense Tracking',
      budgets: 'Budget Planning',
      clients: 'Client Directory',
      security: 'Security & Privacy',
      accounts: 'Chart of Accounts',
      ledger: 'General Ledger',
      reports: 'Financial Reports',
      accounts_receivable: 'Accounts Receivable',
      accounts_payable: 'Accounts Payable',
    };
    return titles[id] || 'Dashboard';
  };

  const getInitials = (name?: string) => {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const initials = getInitials(user?.name);

  const handleNavigate = (page: PageId, settingsSection?: SettingsSection) => {
    setIsMenuOpen(false);
    onNavigate?.(page, settingsSection);
  };

  const handleSignOut = () => {
    setIsMenuOpen(false);
    onLogout?.();
  };

  return (
    <header className="flex items-center justify-between mb-8 sticky top-0 bg-slate-50/80 backdrop-blur-md z-30 py-4">
      <div className="flex flex-col">
        <h1 className="text-3xl font-black text-jamaica-black tracking-tighter uppercase leading-none">
          {getPageTitle(activePage)}
        </h1>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1.5 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          System Operational • {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center relative">
          <Search className="absolute left-3 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search records..."
            className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 w-64 transition-all shadow-sm"
          />
        </div>

        <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block" />

        <div className="flex items-center gap-2">
          {children}
          <NotificationCenter />

          <button className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Calendar size={16} />
            Schedule
          </button>
        </div>

        {/* User Avatar Dropdown */}
        <div className="relative pl-4 border-l border-slate-200" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
            className={cn(
              'flex items-center gap-3 p-1.5 pr-2.5 rounded-2xl transition-all border',
              isMenuOpen
                ? 'bg-white border-brand-200 shadow-md ring-2 ring-brand-500/10'
                : 'border-transparent hover:bg-white hover:border-slate-200 hover:shadow-sm'
            )}
          >
            <div className="flex flex-col items-end hidden lg:flex">
              <span className="text-xs font-black text-jamaica-black uppercase tracking-tight leading-none">
                {user?.name || 'Account'}
              </span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                {user?.role || 'Member'}
              </span>
            </div>

            <div className="w-10 h-10 rounded-2xl bg-brand-500 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-brand-500/20 overflow-hidden shrink-0">
              {user?.photo ? (
                <img
                  src={user.photo}
                  alt={user?.name || 'Profile'}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : initials ? (
                <span>{initials}</span>
              ) : (
                <User size={20} />
              )}
            </div>

            <ChevronDown
              size={15}
              className={cn(
                'text-slate-400 transition-transform duration-200',
                isMenuOpen && 'rotate-180 text-brand-600'
              )}
            />
          </button>

          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                role="menu"
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-3 w-72 bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 overflow-hidden"
              >
                {/* User Summary Header */}
                <div className="p-5 bg-slate-50/70 border-b border-slate-100 flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-brand-500 flex items-center justify-center text-white text-sm font-black shadow-md shadow-brand-500/20 overflow-hidden shrink-0">
                    {user?.photo ? (
                      <img
                        src={user.photo}
                        alt={user?.name || 'Profile'}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : initials ? (
                      <span>{initials}</span>
                    ) : (
                      <User size={22} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-jamaica-black tracking-tight truncate">
                      {user?.name || 'User'}
                    </p>
                    {user?.email && (
                      <p className="text-xs text-slate-500 font-medium truncate">
                        {user.email}
                      </p>
                    )}
                    {user?.company && (
                      <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-brand-600 uppercase tracking-wider truncate">
                        <Building2 size={11} className="shrink-0" />
                        <span className="truncate">{user.company}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Navigation */}
                <div className="p-2 space-y-0.5">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleNavigate('settings', 'profile')}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition-all text-left"
                  >
                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                      <Settings size={15} />
                    </div>
                    <div className="flex flex-col">
                      <span>Profile & Account</span>
                      <span className="text-[10px] font-medium text-slate-400">Edit name, photo & company</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleNavigate('settings', 'billing')}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition-all text-left"
                  >
                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                      <DollarSign size={15} />
                    </div>
                    <div className="flex flex-col">
                      <span>Billing & Tax Rates</span>
                      <span className="text-[10px] font-medium text-slate-400">Currency & default sales tax</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleNavigate('security')}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition-all text-left"
                  >
                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                      <Shield size={15} />
                    </div>
                    <div className="flex flex-col">
                      <span>Security & Privacy</span>
                      <span className="text-[10px] font-medium text-slate-400">Password, 2FA & sessions</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleNavigate('reports')}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition-all text-left"
                  >
                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                      <FileText size={15} />
                    </div>
                    <div className="flex flex-col">
                      <span>Financial Reports</span>
                      <span className="text-[10px] font-medium text-slate-400">Statements & exports</span>
                    </div>
                  </button>
                </div>

                {/* Sign Out Footer */}
                {onLogout && (
                  <div className="p-2 border-t border-slate-100 bg-slate-50/40">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider text-rose-600 hover:bg-rose-50 transition-all text-left"
                    >
                      <div className="w-8 h-8 rounded-xl bg-rose-100/70 flex items-center justify-center text-rose-600">
                        <LogOut size={15} />
                      </div>
                      Sign Out
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
