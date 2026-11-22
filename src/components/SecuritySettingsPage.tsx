import { useState, useEffect } from 'react';
import { 
  Shield, 
  Key, 
  Smartphone, 
  Monitor, 
  History, 
  Bell, 
  Lock,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  LogOut
} from 'lucide-react';
import { motion } from 'framer-motion';
import { dataService } from '../services/dataService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { cn } from '../lib/utils';

export function SecuritySettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const [showFullHistory, setShowFullHistory] = useState(false);

  useEffect(() => {
    const loadSettings = () => {
      const data = dataService.getSecuritySettings();
      setSettings(data);
    };
    loadSettings();
    window.addEventListener('island-data-synced', loadSettings);
    return () => window.removeEventListener('island-data-synced', loadSettings);
  }, []);

  const handleToggle2FA = () => {
    const updated = { ...settings, twoFactorEnabled: !settings.twoFactorEnabled };
    setSettings(updated);
    dataService.saveSecuritySettings(updated);
    setMessage({ 
      text: `Two-factor authentication ${updated.twoFactorEnabled ? 'enabled' : 'disabled'} successfully.`, 
      type: 'success' 
    });
  };

  const handleToggleAlerts = () => {
    const updated = { ...settings, loginAlerts: !settings.loginAlerts };
    setSettings(updated);
    dataService.saveSecuritySettings(updated);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new.length < 6) {
      setMessage({ text: 'New password must be at least 6 characters long.', type: 'error' });
      return;
    }
    if (passwordData.new !== passwordData.confirm) {
      setMessage({ text: 'New passwords do not match.', type: 'error' });
      return;
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.updateUser({ password: passwordData.new });
      if (error) {
        setMessage({ text: error.message || 'Failed to update password.', type: 'error' });
        return;
      }
    }

    const updated = { ...settings, lastPasswordChange: new Date().toISOString() };
    setSettings(updated);
    dataService.saveSecuritySettings(updated);
    setIsChangingPassword(false);
    setPasswordData({ current: '', new: '', confirm: '' });
    setMessage({ text: 'Password updated successfully.', type: 'success' });
  };

  const handleTerminateSession = (sessionId: string) => {
    const updated = { 
      ...settings, 
      activeSessions: settings.activeSessions.filter((s: any) => s.id !== sessionId) 
    };
    setSettings(updated);
    dataService.saveSecuritySettings(updated);
    setMessage({ text: 'Session terminated successfully.', type: 'success' });
  };

  if (!settings) return null;

  const loginHistory = settings.loginHistory || [];
  const displayedHistory = showFullHistory ? loginHistory : loginHistory.slice(0, 3);
  const securityScore =
    50 +
    (settings.twoFactorEnabled ? 30 : 0) +
    (settings.loginAlerts ? 20 : 0);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center text-brand-600">
            <Shield size={24} />
          </div>
          <h1 className="text-4xl font-black text-jamaica-black tracking-tighter uppercase">Security Settings</h1>
        </div>
        <p className="text-slate-500 font-medium">Manage your account security, sessions, and authentication preferences.</p>
      </header>

      {message && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-4 rounded-2xl flex items-center gap-3 border",
            message.type === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-rose-50 border-rose-100 text-rose-700"
          )}
        >
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
          <span className="text-sm font-bold">{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-auto text-current opacity-50 hover:opacity-100">
            <XCircle size={16} />
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Password Section */}
          <section className="glass-panel p-8 rounded-3xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                  <Key size={20} />
                </div>
                <div>
                  <h3 className="font-black text-jamaica-black uppercase tracking-tight">Password</h3>
                  <p className="text-xs text-slate-500">Last changed {new Date(settings.lastPasswordChange).toLocaleDateString()}</p>
                </div>
              </div>
              {!isChangingPassword && (
                <button 
                  onClick={() => setIsChangingPassword(true)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Change Password
                </button>
              )}
            </div>

            {isChangingPassword && (
              <form onSubmit={handlePasswordChange} className="space-y-4 pt-4 border-t border-slate-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Password</label>
                    <input 
                      type="password" 
                      required
                      value={passwordData.current}
                      onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                    />
                  </div>
                  <div className="hidden sm:block" />
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                    <input 
                      type="password" 
                      required
                      value={passwordData.new}
                      onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                    <input 
                      type="password" 
                      required
                      value={passwordData.confirm}
                      onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button 
                    type="submit"
                    className="px-6 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20"
                  >
                    Update Password
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsChangingPassword(false)}
                    className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* Two-Factor Authentication */}
          <section className="glass-panel p-8 rounded-3xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600">
                  <Smartphone size={20} />
                </div>
                <div>
                  <h3 className="font-black text-jamaica-black uppercase tracking-tight">Two-Factor Authentication</h3>
                  <p className="text-xs text-slate-500">Add an extra layer of security to your account</p>
                </div>
              </div>
              <button 
                onClick={handleToggle2FA}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                  settings.twoFactorEnabled ? "bg-brand-600" : "bg-slate-200"
                )}
              >
                <span className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  settings.twoFactorEnabled ? "translate-x-6" : "translate-x-1"
                )} />
              </button>
            </div>
            
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex gap-3">
                <div className="mt-1 text-brand-600">
                  <Lock size={16} />
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  When enabled, you'll be asked for a security code in addition to your password when you log in on a new device.
                </p>
              </div>
            </div>
          </section>

          {/* Active Sessions */}
          <section className="glass-panel p-8 rounded-3xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                <Monitor size={20} />
              </div>
              <div>
                <h3 className="font-black text-jamaica-black uppercase tracking-tight">Active Sessions</h3>
                <p className="text-xs text-slate-500">Devices currently logged into your account</p>
              </div>
            </div>

            <div className="space-y-4">
              {settings.activeSessions.map((session: any) => (
                <div key={session.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl border border-slate-100 flex items-center justify-center text-slate-400">
                      {session.device.includes('iPhone') ? <Smartphone size={20} /> : <Monitor size={20} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{session.device}</span>
                        {session.current && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[8px] font-black uppercase tracking-widest">
                            Current Session
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{session.location} • {new Date(session.lastActive).toLocaleString()}</p>
                    </div>
                  </div>
                  {!session.current && (
                    <button 
                      onClick={() => handleTerminateSession(session.id)}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                      title="Terminate Session"
                    >
                      <LogOut size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          {/* Security Alerts */}
          <section className="glass-panel p-6 rounded-3xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
                <Bell size={18} />
              </div>
              <h3 className="font-black text-jamaica-black uppercase tracking-tight text-sm">Security Alerts</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Login Notifications</span>
                <button 
                  onClick={handleToggleAlerts}
                  className={cn(
                    "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none",
                    settings.loginAlerts ? "bg-brand-600" : "bg-slate-200"
                  )}
                >
                  <span className={cn(
                    "inline-block h-3 w-3 transform rounded-full bg-white transition-transform",
                    settings.loginAlerts ? "translate-x-5" : "translate-x-1"
                  )} />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Receive an email alert whenever a new login is detected on your account.
              </p>
            </div>
          </section>

          {/* Login History */}
          <section className="glass-panel p-6 rounded-3xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                <History size={18} />
              </div>
              <h3 className="font-black text-jamaica-black uppercase tracking-tight text-sm">Login History</h3>
            </div>

            <div className="space-y-4">
              {displayedHistory.map((log: any) => (
                <div key={log.id} className="flex items-center justify-between pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{log.device}</span>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                        log.status === 'Success' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                      )}>
                        {log.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">{new Date(log.date).toLocaleString()}</p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{log.ip}</span>
                </div>
              ))}
            </div>
            
            {loginHistory.length > 3 && (
              <button
                type="button"
                onClick={() => setShowFullHistory((prev) => !prev)}
                className="w-full py-2 text-[10px] font-black text-brand-600 uppercase tracking-widest hover:text-brand-700 transition-all flex items-center justify-center gap-1"
              >
                {showFullHistory ? 'Show Recent Only' : `View Full History (${loginHistory.length})`} <ChevronRight size={12} />
              </button>
            )}
          </section>

          {/* Security Score */}
          <section className="bg-jamaica-black p-6 rounded-3xl text-white space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black uppercase tracking-widest text-xs">Security Score</h3>
              <span className="text-brand-400 font-black text-xl">{securityScore}%</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-brand-500 rounded-full transition-all duration-300" style={{ width: `${securityScore}%` }} />
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              {securityScore === 100
                ? 'All recommended protections are enabled for your account.'
                : !settings.twoFactorEnabled
                  ? 'Enable Two-Factor Authentication to strengthen your account protection.'
                  : 'Enable Login Notifications to reach 100%.'}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
