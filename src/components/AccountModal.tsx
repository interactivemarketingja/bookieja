import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Account, AccountType } from '../types';
import { ConfirmationModal } from './ConfirmationModal';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (account: Account) => void;
  onDelete?: (id: string) => void;
  initialData: Account | null;
  accounts: Account[];
}

export function AccountModal({ isOpen, onClose, onSave, onDelete, initialData, accounts }: AccountModalProps) {
  const [formData, setFormData] = useState<Account>({
    id: '',
    code: '',
    name: '',
    type: 'Asset',
    description: '',
    notes: '',
    balance: 0
  });
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        id: '',
        code: '',
        name: '',
        type: 'Asset',
        description: '',
        notes: '',
        balance: 0
      });
    }
    setError(null);
    setShowConfirm(false);
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation: Unique code
    const isCodeTaken = accounts.some(acc => acc.code === formData.code && acc.id !== formData.id);
    if (isCodeTaken) {
      setError('Account code already exists. Please use a unique code.');
      return;
    }

    if (!formData.code.trim()) {
      setError('Account code is required.');
      return;
    }

    if (!formData.name.trim()) {
      setError('Account name is required.');
      return;
    }

    if (!initialData) {
      setShowConfirm(true);
    } else {
      onSave(formData);
      onClose();
    }
  };

  const handleConfirmSave = () => {
    onSave(formData);
    setShowConfirm(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl"
          >
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-black text-jamaica-black tracking-tighter uppercase">
                  {initialData ? 'Edit Account' : 'New Account'}
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  {initialData ? 'Update account details and balance' : 'Create a new account in your chart'}
                </p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                <X size={24} className="text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold"
                >
                  <AlertCircle size={16} />
                  {error}
                </motion.div>
              )}
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Account Code</label>
                  <input 
                    required
                    type="text" 
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                    placeholder="e.g. 1000"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Account Type</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as AccountType})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all appearance-none"
                  >
                    <option value="Asset">Asset</option>
                    <option value="Liability">Liability</option>
                    <option value="Equity">Equity</option>
                    <option value="Revenue">Revenue</option>
                    <option value="Expense">Expense</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Account Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                  placeholder="e.g. Cash at Bank"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all min-h-[80px]"
                  placeholder="Optional account details..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Internal Notes</label>
                <textarea 
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all min-h-[80px]"
                  placeholder="Internal notes for reference..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                  {initialData ? 'Current Balance' : 'Initial Balance'}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    value={formData.balance}
                    onChange={(e) => setFormData({...formData, balance: Number(e.target.value)})}
                    className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                  />
                </div>
              </div>
            </form>

            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
              {initialData && onDelete && (
                <button 
                  type="button"
                  onClick={() => onDelete(initialData.id)}
                  className="px-6 py-4 bg-rose-50 text-rose-600 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-rose-100 transition-all"
                >
                  Delete
                </button>
              )}
              <div className="flex-1 flex gap-3">
                <button 
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  onClick={handleSubmit}
                  className="flex-1 px-6 py-4 bg-brand-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20"
                >
                  {initialData ? 'Update Account' : 'Create Account'}
                </button>
              </div>
            </div>
          </motion.div>

          <ConfirmationModal 
            isOpen={showConfirm}
            onClose={() => setShowConfirm(false)}
            onConfirm={handleConfirmSave}
            title="Create New Account"
            message={`Are you sure you want to create the account "${formData.name}" (${formData.code})?`}
            confirmText="Create Account"
            variant="info"
          />
        </div>
      )}
    </AnimatePresence>
  );
}
