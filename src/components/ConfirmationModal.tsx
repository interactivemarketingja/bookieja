import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '../lib/utils';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  variant?: 'danger' | 'success' | 'info';
}

export function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm',
  variant = 'danger'
}: ConfirmationModalProps) {
  const icons = {
    danger: <AlertTriangle size={32} />,
    success: <CheckCircle2 size={32} />,
    info: <Info size={32} />
  };

  const colors = {
    danger: 'bg-rose-50 text-rose-600',
    success: 'bg-emerald-50 text-emerald-600',
    info: 'bg-brand-50 text-brand-600'
  };

  const buttonColors = {
    danger: 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20',
    success: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20',
    info: 'bg-brand-600 hover:bg-brand-700 shadow-brand-500/20'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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
            <div className="p-8 text-center">
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6",
                colors[variant]
              )}>
                {icons[variant]}
              </div>
              <h3 className="text-xl font-black text-jamaica-black uppercase tracking-tight mb-2">
                {title}
              </h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                {message}
              </p>
            </div>

            <div className="p-6 bg-slate-50 flex gap-4">
              <button 
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={onConfirm}
                className={cn(
                  "flex-1 px-6 py-3 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl",
                  buttonColors[variant]
                )}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
