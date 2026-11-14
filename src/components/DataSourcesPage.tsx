import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag,
  ShoppingCart,
  Store,
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  ExternalLink,
  MoreVertical,
  RefreshCw,
  Check,
  X,
  Globe,
  Key,
  Database
} from 'lucide-react';
import { cn } from '../lib/utils';
import { dataService, EcommerceSource, SyncLog } from '../services/dataService';
import { Invoice, Expense } from '../types';
import { ConfirmationModal } from './ConfirmationModal';

const DEFAULT_SOURCES: EcommerceSource[] = [
  { id: '1', name: 'Main Shopify Store', type: 'Shopify', status: 'connected', lastSync: '2 mins ago', orders: '1,240', url: 'mystore.myshopify.com', apiKey: 'shpat_xxxxxxxx' },
  { id: '2', name: 'WooCommerce Site', type: 'WooCommerce', status: 'connected', lastSync: '1 hour ago', orders: '850', url: 'shop.mywebsite.com', apiKey: 'ck_xxxxxxxx', apiSecret: 'cs_xxxxxxxx' },
];

export function DataSourcesPage() {
  const [sources, setSources] = useState<EcommerceSource[]>([]);
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [lastSyncedName, setLastSyncedName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [sourceToDelete, setSourceToDelete] = useState<string | null>(null);
  const [selectedSourceLogs, setSelectedSourceLogs] = useState<SyncLog[]>([]);
  const [activeLogSource, setActiveLogSource] = useState<string>('');
  const [newStore, setNewStore] = useState<{ name: string; type: 'Shopify' | 'WooCommerce'; url: string; apiKey: string; apiSecret: string }>({ 
    name: '', 
    type: 'Shopify', 
    url: '', 
    apiKey: '',
    apiSecret: ''
  });

  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);

  useEffect(() => {
    const loadSources = () => {
      setSources(dataService.getEcommerceSources(DEFAULT_SOURCES));
      setSyncLogs(dataService.getSyncLogs());
    };
    loadSources();
    window.addEventListener('island-data-synced', loadSources);
    return () => window.removeEventListener('island-data-synced', loadSources);
  }, []);

  const saveSources = (updated: EcommerceSource[]) => {
    setSources(updated);
    dataService.saveEcommerceSources(updated);
  };

  const addLog = (log: Omit<SyncLog, 'id'>) => {
    const newLog: SyncLog = { ...log, id: Math.random().toString(36).substr(2, 9) };
    const updatedLogs = dataService.saveSyncLog(newLog);
    setSyncLogs(updatedLogs);
  };

  const handleSync = (id: string, name: string) => {
    setSyncingIds(prev => new Set(prev).add(id));
    
    // Simulate sync process and add some data
    setTimeout(() => {
      const syncCount = Math.floor(Math.random() * 5) + 1;
      const isSuccess = Math.random() > 0.1; // 90% success rate for simulation

      if (isSuccess) {
        for (let i = 0; i < syncCount; i++) {
          // Create a mock invoice representing synced data
          const newInvoice: Invoice = {
            id: `SYNC-${Math.floor(Math.random() * 100000)}`,
            client_name: `eCommerce Customer ${i + 1} (${name})`,
            amount: Math.floor(Math.random() * 500) + 50,
            date: new Date().toISOString().split('T')[0],
            due_date: new Date().toISOString().split('T')[0],
            status: 'Paid',
            description: `Synced from ${name} - Order #${Math.floor(Math.random() * 10000)}`
          };
          
          dataService.saveInvoice(newInvoice);

          // Also sync some expenses (transaction fees)
          const fee: Expense = {
            id: `FEE-${Math.floor(Math.random() * 100000)}`,
            category: 'Software',
            amount: newInvoice.amount * 0.029 + 0.30,
            date: new Date().toISOString().split('T')[0],
            description: `Transaction Fee for ${newInvoice.id}`,
            status: 'Paid'
          };
          dataService.saveExpense(fee);
        }
        
        addLog({
          sourceId: id,
          timestamp: new Date().toLocaleString(),
          status: 'success',
          message: 'Sync Completed',
          details: `Successfully imported ${syncCount} orders and associated transaction fees.`
        });

        const updated = sources.map(s => s.id === id ? { ...s, lastSync: 'Just now', orders: (parseInt(s.orders.replace(',', '')) + syncCount).toLocaleString(), status: 'connected' as const } : s);
        saveSources(updated);
        setLastSyncedName(name);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } else {
        addLog({
          sourceId: id,
          timestamp: new Date().toLocaleString(),
          status: 'error',
          message: 'Sync Failed',
          details: 'Connection timeout while fetching new orders. Please check your API credentials.'
        });
        const updated = sources.map(s => s.id === id ? { ...s, status: 'warning' as const } : s);
        saveSources(updated);
      }
      
      setSyncingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 2000);
  };

  const viewLogs = (id: string, name: string) => {
    const sourceLogs = syncLogs.filter(l => l.sourceId === id);
    setSelectedSourceLogs(sourceLogs);
    setActiveLogSource(name);
    setIsLogModalOpen(true);
  };

  const handleTestConnection = () => {
    if (!newStore.url || !newStore.apiKey || (newStore.type === 'WooCommerce' && !newStore.apiSecret)) {
      setTestResult('error');
      setTimeout(() => setTestResult(null), 3000);
      return;
    }

    setTestingConnection(true);
    setTestResult(null);

    // Simulate API call
    setTimeout(() => {
      setTestingConnection(false);
      setTestResult('success');
      setTimeout(() => setTestResult(null), 3000);
    }, 1500);
  };

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    const source: EcommerceSource = {
      id: Math.random().toString(36).substr(2, 9),
      name: newStore.name,
      type: newStore.type,
      status: 'connected',
      lastSync: 'Never',
      orders: '0',
      url: newStore.url,
      apiKey: newStore.apiKey,
      apiSecret: newStore.apiSecret
    };
    saveSources([...sources, source]);
    setIsModalOpen(false);
    setNewStore({ name: '', type: 'Shopify', url: '', apiKey: '', apiSecret: '' });
  };

  const removeSource = (id: string) => {
    setSourceToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmRemoveSource = () => {
    if (!sourceToDelete) return;
    saveSources(sources.filter(s => s.id !== sourceToDelete));
    setIsDeleteConfirmOpen(false);
    setSourceToDelete(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 relative"
    >
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-jamaica-black tracking-tighter uppercase">eCommerce Connections</h1>
          <p className="text-slate-500 mt-1 font-medium">Connect your stores and sync sales data into the app</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20"
        >
          <Plus size={18} />
          Connect Store
        </button>
      </header>
      
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-3xl border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600">
            <Store size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Stores</p>
            <h3 className="text-2xl font-black text-jamaica-black tracking-tighter">
              {sources.length}
            </h3>
          </div>
        </div>
        
        <div className="glass-panel p-6 rounded-3xl border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Connections</p>
            <h3 className="text-2xl font-black text-emerald-600 tracking-tighter">
              {sources.filter(s => s.status === 'connected').length}
            </h3>
          </div>
        </div>
        
        <div className="glass-panel p-6 rounded-3xl border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600">
            <Database size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Orders Synced</p>
            <h3 className="text-2xl font-black text-rose-600 tracking-tighter">
              {sources.reduce((acc, s) => acc + parseInt(s.orders.replace(',', '')), 0).toLocaleString()}
            </h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sources.map((source) => (
          <div key={source.id} className="glass-panel p-8 rounded-[32px] group hover:border-brand-300 transition-all border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-600 transition-all">
                  {source.type === 'Shopify' ? <ShoppingBag size={28} /> : <ShoppingCart size={28} />}
                </div>
                <div>
                  <h3 className="text-lg font-black text-jamaica-black uppercase tracking-tight">{source.name}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{source.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleSync(source.id, source.name)}
                  disabled={syncingIds.has(source.id)}
                  className={cn(
                    "p-3 rounded-xl transition-all",
                    syncingIds.has(source.id) 
                      ? "bg-brand-50 text-brand-600" 
                      : "text-slate-400 hover:text-brand-600 hover:bg-brand-50"
                  )}
                  title="Sync Now"
                >
                  <RefreshCw size={20} className={cn(syncingIds.has(source.id) && "animate-spin")} />
                </button>
                <div className="relative group/menu">
                  <button className="p-3 text-slate-400 hover:text-slate-900 transition-all">
                    <MoreVertical size={20} />
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10">
                    <button 
                      onClick={() => removeSource(source.id)}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all"
                    >
                      Disconnect Store
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                <div className="flex items-center gap-2">
                  {source.status === 'connected' ? (
                    <CheckCircle2 size={14} className="text-emerald-500" />
                  ) : source.status === 'warning' ? (
                    <AlertCircle size={14} className="text-amber-500" />
                  ) : (
                    <Clock size={14} className="text-slate-400" />
                  )}
                  <span className={cn(
                    "text-xs font-black uppercase tracking-widest",
                    source.status === 'connected' ? "text-emerald-600" :
                    source.status === 'warning' ? "text-amber-600" :
                    "text-slate-500"
                  )}>
                    {source.status}
                  </span>
                </div>
              </div>
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Orders Synced</p>
                <p className="text-sm font-black text-jamaica-black tabular-nums">{source.orders}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {syncingIds.has(source.id) ? 'Synchronizing...' : `Last synced ${source.lastSync}`}
              </span>
              <button 
                onClick={() => viewLogs(source.id, source.name)}
                className="text-[10px] font-black text-brand-600 uppercase tracking-widest flex items-center gap-1 hover:underline"
              >
                View Logs
                <ExternalLink size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Sync Logs Modal */}
      <AnimatePresence>
        {isLogModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLogModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h2 className="text-2xl font-black text-jamaica-black tracking-tighter uppercase">Sync History</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{activeLogSource}</p>
                </div>
                <button onClick={() => setIsLogModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-all shadow-sm">
                  <X size={24} className="text-slate-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-4">
                {selectedSourceLogs.length === 0 ? (
                  <div className="text-center py-12">
                    <Database size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-500 font-medium">No sync logs found for this store.</p>
                  </div>
                ) : (
                  selectedSourceLogs.map((log) => (
                    <div key={log.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/30 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            log.status === 'success' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                          )}>
                            {log.status === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-jamaica-black uppercase tracking-tight">{log.message}</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{log.timestamp}</p>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">{log.details}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                <button 
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Connect Store Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-2xl font-black text-jamaica-black tracking-tighter uppercase">Connect eCommerce Store</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                  <X size={24} className="text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleConnect} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Store Type</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      type="button"
                      onClick={() => setNewStore({...newStore, type: 'Shopify'})}
                      className={cn(
                        "flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all",
                        newStore.type === 'Shopify' ? "border-brand-600 bg-brand-50 text-brand-600" : "border-slate-100 hover:border-slate-200 text-slate-400"
                      )}
                    >
                      <ShoppingBag size={20} />
                      <span className="text-sm font-black uppercase tracking-widest">Shopify</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => setNewStore({...newStore, type: 'WooCommerce'})}
                      className={cn(
                        "flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all",
                        newStore.type === 'WooCommerce' ? "border-brand-600 bg-brand-50 text-brand-600" : "border-slate-100 hover:border-slate-200 text-slate-400"
                      )}
                    >
                      <ShoppingCart size={20} />
                      <span className="text-sm font-black uppercase tracking-widest">WooCommerce</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Store Name</label>
                  <div className="relative">
                    <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      required
                      type="text" 
                      value={newStore.name}
                      onChange={(e) => setNewStore({...newStore, name: e.target.value})}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                      placeholder="e.g. My Awesome Shop"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Store URL</label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      required
                      type="text" 
                      value={newStore.url}
                      onChange={(e) => setNewStore({...newStore, url: e.target.value})}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                      placeholder="e.g. mystore.myshopify.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                    {newStore.type === 'Shopify' ? 'Access Token' : 'Consumer Key'}
                  </label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      required
                      type="password" 
                      value={newStore.apiKey}
                      onChange={(e) => setNewStore({...newStore, apiKey: e.target.value})}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                      placeholder={newStore.type === 'Shopify' ? "shpat_xxxxxxxxxxxxxxxx" : "ck_xxxxxxxxxxxxxxxx"}
                    />
                  </div>
                </div>

                {newStore.type === 'WooCommerce' && (
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Consumer Secret</label>
                    <div className="relative">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        required
                        type="password" 
                        value={newStore.apiSecret}
                        onChange={(e) => setNewStore({...newStore, apiSecret: e.target.value})}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                        placeholder="cs_xxxxxxxxxxxxxxxx"
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testingConnection}
                    className={cn(
                      "w-full px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                      testResult === 'success' ? "bg-emerald-50 text-emerald-600 border border-emerald-200" :
                      testResult === 'error' ? "bg-rose-50 text-rose-600 border border-rose-200" :
                      "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {testingConnection ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        Testing...
                      </>
                    ) : testResult === 'success' ? (
                      <>
                        <Check size={14} />
                        Connection Successful
                      </>
                    ) : testResult === 'error' ? (
                      <>
                        <AlertCircle size={14} />
                        Connection Failed
                      </>
                    ) : (
                      <>
                        <RefreshCw size={14} />
                        Test Connection
                      </>
                    )}
                  </button>
                  
                  <div className="flex gap-4">
                    <button 
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 px-6 py-4 bg-slate-50 text-slate-600 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 px-6 py-4 bg-brand-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20"
                    >
                      Connect
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
            <span className="text-sm font-medium">{lastSyncedName} synced successfully</span>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setSourceToDelete(null);
        }}
        onConfirm={confirmRemoveSource}
        title="Disconnect Store"
        message="Are you sure you want to disconnect this store? This will stop all automatic synchronization."
        confirmText="Disconnect"
        variant="danger"
      />
    </motion.div>
  );
}
