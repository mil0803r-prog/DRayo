import React, { useState, useEffect } from 'react';
import { Tag, Plus, List, Check } from 'lucide-react';
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
  placeholder = 'Ej: Ropa, Hoodies, Casacas...',
  required = false,
  className = '',
  allowQuickPills = true,
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

  // Mode: 'select' (dropdown) or 'manual' (custom text input)
  const [isManual, setIsManual] = useState<boolean>(() => {
    if (!value) return false;
    const stored = getCategoriesFromStore();
    const all = Array.from(new Set([...stored, ...existingCategories.filter(Boolean)]));
    return !all.includes(value);
  });

  const [manualInput, setManualInput] = useState<string>(value || '');

  // Keep categories in sync if existingCategories changes
  useEffect(() => {
    const stored = getCategoriesFromStore();
    const merged = Array.from(new Set([...stored, ...existingCategories.filter(Boolean)]));
    setCategories(merged);
  }, [existingCategories, categoryType]);

  // Sync value changes to manualInput
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

  const handleManualBlur = () => {
    if (manualInput && manualInput.trim()) {
      const trimmed = manualInput.trim();
      const updated = registerNewCategory(trimmed);
      setCategories(Array.from(new Set([...updated, ...existingCategories.filter(Boolean)])));
      onChange(trimmed);
    }
  };

  const handleManualKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleManualBlur();
    }
  };

  const handleSelectPill = (cat: string) => {
    setIsManual(false);
    onChange(cat);
    setManualInput(cat);
  };

  const toggleMode = () => {
    if (isManual) {
      // Switching to select mode
      if (manualInput && manualInput.trim()) {
        const trimmed = manualInput.trim();
        const updated = registerNewCategory(trimmed);
        setCategories(Array.from(new Set([...updated, ...existingCategories.filter(Boolean)])));
      }
      setIsManual(false);
    } else {
      // Switching to manual input mode
      setIsManual(true);
      setManualInput(value || '');
    }
  };

  const colorStyles = {
    blue: {
      text: 'text-blue-600 hover:text-blue-800',
      icon: 'text-blue-600',
      inputFocus: 'focus:ring-blue-500 border-blue-300 bg-blue-50/40',
      pillActive: 'bg-blue-600 text-white border-blue-600',
      newOption: 'text-blue-600 bg-blue-50',
    },
    indigo: {
      text: 'text-indigo-600 hover:text-indigo-800',
      icon: 'text-indigo-600',
      inputFocus: 'focus:ring-indigo-500 border-indigo-300 bg-indigo-50/40',
      pillActive: 'bg-indigo-600 text-white border-indigo-600',
      newOption: 'text-indigo-600 bg-indigo-50',
    },
    purple: {
      text: 'text-purple-600 hover:text-purple-800',
      icon: 'text-purple-600',
      inputFocus: 'focus:ring-purple-500 border-purple-300 bg-purple-50/40',
      pillActive: 'bg-purple-600 text-white border-purple-600',
      newOption: 'text-purple-600 bg-purple-50',
    },
    slate: {
      text: 'text-slate-700 hover:text-slate-900',
      icon: 'text-slate-600',
      inputFocus: 'focus:ring-slate-500 border-slate-300 bg-slate-50/40',
      pillActive: 'bg-slate-800 text-white border-slate-800',
      newOption: 'text-slate-700 bg-slate-50',
    },
  }[themeColor] || {
    text: 'text-indigo-600 hover:text-indigo-800',
    icon: 'text-indigo-600',
    inputFocus: 'focus:ring-indigo-500 border-indigo-300 bg-indigo-50/40',
    pillActive: 'bg-indigo-600 text-white border-indigo-600',
    newOption: 'text-indigo-600 bg-indigo-50',
  };

  const listId = `registered-${categoryType}-categories-datalist`;

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-slate-700 font-semibold text-xs flex items-center gap-1.5">
          <Tag className={`w-3.5 h-3.5 ${colorStyles.icon}`} />
          <span>{label}</span>
          {required && <span className="text-rose-500 font-bold">*</span>}
        </label>

        <button
          type="button"
          onClick={toggleMode}
          className={`text-[11px] font-bold ${colorStyles.text} hover:underline flex items-center gap-1 cursor-pointer transition-colors`}
        >
          {isManual ? (
            <>
              <List className="w-3 h-3" />
              <span>Ver desplegable</span>
            </>
          ) : (
            <>
              <Plus className="w-3 h-3" />
              <span>Escribir manual</span>
            </>
          )}
        </button>
      </div>

      {isManual ? (
        <div className="relative">
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
            className={`w-full border text-slate-900 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 text-xs font-semibold shadow-2xs transition-all ${colorStyles.inputFocus}`}
          />
          <datalist id={listId}>
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 px-1">
            <span>✨ Presiona Enter o sal del campo para registrarla automáticamente en el desplegable.</span>
          </div>
        </div>
      ) : (
        <div className="relative">
          <select
            value={value || ''}
            onChange={handleSelectChange}
            required={required}
            className="w-full bg-white border border-slate-200 text-slate-900 px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500 text-xs font-medium cursor-pointer shadow-2xs"
          >
            <option value="" disabled>
              -- Selecciona una categoría --
            </option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
            <option value="__NEW_CATEGORY__" className={`font-bold ${colorStyles.newOption}`}>
              ➕ + Escribir nueva categoría manualmente...
            </option>
          </select>
        </div>
      )}

      {/* Quick category pills for 1-click selection */}
      {allowQuickPills && categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] text-slate-400 font-medium">Sugerencias:</span>
          {categories.slice(0, 6).map((cat) => {
            const isSelected = value === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleSelectPill(cat)}
                className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1 border ${
                  isSelected
                    ? `${colorStyles.pillActive} shadow-2xs`
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                {isSelected && <Check className="w-2.5 h-2.5" />}
                <span>{cat}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
