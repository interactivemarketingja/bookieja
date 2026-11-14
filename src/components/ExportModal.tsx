import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Calendar, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { cn } from '../lib/utils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (filters: ExportFilters) => void;
}

export interface ExportFilters {
  startDate: string;
  endDate: string;
  statuses: string[];
}

export function ExportModal({ isOpen, onClose, onExport }: ExportModalProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['Completed', 'Pending', 'Flagged']);

  const statuses = [
    { id: 'Completed', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 'Pending', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
    { id: 'Flagged', icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50' },
  ];

  const toggleStatus = (status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status) 
        : [...prev, status]
    );
  };

  const handleExport = () => {
    onExport({
      startDate,
      endDate,
      statuses: selectedStatuses
    });
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
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600">
                  <Download size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Export Ledger</h3>
                  <p className="text-xs text-slate-500">Configure your CSV export</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Date Range */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Calendar size={14} />
                  Date Range (Optional)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-medium ml-1">From</span>
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-medium ml-1">To</span>
                    <input 
                      type="date" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Transaction Status
                </label>
                <div className="space-y-2">
                  {statuses.map((status) => (
                    <button
                      key={status.id}
                      onClick={() => toggleStatus(status.id)}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-xl border transition-all",
                        selectedStatuses.includes(status.id)
                          ? "border-brand-200 bg-brand-50/30"
                          : "border-slate-100 bg-white hover:border-slate-200"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", status.bg, status.color)}>
                          <status.icon size={16} />
                        </div>
                        <span className="text-sm font-medium text-slate-700">{status.id}</span>
                      </div>
                      <div className={cn(
                        "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                        selectedStatuses.includes(status.id)
                          ? "bg-brand-600 border-brand-600 text-white"
                          : "border-slate-200 bg-white"
                      )}>
                        {selectedStatuses.includes(status.id) && <CheckCircle2 size={12} />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleExport}
                disabled={selectedStatuses.length === 0}
                className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20 disabled:opacity-50 disabled:shadow-none"
              >
                Download CSV
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
