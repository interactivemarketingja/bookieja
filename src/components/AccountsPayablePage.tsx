import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Receipt, 
  AlertCircle, 
  CheckCircle2,
  Calendar,
  Search,
  Store
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { Expense } from '../types';
import { cn, formatCurrency, parseLocalDate, formatLocalDate } from '../lib/utils';

export function AccountsPayablePage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Overdue' | 'Pending'>('All');

  const fetchData = () => {
    const data = dataService.getExpenses();
    setExpenses(data.filter(exp => exp.status !== 'Paid' && exp.due_date));
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

  const getAgingCategory = (days: number) => {
    if (days <= 0) return 'Current';
    if (days <= 30) return '1-30 Days';
    if (days <= 60) return '31-60 Days';
    if (days <= 90) return '61-90 Days';
    return '90+ Days';
  };

  const agingData = expenses.reduce((acc, exp) => {
    if (!exp.due_date) return acc;
    const days = calculateAging(exp.due_date);
    const category = getAgingCategory(days);
    acc[category] = (acc[category] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  const totalAP = Object.values(agingData).reduce((a, b) => a + b, 0);

  const filteredExpenses = expenses.filter(exp => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = (exp.description || '').toLowerCase().includes(q) ||
      (exp.category || '').toLowerCase().includes(q);
    const days = exp.due_date ? calculateAging(exp.due_date) : 0;
    const isOverdue = exp.status === 'Overdue' || days > 0;
    const matchesFilter =
      statusFilter === 'All' ||
      (statusFilter === 'Overdue' && isOverdue) ||
      (statusFilter === 'Pending' && !isOverdue);
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
        <h1 className="text-4xl font-black text-jamaica-black tracking-tighter uppercase">Accounts Payable</h1>
        <p className="text-slate-500 mt-1 font-medium">Track upcoming bills and vendor aging</p>
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
                {totalAP > 0 ? Math.round(((agingData[cat] || 0) / totalAP) * 100) : 0}% of total
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
              placeholder="Search vendor or description..." 
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
              <option value="All">All Payables</option>
              <option value="Overdue">Overdue Only</option>
              <option value="Pending">Current / Pending</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendor / Category</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Due Date</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Aging Status</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount Payable</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredExpenses.map((exp) => {
                const days = exp.due_date ? calculateAging(exp.due_date) : 0;
                const isOverdue = days > 0;
                
                return (
                  <tr key={exp.id} className="group hover:bg-slate-50/50 transition-all">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent-50 flex items-center justify-center text-accent-600">
                          <Store size={14} />
                        </div>
                        <span className="text-sm font-black text-jamaica-black uppercase tracking-tight">{exp.category}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs font-bold text-slate-400">{exp.description || 'No description'}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <Calendar size={14} className="text-slate-400" />
                        {exp.due_date}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {isOverdue ? (
                        <span className="text-xs font-black text-rose-600 uppercase tracking-widest flex items-center gap-1">
                          <AlertCircle size={14} />
                          {days} Days Overdue
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
                        {formatCurrency(exp.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        exp.status === 'Overdue' ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                      )}>
                        {exp.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300">
                        <Receipt size={32} />
                      </div>
                      <p className="text-slate-500 font-medium">No outstanding payables found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-slate-50/50">
              <tr className="font-black">
                <td colSpan={4} className="px-4 py-4 text-xs uppercase tracking-widest text-slate-400">Total Payables</td>
                <td className="px-4 py-4 text-right text-lg font-black text-accent-600 tabular-nums">{formatCurrency(totalAP)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
