import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  FileText, 
  X, 
  Check, 
  AlertCircle, 
  Wand2, 
  Trash2, 
  Table as TableIcon,
  ArrowRight,
  Shield
} from 'lucide-react';
import { cn } from '../lib/utils';
import { dataService } from '../services/dataService';
import { Expense } from '../types';

interface ImportError {
  field: keyof ImportedRow;
  message: string;
}

interface ImportedRow {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  status: 'clean' | 'dirty' | 'fixed';
  errors?: ImportError[];
  suggestions?: {
    field: keyof ImportedRow;
    value: string;
    reason: string;
  }[];
}

const CATEGORY_KEYWORDS: Record<string, string> = {
  'rent': 'Rent',
  'lease': 'Rent',
  'electricity': 'Utilities',
  'water': 'Utilities',
  'jps': 'Utilities',
  'internet': 'Utilities',
  'flow': 'Utilities',
  'digicel': 'Utilities',
  'salary': 'Salary',
  'payroll': 'Salary',
  'wages': 'Salary',
  'marketing': 'Marketing',
  'ads': 'Marketing',
  'facebook': 'Marketing',
  'google': 'Marketing',
  'software': 'Software',
  'subscription': 'Software',
  'aws': 'Software',
  'cloud': 'Software',
  'supplies': 'Expenses',
  'office': 'Expenses',
  'lunch': 'Dining',
  'dinner': 'Dining',
  'restaurant': 'Dining',
  'consulting': 'Revenue',
  'fee': 'Revenue',
  'payment': 'Revenue',
};

function parseAndNormalizeDate(dateStr: string): { normalized: string; error?: string } {
  // Try YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return { normalized: dateStr };
  
  // Try MM/DD/YYYY or DD/MM/YYYY
  const parts = dateStr.split(/[\/\-]/);
  if (parts.length === 3) {
    let month, day, year;
    if (parts[0].length === 4) { // YYYY/MM/DD
      [year, month, day] = parts;
    } else if (parts[2].length === 4) { // MM/DD/YYYY or DD/MM/YYYY
      // Defaulting to MM/DD/YYYY for simplicity in this demo, but could be smarter
      [month, day, year] = parts;
    } else {
      return { normalized: dateStr, error: 'Ambiguous date format' };
    }
    
    const d = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    if (!isNaN(d.getTime())) {
      return { normalized: d.toISOString().split('T')[0] };
    }
  }
  
  return { normalized: dateStr, error: 'Invalid date format' };
}

function suggestCategory(description: string): string | null {
  const desc = description.toLowerCase();
  for (const [keyword, category] of Object.entries(CATEGORY_KEYWORDS)) {
    if (desc.includes(keyword)) return category;
  }
  return null;
}

