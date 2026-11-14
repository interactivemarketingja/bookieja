import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Calendar, CheckCircle2, Clock, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { cn } from '../lib/utils';

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (filters: ReportExportFilters) => void;
  currentDateRange: { start: string; end: string };
  currentStatus: string;
  reportType: string;
}

export interface ReportExportFilters {
  startDate: string;
  endDate: string;
  status: string;
}

export function ReportExportModal({ 
  isOpen, 
  onClose, 
  onExport, 
  currentDateRange, 
  currentStatus,
  reportType
}: ReportExportModalProps) {
  const [startDate, setStartDate] = useState(currentDateRange.start);
  const [endDate, setEndDate] = useState(currentDateRange.end);
  const [status, setStatus] = useState(currentStatus);

  useEffect(() => {
    if (isOpen) {
      setStartDate(currentDateRange.start);
      setEndDate(currentDateRange.end);
      setStatus(currentStatus);
    }
  }, [isOpen, currentDateRange, currentStatus]);

  const handleExport = () => {
    onExport({
      startDate,
      endDate,
      status
    });
    onClose();
  };

  const reportName = reportType.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

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
                <div className="w-10 h-10 jamaica-gradient rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h3 className="font-black text-jamaica-black uppercase tracking-tight">Export {reportName}</h3>
                  <p className="text-xs text-slate-500 font-medium">Configure CSV export settings</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-all"
              >
                <X size={20} />
              </button>
            </div>
 
            <div className="p-8 space-y-6">
              {/* Date Range */}
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Calendar size={14} />
                  Date Range
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-1">From</span>
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-1">To</span>
                    <input 
                      type="date" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Clock size={14} />
                  Status Filter
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'All', label: 'All Statuses', icon: CheckCircle2, color: 'text-slate-400' },
                    { id: 'Paid', label: 'Paid Only', icon: CheckCircle2, color: 'text-emerald-500' },
                    { id: 'Unpaid', label: 'Unpaid / Pending', icon: Clock, color: 'text-accent-500' },
                    { id: 'Overdue', label: 'Overdue Only', icon: AlertTriangle, color: 'text-rose-500' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setStatus(opt.id)}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-2xl border transition-all",
                        status === opt.id 
                          ? "border-brand-200 bg-brand-50/30" 
                          : "border-slate-100 bg-white hover:border-slate-200"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <opt.icon size={16} className={opt.color} />
                        <span className="text-sm font-bold text-slate-700">{opt.label}</span>
                      </div>
                      <div className={cn(
                        "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                        status === opt.id 
                          ? "bg-brand-600 border-brand-600 text-white" 
                          : "border-slate-200 bg-white"
                      )}>
                        {status === opt.id && <CheckCircle2 size={12} />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-4">
              <button 
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleExport}
                className="flex-1 px-6 py-3 bg-brand-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-brand-700 transition-all shadow-xl shadow-brand-500/20 flex items-center justify-center gap-2"
              >
                <Download size={18} />
                Export CSV
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
