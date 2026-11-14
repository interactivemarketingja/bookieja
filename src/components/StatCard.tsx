import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';
import { cn, formatCurrency, formatNumber, formatPercent } from '../lib/utils';

interface StatCardProps {
  title: string;
  value: number;
  type: 'currency' | 'number' | 'percent';
  trend?: number;
  icon: LucideIcon;
  delay?: number;
}

export function StatCard({ title, value, type, trend, icon: Icon, delay = 0 }: StatCardProps) {
  const formattedValue = type === 'currency' 
    ? formatCurrency(value) 
    : type === 'percent' 
    ? formatPercent(value) 
    : formatNumber(value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-panel p-6 rounded-3xl flex flex-col gap-5 border-slate-100 shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex justify-between items-start">
        <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl shadow-sm">
          <Icon size={24} />
        </div>
        {trend !== undefined && (
          <div className={cn(
            "text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider",
            trend >= 0 ? "bg-brand-50 text-brand-700" : "bg-rose-50 text-rose-600"
          )}>
            {trend >= 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>
      <div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{title}</p>
        <h3 className="text-3xl font-black text-jamaica-black mt-1 tracking-tighter">{formattedValue}</h3>
      </div>
    </motion.div>
  );
}
