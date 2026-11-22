import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  FileText, 
  Check, 
  AlertCircle, 
  Wand2, 
  Trash2, 
  ArrowRight,
  Shield,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { cn, formatCurrency, formatLocalDate } from '../lib/utils';
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
  const trimmed = (dateStr || '').trim();
  if (!trimmed) return { normalized: trimmed, error: 'Missing date' };

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return { normalized: trimmed };
  
  const parts = trimmed.split(/[\/\-]/);
  if (parts.length === 3) {
    let year: number, month: number, day: number;
    if (parts[0].length === 4) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    } else if (parts[2].length === 4) {
      month = parseInt(parts[0], 10);
      day = parseInt(parts[1], 10);
      year = parseInt(parts[2], 10);
      if (month > 12 && day <= 12) {
        const tmp = month;
        month = day;
        day = tmp;
      }
    } else {
      return { normalized: trimmed, error: 'Ambiguous date format' };
    }
    
    const d = new Date(year, month - 1, day);
    if (!isNaN(d.getTime()) && d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day) {
      return { normalized: formatLocalDate(d) };
    }
  }
  
  return { normalized: trimmed, error: 'Invalid date format' };
}

function suggestCategory(description: string): string | null {
  const desc = (description || '').toLowerCase();
  for (const [keyword, category] of Object.entries(CATEGORY_KEYWORDS)) {
    if (desc.includes(keyword)) return category;
  }
  return null;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function processRawRows(rawData: { id: string; date: string; description: string; amount: number; category: string }[]): ImportedRow[] {
  return rawData.map((row, _, arr) => {
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

    if (isNaN(row.amount) || row.amount <= 0) {
      errors.push({ field: 'amount', message: 'Invalid amount' });
    }

    const isDuplicate = arr.filter(r => r.description === row.description && r.amount === row.amount && r.date === row.date).length > 1;
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
}

export function DataImportPage() {
  const [data, setData] = useState<ImportedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'upload' | 'clean'>('upload');
  const [statusBanner, setStatusBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const handleParsedRows = (rawRows: { id: string; date: string; description: string; amount: number; category: string }[], label: string) => {
    if (rawRows.length === 0) {
      setStatusBanner({ type: 'error', message: `No valid rows found in "${label}". Expected CSV headers: Date, Description, Amount, Category.` });
      setIsProcessing(false);
      return;
    }
    setFileName(label);
    setData(processRawRows(rawRows));
    setIsProcessing(false);
    setStep('clean');
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setStatusBanner(null);
    setIsProcessing(true);

    try {
      const lower = file.name.toLowerCase();
      if (lower.endsWith('.json')) {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const list = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.records) ? parsed.records : []);
        const rawRows = list.map((item: any, idx: number) => ({
          id: `IMP-${Date.now()}-${idx}`,
          date: String(item.date || item.Date || ''),
          description: String(item.description || item.Description || item.memo || item.Memo || item.name || item.Name || 'Imported Item'),
          amount: Math.abs(parseFloat(String(item.amount ?? item.Amount ?? item.total ?? 0).replace(/[^0-9.\-]/g, '')) || 0),
          category: String(item.category || item.Category || '')
        }));
        handleParsedRows(rawRows, file.name);
      } else if (lower.endsWith('.csv')) {
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
        if (lines.length < 2) {
          setStatusBanner({ type: 'error', message: 'CSV file must include a header row and at least one data row.' });
          setIsProcessing(false);
          return;
        }
        const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
        const dateIdx = headers.findIndex(h => h.includes('date'));
        const descIdx = headers.findIndex(h => h.includes('desc') || h.includes('memo') || h.includes('name') || h.includes('item'));
        const amtIdx = headers.findIndex(h => h.includes('amount') || h.includes('total') || h.includes('value') || h.includes('price'));
        const catIdx = headers.findIndex(h => h.includes('cat'));

        const rawRows = lines.slice(1).map((line, idx) => {
          const cols = parseCSVLine(line);
          const rawDate = dateIdx >= 0 ? cols[dateIdx] : cols[0] || '';
          const rawDesc = descIdx >= 0 ? cols[descIdx] : cols[1] || 'Imported Item';
          const rawAmt = amtIdx >= 0 ? cols[amtIdx] : cols[2] || '0';
          const rawCat = catIdx >= 0 ? cols[catIdx] : cols[3] || '';
          return {
            id: `IMP-${Date.now()}-${idx}`,
            date: rawDate,
            description: rawDesc,
            amount: Math.abs(parseFloat(rawAmt.replace(/[^0-9.\-]/g, '')) || 0),
            category: rawCat
          };
        });
        handleParsedRows(rawRows, file.name);
      } else {
        setStatusBanner({ type: 'error', message: 'Unsupported file format. Please upload a .csv or .json file.' });
        setIsProcessing(false);
      }
    } catch (err) {
      setStatusBanner({ type: 'error', message: `Failed to parse "${file.name}": ${(err as Error).message}` });
      setIsProcessing(false);
    }
  }, []);

  const handleLoadSample = () => {
    setStatusBanner(null);
    const sampleRows = [
      { id: `SMP-1`, date: '2025-02-01', description: 'Office Supplies', amount: 150.00, category: 'Expenses' },
      { id: `SMP-2`, date: '02/02/2025', description: 'Client Lunch at Tracks & Records', amount: 85.50, category: '' },
      { id: `SMP-3`, date: '2025-02-03', description: 'Monthly AWS Cloud Subscription', amount: 29.99, category: '' },
      { id: `SMP-4`, date: '2025-02-03', description: 'Monthly AWS Cloud Subscription', amount: 29.99, category: 'Software' },
      { id: `SMP-5`, date: 'invalid-date', description: 'JPS Electricity Bill', amount: 450.00, category: 'Utilities' },
    ];
    handleParsedRows(sampleRows, 'sample_statement.csv');
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/json': ['.json']
    },
    multiple: false
  });

  const handleAutoClean = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const todayStr = formatLocalDate();
      setData(prev => {
        const cleaned = prev.map(row => {
          const newRow = { ...row };
          
          if (row.suggestions) {
            row.suggestions.forEach(s => {
              (newRow as any)[s.field] = s.value;
            });
          }

          if (!parseAndNormalizeDate(newRow.date).error) {
            newRow.date = parseAndNormalizeDate(newRow.date).normalized;
          } else {
            newRow.date = todayStr;
          }

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

        return cleaned.filter((row, index, self) => 
          index === self.findIndex((t) => t.description === row.description && t.amount === row.amount && t.date === row.date)
        );
      });
      setIsProcessing(false);
    }, 300);
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
        date: parseAndNormalizeDate(row.date).error ? formatLocalDate() : parseAndNormalizeDate(row.date).normalized,
        category: row.category || 'Uncategorized',
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
    const todayStr = formatLocalDate();
    
    const expenses: Expense[] = data.map((row, idx) => ({
      id: `EXP-${Date.now()}-${idx}`,
      date: parseAndNormalizeDate(row.date).error ? todayStr : parseAndNormalizeDate(row.date).normalized,
      description: row.description,
      amount: Number(row.amount) || 0,
      category: row.category || 'Uncategorized',
      status: 'Paid'
    }));

    expenses.forEach(expense => {
      dataService.saveExpense(expense);
    });
    window.dispatchEvent(new CustomEvent('island-data-synced'));

    setIsProcessing(false);
    setStatusBanner({ type: 'success', message: `Successfully imported ${expenses.length} expense records into your ledger.` });
    setStep('upload');
    setData([]);
    setFileName('');
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
          <p className="text-slate-500 mt-1">
            {step === 'clean' && fileName
              ? `Reviewing parsed records from ${fileName}`
              : 'Upload your financial CSV or JSON statements and clean your data'}
          </p>
        </div>
        {step === 'clean' && (
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                setStep('upload');
                setData([]);
                setFileName('');
              }}
              className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={handleAutoClean}
              disabled={isProcessing}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-all disabled:opacity-50"
            >
              <Wand2 size={18} className={isProcessing ? "animate-spin" : ""} />
              Auto-Clean Data
            </button>
          </div>
        )}
      </header>

      {statusBanner && (
        <div className={cn(
          "p-4 rounded-2xl border flex items-center gap-3 text-sm font-bold",
          statusBanner.type === 'success'
            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
            : "bg-rose-50 border-rose-200 text-rose-700"
        )}>
          {statusBanner.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{statusBanner.message}</span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 'upload' ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-3xl mx-auto space-y-6"
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
                Drag and drop your CSV or JSON statement files. Include Date, Description, Amount, and optional Category columns.
              </p>
              <div className="flex items-center justify-center gap-6 text-slate-400">
                <div className="flex items-center gap-2">
                  <FileText size={16} />
                  <span className="text-xs font-medium">CSV & JSON</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield size={16} />
                  <span className="text-xs font-medium">Local Parsing</span>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleLoadSample}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
              >
                <Sparkles size={14} className="text-brand-600" />
                Try with Sample Statement Data
              </button>
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
                                  {row.date || 'Missing'}
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
                              <span className="text-sm text-slate-600 font-bold">{formatCurrency(row.amount)}</span>
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
                    disabled={isProcessing || data.length === 0 || data.some(r => r.status === 'dirty')}
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

