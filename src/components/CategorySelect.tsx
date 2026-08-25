import React, { useState, useEffect } from 'react';
import { Plus, List, Check, X } from 'lucide-react';
import {
  getStoredCategories,
  registerCategory,
  getStoredIndirectCategories,
  registerIndirectCategory,
} from '../lib/storage';

interface CategorySelectProps {
  value: string;
  onChange: (category: string) => void;
  existingCategories?: string[];
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  allowQuickPills?: boolean;
  categoryType?: 'product' | 'indirect';
  themeColor?: 'blue' | 'indigo' | 'purple' | 'slate';
}

export const CategorySelect: React.FC<CategorySelectProps> = ({
  value,
  onChange,
  existingCategories = [],
  label = 'Categoría',
  placeholder = 'Escribir nueva categoría...',
  required = false,
  className = '',
  categoryType = 'product',
  themeColor = categoryType === 'indirect' ? 'indigo' : 'blue',
}) => {
  const getCategoriesFromStore = () => {
    return categoryType === 'indirect' ? getStoredIndirectCategories() : getStoredCategories();
  };

  const registerNewCategory = (cat: string) => {
    return categoryType === 'indirect' ? registerIndirectCategory(cat) : registerCategory(cat);
  };

  const [categories, setCategories] = useState<string[]>(() => {
    const stored = getCategoriesFromStore();
    return Array.from(new Set([...stored, ...existingCategories.filter(Boolean)]));
  });

  const [isManual, setIsManual] = useState<boolean>(() => {
    if (!value) return false;
    const stored = getCategoriesFromStore();
    const all = Array.from(new Set([...stored, ...existingCategories.filter(Boolean)]));
    return !all.includes(value);
  });

  const [manualInput, setManualInput] = useState<string>(value || '');

  useEffect(() => {
    const stored = getCategoriesFromStore();
    const merged = Array.from(new Set([...stored, ...existingCategories.filter(Boolean)]));
    setCategories(merged);
  }, [existingCategories, categoryType]);

  useEffect(() => {
    if (value !== manualInput) {
      setManualInput(value || '');
    }
  }, [value]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected === '__NEW_CATEGORY__') {
      setIsManual(true);
      setManualInput('');
      onChange('');
    } else {
      setIsManual(false);
      onChange(selected);
      setManualInput(selected);
    }
  };

  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setManualInput(val);
    onChange(val);
  };

  const saveManualCategory = () => {
    if (manualInput && manualInput.trim()) {
      const trimmed = manualInput.trim();
      const updated = registerNewCategory(trimmed);
      setCategories(Array.from(new Set([...updated, ...existingCategories.filter(Boolean)])));
      onChange(trimmed);
    }
  };

  const handleManualBlur = () => {
    saveManualCategory();
  };

  const handleManualKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveManualCategory();
    }
  };

  const listId = `registered-${categoryType}-categories-datalist`;

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="text-slate-700 font-semibold block text-xs mb-0.5">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {isManual ? (
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <input
              type="text"
              required={required}
              value={manualInput}
              onChange={handleManualChange}
              onBlur={handleManualBlur}
              onKeyDown={handleManualKeyDown}
              placeholder={placeholder}
              list={listId}
              autoFocus
              className="w-full bg-white border border-slate-300 text-slate-900 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-semibold shadow-2xs"
            />
            <datalist id={listId}>
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          <button
            type="button"
            onClick={() => {
              saveManualCategory();
              setIsManual(false);
            }}
            title="Volver a lista desplegable"
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-colors cursor-pointer flex items-center justify-center shrink-0"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <select
              value={value || ''}
              onChange={handleSelectChange}
              required={required}
              className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium cursor-pointer shadow-2xs"
            >
              <option value="" disabled>
                -- Selecciona una categoría --
              </option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              <option value="__NEW_CATEGORY__" className="font-bold text-blue-600 bg-blue-50">
                + Escribir otra categoría manualmente...
              </option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsManual(true);
              setManualInput('');
              onChange('');
            }}
            title="Escribir nueva categoría manualmente"
            className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl border border-blue-200 transition-colors cursor-pointer flex items-center justify-center shrink-0 font-bold"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      )}
    </div>
  );
};