export function DataImportPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [data, setData] = useState<ImportedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'upload' | 'clean'>('upload');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
    setIsProcessing(true);
    
    // Simulate parsing and initial validation
    setTimeout(() => {
      const rawData = [
        { id: '1', date: '2024-05-01', description: 'Office Supplies', amount: 150.00, category: 'Expenses' },
        { id: '2', date: '05/02/2024', description: 'Client Lunch at Usain Bolt\'s Tracks & Records', amount: 85.50, category: '' },
        { id: '3', date: '2024-05-03', description: 'Monthly AWS Cloud Subscription', amount: 29.99, category: '' },
        { id: '4', date: '2024-05-03', description: 'Monthly AWS Cloud Subscription', amount: 29.99, category: 'Software' },
        { id: '5', date: '2024-05-04', description: 'Consulting Fee - Project Alpha', amount: 1200.00, category: 'Revenue' },
        { id: '6', date: 'invalid-date', description: 'JPS Electricity Bill', amount: 450.00, category: 'Utilities' },
      ];

        const processedData: ImportedRow[] = rawData.map(row => {
          const dateResult = parseAndNormalizeDate(row.date);
          const categorySuggestion = row.category ? null : suggestCategory(row.description);
          
          const errors: ImportError[] = [];
          const suggestions: ImportedRow['suggestions'] = [];

          if (dateResult.error) {
            errors.push({ field: 'date', message: dateResult.error });
          } else if (dateResult.normalized !== row.date) {
            suggestions.push({ field: 'date', value: dateResult.normalized, reason: 'Standardized format' });
          }

          if (!row.category) {
            if (categorySuggestion) {
              suggestions.push({ field: 'category', value: categorySuggestion, reason: 'Matched keyword' });
            } else {
              errors.push({ field: 'category', message: 'Missing category' });
            }
          }

          const isDuplicate = rawData.filter(r => r.description === row.description && r.amount === row.amount && r.date === row.date).length > 1;
          if (isDuplicate) {
            errors.push({ field: 'description', message: 'Potential duplicate' });
          }

          return {
            ...row,
            status: (errors.length > 0 || suggestions.length > 0) ? 'dirty' : 'clean',
            errors,
            suggestions
          };
        });

      setData(processedData);
      setIsProcessing(false);
      setStep('clean');
    }, 1500);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/json': ['.json']
    },
    multiple: false
  });

  const handleAutoClean = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setData(prev => {
        const cleaned = prev.map(row => {
          let newRow = { ...row };
          
          // Apply suggestions
          if (row.suggestions) {
            row.suggestions.forEach(s => {
              (newRow as any)[s.field] = s.value;
            });
          }

          // Final fallback for missing category
          if (!newRow.category) {
            newRow.category = 'Uncategorized';
          }

          return {
            ...newRow,
            status: 'fixed' as const,
            errors: [],
            suggestions: []
          };
        });

        // Deduplicate
        return cleaned.filter((row, index, self) => 
          index === self.findIndex((t) => t.description === row.description && t.amount === row.amount && t.date === row.date)
        );
      });
      setIsProcessing(false);
    }, 1500);
  };

  const applySuggestion = (rowId: string, field: keyof ImportedRow) => {
    setData(prev => prev.map(row => {
      if (row.id !== rowId) return row;
      const suggestion = row.suggestions?.find(s => s.field === field);
      if (!suggestion) return row;

      const newSuggestions = row.suggestions?.filter(s => s.field !== field) || [];
      const newErrors = row.errors?.filter(e => e.field !== field) || [];
      const newRow = {
        ...row,
        [field]: suggestion.value,
        suggestions: newSuggestions,
        errors: newErrors,
      };

      return {
        ...newRow,
        status: (newErrors.length === 0 && newSuggestions.length === 0) ? 'clean' : 'dirty'
      };
    }));
  };

  const markAsCorrect = (rowId: string) => {
    setData(prev => prev.map(row => {
      if (row.id !== rowId) return row;
      return {
        ...row,
        status: 'fixed',
        errors: [],
        suggestions: []
      };
    }));
  };

  const removeRow = (id: string) => {
    setData(prev => prev.filter(row => row.id !== id));
  };

  const handleImport = () => {
    if (data.length === 0) return;
    
    setIsProcessing(true);
    
    // Convert imported rows to Expense objects
    const expenses: Expense[] = data.map(row => ({
      id: Math.random().toString(36).substr(2, 9),
      date: row.date,
      description: row.description,
      amount: row.amount,
      category: row.category || 'Uncategorized',
      status: 'Paid' // Default to Paid for imports
    }));

    // Save each expense
    expenses.forEach(expense => {
      dataService.saveExpense(expense);
    });

    setTimeout(() => {
      setIsProcessing(false);
      alert(`Successfully imported ${expenses.length} records!`);
      setStep('upload');
      setData([]);
      setFiles([]);
    }, 1000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Data Import & Cleaning</h1>
          <p className="text-slate-500 mt-1">Upload your financial statements and clean your data</p>
        </div>
        {step === 'clean' && (
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setStep('upload')}
              className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={handleAutoClean}
              disabled={isProcessing}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-all disabled:opacity-50"
            >
              {isProcessing ? <Wand2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
              Auto-Clean Data
            </button>
          </div>
        )}
      </header>

      <AnimatePresence mode="wait">
        {step === 'upload' ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-3xl mx-auto"
          >
            <div 
              {...getRootProps()} 
              className={cn(
                "border-2 border-dashed rounded-3xl p-16 text-center transition-all cursor-pointer",
                isDragActive ? "border-brand-500 bg-brand-50/50" : "border-slate-200 hover:border-brand-400 hover:bg-slate-50/50"
              )}
            >
              <input {...getInputProps()} />
              <div className="w-20 h-20 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 mx-auto mb-6">
                <Upload size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {isDragActive ? "Drop your file here" : "Upload your financial data"}
              </h3>
              <p className="text-slate-500 mb-8 max-w-sm mx-auto">
                Drag and drop your CSV, Excel, or JSON files. We'll automatically detect the format and prepare it for cleaning.
              </p>
              <div className="flex items-center justify-center gap-6 text-slate-400">
                <div className="flex items-center gap-2">
                  <FileText size={16} />
                  <span className="text-xs font-medium">CSV</span>
                </div>
                <div className="flex items-center gap-2">
                  <TableIcon size={16} />
                  <span className="text-xs font-medium">Excel</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield size={16} />
                  <span className="text-xs font-medium">Secure</span>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="clean"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 glass-panel rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-bottom border-slate-100">
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {data.map((row) => {
                        const rowErrors = row.errors || [];
                        const rowSuggestions = row.suggestions || [];
                        const isDirty = row.status === 'dirty';

                        return (
                          <tr key={row.id} className={cn(
                            "group transition-all",
                            isDirty ? "bg-rose-50/20" : "hover:bg-slate-50/50"
                          )}>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <div className={cn(
                                  "text-sm px-2 py-1 rounded-lg inline-block",
                                  rowErrors.some(e => e.field === 'date') ? "bg-rose-100 text-rose-700 font-bold" : 
                                  rowSuggestions.some(s => s.field === 'date') ? "bg-brand-50 text-brand-700 font-bold" : "text-slate-600 font-medium"
                                )}>
                                  {row.date}
                                </div>
                                {rowSuggestions.find(s => s.field === 'date') && (
                                  <button 
                                    onClick={() => applySuggestion(row.id, 'date')}
                                    className="text-[10px] bg-brand-600 text-white px-2 py-1 rounded-lg font-black uppercase tracking-wider hover:bg-brand-700 transition-all flex items-center gap-1 shadow-sm"
                                  >
                                    <Check size={10} />
                                    Fix: {rowSuggestions.find(s => s.field === 'date')?.value}
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <div className={cn(
                                  "text-sm px-2 py-1 rounded-lg inline-block",
                                  rowErrors.some(e => e.field === 'description') ? "bg-amber-100 text-amber-700 font-bold" : "text-slate-900 font-bold"
                                )}>
                                  {row.description}
                                </div>
                                {rowErrors.find(e => e.field === 'description') && (
                                  <span className="text-[10px] text-amber-600 font-black uppercase tracking-widest flex items-center gap-1 ml-2">
                                    <AlertCircle size={10} />
                                    {rowErrors.find(e => e.field === 'description')?.message}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-slate-600 font-bold">${row.amount.toFixed(2)}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                {row.category ? (
                                  <div className={cn(
                                    "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider inline-block",
                                    rowSuggestions.some(s => s.field === 'category') ? "bg-brand-50 text-brand-700 border border-brand-200" : "bg-slate-100 text-slate-600"
                                  )}>
                                    {row.category}
                                  </div>
                                ) : (
                                  <span className="px-2 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 w-fit border border-rose-200">
                                    <AlertCircle size={10} />
                                    Missing
                                  </span>
                                )}
                                {rowSuggestions.find(s => s.field === 'category') && (
                                  <button 
                                    onClick={() => applySuggestion(row.id, 'category')}
                                    className="text-[10px] bg-brand-600 text-white px-2 py-1 rounded-lg font-black uppercase tracking-wider hover:bg-brand-700 transition-all flex items-center gap-1 shadow-sm"
                                  >
                                    <Check size={10} />
                                    Suggest: {rowSuggestions.find(s => s.field === 'category')?.value}
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {isDirty && (
                                  <button 
                                    onClick={() => markAsCorrect(row.id)}
                                    className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
                                    title="Mark as Correct"
                                  >
                                    <Check size={18} />
                                  </button>
                                )}
                                <button 
                                  onClick={() => removeRow(row.id)}
                                  className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                  title="Remove Row"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-6">
                <div className="glass-panel p-6 rounded-3xl space-y-4">
                  <h3 className="font-bold text-slate-900">Cleaning Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                      <span className="text-sm text-slate-500">Total Rows</span>
                      <span className="text-sm font-bold text-slate-900">{data.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-rose-50 rounded-xl">
                      <span className="text-sm text-rose-600 font-medium">Issues Detected</span>
                      <span className="text-sm font-bold text-rose-600">
                        {data.filter(r => r.status === 'dirty').length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl">
                      <span className="text-sm text-emerald-600 font-medium">Clean Rows</span>
                      <span className="text-sm font-bold text-emerald-600">
                        {data.filter(r => r.status === 'clean' || r.status === 'fixed').length}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={handleImport}
                    disabled={isProcessing || data.some(r => r.status === 'dirty')}
                    className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    Confirm & Import
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
