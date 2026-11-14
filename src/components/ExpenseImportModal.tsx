import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  FileText,
  Table as TableIcon,
  ChevronRight,
  ChevronLeft,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Expense, BudgetCategory } from '../types';
import { cn, formatCurrency } from '../lib/utils';

interface ExpenseImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (expenses: Expense[]) => void;
  categories: BudgetCategory[];
}

type Step = 'upload' | 'mapping' | 'preview';

export function ExpenseImportModal({ isOpen, onClose, onImport, categories }: ExpenseImportModalProps) {
  const [step, setStep] = useState<Step>('upload');
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importedExpenses, setImportedExpenses] = useState<Partial<Expense>[]>([]);
  const [error, setError] = useState<string | null>(null);

  const expenseFields = [
    { key: 'category', label: 'Category', required: true },
    { key: 'amount', label: 'Amount', required: true },
    { key: 'date', label: 'Date', required: true },
    { key: 'due_date', label: 'Due Date', required: false },
    { key: 'description', label: 'Description', required: false },
    { key: 'status', label: 'Status', required: false },
    { key: 'is_recurring', label: 'Is Recurring', required: false },
    { key: 'frequency', label: 'Frequency', required: false },
    { key: 'duration_months', label: 'Duration (Months)', required: false },
  ];

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = text.split(/\r?\n/).filter(row => row.trim() !== '');
      const data = rows.map(row => {
        // Simple CSV parser that handles quoted values
        const matches = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        return matches ? matches.map(val => val.replace(/^"|"$/g, '')) : row.split(',');
      });

      if (data.length < 2) {
        setError('CSV file must have at least a header and one data row.');
        return;
      }

      setHeaders(data[0]);
      setCsvData(data.slice(1));
      
      // Auto-mapping
      const initialMapping: Record<string, string> = {};
      data[0].forEach((header, index) => {
        const lowerHeader = header.toLowerCase();
        const field = expenseFields.find(f => 
          f.key.toLowerCase() === lowerHeader || 
          f.label.toLowerCase() === lowerHeader ||
          (f.key === 'category' && lowerHeader.includes('cat')) ||
          (f.key === 'amount' && (lowerHeader.includes('amt') || lowerHeader.includes('price'))) ||
          (f.key === 'date' && lowerHeader.includes('date'))
        );
        if (field) {
          initialMapping[field.key] = index.toString();
        }
      });
      
      setMapping(initialMapping);
      setStep('mapping');
      setError(null);
    };
    reader.readAsText(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false
  });

  const handleProcessMapping = () => {
    // Check required fields
    const missingFields = expenseFields.filter(f => f.required && !mapping[f.key]);
    if (missingFields.length > 0) {
      setError(`Please map all required fields: ${missingFields.map(f => f.label).join(', ')}`);
      return;
    }

    const expenses: Partial<Expense>[] = csvData.map((row, rowIndex) => {
      const expense: any = {
        id: `EXP-IMP-${Date.now()}-${rowIndex}`,
        status: 'Pending',
        is_recurring: false,
        frequency: 'Monthly',
        duration_months: 12
      };

      Object.entries(mapping).forEach(([field, colIndex]) => {
        const value = row[parseInt(colIndex)];
        if (field === 'amount') {
          expense[field] = parseFloat(value.replace(/[^0-9.-]+/g, '')) || 0;
        } else if (field === 'is_recurring') {
          expense[field] = value.toLowerCase() === 'true' || value.toLowerCase() === 'yes' || value === '1';
        } else if (field === 'duration_months') {
          expense[field] = parseInt(value) || 12;
        } else {
          expense[field] = value;
        }
      });

      // Validate category
      const categoryExists = categories.some(c => c.name.toLowerCase() === expense.category?.toLowerCase());
      if (!categoryExists && expense.category) {
        // If category doesn't exist, we'll use the first one available or 'Uncategorized'
        expense.category = categories[0]?.name || 'Uncategorized';
      }

      return expense;
    });

    setImportedExpenses(expenses);
    setStep('preview');
    setError(null);
  };

  const handleImport = () => {
    onImport(importedExpenses as Expense[]);
    onClose();
    // Reset state
    setStep('upload');
    setCsvData([]);
    setHeaders([]);
    setMapping({});
    setImportedExpenses([]);
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
            className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 jamaica-gradient rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
                  <Upload size={20} />
                </div>
                <div>
                  <h3 className="font-black text-jamaica-black uppercase tracking-tight">Import Expenses</h3>
                  <p className="text-xs text-slate-500 font-medium">Bulk import from CSV file</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              {/* Stepper */}
              <div className="flex items-center justify-center mb-10">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all",
                    step === 'upload' ? "bg-brand-600 text-white" : "bg-emerald-100 text-emerald-600"
                  )}>
                    {step === 'upload' ? '1' : <CheckCircle2 size={16} />}
                  </div>
                  <div className="w-12 h-0.5 bg-slate-100" />
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all",
                    step === 'mapping' ? "bg-brand-600 text-white" : 
                    step === 'preview' ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
                  )}>
                    {step === 'preview' ? <CheckCircle2 size={16} /> : '2'}
                  </div>
                  <div className="w-12 h-0.5 bg-slate-100" />
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all",
                    step === 'preview' ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-400"
                  )}>
                    3
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-700 text-sm font-bold">
                  <AlertTriangle size={18} />
                  {error}
                </div>
              )}

              {step === 'upload' && (
                <div className="space-y-6">
                  <div 
                    {...getRootProps()} 
                    className={cn(
                      "border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center transition-all cursor-pointer",
                      isDragActive ? "border-brand-500 bg-brand-50/50" : "border-slate-200 hover:border-brand-400 hover:bg-slate-50"
                    )}
                  >
                    <input {...getInputProps()} />
                    <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 mb-4">
                      <FileText size={32} />
                    </div>
                    <h4 className="text-lg font-black text-jamaica-black uppercase tracking-tight mb-2">
                      {isDragActive ? 'Drop the file here' : 'Select CSV File'}
                    </h4>
                    <p className="text-sm text-slate-500 max-w-xs mx-auto">
                      Drag and drop your expense CSV file here, or click to browse your files.
                    </p>
                  </div>
                  
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">CSV Format Requirements</h5>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        First row must be headers
                      </li>
                      <li className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        Required fields: Category, Amount, Date
                      </li>
                      <li className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        Date format should be YYYY-MM-DD
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {step === 'mapping' && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-black text-jamaica-black uppercase tracking-tight">Map CSV Columns</h4>
                    <p className="text-xs text-slate-500 font-medium">Match your CSV columns to expense fields</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {expenseFields.map((field) => (
                      <div key={field.key} className="flex items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="w-1/3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">{field.label}</span>
                            {field.required && <span className="text-rose-500 text-xs font-black">*</span>}
                          </div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest">Expense Field</p>
                        </div>
                        <ArrowRight size={16} className="text-slate-300" />
                        <div className="flex-1">
                          <select 
                            value={mapping[field.key] || ''}
                            onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all appearance-none"
                          >
                            <option value="">-- Select Column --</option>
                            {headers.map((header, index) => (
                              <option key={index} value={index}>{header}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 'preview' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-black text-jamaica-black uppercase tracking-tight">Preview Data</h4>
                    <span className="px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                      {importedExpenses.length} Records Found
                    </span>
                  </div>

                  <div className="border border-slate-100 rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                          <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                          <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                          <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {importedExpenses.slice(0, 5).map((expense, i) => (
                          <tr key={i} className="text-xs">
                            <td className="px-4 py-3 font-bold text-jamaica-black uppercase tracking-tight">{expense.category}</td>
                            <td className="px-4 py-3 font-black text-rose-600">{formatCurrency(expense.amount || 0)}</td>
                            <td className="px-4 py-3 text-slate-500">{expense.date}</td>
                            <td className="px-4 py-3 text-slate-500 truncate max-w-[200px]">{expense.description || '-'}</td>
                          </tr>
                        ))}
                        {importedExpenses.length > 5 && (
                          <tr>
                            <td colSpan={4} className="px-4 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                              And {importedExpenses.length - 5} more records...
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
                    <AlertTriangle size={18} className="text-amber-600 mt-0.5" />
                    <p className="text-xs text-amber-700 leading-relaxed font-medium">
                      Please review the data above. Once imported, these expenses will be added to your ledger. 
                      Categories that don't match existing ones will be assigned to your default category.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-white flex gap-4 sticky bottom-0 z-10">
              {step === 'upload' ? (
                <button 
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-slate-50 text-slate-600 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
              ) : (
                <button 
                  onClick={() => setStep(step === 'mapping' ? 'upload' : 'mapping')}
                  className="flex-1 px-6 py-3 bg-slate-50 text-slate-600 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                >
                  <ChevronLeft size={18} />
                  Back
                </button>
              )}

              {step === 'upload' ? (
                <div className="flex-1" />
              ) : step === 'mapping' ? (
                <button 
                  onClick={handleProcessMapping}
                  className="flex-1 px-6 py-3 bg-brand-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-brand-700 transition-all shadow-xl shadow-brand-500/20 flex items-center justify-center gap-2"
                >
                  Continue
                  <ChevronRight size={18} />
                </button>
              ) : (
                <button 
                  onClick={handleImport}
                  className="flex-1 px-6 py-3 bg-brand-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-brand-700 transition-all shadow-xl shadow-brand-500/20 flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  Import {importedExpenses.length} Records
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
