import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Tag, Plus, Trash2, Edit2, Save } from 'lucide-react';
import { BudgetCategory } from '../types';
import { dataService } from '../services/dataService';

interface CategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: BudgetCategory[];
  onRefresh: () => void;
}

export function CategoryManagementModal({ isOpen, onClose, categories, onRefresh }: CategoryManagementModalProps) {
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);
  const [formData, setFormData] = useState<BudgetCategory>({
    id: '',
    name: '',
    description: '',
    color: '#009B3A'
  });
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!editingCategory;
    const payload = isEdit ? formData : { ...formData, id: `CAT-${Date.now()}` };

    try {
      dataService.saveCategory(payload);
      setEditingCategory(null);
      setFormData({ id: '', name: '', description: '', color: '#009B3A' });
      onRefresh();
    } catch (error) {
      console.error('Failed to save category:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      dataService.deleteCategory(id);
      setIsDeleting(null);
      onRefresh();
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const colors = [
    '#009B3A', // Jamaica Green
    '#FED100', // Jamaica Gold
    '#000000', // Jamaica Black
    '#0ea5e9', // Sky
    '#6366f1', // Indigo
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#f43f5e', // Rose
    '#f59e0b', // Amber
    '#10b981', // Emerald
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
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
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600">
                  <Tag size={20} />
                </div>
                <div>
                  <h3 className="font-black text-jamaica-black uppercase tracking-tight">Manage Categories</h3>
                  <p className="text-xs text-slate-500 font-medium">Organize your spending categories</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Add/Edit Form */}
              <form onSubmit={handleSave} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Marketing"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Color</label>
                    <div className="flex flex-wrap gap-2">
                      {colors.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setFormData({...formData, color: c})}
                          className={`w-6 h-6 rounded-full transition-all ${formData.color === c ? 'ring-2 ring-offset-2 ring-brand-500 scale-110' : 'hover:scale-110'}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                  <input 
                    type="text" 
                    placeholder="Brief description of this category"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  {editingCategory && (
                    <button 
                      type="button"
                      onClick={() => {
                        setEditingCategory(null);
                        setFormData({ id: '', name: '', description: '', color: '#009B3A' });
                      }}
                      className="px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 transition-all"
                    >
                      Cancel
                    </button>
                  )}
                  <button 
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20 text-xs"
                  >
                    {editingCategory ? <Save size={14} /> : <Plus size={14} />}
                    {editingCategory ? 'Update' : 'Add Category'}
                  </button>
                </div>
              </form>

              {/* Categories List */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Existing Categories</h4>
                <div className="grid grid-cols-1 gap-2">
                  {categories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl group hover:border-brand-200 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: cat.color }}>
                          <Tag size={14} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-jamaica-black uppercase tracking-tight">{cat.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{cat.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => {
                            setEditingCategory(cat);
                            setFormData(cat);
                          }}
                          className="p-2 text-slate-400 hover:bg-brand-50 hover:text-brand-600 rounded-lg transition-all"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => setIsDeleting(cat.id)}
                          className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Delete Confirmation Overlay */}
            <AnimatePresence>
              {isDeleting && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex items-center justify-center p-8 text-center"
                >
                  <div className="max-w-xs space-y-6">
                    <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mx-auto">
                      <Trash2 size={32} />
                    </div>
                    <div className="space-y-2">
                      <h5 className="font-black text-jamaica-black uppercase tracking-tight">Delete Category?</h5>
                      <p className="text-xs text-slate-500 font-medium">This will remove the category. Expenses using this category will remain but without a category association.</p>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setIsDeleting(null)}
                        className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all text-[10px]"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => handleDelete(isDeleting)}
                        className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-500/20 text-[10px]"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
