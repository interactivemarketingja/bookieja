import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, 
  AlertCircle, 
  CheckCircle2,
  Calendar,
  Search,
  User
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { Invoice } from '../types';
import { cn, formatCurrency, parseLocalDate, formatLocalDate } from '../lib/utils';
import { InvoiceDetailsModal } from './InvoicesPage';

export function AccountsReceivablePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Overdue' | 'Current'>('All');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const fetchData = () => {
    const data = dataService.getInvoices();
    const unpaidInvoices = data.filter(inv => inv.status !== 'Paid');
    setInvoices(unpaidInvoices);
    
    // Update selected invoice if it's currently open
    setSelectedInvoice(prev => {
      if (!prev) return null;
      return data.find(inv => inv.id === prev.id) || prev;
    });
  };

  useEffect(() => {
    fetchData();
    window.addEventListener('island-data-synced', fetchData);
    return () => window.removeEventListener('island-data-synced', fetchData);
  }, []);

  const calculateAging = (dueDate: string) => {
    const todayLocal = parseLocalDate(formatLocalDate());
    const due = parseLocalDate(dueDate);
    const diffTime = todayLocal.getTime() - due.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  };

  const getRemainingBalance = (inv: Invoice) => {
    if (inv.status === 'Paid') return 0;
    const paid = (inv.payment_history || []).reduce((sum, p) => sum + p.amount, 0);
    return Math.max(0, inv.amount + (inv.tax_amount || 0) - paid);
  };

  const getAgingCategory = (days: number) => {
    if (days <= 0) return 'Current';
    if (days <= 30) return '1-30 Days';
    if (days <= 60) return '31-60 Days';
    if (days <= 90) return '61-90 Days';
    return '90+ Days';
  };

  const agingData = invoices.reduce((acc, inv) => {
    const days = calculateAging(inv.due_date);
    const category = getAgingCategory(days);
    acc[category] = (acc[category] || 0) + getRemainingBalance(inv);
    return acc;
  }, {} as Record<string, number>);

  const totalAR = Object.values(agingData).reduce((a, b) => a + b, 0);

  const filteredInvoices = invoices.filter(inv => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = (inv.client_name || '').toLowerCase().includes(q) ||
      (inv.id || '').toLowerCase().includes(q);
    const days = calculateAging(inv.due_date);
    const matchesFilter =
      statusFilter === 'All' ||
      (statusFilter === 'Overdue' && days > 0) ||
      (statusFilter === 'Current' && days <= 0);
    return matchesSearch && matchesFilter;
  });

  const categories = ['Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days'];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header>
        <h1 className="text-4xl font-black text-jamaica-black tracking-tighter uppercase">Accounts Receivable</h1>
        <p className="text-slate-500 mt-1 font-medium">Track outstanding payments and client aging</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {categories.map((cat, idx) => (
          <div key={cat} className="glass-panel p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className={cn(
              "absolute top-0 left-0 w-1 h-full",
              idx === 0 ? "bg-emerald-500" : idx === 1 ? "bg-amber-400" : idx === 2 ? "bg-orange-500" : "bg-rose-600"
            )} />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{cat}</p>
            <p className="text-xl font-black text-jamaica-black">{formatCurrency(agingData[cat] || 0)}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                {totalAR > 0 ? Math.round(((agingData[cat] || 0) / totalAR) * 100) : 0}% of total
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-panel p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search client or invoice ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="All">All Receivables</option>
              <option value="Overdue">Overdue Only</option>
              <option value="Current">Current Only</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Due Date</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Days Overdue</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount Due</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredInvoices.map((inv) => {
                const days = calculateAging(inv.due_date);
                const isOverdue = days > 0;
                
                return (
                  <tr key={inv.id} className="group hover:bg-slate-50/50 transition-all">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-brand-600">
                          <User size={14} />
                        </div>
                        <span className="text-sm font-black text-jamaica-black uppercase tracking-tight">{inv.client_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <button 
                        onClick={() => {
                          setSelectedInvoice(inv);
                          setIsDetailsModalOpen(true);
                        }}
                        className="text-xs font-mono font-bold text-brand-600 hover:text-brand-700 hover:underline transition-all"
                      >
                        {inv.id}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <Calendar size={14} className="text-slate-400" />
                        {inv.due_date}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {isOverdue ? (
                        <span className="text-xs font-black text-rose-600 uppercase tracking-widest flex items-center gap-1">
                          <AlertCircle size={14} />
                          {days} Days
                        </span>
                      ) : (
                        <span className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                          <CheckCircle2 size={14} />
                          Current
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-sm font-black text-jamaica-black tabular-nums">
                        {formatCurrency(getRemainingBalance(inv))}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        (inv.status === 'Overdue' || isOverdue) ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                      )}>
                        {isOverdue ? 'Overdue' : inv.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300">
                        <FileText size={32} />
                      </div>
                      <p className="text-slate-500 font-medium">No outstanding receivables found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-slate-50/50">
              <tr className="font-black">
                <td colSpan={4} className="px-4 py-4 text-xs uppercase tracking-widest text-slate-400">Total Receivables</td>
                <td className="px-4 py-4 text-right text-lg font-black text-brand-600 tabular-nums">{formatCurrency(totalAR)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <InvoiceDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
        onEdit={() => {
          // For now, we just close the details modal. 
          // If we wanted to edit, we'd need to navigate to InvoicesPage with edit state.
          setIsDetailsModalOpen(false);
        }}
        onUpdate={fetchData}
      />
    </motion.div>
  );
}
