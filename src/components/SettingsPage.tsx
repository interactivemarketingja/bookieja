import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Bell, 
  Shield, 
  Globe, 
  Palette,
  Mail,
  Lock,
  DollarSign,
  Smartphone,
  Camera,
  Check,
  Copy,
  Plus,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '../lib/utils';
import { dataService } from '../services/dataService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

function Toggle({ enabled, onChange }: ToggleProps) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2",
        enabled ? "bg-brand-600" : "bg-slate-200"
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
          enabled ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}

interface SettingsPageProps {
  user: any;
  onUpdateUser: (user: any) => void;
  initialSection?: 'profile' | 'notifications' | 'security' | 'api' | 'billing';
}

export function SettingsPage({ user, onUpdateUser, initialSection = 'profile' }: SettingsPageProps) {
  const [activeSection, setActiveSection] = useState<'profile' | 'notifications' | 'security' | 'api' | 'billing'>(initialSection);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);
  
  // Form States
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || '',
    company: user?.company || '',
    photo: user?.photo || ''
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    pushNotifications: false,
    weeklyReports: true,
    securityAlerts: true
  });

  const [apiKeys, setApiKeys] = useState([
    { id: '1', name: 'Production Read-Only', key: 'nx_live_••••••••••••4k2p', created: '2024-01-15' },
    { id: '2', name: 'Staging Environment', key: 'nx_test_••••••••••••9m1s', created: '2024-02-10' },
  ]);

  const [billing, setBilling] = useState({
    taxRate: 15.0,
    currency: 'USD',
    invoicePrefix: 'INV-'
  });

  const [security, setSecurity] = useState({
    twoFactor: false,
    passwordLastChanged: '2024-02-15',
    sessions: [
      { id: '1', device: 'MacBook Pro', location: 'Kingston, JM', status: 'Active Now', current: true },
      { id: '2', device: 'iPhone 15', location: 'Montego Bay, JM', status: '2 hours ago', current: false },
    ]
  });

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const [showPassword, setShowPassword] = useState(false);

  const fetchSettings = () => {
    try {
      const settingsData = dataService.getSettings();
      setBilling(prev => ({
        ...prev,
        taxRate: settingsData.tax_rate != null ? Number(settingsData.tax_rate) : prev.taxRate,
        currency: settingsData.currency || prev.currency,
        invoicePrefix: settingsData.invoice_prefix || prev.invoicePrefix,
      }));
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    try {
      dataService.saveSettings({
        tax_rate: billing.taxRate,
        currency: billing.currency,
        invoice_prefix: billing.invoicePrefix,
      });

      const updatedUser = dataService.saveUser(profile);
      onUpdateUser(updatedUser);

      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const sidebarItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'billing', label: 'Billing & Tax', icon: DollarSign },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'api', label: 'API Keys', icon: Lock },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Settings Sidebar */}
        <div className="space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as any)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                activeSection === item.id 
                  ? "bg-white text-brand-600 shadow-sm border border-slate-200" 
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="md:col-span-3 space-y-6">
          <AnimatePresence mode="wait">
            {activeSection === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="glass-panel p-8 rounded-3xl space-y-8"
              >
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-3xl font-bold overflow-hidden border-4 border-white shadow-md">
                      {profile.photo ? (
                        <img src={profile.photo} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        profile.name.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border border-slate-100 text-slate-600 hover:text-brand-600 transition-all cursor-pointer">
                      <Camera size={16} />
                      <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                    </label>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Profile Picture</h3>
                    <p className="text-sm text-slate-500">JPG, GIF or PNG. Max size of 800K</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Full Name</label>
                    <input 
                      type="text" 
                      value={profile.name}
                      onChange={(e) => setProfile({...profile, name: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Email Address</label>
                    <input 
                      type="email" 
                      value={profile.email}
                      onChange={(e) => setProfile({...profile, email: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Role</label>
                    <input 
                      type="text" 
                      value={profile.role}
                      onChange={(e) => setProfile({...profile, role: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Company</label>
                    <input 
                      type="text" 
                      value={profile.company}
                      onChange={(e) => setProfile({...profile, company: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {activeSection === 'billing' && (
              <motion.div
                key="billing"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="glass-panel p-8 rounded-3xl space-y-8"
              >
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">Billing Configuration</h3>
                  <p className="text-sm text-slate-500">Set up your default tax rates and invoice preferences</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Default Sales Tax (%)</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">%</div>
                      <input 
                        type="number" 
                        step="0.1"
                        value={billing.taxRate}
                        onChange={(e) => setBilling({...billing, taxRate: Number(e.target.value)})}
                        className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">This rate will be applied to all new invoices by default.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Currency</label>
                    <select 
                      value={billing.currency}
                      onChange={(e) => setBilling({...billing, currency: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all appearance-none"
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="JMD">JMD - Jamaican Dollar</option>
                      <option value="TTD">TTD - Trinidad & Tobago Dollar</option>
                      <option value="BBD">BBD - Barbadian Dollar</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {activeSection === 'notifications' && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="glass-panel p-8 rounded-3xl space-y-6"
              >
                <div className="space-y-1 mb-6">
                  <h3 className="text-lg font-bold text-slate-900">Notification Preferences</h3>
                  <p className="text-sm text-slate-500">Choose how you want to be notified about platform activity</p>
                </div>

                <div className="space-y-4">
                  {[
                    { id: 'emailAlerts', label: 'Email Notifications', desc: 'Receive daily summaries and critical alerts via email' },
                    { id: 'pushNotifications', label: 'Push Notifications', desc: 'Real-time desktop alerts for system events' },
                    { id: 'weeklyReports', label: 'Weekly Performance Reports', desc: 'Detailed PDF reports sent every Monday morning' },
                    { id: 'securityAlerts', label: 'Security Alerts', desc: 'Immediate notification on login from new devices' },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                      <Toggle 
                        enabled={notifications[item.id as keyof typeof notifications]} 
                        onChange={(val) => setNotifications({...notifications, [item.id]: val})} 
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeSection === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="glass-panel p-8 rounded-3xl space-y-8">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-900">Security Settings</h3>
                    <p className="text-sm text-slate-500">Secure your account with two-factor authentication and password management</p>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-6 bg-brand-50/50 rounded-2xl border border-brand-100">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center text-brand-600">
                          <Smartphone size={24} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">Two-Factor Authentication (2FA)</p>
                          <p className="text-xs text-slate-500 max-w-md mt-1">
                            Add an extra layer of security to your account by requiring more than just a password to log in.
                          </p>
                        </div>
                      </div>
                      <Toggle 
                        enabled={security.twoFactor} 
                        onChange={(val) => setSecurity({...security, twoFactor: val})} 
                      />
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-slate-900">Change Password</h4>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-700">Current Password</label>
                          <div className="relative">
                            <input 
                              type={showPassword ? "text" : "password"}
                              value={passwords.current}
                              onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                              placeholder="••••••••"
                            />
                            <button 
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-700">New Password</label>
                            <input 
                              type="password" 
                              value={passwords.new}
                              onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                              placeholder="••••••••"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-700">Confirm New Password</label>
                            <input 
                              type="password" 
                              value={passwords.confirm}
                              onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                              placeholder="••••••••"
                            />
                          </div>
                        </div>
                        <button 
                          onClick={async () => {
                            if (passwords.new && passwords.new === passwords.confirm) {
                              if (isSupabaseConfigured && supabase) {
                                const { error } = await supabase.auth.updateUser({ password: passwords.new });
                                if (error) {
                                  console.error('Password update failed:', error);
                                  return;
                                }
                              }
                              setShowToast(true);
                              setPasswords({ current: '', new: '', confirm: '' });
                              setTimeout(() => setShowToast(false), 3000);
                            }
                          }}
                          className="w-fit px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-all"
                        >
                          Update Password
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass-panel p-8 rounded-3xl space-y-6">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-900">Active Sessions</h3>
                    <p className="text-sm text-slate-500">Devices currently logged into your account</p>
                  </div>

                  <div className="space-y-4">
                    {security.sessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                            <Smartphone size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {session.device}
                              {session.current && <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase tracking-wider">Current</span>}
                            </p>
                            <p className="text-xs text-slate-500">{session.location} • {session.status}</p>
                          </div>
                        </div>
                        {!session.current && (
                          <button className="text-xs font-bold text-rose-600 hover:text-rose-700 transition-all">
                            Revoke Access
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeSection === 'api' && (
              <motion.div
                key="api"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="glass-panel p-8 rounded-3xl space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-slate-900">API Access Tokens</h3>
                      <p className="text-sm text-slate-500">Manage keys for external integration with Island Bookkeeping</p>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-600 rounded-xl text-sm font-semibold hover:bg-brand-100 transition-all">
                      <Plus size={18} />
                      Generate Key
                    </button>
                  </div>

                  <div className="space-y-4">
                    {apiKeys.map((key) => (
                      <div key={key.id} className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-slate-900">{key.name}</p>
                          <div className="flex items-center gap-2 font-mono text-xs text-slate-500">
                            {key.key}
                            <button className="p-1 hover:text-brand-600 transition-all">
                              <Copy size={12} />
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Created on {key.created}</p>
                        </div>
                        <div className="flex gap-2">
                          <button className="p-2 text-slate-400 hover:text-slate-900 transition-all">
                            <Eye size={18} />
                          </button>
                          <button className="p-2 text-slate-400 hover:text-rose-600 transition-all">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex gap-3">
                  <Shield className="text-amber-600 shrink-0" size={20} />
                  <div>
                    <p className="text-sm font-bold text-amber-900">Security Best Practice</p>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      Never share your API keys or commit them to version control. Use environment variables to store them securely.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 right-8 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-50"
          >
            <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
              <Check size={14} className="text-white" />
            </div>
            <span className="text-sm font-medium">Settings saved successfully</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
