import React, { useState } from 'react';
import { Product, PricingCalculationRecord, IndirectCost, TabType } from '../types';
import { api } from '../lib/api';
import { INITIAL_INDIRECT_COSTS } from '../data/sampleData';
import { IndirectCostsView } from './IndirectCostsView';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  Calculator,
  Package,
  Sparkles,
  Percent,
  DollarSign,
  TrendingUp,
  Copy,
  Check,
  Plus,
  Trash2,
  Megaphone,
  Truck,
  ArrowRight,
  Gift,
  ShoppingBag,
  MessageCircle,
  Tag,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  Scale,
  User,
  Wallet,
  Home,
  Utensils,
  Car,
  HeartPulse,
  GraduationCap,
  Coffee,
  PiggyBank,
  Target,
  ShieldCheck,
  Info,
  Zap,
  Save,
  History,
  FileSpreadsheet,
  Download,
  Search,
  Eye,
  CheckSquare,
  Square,
  ArrowDownToLine,
  ExternalLink,
  FileText,
  SlidersHorizontal,
  RefreshCw,
  FolderOpen,
  Edit2,
  Pencil,
  Building2,
  Receipt,
  PieChart,
  Activity,
  Sliders,
  ChevronRight,
  BarChart2,
  X
} from 'lucide-react';

interface PricingCalculatorViewProps {
  products: Product[];
  pricingRecords?: PricingCalculationRecord[];
  indirectCosts?: IndirectCost[];
  onAddIndirectCost?: (cost: IndirectCost) => void;
  onUpdateIndirectCost?: (cost: IndirectCost) => void;
  onDeleteIndirectCost?: (costId: string) => void;
  onBulkDeleteIndirectCosts?: (ids: string[]) => void;
  onAddPricingRecord?: (record: PricingCalculationRecord) => void;
  onDeletePricingRecord?: (recordId: string) => void;
  onBulkDeletePricingRecords?: (recordIds: string[]) => void;
  onUpdateProductPrice?: (productId: string, newSalePrice: number, newCostPrice: number) => void;
  setActiveTab?: (tab: TabType) => void;
  showToast?: (msg: string) => void;
}

interface ComboItem {
  id: string;
  productId?: string;
  name: string;
  quantity: number;
  costPrice: number;
  regularSalePrice: number;
}

interface PersonalExpenseItem {
  id: string;
  category: string;
  name: string;
  amount: number;
  iconName: 'home' | 'food' | 'services' | 'transport' | 'health' | 'education' | 'leisure' | 'savings' | 'other';
}

const INITIAL_PERSONAL_EXPENSES: PersonalExpenseItem[] = [
  { id: 'pe-1', category: 'Vivienda', name: 'Alquiler / Hipoteca / Mantenimiento', amount: 900, iconName: 'home' },
  { id: 'pe-2', category: 'Alimentación', name: 'Supermercado & Comida Diaria', amount: 650, iconName: 'food' },
  { id: 'pe-3', category: 'Servicios', name: 'Luz, Agua, Internet, Celular', amount: 250, iconName: 'services' },
  { id: 'pe-4', category: 'Transporte', name: 'Gasolina / Pasajes / Taxi', amount: 200, iconName: 'transport' },
  { id: 'pe-5', category: 'Salud', name: 'Seguro médico, farmacia & bienestar', amount: 150, iconName: 'health' },
  { id: 'pe-6', category: 'Educación', name: 'Cursos de Ecommerce / Libros', amount: 100, iconName: 'education' },
  { id: 'pe-7', category: 'Personal & Ocio', name: 'Salidas, entretenimiento & varios', amount: 250, iconName: 'leisure' },
  { id: 'pe-8', category: 'Ahorro / Fondo', name: 'Fondo de emergencia personal', amount: 300, iconName: 'savings' },
];

export const PricingCalculatorView: React.FC<PricingCalculatorViewProps> = ({
  products,
  pricingRecords = [],
  indirectCosts = INITIAL_INDIRECT_COSTS,
  onAddIndirectCost,
  onUpdateIndirectCost,
  onDeleteIndirectCost,
  onBulkDeleteIndirectCosts,
  onAddPricingRecord,
  onDeletePricingRecord,
  onBulkDeletePricingRecords,
  onUpdateProductPrice,
  setActiveTab,
  showToast,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'individual' | 'punto_equilibrio' | 'personal_budget' | 'combos' | 'indirect_costs' | 'history'>('individual');

  // ==========================================
  // STATE FOR SAVE MODAL & RECORD MANAGEMENT
  // ==========================================
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveModalType, setSaveModalType] = useState<'individual' | 'combo' | 'personal_budget'>('individual');
  const [saveTitle, setSaveTitle] = useState('');
  const [saveNotes, setSaveNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // ==========================================
  // STATE FOR EDIT RECORD MODAL
  // ==========================================
  const [editingRecord, setEditingRecord] = useState<PricingCalculationRecord | null>(null);
  const [editRecTitle, setEditRecTitle] = useState<string>('');
  const [editRecNotes, setEditRecNotes] = useState<string>('');
  const [editRecSalePrice, setEditRecSalePrice] = useState<number | ''>('');
  const [editRecCostPrice, setEditRecCostPrice] = useState<number | ''>('');
  const [editRecCpa, setEditRecCpa] = useState<number | ''>('');
  const [editRecShipping, setEditRecShipping] = useState<number | ''>('');
  const [editRecPackaging, setEditRecPackaging] = useState<number | ''>('');
  const [editRecPersonalQuota, setEditRecPersonalQuota] = useState<number | ''>('');
  const [editRecBudgetTotal, setEditRecBudgetTotal] = useState<number | ''>('');
  const [editRecBudgetSales, setEditRecBudgetSales] = useState<number | ''>('');
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

  // ==========================================
  // STATE FOR HISTORY TAB SEARCH & FILTERS
  // ==========================================
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilterType, setHistoryFilterType] = useState<'all' | 'individual' | 'combo' | 'personal_budget'>('all');
  const [historyViewMode, setHistoryViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);

  // ==========================================
  // STATE FOR PERSONAL EXPENSES BUDGET
  // ==========================================
  const [personalExpenses, setPersonalExpenses] = useState<PersonalExpenseItem[]>(INITIAL_PERSONAL_EXPENSES);
  const [monthlyEstimatedSales, setMonthlyEstimatedSales] = useState<number>(200);
  const [newExpName, setNewExpName] = useState('');
  const [newExpAmount, setNewExpAmount] = useState<number | ''>('');
  const [newExpCategory, setNewExpCategory] = useState('Personal');

  // ==========================================
  // CALCULATIONS FOR INDIRECT COSTS (COSTOS FIJOS)
  // ==========================================
  const activeIndirectCosts = (indirectCosts || []).filter((c) => c.isActive !== false);

  const totalMonthlyIndirectCosts = activeIndirectCosts.reduce((sum, item) => {
    if (item.periodicity === 'Anual') return sum + item.amount / 12;
    return sum + item.amount;
  }, 0);

  const calculatedIndirectQuotaPerUnit = monthlyEstimatedSales > 0
    ? Math.round((totalMonthlyIndirectCosts / monthlyEstimatedSales) * 100) / 100
    : 0;

  // Total monthly personal budget
  const totalMonthlyPersonalBudget = personalExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  
  // Calculated personal expense per garment
  const calculatedPersonalQuotaPerUnit = monthlyEstimatedSales > 0
    ? Math.round((totalMonthlyPersonalBudget / monthlyEstimatedSales) * 100) / 100
    : 0;

  // Add personal expense
  const handleAddPersonalExpense = () => {
    if (!newExpName.trim() || !newExpAmount || Number(newExpAmount) <= 0) return;
    const newItem: PersonalExpenseItem = {
      id: `pe-${Date.now()}`,
      category: newExpCategory,
      name: newExpName.trim(),
      amount: Number(newExpAmount),
      iconName: 'other',
    };
    setPersonalExpenses((prev) => [...prev, newItem]);
    setNewExpName('');
    setNewExpAmount('');
  };

  // Remove personal expense
  const handleRemovePersonalExpense = (id: string) => {
    setPersonalExpenses((prev) => prev.filter((item) => item.id !== id));
  };

  // Update personal expense amount
  const handleUpdatePersonalExpenseAmount = (id: string, newAmount: number) => {
    setPersonalExpenses((prev) =>
      prev.map((item) => (item.id === id ? { ...item, amount: Math.max(0, newAmount) } : item))
    );
  };

  // ==========================================
  // STATE FOR INDIVIDUAL PRODUCT CALCULATOR
  // ==========================================
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [unitCostPrice, setUnitCostPrice] = useState<number | ''>('');
  const [unitCpa, setUnitCpa] = useState<number | ''>('');
  const [unitShipping, setUnitShipping] = useState<number | ''>('');
  const [unitExtraCost, setUnitExtraCost] = useState<number | ''>('');
  const [unitIndirectCost, setUnitIndirectCost] = useState<number | ''>('');
  const [unitPersonalExpense, setUnitPersonalExpense] = useState<number | ''>('');
  const [unitSalePrice, setUnitSalePrice] = useState<number | ''>('');
  const [targetMarginPercent, setTargetMarginPercent] = useState<number | ''>(35);
  const [calcMode, setCalcMode] = useState<'by_price' | 'by_margin'>('by_price');
  const [copiedUnitText, setCopiedUnitText] = useState(false);
  const [updatedSuccessMsg, setUpdatedSuccessMsg] = useState<string | null>(null);

  // Simulation state for Break-even subtab
  const [simCustomSalePrice, setSimCustomSalePrice] = useState<number | ''>('');
  const [simCustomDirectCost, setSimCustomDirectCost] = useState<number | ''>('');
  const [simCustomIndirectCost, setSimCustomIndirectCost] = useState<number | ''>('');
  const [simCustomPersonalBudget, setSimCustomPersonalBudget] = useState<number | ''>('');
  const [simUnitsTarget, setSimUnitsTarget] = useState<number>(200);

  // Apply personal quota from budget directly to unit calculator
  const handleApplyPersonalQuotaToUnit = (quota: number) => {
    setUnitPersonalExpense(quota);
    setActiveSubTab('individual');
    setUpdatedSuccessMsg(`¡Cuota de Gastos Personales (S/ ${quota.toFixed(2)} por prenda) aplicada a la calculadora!`);
    setTimeout(() => setUpdatedSuccessMsg(null), 3500);
  };

  // Apply indirect quota directly to unit calculator
  const handleApplyIndirectQuotaToUnit = (quota: number) => {
    setUnitIndirectCost(quota);
    setActiveSubTab('individual');
    setUpdatedSuccessMsg(`¡Cuota de Costos Indirectos (S/ ${quota.toFixed(2)} por prenda) aplicada a la calculadora!`);
    setTimeout(() => setUpdatedSuccessMsg(null), 3500);
  };

  // Handle product selection autofill
  const handleSelectIndividualProduct = (id: string) => {
    setSelectedProductId(id);
    const prod = products.find((p) => p.id === id);
    if (prod) {
      setUnitCostPrice(prod.costPrice);
      setUnitSalePrice(prod.salePrice);
    } else {
      setUnitCostPrice('');
      setUnitSalePrice('');
    }
  };

  // Calculations for Individual Unit
  const numUnitCostPrice = typeof unitCostPrice === 'number' ? unitCostPrice : (parseFloat(String(unitCostPrice)) || 0);
  const numUnitCpa = typeof unitCpa === 'number' ? unitCpa : (parseFloat(String(unitCpa)) || 0);
  const numUnitShipping = typeof unitShipping === 'number' ? unitShipping : (parseFloat(String(unitShipping)) || 0);
  const numUnitExtraCost = typeof unitExtraCost === 'number' ? unitExtraCost : (parseFloat(String(unitExtraCost)) || 0);
  
  // If unitIndirectCost is blank string or unset, fallback to calculatedIndirectQuotaPerUnit
  const numUnitIndirectCost = typeof unitIndirectCost === 'number'
    ? unitIndirectCost
    : (unitIndirectCost === '' ? calculatedIndirectQuotaPerUnit : (parseFloat(String(unitIndirectCost)) || 0));

  const numUnitPersonalExpense = typeof unitPersonalExpense === 'number' ? unitPersonalExpense : (parseFloat(String(unitPersonalExpense)) || 0);
  const numUnitSalePrice = typeof unitSalePrice === 'number' ? unitSalePrice : (parseFloat(String(unitSalePrice)) || 0);
  const numTargetMargin = typeof targetMarginPercent === 'number' ? targetMarginPercent : (parseFloat(String(targetMarginPercent)) || 0);

  // Direct business operational costs (Prenda + CPA + Envío + Empaque)
  const directOperationalCost = numUnitCostPrice + numUnitCpa + numUnitShipping + numUnitExtraCost;
  
  // Total direct + indirect operational cost (Prenda + CPA + Envío + Empaque + Cuota Indirectos)
  const totalDirectAndIndirectCost = directOperationalCost + numUnitIndirectCost;

  // Total integral cost (Directos + Indirectos + Cuota Sueldo Personal)
  const totalUnitExpenseCost = totalDirectAndIndirectCost + numUnitPersonalExpense;
  
  // Calculate sale price if mode is by margin
  const effectiveSalePrice = calcMode === 'by_margin'
    ? (100 - numTargetMargin) > 0
      ? totalUnitExpenseCost / (1 - numTargetMargin / 100)
      : totalUnitExpenseCost * 1.5
    : numUnitSalePrice;

  // Gross profit before indirect and personal expenses (Dinero bruto generado por venta)
  const unitGrossProfit = effectiveSalePrice - directOperationalCost;
  const unitGrossMargin = effectiveSalePrice > 0 ? (unitGrossProfit / effectiveSalePrice) * 100 : 0;

  // Operating profit after indirect costs
  const unitOperatingProfit = effectiveSalePrice - totalDirectAndIndirectCost;
  const unitOperatingMargin = effectiveSalePrice > 0 ? (unitOperatingProfit / effectiveSalePrice) * 100 : 0;

  // Net profit after indirect costs and personal expenses (Ganancia libre para reinversión en negocio)
  const unitNetProfitAfterPersonal = effectiveSalePrice - totalUnitExpenseCost;
  const unitNetMarginAfterPersonal = effectiveSalePrice > 0 ? (unitNetProfitAfterPersonal / effectiveSalePrice) * 100 : 0;

  const unitRoi = totalUnitExpenseCost > 0 ? (unitNetProfitAfterPersonal / totalUnitExpenseCost) * 100 : 0;
  const unitMinRoas = numUnitCpa > 0 ? effectiveSalePrice / numUnitCpa : 0;

  // Unit contribution margin (Precio - Costo Directo)
  const unitContributionMargin = effectiveSalePrice - directOperationalCost;

  // Break-even units for operating costs (covering indirect costs)
  const breakEvenUnitsOperating = unitContributionMargin > 0
    ? Math.ceil(totalMonthlyIndirectCosts / unitContributionMargin)
    : 0;

  // Break-even units to pay 100% of personal budget + indirect costs
  const breakEvenUnitsIntegral = unitContributionMargin > 0
    ? Math.ceil((totalMonthlyIndirectCosts + totalMonthlyPersonalBudget) / unitContributionMargin)
    : 0;

  // Break-even units to pay 100% of personal budget alone
  const breakEvenUnitsForSalary = unitGrossProfit > 0
    ? Math.ceil(totalMonthlyPersonalBudget / unitGrossProfit)
    : 0;

  // Handle save price to product
  const handleApplyPriceToInventory = () => {
    if (!selectedProductId || !onUpdateProductPrice) return;
    onUpdateProductPrice(selectedProductId, Math.round(effectiveSalePrice), numUnitCostPrice);
    const prod = products.find((p) => p.id === selectedProductId);
    setUpdatedSuccessMsg(`¡Precio de "${prod?.name || 'Producto'}" actualizado a S/ ${Math.round(effectiveSalePrice).toFixed(2)} en el inventario!`);
    setTimeout(() => setUpdatedSuccessMsg(null), 3500);
  };

  // Copy unit summary
  const handleCopyUnitSummary = () => {
    const summary = `📊 *DESGLOSE DE PRECIO Y MARGEN D'RAYO*
• Costo de Prenda: S/ ${numUnitCostPrice.toFixed(2)}
• Publicidad (CPA): S/ ${numUnitCpa.toFixed(2)}
• Envío Incluido: S/ ${numUnitShipping.toFixed(2)}
• Empaque / Extras: S/ ${numUnitExtraCost.toFixed(2)}
• Subtotal Costos Directos: S/ ${directOperationalCost.toFixed(2)}
• Costos Indirectos / Fijos (Cuota): S/ ${numUnitIndirectCost.toFixed(2)}
${numUnitPersonalExpense > 0 ? `• Gastos Personales / Sueldo: S/ ${numUnitPersonalExpense.toFixed(2)}\n` : ''}-------------------------------
💰 *Costo Total Integral:* S/ ${totalUnitExpenseCost.toFixed(2)}
🏷️ *Precio de Venta:* S/ ${effectiveSalePrice.toFixed(2)}
📈 *Ganancia Libre para Negocio:* S/ ${unitNetProfitAfterPersonal.toFixed(2)} (${unitNetMarginAfterPersonal.toFixed(1)}% Margen)
🎯 *ROAS Mínimo:* ${unitMinRoas.toFixed(2)}x
🏢 *Punto Equilibrio Operativo:* ${breakEvenUnitsOperating} prendas/mes
👑 *Punto Equilibrio Total (+ Sueldo):* ${breakEvenUnitsIntegral} prendas/mes`;
    navigator.clipboard.writeText(summary);
    setCopiedUnitText(true);
    setTimeout(() => setCopiedUnitText(false), 2500);
  };


  // ==========================================
  // STATE FOR COMBOS & PACKS CALCULATOR
  // ==========================================
  const [comboTitle, setComboTitle] = useState<string>("Combo D'RAYO");
  const [comboItems, setComboItems] = useState<ComboItem[]>([
    {
      id: '1',
      productId: '',
      name: '',
      quantity: 1,
      costPrice: '' as any,
      regularSalePrice: '' as any,
    }
  ]);

  const [comboCpa, setComboCpa] = useState<number | ''>('');
  const [comboShipping, setComboShipping] = useState<number | ''>('');
  const [comboPackaging, setComboPackaging] = useState<number | ''>('');
  const [comboPersonalExpense, setComboPersonalExpense] = useState<number | ''>('');
  const [comboTargetPrice, setComboTargetPrice] = useState<number | ''>('');
  const [copiedComboMsg, setCopiedComboMsg] = useState(false);

  // Add Item to Combo
  const handleAddComboItem = () => {
    const newItem: ComboItem = {
      id: Date.now().toString(),
      productId: '',
      name: '',
      quantity: 1,
      costPrice: '' as any,
      regularSalePrice: '' as any,
    };
    setComboItems((prev) => [...prev, newItem]);
  };

  // Update Item in Combo
  const handleUpdateComboItem = (id: string, field: keyof ComboItem, value: any) => {
    setComboItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        if (field === 'productId') {
          const prod = products.find((p) => p.id === value);
          if (prod) {
            return {
              ...item,
              productId: prod.id,
              name: prod.name,
              costPrice: prod.salePrice || prod.costPrice,
              regularSalePrice: prod.salePrice || prod.costPrice,
            };
          }
        }
        return { ...item, [field]: value };
      })
    );
  };

  // Duplicate Item in Combo
  const handleDuplicateComboItem = (item: ComboItem) => {
    const newItem: ComboItem = {
      ...item,
      id: Date.now().toString(),
    };
    setComboItems((prev) => [...prev, newItem]);
  };

  // Remove Item from Combo
  const handleRemoveComboItem = (id: string) => {
    if (comboItems.length <= 1) return;
    setComboItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Calculations for Combos
  const numComboCpa = typeof comboCpa === 'number' ? comboCpa : (parseFloat(String(comboCpa)) || 0);
  const numComboShipping = typeof comboShipping === 'number' ? comboShipping : (parseFloat(String(comboShipping)) || 0);
  const numComboPackaging = typeof comboPackaging === 'number' ? comboPackaging : (parseFloat(String(comboPackaging)) || 0);
  const numComboPersonalExpense = typeof comboPersonalExpense === 'number' ? comboPersonalExpense : (parseFloat(String(comboPersonalExpense)) || 0);
  const numComboTargetPrice = typeof comboTargetPrice === 'number' ? comboTargetPrice : (parseFloat(String(comboTargetPrice)) || 0);

  const totalComboUnitsCount = comboItems.reduce((sum, i) => {
    const qty = typeof i.quantity === 'number' ? i.quantity : (parseInt(String(i.quantity), 10) || 1);
    return sum + qty;
  }, 0);

  const totalComboProductsCost = comboItems.reduce((sum, i) => {
    const cost = typeof i.costPrice === 'number' ? i.costPrice : (parseFloat(String(i.costPrice)) || 0);
    const qty = typeof i.quantity === 'number' ? i.quantity : (parseInt(String(i.quantity), 10) || 1);
    return sum + cost * qty;
  }, 0);

  const totalComboRegularRetail = comboItems.reduce((sum, i) => {
    const retail = typeof i.regularSalePrice === 'number' ? i.regularSalePrice : (parseFloat(String(i.regularSalePrice)) || 0);
    const qty = typeof i.quantity === 'number' ? i.quantity : (parseInt(String(i.quantity), 10) || 1);
    return sum + retail * qty;
  }, 0);

  const totalComboDirectCost = totalComboProductsCost + numComboCpa + numComboShipping + numComboPackaging;
  const totalComboExpenseCost = totalComboDirectCost + numComboPersonalExpense;

  const customerSavingsAmount = totalComboRegularRetail - numComboTargetPrice;
  const customerSavingsPercent = totalComboRegularRetail > 0 ? (customerSavingsAmount / totalComboRegularRetail) * 100 : 0;

  const comboNetProfit = numComboTargetPrice - totalComboExpenseCost;
  const comboNetMargin = numComboTargetPrice > 0 ? (comboNetProfit / numComboTargetPrice) * 100 : 0;
  const comboRoi = totalComboExpenseCost > 0 ? (comboNetProfit / totalComboExpenseCost) * 100 : 0;
  const comboRoas = numComboCpa > 0 ? numComboTargetPrice / numComboCpa : 0;

  // Preset Strategy Quick Buttons
  const applyPresetStrategy = (type: '2x_discount' | '3x2' | 'free_shipping_10_off' | 'second_half_price') => {
    if (comboItems.length === 0) return;

    if (type === 'second_half_price') {
      const item1Price = Number(comboItems[0]?.regularSalePrice) || 80;
      const calculatedPrice = item1Price + item1Price * 0.5;
      setComboTargetPrice(Math.round(calculatedPrice));
      setComboTitle("Combo 2da Unidad al 50%");
    } else if (type === '2x_discount') {
      const discounted = (totalComboRegularRetail || 100) * 0.8;
      setComboTargetPrice(Math.round(discounted));
      setComboTitle("Pack 2X con 20% OFF");
    } else if (type === '3x2') {
      const sortedPrices = comboItems.flatMap((i) => Array(Number(i.quantity) || 1).fill(Number(i.regularSalePrice) || 0)).sort((a, b) => b - a);
      const payFor2Price = (sortedPrices[0] || 0) + (sortedPrices[1] || 0);
      setComboTargetPrice(Math.round(payFor2Price));
      setComboTitle("Super Pack 3X2 D'RAYO");
    } else if (type === 'free_shipping_10_off') {
      const price = (totalComboRegularRetail || 100) * 0.9;
      setComboTargetPrice(Math.round(price));
      setComboShipping(0);
      setComboTitle("Combo Especial + Envío Gratis 🚀");
    }
  };

  // Generate WhatsApp Copy Message
  const generateWhatsAppCopy = () => {
    const itemsListText = comboItems
      .map((i) => `• ${i.quantity}x ${i.name || 'Prenda'}`)
      .join('\n');

    return `🔥 *OFERTA ESPECIAL: ${(comboTitle || 'COMBO').toUpperCase()}* 🔥

Lllévate hoy mismo este paquete exclusivo:
${itemsListText}

🎉 *PRECIO DEL COMBO:* *S/ ${numComboTargetPrice.toFixed(2)}*

🚀 *Incluye Envío Rápido a Domicilio/Agencia.*

¿Te gustaría reservarlo en tu talla antes de que se agote el stock? Responde con *SI* para separarlo hoy. 📲`;
  };

  const handleCopyComboWhatsApp = () => {
    navigator.clipboard.writeText(generateWhatsAppCopy());
    setCopiedComboMsg(true);
    setTimeout(() => setCopiedComboMsg(false), 2500);
  };

  // ==========================================
  // SAVE / LOAD / EXPORT RECORD HANDLERS
  // ==========================================
  const handleOpenSaveModal = (type: 'individual' | 'combo' | 'personal_budget') => {
    setSaveModalType(type);
    const dateStr = new Date().toISOString().slice(0, 10);
    if (type === 'individual') {
      const prod = products.find((p) => p.id === selectedProductId);
      const name = prod ? prod.name : 'Prenda Individual';
      setSaveTitle(`${name} - S/ ${effectiveSalePrice.toFixed(0)} (${dateStr})`);
    } else if (type === 'combo') {
      setSaveTitle(`${comboTitle || "Combo D'RAYO"} - S/ ${numComboTargetPrice.toFixed(0)} (${dateStr})`);
    } else {
      setSaveTitle(`Presupuesto Personal S/ ${totalMonthlyPersonalBudget.toFixed(0)} - ${monthlyEstimatedSales} prendas/mes (${dateStr})`);
    }
    setSaveNotes('');
    setShowSaveModal(true);
  };

  const handleConfirmSaveRecord = async () => {
    if (!saveTitle.trim()) return;
    setIsSaving(true);
    try {
      const newRecordId = `calc-${Date.now()}`;
      const now = new Date().toISOString();
      let record: PricingCalculationRecord;

      if (saveModalType === 'individual') {
        const prod = products.find((p) => p.id === selectedProductId);
        record = {
          id: newRecordId,
          type: 'individual',
          title: saveTitle.trim(),
          createdAt: now,
          notes: saveNotes.trim() || undefined,
          productId: selectedProductId || undefined,
          productName: prod?.name || 'Prenda Individual',
          productCostPrice: numUnitCostPrice,
          salePrice: effectiveSalePrice,
          cpa: numUnitCpa,
          shipping: numUnitShipping,
          packaging: numUnitExtraCost,
          personalExpenseQuota: numUnitPersonalExpense,
          totalCost: totalUnitExpenseCost,
          netProfit: unitNetProfitAfterPersonal,
          netMarginPercent: unitNetMarginAfterPersonal,
          minRoas: unitMinRoas,
          targetMarginPercent: typeof targetMarginPercent === 'number' ? targetMarginPercent : undefined,
        };
      } else if (saveModalType === 'combo') {
        record = {
          id: newRecordId,
          type: 'combo',
          title: saveTitle.trim(),
          createdAt: now,
          notes: saveNotes.trim() || undefined,
          comboTitle: comboTitle,
          comboItems: comboItems.map((item) => ({
            id: item.id,
            productId: item.productId,
            name: item.name,
            quantity: Number(item.quantity) || 1,
            costPrice: Number(item.costPrice) || 0,
            regularSalePrice: Number(item.regularSalePrice) || 0,
          })),
          regularRetailPrice: totalComboRegularRetail,
          salePrice: numComboTargetPrice,
          productCostPrice: totalComboProductsCost,
          cpa: numComboCpa,
          shipping: numComboShipping,
          packaging: numComboPackaging,
          personalExpenseQuota: numComboPersonalExpense,
          totalCost: totalComboExpenseCost,
          netProfit: comboNetProfit,
          netMarginPercent: comboNetMargin,
          minRoas: comboRoas,
          discountPercent: customerSavingsPercent,
          savingsAmount: customerSavingsAmount,
        };
      } else {
        record = {
          id: newRecordId,
          type: 'personal_budget',
          title: saveTitle.trim(),
          createdAt: now,
          notes: saveNotes.trim() || undefined,
          totalPersonalBudget: totalMonthlyPersonalBudget,
          monthlyEstimatedSales: monthlyEstimatedSales,
          personalExpenseQuota: calculatedPersonalQuotaPerUnit,
          breakdownItems: personalExpenses.map((exp) => ({
            category: exp.category,
            name: exp.name,
            amount: exp.amount,
          })),
        };
      }

      await api.savePricingRecord(record);
      if (onAddPricingRecord) {
        onAddPricingRecord(record);
      }
      setShowSaveModal(false);
      if (showToast) {
        showToast(`¡Cálculo guardado con éxito en los registros!`);
      } else {
        setUpdatedSuccessMsg(`¡Cálculo "${record.title}" guardado en la base de datos!`);
        setTimeout(() => setUpdatedSuccessMsg(null), 3500);
      }
    } catch (err) {
      console.error('Error saving pricing record:', err);
      if (showToast) {
        showToast('Error al guardar el registro de cálculo.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadRecordIntoCalculator = (record: PricingCalculationRecord) => {
    if (record.type === 'individual') {
      if (record.productId) {
        setSelectedProductId(record.productId);
      } else {
        setSelectedProductId('');
      }
      setUnitCostPrice(record.productCostPrice ?? '');
      setUnitCpa(record.cpa ?? '');
      setUnitShipping(record.shipping ?? '');
      setUnitExtraCost(record.packaging ?? '');
      setUnitPersonalExpense(record.personalExpenseQuota ?? '');
      setUnitSalePrice(record.salePrice ?? '');
      if (record.targetMarginPercent) {
        setTargetMarginPercent(record.targetMarginPercent);
      }
      setActiveSubTab('individual');
      if (showToast) {
        showToast(`Cálculo "${record.title}" cargado en la calculadora por unidad`);
      } else {
        setUpdatedSuccessMsg(`Cálculo "${record.title}" cargado en la calculadora individual`);
        setTimeout(() => setUpdatedSuccessMsg(null), 3500);
      }
    } else if (record.type === 'combo') {
      if (record.comboTitle) setComboTitle(record.comboTitle);
      if (Array.isArray(record.comboItems) && record.comboItems.length > 0) {
        setComboItems(
          record.comboItems.map((it) => ({
            id: it.id || String(Date.now()),
            productId: it.productId,
            name: it.name,
            quantity: it.quantity,
            costPrice: it.costPrice,
            regularSalePrice: it.regularSalePrice,
          }))
        );
      }
      setComboCpa(record.cpa ?? '');
      setComboShipping(record.shipping ?? '');
      setComboPackaging(record.packaging ?? '');
      setComboPersonalExpense(record.personalExpenseQuota ?? '');
      setComboTargetPrice(record.salePrice ?? '');
      setActiveSubTab('combos');
      if (showToast) {
        showToast(`Combo "${record.title}" cargado en la calculadora de combos`);
      } else {
        setUpdatedSuccessMsg(`Combo "${record.title}" cargado en la calculadora de combos`);
        setTimeout(() => setUpdatedSuccessMsg(null), 3500);
      }
    } else if (record.type === 'personal_budget') {
      if (record.monthlyEstimatedSales) {
        setMonthlyEstimatedSales(record.monthlyEstimatedSales);
      }
      if (Array.isArray(record.breakdownItems) && record.breakdownItems.length > 0) {
        setPersonalExpenses(
          record.breakdownItems.map((it, idx) => ({
            id: `pe-loaded-${idx}-${Date.now()}`,
            category: it.category,
            name: it.name,
            amount: it.amount,
            iconName: 'other',
          }))
        );
      }
      setActiveSubTab('personal_budget');
      if (showToast) {
        showToast(`Presupuesto "${record.title}" cargado en el simulador`);
      } else {
        setUpdatedSuccessMsg(`Presupuesto "${record.title}" cargado`);
        setTimeout(() => setUpdatedSuccessMsg(null), 3500);
      }
    }
  };

  // Open Edit Record Modal
  const handleOpenEditRecordModal = (record: PricingCalculationRecord) => {
    setEditingRecord(record);
    setEditRecTitle(record.title);
    setEditRecNotes(record.notes || '');
    setEditRecSalePrice(record.salePrice ?? '');
    setEditRecCostPrice(record.productCostPrice ?? '');
    setEditRecCpa(record.cpa ?? '');
    setEditRecShipping(record.shipping ?? '');
    setEditRecPackaging(record.packaging ?? '');
    setEditRecPersonalQuota(record.personalExpenseQuota ?? '');
    setEditRecBudgetTotal(record.totalPersonalBudget ?? '');
    setEditRecBudgetSales(record.monthlyEstimatedSales ?? '');
  };

  // Save changes to Edited Pricing Record
  const handleSaveEditedPricingRecord = async () => {
    if (!editingRecord || !editRecTitle.trim()) return;
    setIsSavingEdit(true);
    try {
      let updated: PricingCalculationRecord;
      if (editingRecord.type === 'personal_budget') {
        const budget = Number(editRecBudgetTotal) || 0;
        const sales = Number(editRecBudgetSales) || 1;
        const quota = sales > 0 ? budget / sales : 0;
        updated = {
          ...editingRecord,
          title: editRecTitle.trim(),
          notes: editRecNotes.trim() || undefined,
          totalPersonalBudget: budget,
          monthlyEstimatedSales: sales,
          personalExpenseQuota: quota,
        };
      } else {
        const salePrice = Number(editRecSalePrice) || 0;
        const costPrice = Number(editRecCostPrice) || 0;
        const cpa = Number(editRecCpa) || 0;
        const shipping = Number(editRecShipping) || 0;
        const packaging = Number(editRecPackaging) || 0;
        const personalQuota = Number(editRecPersonalQuota) || 0;
        const totalCost = costPrice + cpa + shipping + packaging + personalQuota;
        const netProfit = salePrice - totalCost;
        const netMarginPercent = salePrice > 0 ? (netProfit / salePrice) * 100 : 0;
        const minRoas = (cpa > 0 && netProfit + cpa > 0) ? salePrice / (netProfit + cpa) : (cpa > 0 ? salePrice / cpa : 1);

        updated = {
          ...editingRecord,
          title: editRecTitle.trim(),
          notes: editRecNotes.trim() || undefined,
          salePrice,
          productCostPrice: costPrice,
          cpa,
          shipping,
          packaging,
          personalExpenseQuota: personalQuota,
          totalCost,
          netProfit,
          netMarginPercent,
          minRoas,
        };
      }

      await api.savePricingRecord(updated);
      if (onAddPricingRecord) {
        onAddPricingRecord(updated);
      }
      setEditingRecord(null);
      if (showToast) {
        showToast(`¡Cálculo "${updated.title}" actualizado con éxito!`);
      } else {
        setUpdatedSuccessMsg(`¡Cálculo "${updated.title}" actualizado!`);
        setTimeout(() => setUpdatedSuccessMsg(null), 3500);
      }
    } catch (err) {
      console.error('Error updating pricing record:', err);
      if (showToast) showToast('Error al actualizar el registro de cálculo.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!window.confirm('¿Confirmas que deseas eliminar este registro de cálculo?')) return;
    try {
      await api.deletePricingRecord(recordId);
      if (onDeletePricingRecord) {
        onDeletePricingRecord(recordId);
      }
      setSelectedRecordIds((prev) => prev.filter((id) => id !== recordId));
      if (showToast) showToast('Registro eliminado con éxito.');
    } catch (err) {
      if (showToast) showToast('Error al eliminar registro');
    }
  };

  const handleBulkDeleteSelected = async () => {
    if (selectedRecordIds.length === 0) return;
    if (!window.confirm(`¿Deseas eliminar los ${selectedRecordIds.length} registros seleccionados?`)) return;
    try {
      await api.bulkDeletePricingRecords(selectedRecordIds);
      if (onBulkDeletePricingRecords) {
        onBulkDeletePricingRecords(selectedRecordIds);
      }
      setSelectedRecordIds([]);
      if (showToast) showToast(`${selectedRecordIds.length} registros eliminados.`);
    } catch (err) {
      if (showToast) showToast('Error al eliminar los registros seleccionados');
    }
  };

  const handleExportRecordsCSV = () => {
    if (pricingRecords.length === 0) {
      if (showToast) showToast('No hay registros para exportar.');
      return;
    }
    const headers = [
      'ID',
      'Titulo',
      'Tipo',
      'Fecha',
      'Producto_o_Combo',
      'Precio_Venta_PEN',
      'Costo_Prenda_PEN',
      'CPA_Anuncio_PEN',
      'Envio_PEN',
      'Empaque_PEN',
      'Cuota_Personal_PEN',
      'Costo_Total_PEN',
      'Ganancia_Neta_PEN',
      'Margen_Porcentaje',
      'ROAS_Minimo',
      'Notas',
    ];
    const rows = pricingRecords.map((r) => [
      `"${r.id}"`,
      `"${(r.title || '').replace(/"/g, '""')}"`,
      `"${r.type}"`,
      `"${r.createdAt || ''}"`,
      `"${(r.productName || r.comboTitle || '').replace(/"/g, '""')}"`,
      r.salePrice !== undefined ? r.salePrice.toFixed(2) : '',
      r.productCostPrice !== undefined ? r.productCostPrice.toFixed(2) : '',
      r.cpa !== undefined ? r.cpa.toFixed(2) : '',
      r.shipping !== undefined ? r.shipping.toFixed(2) : '',
      r.packaging !== undefined ? r.packaging.toFixed(2) : '',
      r.personalExpenseQuota !== undefined ? r.personalExpenseQuota.toFixed(2) : '',
      r.totalCost !== undefined ? r.totalCost.toFixed(2) : (r.totalPersonalBudget !== undefined ? r.totalPersonalBudget.toFixed(2) : ''),
      r.netProfit !== undefined ? r.netProfit.toFixed(2) : '',
      r.netMarginPercent !== undefined ? r.netMarginPercent.toFixed(1) : '',
      r.minRoas !== undefined ? r.minRoas.toFixed(2) : '',
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `calculos_precios_drayo_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    if (showToast) showToast('Archivo CSV descargado con éxito.');
  };

  const renderExpenseIcon = (iconName: string) => {
    switch (iconName) {
      case 'home': return <Home className="w-4 h-4 text-blue-500" />;
      case 'food': return <Utensils className="w-4 h-4 text-amber-500" />;
      case 'services': return <Zap className="w-4 h-4 text-yellow-500" />;
      case 'transport': return <Car className="w-4 h-4 text-emerald-500" />;
      case 'health': return <HeartPulse className="w-4 h-4 text-rose-500" />;
      case 'education': return <GraduationCap className="w-4 h-4 text-purple-500" />;
      case 'leisure': return <Coffee className="w-4 h-4 text-orange-500" />;
      case 'savings': return <PiggyBank className="w-4 h-4 text-indigo-500" />;
      default: return <Wallet className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Section Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <Calculator className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-extrabold text-white">Calculadora Estratégica de Precios & Costos</h2>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                Margen Real, Combos & Gastos Personales
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Calcula tu precio objetivo considerando fabricación, anuncios, envíos y tu sueldo / gastos personales mensuales.
            </p>
          </div>
        </div>

        {/* Sub-tab Navigation Switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto shrink-0 flex-wrap sm:flex-nowrap gap-1">
          <button
            onClick={() => setActiveSubTab('individual')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSubTab === 'individual'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Calculadora</span>
          </button>

          <button
            onClick={() => setActiveSubTab('punto_equilibrio')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSubTab === 'punto_equilibrio'
                ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md'
                : 'text-cyan-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-cyan-300" />
            <span>Análisis Pro: Gráfica Punto de Equilibrio</span>
          </button>

          <button
            onClick={() => setActiveSubTab('personal_budget')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSubTab === 'personal_budget'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-emerald-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Gastos Meta & Sueldo</span>
          </button>

          <button
            onClick={() => setActiveSubTab('combos')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSubTab === 'combos'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Gift className="w-3.5 h-3.5 text-amber-300" />
            <span>Combos & Packs</span>
          </button>

          <button
            onClick={() => setActiveSubTab('indirect_costs')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSubTab === 'indirect_costs'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-indigo-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-indigo-300" />
            <span>Costos Indirectos</span>
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSubTab === 'history'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-amber-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Historial Guardados ({pricingRecords.length})</span>
          </button>
        </div>
      </div>

      {/* SUCCESS TOAST MESSAGE */}
      {updatedSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 text-xs text-emerald-800 font-medium flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{updatedSuccessMsg}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUBTAB 1: CALCULADORA POR UNIDAD INDIVIDUAL */}
      {/* ========================================================= */}
      {activeSubTab === 'individual' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Inputs Section (Left Column) */}
          <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-600" />
                <span>Estructura de Costos por Prenda (Directos + Indirectos + Sueldo)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Calcula tu precio considerando fabricación, publicidad, envíos, costos indirectos del taller y tu meta personal.
              </p>
            </div>

            {/* Select product dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Cargar Prenda de Inventario (Opcional):
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => handleSelectIndividualProduct(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">-- Ingreso Manual de Costos --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Costo: S/ {p.costPrice.toFixed(2)} | Precio: S/ {p.salePrice.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* 1. Costo de Prenda */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. Costo de Fabricación / Compra (S/):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono font-bold">S/</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="0.00"
                    value={unitCostPrice}
                    onChange={(e) => setUnitCostPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <span className="text-[10px] text-slate-400">Gasto directo de confección o telas</span>
              </div>

              {/* 2. CPA / Anuncio por prenda */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  2. Publicidad Asignada (CPA por prenda) (S/):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono font-bold">S/</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="0.00"
                    value={unitCpa}
                    onChange={(e) => setUnitCpa(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-xs font-mono font-bold text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <span className="text-[10px] text-slate-400">Gasto publicitario para vender 1 unidad</span>
              </div>

              {/* 3. Costo de Envío */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  3. Costo de Envío / Flete Asumido (S/):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono font-bold">S/</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="0.00"
                    value={unitShipping}
                    onChange={(e) => setUnitShipping(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <span className="text-[10px] text-slate-400">Si ofreces Envío Gratis al cliente</span>
              </div>

              {/* 4. Empaque / Extras */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  4. Empaque / Bolsa / Etiquetas / Varios (S/):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono font-bold">S/</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="0.00"
                    value={unitExtraCost}
                    onChange={(e) => setUnitExtraCost(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <span className="text-[10px] text-slate-400">Bolsa, sticker de regalo, pasarela</span>
              </div>
            </div>

            {/* 5. COSTOS INDIRECTOS Y FIJOS ASIGNADOS (DEBAJO DE CALCULADORA) */}
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold text-indigo-950 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span>5. Costos Indirectos & Fijos Asignados (S/ por prenda):</span>
                </label>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('indirect_costs')}
                  className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Receipt className="w-3 h-3 text-indigo-500" />
                  <span>Administrar Rubros Fijos</span>
                </button>
              </div>

              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-indigo-700 font-mono font-bold">S/</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder={calculatedIndirectQuotaPerUnit > 0 ? calculatedIndirectQuotaPerUnit.toFixed(2) : "0.00"}
                  value={unitIndirectCost}
                  onChange={(e) => setUnitIndirectCost(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full bg-white border border-indigo-300 rounded-xl pl-8 pr-3 py-2 text-xs font-mono font-black text-indigo-950 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-indigo-900">
                <span className="text-[10px] text-slate-500">
                  Total Fijos Mensuales: <strong className="text-indigo-950 font-mono">S/ {totalMonthlyIndirectCosts.toFixed(2)}/mes</strong> (Taller, Alquiler, Servicios, Apps)
                </span>

                {calculatedIndirectQuotaPerUnit > 0 && (
                  <button
                    type="button"
                    onClick={() => setUnitIndirectCost(calculatedIndirectQuotaPerUnit)}
                    className="bg-white hover:bg-indigo-100 text-indigo-800 border border-indigo-300 px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    Usar cálculo prorrateado: S/ {calculatedIndirectQuotaPerUnit.toFixed(2)}/prenda
                  </button>
                )}
              </div>

              {/* Quick rubros pills */}
              {activeIndirectCosts.length > 0 && (
                <div className="pt-2 border-t border-indigo-100 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] text-indigo-700 font-bold">Rubros activos:</span>
                  {activeIndirectCosts.slice(0, 4).map((c) => (
                    <span
                      key={c.id}
                      className="text-[10px] bg-white text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md font-mono"
                    >
                      {c.name}: S/ {c.amount.toFixed(0)}
                    </span>
                  ))}
                  {activeIndirectCosts.length > 4 && (
                    <span className="text-[10px] text-indigo-500 font-medium">+{activeIndirectCosts.length - 4} más</span>
                  )}
                </div>
              )}
            </div>

            {/* 6. GASTOS PERSONALES / SUELDO POR PRENDA */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>6. Cuota de Gastos Personales / Sueldo Asignado (S/ por prenda):</span>
                </label>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('personal_budget')}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Abrir Simulador de Sueldo</span>
                </button>
              </div>

              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-emerald-700 font-mono font-bold">S/</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="0.00"
                  value={unitPersonalExpense}
                  onChange={(e) => setUnitPersonalExpense(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full bg-white border border-emerald-300 rounded-xl pl-8 pr-3 py-2 text-xs font-mono font-black text-emerald-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-emerald-800">
                <span className="text-[10px] text-slate-500">
                  Asigna una cuota por prenda para cubrir tu costo de vida mensual.
                </span>

                {calculatedPersonalQuotaPerUnit > 0 && (
                  <button
                    type="button"
                    onClick={() => setUnitPersonalExpense(calculatedPersonalQuotaPerUnit)}
                    className="bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    Usar cálculo de presupuesto: S/ {calculatedPersonalQuotaPerUnit.toFixed(2)}/prenda
                  </button>
                )}
              </div>
            </div>

            {/* Target Mode Selector */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Método de Cálculo del Precio:</span>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                  <button
                    onClick={() => setCalcMode('by_price')}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                      calcMode === 'by_price' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    Fijar Precio (S/)
                  </button>
                  <button
                    onClick={() => setCalcMode('by_margin')}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                      calcMode === 'by_margin' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    Fijar Margen (%)
                  </button>
                </div>
              </div>

              {calcMode === 'by_price' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Precio Deseado al Cliente (S/):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono font-bold">S/</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0.00"
                      value={unitSalePrice}
                      onChange={(e) => setUnitSalePrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-full bg-blue-50/50 border border-blue-300 rounded-xl pl-8 pr-3 py-2.5 text-sm font-mono font-black text-blue-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {totalUnitExpenseCost > 0 && (
                    <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-700 flex items-center gap-1">
                          💡 Precios Sugeridos por Margen (incluyendo costos indirectos y personales):
                        </span>
                        <span className="text-[10px] text-slate-400">Toca para aplicar</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => setUnitSalePrice(Math.round(totalUnitExpenseCost / 0.70))}
                          className="bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-300 hover:border-emerald-400 px-2 py-1 rounded-md text-[11px] font-mono font-bold transition-all cursor-pointer shadow-2xs"
                        >
                          S/ {Math.round(totalUnitExpenseCost / 0.70)} <span className="text-[10px] text-slate-400 font-normal">(30% marg.)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setUnitSalePrice(Math.round(totalUnitExpenseCost / 0.65))}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-400 px-2.5 py-1 rounded-md text-[11px] font-mono font-black transition-all cursor-pointer shadow-2xs"
                        >
                          S/ {Math.round(totalUnitExpenseCost / 0.65)} <span className="text-[10px] text-emerald-600 font-semibold">★ Recomendado (35%)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setUnitSalePrice(Math.round(totalUnitExpenseCost / 0.60))}
                          className="bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-300 hover:border-indigo-400 px-2 py-1 rounded-md text-[11px] font-mono font-bold transition-all cursor-pointer shadow-2xs"
                        >
                          S/ {Math.round(totalUnitExpenseCost / 0.60)} <span className="text-[10px] text-slate-400 font-normal">(40% marg.)</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Margen Neto Objetivo (%):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="90"
                      step="1"
                      placeholder="35"
                      value={targetMarginPercent}
                      onChange={(e) => setTargetMarginPercent(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-full bg-indigo-50/50 border border-indigo-300 rounded-xl pl-3 pr-8 py-2.5 text-sm font-mono font-black text-indigo-900 focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono font-bold">%</span>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Results Card (Right Column) */}
          <div className="lg:col-span-5 space-y-4">
            
            <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-indigo-950 text-white border border-slate-800 rounded-2xl p-6 shadow-lg space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resultado Financiero</span>
                <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  Unidad Individual
                </span>
              </div>

              {/* Main Price Big Display */}
              <div>
                <span className="text-xs text-slate-400 font-medium">Precio Sugerido</span>
                <div className="text-3xl font-black font-mono text-emerald-400 mt-0.5">
                  S/ {effectiveSalePrice.toFixed(2)}
                </div>
                <div className="text-[11px] text-slate-300 mt-1 flex items-center justify-between">
                  <span>Costo Total Integral (Directo + Fijos + Vida):</span>
                  <span className="font-mono font-bold text-slate-100">S/ {totalUnitExpenseCost.toFixed(2)}</span>
                </div>
              </div>

              {/* Expense Breakdown List */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>📦 Prenda / Confección:</span>
                  <span className="font-mono font-semibold">S/ {numUnitCostPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-blue-300">
                  <span>📢 Publicidad (CPA):</span>
                  <span className="font-mono font-semibold">S/ {numUnitCpa.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>🚀 Envío / Flete:</span>
                  <span className="font-mono font-semibold">S/ {numUnitShipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>🏷️ Empaque & Extras:</span>
                  <span className="font-mono font-semibold">S/ {numUnitExtraCost.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-slate-400 font-medium border-t border-white/10 pt-1.5 text-[11px]">
                  <span>Subtotal Costos Directos:</span>
                  <span className="font-mono font-bold text-slate-200">S/ {directOperationalCost.toFixed(2)}</span>
                </div>

                {/* TOTAL DE COSTOS INDIRECTOS (DISPLAYED BEFORE MARGEN NETO) */}
                <div className="flex justify-between text-indigo-300 font-bold bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-1.5 rounded-lg">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Total de Costos Indirectos (Cuota):</span>
                  </span>
                  <span className="font-mono text-indigo-200">S/ {numUnitIndirectCost.toFixed(2)}</span>
                </div>

                {numUnitPersonalExpense > 0 && (
                  <div className="flex justify-between text-emerald-300 font-bold border-t border-white/10 pt-1.5">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-emerald-400" />
                      <span>Gastos Personales / Sueldo:</span>
                    </span>
                    <span className="font-mono">S/ {numUnitPersonalExpense.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Margin & Profit Metrics */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Ganancia Libre Negocio</span>
                  <div className={`text-lg font-black font-mono ${unitNetProfitAfterPersonal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    S/ {unitNetProfitAfterPersonal.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-slate-400">Post costos fijos y sueldo</span>
                </div>

                <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Margen Neto Libre %</span>
                  <div className={`text-lg font-black font-mono ${unitNetMarginAfterPersonal >= 20 ? 'text-emerald-400' : unitNetMarginAfterPersonal >= 10 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {unitNetMarginAfterPersonal.toFixed(1)}%
                  </div>
                  <span className="text-[10px] text-slate-400">Para reinversión/capital</span>
                </div>
              </div>

              {/* Break-even & ROAS Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-xl p-2.5 border border-white/10 text-center">
                  <span className="text-[10px] text-slate-400">P. Equilibrio Fijos</span>
                  <div className="text-sm font-bold font-mono text-cyan-300">
                    {breakEvenUnitsOperating > 0 ? `${breakEvenUnitsOperating} prendas/mes` : '0 prendas'}
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-2.5 border border-white/10 text-center">
                  <span className="text-[10px] text-slate-400">P. Equilibrio Total</span>
                  <div className="text-sm font-bold font-mono text-emerald-300">
                    {breakEvenUnitsIntegral > 0 ? `${breakEvenUnitsIntegral} prendas/mes` : '0 prendas'}
                  </div>
                </div>
              </div>

              {/* Direct Jump to Break-Even Pro Section */}
              <button
                type="button"
                onClick={() => setActiveSubTab('punto_equilibrio')}
                className="w-full bg-gradient-to-r from-indigo-600/30 to-cyan-600/30 hover:from-indigo-600/50 hover:to-cyan-600/50 text-indigo-200 border border-indigo-500/40 rounded-xl py-2 px-3 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Activity className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Ver Análisis Pro: Gráfica Punto de Equilibrio</span>
                <ArrowRight className="w-3.5 h-3.5 text-indigo-300 ml-auto" />
              </button>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => handleOpenSaveModal('individual')}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Cálculo en Registros</span>
                </button>

                {selectedProductId && onUpdateProductPrice && (
                  <button
                    onClick={handleApplyPriceToInventory}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Actualizar Precio en Inventario</span>
                  </button>
                )}

                <button
                  onClick={handleCopyUnitSummary}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 rounded-xl font-semibold text-xs border border-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  {copiedUnitText ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedUnitText ? '¡Copiado!' : 'Copiar Resumen de Costos'}</span>
                </button>
              </div>

            </div>

          </div>

        </div>
      )}


      {/* ========================================================= */}
      {/* SECTION: ANÁLISIS PRO: GRÁFICA PUNTO DE EQUILIBRIO */}
      {/* Ubicada estratégicamente entre Calculadora y Gastos Meta */}
      {/* ========================================================= */}
      {activeSubTab === 'punto_equilibrio' && (() => {
        // Effective values for simulation
        const simSalePrice = typeof simCustomSalePrice === 'number' && simCustomSalePrice > 0
          ? simCustomSalePrice
          : (effectiveSalePrice > 0 ? effectiveSalePrice : 69);

        const simDirectCost = typeof simCustomDirectCost === 'number' && simCustomDirectCost >= 0
          ? simCustomDirectCost
          : (directOperationalCost > 0 ? directOperationalCost : 35);

        const simIndirectCost = typeof simCustomIndirectCost === 'number' && simCustomIndirectCost >= 0
          ? simCustomIndirectCost
          : totalMonthlyIndirectCosts;

        const simPersonalBudget = typeof simCustomPersonalBudget === 'number' && simCustomPersonalBudget >= 0
          ? simCustomPersonalBudget
          : totalMonthlyPersonalBudget;

        const simTargetUnits = simUnitsTarget > 0 ? simUnitsTarget : monthlyEstimatedSales;

        // Marginal contribution per unit
        const simUnitContribution = Math.max(0, simSalePrice - simDirectCost);
        const simContributionMarginPct = simSalePrice > 0 ? (simUnitContribution / simSalePrice) * 100 : 0;

        // Break-even points
        const simBreakEvenOperatingUnits = simUnitContribution > 0
          ? Math.ceil(simIndirectCost / simUnitContribution)
          : 0;
        const simBreakEvenOperatingRevenue = simBreakEvenOperatingUnits * simSalePrice;

        const simBreakEvenIntegralUnits = simUnitContribution > 0
          ? Math.ceil((simIndirectCost + simPersonalBudget) / simUnitContribution)
          : 0;
        const simBreakEvenIntegralRevenue = simBreakEvenIntegralUnits * simSalePrice;

        const simDailyOperatingOrders = Math.ceil(simBreakEvenOperatingUnits / 30);
        const simDailyIntegralOrders = Math.ceil(simBreakEvenIntegralUnits / 30);

        // Simulation points at current target volume
        const simCurrentRevenue = simTargetUnits * simSalePrice;
        const simCurrentDirectCostTotal = simTargetUnits * simDirectCost;
        const simCurrentOperatingTotalCost = simIndirectCost + simCurrentDirectCostTotal;
        const simCurrentIntegralTotalCost = simIndirectCost + simPersonalBudget + simCurrentDirectCostTotal;
        const simCurrentOperatingProfit = simCurrentRevenue - simCurrentOperatingTotalCost;
        const simCurrentNetProfit = simCurrentRevenue - simCurrentIntegralTotalCost;

        // Generate Chart Data dynamically based on break even thresholds
        const maxChartUnits = Math.max(300, Math.ceil(Math.max(simTargetUnits * 1.3, simBreakEvenIntegralUnits * 1.35) / 50) * 50);
        const chartStep = Math.max(10, Math.round(maxChartUnits / 16));
        const chartPoints = [];

        for (let u = 0; u <= maxChartUnits; u += chartStep) {
          const rev = u * simSalePrice;
          const direct = u * simDirectCost;
          const opCost = simIndirectCost + direct;
          const intCost = simIndirectCost + simPersonalBudget + direct;
          const net = rev - intCost;

          chartPoints.push({
            unidades: u,
            ingresos: Math.round(rev),
            costoOperativo: Math.round(opCost),
            costoIntegral: Math.round(intCost),
            utilidadNeta: Math.round(net),
          });
        }

        return (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Header Title Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                      <span>Análisis Pro: Gráfica de Punto de Equilibrio</span>
                      <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-bold px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                        Cálculo Dinámico
                      </span>
                    </h2>
                    <p className="text-xs text-slate-300">
                      Visualiza exactamente cuántas prendas debes vender al mes para pagar costos operativos fijos y tu sueldo emprendedor.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start md:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setSimCustomSalePrice('');
                    setSimCustomDirectCost('');
                    setSimCustomIndirectCost('');
                    setSimCustomPersonalBudget('');
                    setSimUnitsTarget(200);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Sincronizar con Calculadora</span>
                </button>
              </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: Punto Equilibrio Operativo */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <span>P. Equilibrio Fijos Negocio</span>
                  </span>
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-bold">
                    Operativo
                  </span>
                </div>
                <div className="text-2xl font-black font-mono text-indigo-950">
                  {simBreakEvenOperatingUnits} <span className="text-sm font-semibold text-slate-500">prendas/mes</span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                  <span>Facturación mínima:</span>
                  <strong className="font-mono text-slate-800">S/ {simBreakEvenOperatingRevenue.toFixed(2)}</strong>
                </div>
                <div className="text-[10px] text-slate-400">
                  Cubre alquiler, apps, servicios y costos directos.
                </div>
              </div>

              {/* Card 2: Punto Equilibrio Integral (+ Sueldo) */}
              <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-50 border border-emerald-200 rounded-2xl p-5 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs text-emerald-900 font-medium">
                  <span className="flex items-center gap-1.5">
                    <User className="w-4 h-4 text-emerald-600" />
                    <span>P. Equilibrio Total (+ Sueldo)</span>
                  </span>
                  <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-md font-bold">
                    Meta Real
                  </span>
                </div>
                <div className="text-2xl font-black font-mono text-emerald-900">
                  {simBreakEvenIntegralUnits} <span className="text-sm font-semibold text-emerald-700">prendas/mes</span>
                </div>
                <div className="text-[11px] text-emerald-800 flex items-center justify-between pt-1 border-t border-emerald-200/60">
                  <span>Facturación objetivo:</span>
                  <strong className="font-mono text-emerald-950">S/ {simBreakEvenIntegralRevenue.toFixed(2)}</strong>
                </div>
                <div className="text-[10px] text-emerald-700">
                  Cubre 100% costos fijos + tus gastos personales.
                </div>
              </div>

              {/* Card 3: Margen de Contribución por Prenda */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Percent className="w-4 h-4 text-blue-600" />
                    <span>Margen Contribución Unit.</span>
                  </span>
                  <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-bold">
                    Unitario
                  </span>
                </div>
                <div className="text-2xl font-black font-mono text-blue-900">
                  S/ {simUnitContribution.toFixed(2)} <span className="text-sm font-semibold text-slate-500">({simContributionMarginPct.toFixed(1)}%)</span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                  <span>Precio S/ {simSalePrice.toFixed(2)} - Directo:</span>
                  <strong className="font-mono text-slate-800">S/ {simDirectCost.toFixed(2)}</strong>
                </div>
                <div className="text-[10px] text-slate-400">
                  Cada prenda aporta esto para absorber fijos y ganancia.
                </div>
              </div>

              {/* Card 4: Ritmo Diario Requerido */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>Ritmo Diario de Ventas</span>
                  </span>
                  <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md font-bold">
                    30 días
                  </span>
                </div>
                <div className="text-2xl font-black font-mono text-amber-900">
                  {simDailyIntegralOrders} <span className="text-sm font-semibold text-slate-500">pedidos/día</span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                  <span>Mínimo para no perder:</span>
                  <strong className="font-mono text-slate-800">{simDailyOperatingOrders} pedidos/día</strong>
                </div>
                <div className="text-[10px] text-slate-400">
                  Ritmo comercial necesario en Meta Ads / TikTok.
                </div>
              </div>

            </div>

            {/* Main Interactive Break-Even Chart Card */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-5">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-indigo-600" />
                    <span>Curva Financiera: Ingresos vs. Costos Operativos & Integrales</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    El punto donde la línea verde (Ingresos) cruza las líneas de costos representa tu punto de equilibrio.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-slate-700 font-medium">Ingresos</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="text-slate-700 font-medium">Costos Operativos</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    <span className="text-slate-700 font-medium">Costo Total (+ Sueldo)</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <span className="text-slate-700 font-medium">Ganancia Libre</span>
                  </div>
                </div>
              </div>

              {/* Chart Canvas */}
              <div className="h-[380px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartPoints} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="unidades"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                      label={{ value: 'Volumen de Prendas Vendidas al Mes', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#64748b' }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickFormatter={(val) => `S/ ${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                        padding: '10px 14px'
                      }}
                      formatter={(val: any, name: string) => {
                        const labelMap: Record<string, string> = {
                          ingresos: 'Ingresos Totales (S/)',
                          costoOperativo: 'Costos Operativos Fijos + Directos (S/)',
                          costoIntegral: 'Costo Integral (+ Sueldo Emprendedor) (S/)',
                          utilidadNeta: 'Utilidad Neta Libre (S/)',
                        };
                        return [`S/ ${Number(val).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`, labelMap[name] || name];
                      }}
                      labelFormatter={(label) => `📦 Volumen: ${label} prendas vendidas`}
                    />
                    
                    {/* Area under revenue */}
                    <Area
                      type="monotone"
                      dataKey="ingresos"
                      name="ingresos"
                      stroke="#10b981"
                      strokeWidth={3}
                      fill="#10b981"
                      fillOpacity={0.08}
                    />

                    {/* Cost lines */}
                    <Line
                      type="monotone"
                      dataKey="costoOperativo"
                      name="costoOperativo"
                      stroke="#ef4444"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="costoIntegral"
                      name="costoIntegral"
                      stroke="#a855f7"
                      strokeWidth={2}
                      strokeDasharray="3 3"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="utilidadNeta"
                      name="utilidadNeta"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={false}
                    />

                    {/* Reference Lines for Break-even markers */}
                    {simBreakEvenOperatingUnits > 0 && (
                      <ReferenceLine
                        x={simBreakEvenOperatingUnits}
                        stroke="#ef4444"
                        strokeDasharray="3 3"
                        label={{
                          value: `P.E. Fijos (${simBreakEvenOperatingUnits}u)`,
                          position: 'top',
                          fill: '#dc2626',
                          fontSize: 11,
                          fontWeight: 'bold',
                        }}
                      />
                    )}

                    {simBreakEvenIntegralUnits > 0 && (
                      <ReferenceLine
                        x={simBreakEvenIntegralUnits}
                        stroke="#059669"
                        strokeDasharray="3 3"
                        label={{
                          value: `P.E. Total (${simBreakEvenIntegralUnits}u)`,
                          position: 'top',
                          fill: '#059669',
                          fontSize: 11,
                          fontWeight: 'bold',
                        }}
                      />
                    )}

                    {/* Reference line for current simulated volume */}
                    {simTargetUnits > 0 && (
                      <ReferenceLine
                        x={simTargetUnits}
                        stroke="#3b82f6"
                        label={{
                          value: `Meta Actual (${simTargetUnits}u)`,
                          position: 'bottom',
                          fill: '#2563eb',
                          fontSize: 11,
                          fontWeight: 'bold',
                        }}
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Visual Zone Explanations */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1">
                  <div className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                    <span>1. Zona de Pérdida (0 a {simBreakEvenOperatingUnits} prendas)</span>
                  </div>
                  <p className="text-[11px] text-rose-700">
                    Los ingresos no logran absorber el costo del taller, alquiler y servicios fijos. El negocio pierde dinero.
                  </p>
                </div>

                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                  <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                    <span>2. Zona de Supervivencia ({simBreakEvenOperatingUnits} a {simBreakEvenIntegralUnits} prendas)</span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    El negocio cubre el 100% de sus costos fijos y no quiebra, pero aún no genera el sueldo completo del dueño.
                  </p>
                </div>

                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                  <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>3. Zona de Crecimiento ({simBreakEvenIntegralUnits}+ prendas)</span>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    Tu sueldo está 100% cubierto. Cada prenda adicional vendida genera ganancia líquida libre para reinversión y expansión.
                  </p>
                </div>
              </div>

            </div>

            {/* Interactive Simulator Variables Panel */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                  <span>Simulador de Escenarios en Tiempo Real</span>
                </h3>
                <span className="text-xs text-slate-500 font-medium">Modifica variables para proyectar</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* 1. Precio */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Precio Venta Unit. (S/):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono font-bold">S/</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      placeholder={effectiveSalePrice.toFixed(2)}
                      value={simCustomSalePrice}
                      onChange={(e) => setSimCustomSalePrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* 2. Costo Directo */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Costo Directo Unit. (S/):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono font-bold">S/</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder={directOperationalCost.toFixed(2)}
                      value={simCustomDirectCost}
                      onChange={(e) => setSimCustomDirectCost(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* 3. Costos Indirectos */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Costos Fijos / Mes (S/):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-indigo-400 font-mono font-bold">S/</span>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      placeholder={totalMonthlyIndirectCosts.toFixed(2)}
                      value={simCustomIndirectCost}
                      onChange={(e) => setSimCustomIndirectCost(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-full bg-indigo-50/50 border border-indigo-300 rounded-xl pl-8 pr-3 py-2 text-xs font-mono font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* 4. Sueldo Personal */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sueldo / Vida Mes (S/):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-emerald-400 font-mono font-bold">S/</span>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      placeholder={totalMonthlyPersonalBudget.toFixed(2)}
                      value={simCustomPersonalBudget}
                      onChange={(e) => setSimCustomPersonalBudget(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-full bg-emerald-50/50 border border-emerald-300 rounded-xl pl-8 pr-3 py-2 text-xs font-mono font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* 5. Volumen Simulado */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Meta de Prendas / Mes:
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="10"
                      max="2000"
                      step="10"
                      value={simUnitsTarget}
                      onChange={(e) => setSimUnitsTarget(parseInt(e.target.value, 10) || 1)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Current Volume Result Strip */}
              <div className="p-4 bg-slate-900 text-white rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-400 font-medium">Proyección para {simTargetUnits} prendas vendidas:</span>
                  <div className="text-xl font-black font-mono mt-0.5 flex items-center gap-3">
                    <span className="text-emerald-400">Ventas: S/ {simCurrentRevenue.toFixed(2)}</span>
                    <span className="text-slate-500">|</span>
                    <span className={simCurrentNetProfit >= 0 ? 'text-emerald-300' : 'text-rose-400'}>
                      Ganancia Neta: S/ {simCurrentNetProfit.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    simTargetUnits >= simBreakEvenIntegralUnits
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : simTargetUnits >= simBreakEvenOperatingUnits
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}>
                    {simTargetUnits >= simBreakEvenIntegralUnits
                      ? '✓ En Zona de Crecimiento Libre'
                      : simTargetUnits >= simBreakEvenOperatingUnits
                      ? '⚠ En Zona de Supervivencia'
                      : '✗ En Zona de Déficit Operativo'}
                  </span>
                </div>
              </div>

            </div>

          </div>
        );
      })()}


      {/* ========================================================= */}
      {/* SUBTAB: COSTOS INDIRECTOS (DIRECT MANAGEMENT VIEW) */}
      {/* ========================================================= */}
      {activeSubTab === 'indirect_costs' && (
        <div className="space-y-6">
          <IndirectCostsView
            indirectCosts={indirectCosts}
            onAddCost={onAddIndirectCost || (() => {})}
            onUpdateCost={onUpdateIndirectCost || (() => {})}
            onDeleteCost={onDeleteIndirectCost || (() => {})}
            onBulkDeleteCosts={onBulkDeleteIndirectCosts}
            showToast={showToast}
          />
        </div>
      )}


      {/* ========================================================= */}
      {/* SUBTAB 2: CALCULADORA DE COMBOS & PACKS (2X, 3X) */}
      {/* ========================================================= */}
      {activeSubTab === 'combos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Combo Builder Inputs (Left Column) */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-5">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Gift className="w-5 h-5 text-amber-500" />
                    <span>Armador de Combo u Oferta</span>
                  </h3>
                  <p className="text-xs text-slate-500">Agrega las prendas que integran la oferta especial.</p>
                </div>

                <button
                  onClick={handleAddComboItem}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Agregar Prenda</span>
                </button>
              </div>

              {/* Combo Title Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre de la Oferta / Combo:
                </label>
                <input
                  type="text"
                  value={comboTitle}
                  onChange={(e) => setComboTitle(e.target.value)}
                  placeholder="ej. Combo 2X Poleras Oversize"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Items List Table */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-indigo-600" />
                    <span>Prendas en el Combo ({comboItems.length})</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleAddComboItem}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Agregar Prenda</span>
                  </button>
                </div>
                
                {comboItems.map((item, index) => {
                  return (
                    <div
                      key={item.id}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 shadow-2xs"
                    >
                      {/* Item label & selector */}
                      <div className="flex items-center gap-2 flex-1 min-w-[160px]">
                        <span className="w-5 h-5 rounded-md bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                          #{index + 1}
                        </span>
                        
                        <select
                          value={item.productId || ''}
                          onChange={(e) => handleUpdateComboItem(item.id, 'productId', e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 cursor-pointer truncate"
                        >
                          <option value="">-- Seleccionar o Personalizado --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {!item.productId && (
                        <div className="w-full sm:w-36">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleUpdateComboItem(item.id, 'name', e.target.value)}
                            placeholder="Nombre de prenda"
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800"
                          />
                        </div>
                      )}

                      {/* Precio Simple */}
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-xs font-bold text-slate-500">S/</span>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          placeholder="99"
                          value={item.costPrice}
                          onChange={(e) => handleUpdateComboItem(item.id, 'costPrice', e.target.value === '' ? '' : parseFloat(e.target.value))}
                          className="w-20 bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      {/* Cantidad */}
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[11px] text-slate-400 font-medium">Cant:</span>
                        <input
                          type="number"
                          min="1"
                          max="99"
                          placeholder="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateComboItem(item.id, 'quantity', e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                          className="w-12 bg-white border border-slate-300 rounded-lg px-1.5 py-1.5 text-xs font-bold font-mono text-center text-slate-900"
                        />
                      </div>

                      {comboItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveComboItem(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                          title="Eliminar prenda"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Agregar otra prenda */}
                <button
                  type="button"
                  onClick={handleAddComboItem}
                  className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Agregar otra prenda al combo</span>
                </button>
              </div>

              {/* Additional Combo Expenses Inputs */}
              <div className="border-t border-slate-100 pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">CPA Anuncios Combo (S/):</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={comboCpa}
                    onChange={(e) => setComboCpa(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-blue-600"
                  />
                  <span className="text-[10px] text-slate-400">Meta Ads por combo</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Costo Envío Combo (S/):</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={comboShipping}
                    onChange={(e) => setComboShipping(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-800"
                  />
                  <span className="text-[10px] text-slate-400">Flete o delivery pack</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Empaque Combo (S/):</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={comboPackaging}
                    onChange={(e) => setComboPackaging(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-800"
                  />
                  <span className="text-[10px] text-slate-400">Caja/Bolsa especial</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-800 mb-1">Gastos Personales (S/):</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={comboPersonalExpense}
                    onChange={(e) => setComboPersonalExpense(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full bg-emerald-50 border border-emerald-300 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-emerald-900"
                  />
                  <span className="text-[10px] text-emerald-600">Cuota sueldo por pack</span>
                </div>
              </div>

              {/* TARGET COMBO PRICE INPUT */}
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 space-y-2">
                <label className="block text-xs font-black text-indigo-950 uppercase tracking-wider">
                  🎯 PRECIO FINAL DEL COMBO AL CLIENTE (S/):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm text-indigo-500 font-mono font-bold">S/</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0.00"
                    value={comboTargetPrice}
                    onChange={(e) => setComboTargetPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full bg-white border-2 border-indigo-400 rounded-xl pl-9 pr-4 py-2.5 text-lg font-black font-mono text-indigo-900 focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

            </div>

          </div>

          {/* Combo Results & WhatsApp Offer Preview (Right Column) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Financial Card */}
            <div className="bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white border border-slate-800 rounded-2xl p-6 shadow-lg space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rentabilidad del Combo</span>
                <span className="text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Gift className="w-3 h-3" />
                  Estrategia Pack
                </span>
              </div>

              {/* Combo Main Numbers */}
              <div>
                <span className="text-xs text-slate-400 font-medium">Precio de Oferta del Combo</span>
                <div className="text-3xl font-black font-mono text-amber-400 mt-0.5">
                  S/ {numComboTargetPrice.toFixed(2)}
                </div>
                <div className="text-[11px] text-slate-300 mt-1 flex items-center justify-between">
                  <span>Costo Total Combo (Prendas + Ads + Envío + Sueldo):</span>
                  <span className="font-mono font-bold text-slate-100">S/ {totalComboExpenseCost.toFixed(2)}</span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Ganancia Neta Libre</span>
                  <div className={`text-lg font-black font-mono ${comboNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    S/ {comboNetProfit.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-slate-400">Por combo vendido</span>
                </div>

                <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Margen Neto %</span>
                  <div className={`text-lg font-black font-mono ${comboNetMargin >= 25 ? 'text-emerald-400' : comboNetMargin >= 10 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {comboNetMargin.toFixed(1)}%
                  </div>
                  <span className="text-[10px] text-slate-400">Sobre precio del combo</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-xl p-2.5 border border-white/10 text-center">
                  <span className="text-[10px] text-slate-400">ROAS Combo Ad</span>
                  <div className="text-sm font-bold font-mono text-amber-300">{comboRoas.toFixed(2)}x</div>
                </div>
                <div className="bg-white/5 rounded-xl p-2.5 border border-white/10 text-center">
                  <span className="text-[10px] text-slate-400">ROI Inversión</span>
                  <div className="text-sm font-bold font-mono text-indigo-300">{comboRoi.toFixed(0)}%</div>
                </div>
              </div>

              {/* Individual Products Breakdown Inside Combo */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                    <span>Prendas en el Combo ({comboItems.length}):</span>
                  </span>
                  <span className="font-mono text-[11px] text-slate-300 font-bold">
                    Total: S/ {totalComboProductsCost.toFixed(2)}
                  </span>
                </div>

                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {comboItems.map((item, idx) => {
                    const price = typeof item.costPrice === 'number' ? item.costPrice : (parseFloat(String(item.costPrice)) || 0);
                    const qty = typeof item.quantity === 'number' ? item.quantity : (parseInt(String(item.quantity), 10) || 1);
                    return (
                      <div key={item.id || idx} className="flex items-center justify-between text-[11px] py-1 border-b border-white/5 last:border-0">
                        <div className="truncate max-w-[170px]">
                          <span className="text-amber-300 font-bold mr-1">{qty}x</span>
                          <span className="text-slate-200">{item.name || `Prenda ${idx + 1}`}</span>
                        </div>
                        <div className="text-right font-mono shrink-0">
                          <span className="text-emerald-400 font-bold">S/ {(price * qty).toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* WhatsApp Offer Generator Box */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                  <h4 className="text-xs font-bold text-slate-900">Mensaje de Oferta para WhatsApp</h4>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">Listo para Enviar</span>
              </div>

              <div className="bg-slate-900 text-emerald-300 font-mono text-[11px] p-3.5 rounded-xl border border-slate-800 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                {generateWhatsAppCopy()}
              </div>

              <button
                onClick={handleCopyComboWhatsApp}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-bold text-xs shadow-sm shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                {copiedComboMsg ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedComboMsg ? '¡Copiado para WhatsApp!' : 'Copiar Oferta para WhatsApp'}</span>
              </button>

              <button
                onClick={() => handleOpenSaveModal('combo')}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl font-bold text-xs shadow-sm shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Combo en Registros</span>
              </button>
            </div>

          </div>

        </div>
      )}


      {/* ========================================================= */}
      {/* SUBTAB 3: GASTOS PERSONALES & SIMULADOR DE SUELDO EMPRENDEDOR */}
      {/* ========================================================= */}
      {activeSubTab === 'personal_budget' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Budget Manager Form (Left Column) */}
          <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-emerald-600" />
                  <span>Presupuesto de Gastos Personales & Retiro Mensual</span>
                </h3>
                <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                  Sueldo Emprendedor
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Registra tus costos mensuales de vida para calcular con precisión cuánto debe aportar cada prenda vendida a tu economía personal.
              </p>
            </div>

            {/* Monthly Target Volume Slider / Input */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-indigo-600" />
                  <span>Ventas Estimadas del Mes (Prendas):</span>
                </label>
                <span className="font-mono font-bold text-sm bg-white px-3 py-0.5 rounded-lg border border-slate-300 text-indigo-700">
                  {monthlyEstimatedSales} prendas/mes
                </span>
              </div>

              <input
                type="range"
                min="20"
                max="1000"
                step="10"
                value={monthlyEstimatedSales}
                onChange={(e) => setMonthlyEstimatedSales(parseInt(e.target.value, 10) || 1)}
                className="w-full accent-indigo-600 cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-slate-400">
                <span>20 prendas</span>
                <span>200 prendas (Estándar)</span>
                <span>500 prendas</span>
                <span>1,000 prendas</span>
              </div>
            </div>

            {/* List of Personal Expenses */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Detalle de Gastos Personales Mensuales:
                </span>
                <span className="text-xs font-bold text-slate-500 font-mono">
                  {personalExpenses.length} rubros
                </span>
              </div>

              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {personalExpenses.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                        {renderExpenseIcon(item.iconName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-slate-800 block truncate">{item.name}</span>
                        <span className="text-[10px] text-slate-400">{item.category}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="relative">
                        <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-mono font-bold">S/</span>
                        <input
                          type="number"
                          min="0"
                          step="10"
                          value={item.amount}
                          onChange={(e) => handleUpdatePersonalExpenseAmount(item.id, parseFloat(e.target.value) || 0)}
                          className="w-24 bg-white border border-slate-300 rounded-lg pl-7 pr-2 py-1 text-xs font-mono font-bold text-slate-900 text-right focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <button
                        onClick={() => handleRemovePersonalExpense(item.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Eliminar gasto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add New Expense Row */}
            <div className="border-t border-slate-100 pt-4">
              <label className="block text-xs font-bold text-slate-700 mb-2">
                + Agregar Nuevo Gasto Personal:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <input
                  type="text"
                  placeholder="Descripción (ej. Gimnasio, Seguro...)"
                  value={newExpName}
                  onChange={(e) => setNewExpName(e.target.value)}
                  className="sm:col-span-6 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
                />

                <select
                  value={newExpCategory}
                  onChange={(e) => setNewExpCategory(e.target.value)}
                  className="sm:col-span-3 bg-slate-50 border border-slate-300 rounded-xl px-2 py-2 text-xs text-slate-700 font-medium"
                >
                  <option value="Vivienda">Vivienda</option>
                  <option value="Alimentación">Alimentación</option>
                  <option value="Servicios">Servicios</option>
                  <option value="Transporte">Transporte</option>
                  <option value="Salud">Salud</option>
                  <option value="Personal">Personal</option>
                  <option value="Ahorro">Ahorro</option>
                </select>

                <div className="sm:col-span-3 flex gap-1.5">
                  <input
                    type="number"
                    min="0"
                    placeholder="S/ Monto"
                    value={newExpAmount}
                    onChange={(e) => setNewExpAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={handleAddPersonalExpense}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-xl transition-all cursor-pointer shrink-0"
                    title="Agregar gasto"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Budget Financial Summary & Breakdown (Right Column) */}
          <div className="lg:col-span-5 space-y-4">
            
            <div className="bg-gradient-to-b from-slate-900 via-emerald-950 to-slate-900 text-white border border-slate-800 rounded-2xl p-6 shadow-lg space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resumen de Vida & Ventas</span>
                <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Sueldo Seguro
                </span>
              </div>

              {/* Total Monthly Personal Budget */}
              <div>
                <span className="text-xs text-slate-400 font-medium">Presupuesto Mensual Personal Necesario</span>
                <div className="text-3xl font-black font-mono text-emerald-400 mt-0.5">
                  S/ {totalMonthlyPersonalBudget.toFixed(2)}
                </div>
                <div className="text-[11px] text-slate-300 mt-1 flex items-center justify-between">
                  <span>Meta de Volumen:</span>
                  <span className="font-mono font-bold text-emerald-200">{monthlyEstimatedSales} prendas / mes</span>
                </div>
              </div>

              {/* Highlight Calculated Quota per Unit */}
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center space-y-1">
                <span className="text-[11px] text-emerald-200 uppercase font-bold tracking-wide">
                  Cuota de Gasto Personal por Cada Prenda
                </span>
                <div className="text-3xl font-black font-mono text-emerald-300">
                  S/ {calculatedPersonalQuotaPerUnit.toFixed(2)}
                </div>
                <p className="text-[10px] text-slate-300">
                  Si cada prenda vendida aporta S/ {calculatedPersonalQuotaPerUnit.toFixed(2)}, con {monthlyEstimatedSales} ventas cubres el 100% de tu sueldo de vida.
                </p>
              </div>

              {/* Strategic Insights */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-2.5 text-xs">
                <div className="flex items-center gap-2 text-emerald-300 font-bold">
                  <Info className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Punto de Equilibrio Financiero</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Con un margen operativo típico de <strong>S/ 25.00 por prenda</strong>, necesitas concretar:
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1 text-center font-mono">
                  <div className="bg-white/10 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Ventas Mínimas / Mes</span>
                    <strong className="text-sm text-emerald-300">
                      {Math.ceil(totalMonthlyPersonalBudget / 25)} prendas
                    </strong>
                  </div>
                  <div className="bg-white/10 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Promedio Diario</span>
                    <strong className="text-sm text-amber-300">
                      {(Math.ceil(totalMonthlyPersonalBudget / 25) / 30).toFixed(1)} pedidos/día
                    </strong>
                  </div>
                </div>
              </div>

              {/* Action Button: Apply Quota */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => handleApplyPersonalQuotaToUnit(calculatedPersonalQuotaPerUnit)}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold text-xs shadow-md shadow-emerald-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Aplicar S/ {calculatedPersonalQuotaPerUnit.toFixed(2)} a Calculadora de Precios</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenSaveModal('personal_budget')}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4 text-emerald-400" />
                  <span>Guardar Presupuesto Personal en Registros</span>
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* SUBTAB 4: HISTORIAL DE REGISTROS DE PRECIOS & COTIZACIONES */}
      {/* ========================================================= */}
      {activeSubTab === 'history' && (
        <div className="space-y-6">
          {/* Top KPI Metrics Bar */}
          {(() => {
            const unitAndComboRecords = pricingRecords.filter((r) => r.type !== 'personal_budget');
            const avgMargin =
              unitAndComboRecords.length > 0
                ? unitAndComboRecords.reduce((sum, r) => sum + (r.netMarginPercent || 0), 0) / unitAndComboRecords.length
                : 0;
            const avgProfit =
              unitAndComboRecords.length > 0
                ? unitAndComboRecords.reduce((sum, r) => sum + (r.netProfit || 0), 0) / unitAndComboRecords.length
                : 0;
            const maxMargin =
              unitAndComboRecords.length > 0
                ? Math.max(...unitAndComboRecords.map((r) => r.netMarginPercent || 0))
                : 0;

            return (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                    <span>Total Registros</span>
                    <FolderOpen className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-black font-mono text-slate-900 mt-1.5">
                    {pricingRecords.length}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {pricingRecords.filter((r) => r.type === 'individual').length} por unidad · {pricingRecords.filter((r) => r.type === 'combo').length} combos
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                    <span>Margen Neto Promedio</span>
                    <Percent className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-black font-mono text-emerald-600 mt-1.5">
                    {avgMargin.toFixed(1)}%
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Promedio sobre precio venta
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                    <span>Ganancia Neta Promedio</span>
                    <DollarSign className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-2xl font-black font-mono text-indigo-600 mt-1.5">
                    S/ {avgProfit.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Utilidad libre por transacción
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                    <span>Mayor Margen Guardado</span>
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-2xl font-black font-mono text-amber-600 mt-1.5">
                    {maxMargin > 0 ? `${maxMargin.toFixed(1)}%` : '0%'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Cálculo más rentable registrado
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Filters, Search & Bulk Actions Toolbar */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
              {/* Type Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setHistoryFilterType('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    historyFilterType === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todos ({pricingRecords.length})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilterType('individual')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    historyFilterType === 'individual'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Por Unidad ({pricingRecords.filter((r) => r.type === 'individual').length})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilterType('combo')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    historyFilterType === 'combo'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Combos & Packs ({pricingRecords.filter((r) => r.type === 'combo').length})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilterType('personal_budget')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    historyFilterType === 'personal_budget'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Presupuestos ({pricingRecords.filter((r) => r.type === 'personal_budget').length})
                </button>
              </div>

              {/* View Toggle and Actions */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setHistoryViewMode(historyViewMode === 'cards' ? 'table' : 'cards')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>{historyViewMode === 'cards' ? 'Vista Tabla' : 'Vista Tarjetas'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportRecordsCSV}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  title="Descargar base de datos de cálculos en CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Exportar CSV</span>
                </button>

                {selectedRecordIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleBulkDeleteSelected}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar ({selectedRecordIds.length})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Search Input Bar */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por producto, título de combo, notas o fecha..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Records Display (Cards or Table) */}
          {(() => {
            const filteredRecords = pricingRecords
              .filter((r) => {
                if (historyFilterType !== 'all' && r.type !== historyFilterType) return false;
                if (!historySearch.trim()) return true;
                const q = historySearch.toLowerCase();
                const matchTitle = (r.title || '').toLowerCase().includes(q);
                const matchProduct = (r.productName || '').toLowerCase().includes(q);
                const matchCombo = (r.comboTitle || '').toLowerCase().includes(q);
                const matchNotes = (r.notes || '').toLowerCase().includes(q);
                const matchDate = (r.createdAt || '').toLowerCase().includes(q);
                return matchTitle || matchProduct || matchCombo || matchNotes || matchDate;
              })
              .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());

            if (filteredRecords.length === 0) {
              return (
                <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-2xs space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <History className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">No se encontraron registros de cálculos</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    {pricingRecords.length === 0
                      ? 'Aún no has guardado cálculos en la base de datos. Ve a la calculadora "Por Unidad", "Combos & Packs" o "Gastos Personales" y haz clic en "Guardar Cálculo en Registros".'
                      : 'No hay cálculos que coincidan con la búsqueda o filtro actual.'}
                  </p>
                  {pricingRecords.length === 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveSubTab('individual')}
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      <Calculator className="w-4 h-4" />
                      <span>Ir a la Calculadora</span>
                    </button>
                  )}
                </div>
              );
            }

            if (historyViewMode === 'table') {
              return (
                <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="px-4 py-3 w-8">
                            <input
                              type="checkbox"
                              checked={
                                filteredRecords.length > 0 &&
                                filteredRecords.every((r) => selectedRecordIds.includes(r.id))
                              }
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedRecordIds(filteredRecords.map((r) => r.id));
                                } else {
                                  setSelectedRecordIds([]);
                                }
                              }}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </th>
                          <th className="px-4 py-3">Título & Detalle</th>
                          <th className="px-4 py-3">Tipo</th>
                          <th className="px-4 py-3">Fecha</th>
                          <th className="px-4 py-3">Precio</th>
                          <th className="px-4 py-3">Costo Total</th>
                          <th className="px-4 py-3">Ganancia</th>
                          <th className="px-4 py-3">Margen %</th>
                          <th className="px-4 py-3">ROAS Min</th>
                          <th className="px-4 py-3 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredRecords.map((r) => (
                          <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={selectedRecordIds.includes(r.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedRecordIds((prev) => [...prev, r.id]);
                                  } else {
                                    setSelectedRecordIds((prev) => prev.filter((id) => id !== r.id));
                                  }
                                }}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-bold text-slate-900">{r.title}</div>
                              {r.productName && (
                                <div className="text-[10px] text-slate-500 font-normal">{r.productName}</div>
                              )}
                              {r.notes && (
                                <div className="text-[10px] text-slate-400 italic truncate max-w-xs">{r.notes}</div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  r.type === 'combo'
                                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                    : r.type === 'personal_budget'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                                }`}
                              >
                                {r.type === 'combo' ? 'Combo' : r.type === 'personal_budget' ? 'Presupuesto' : 'Unidad'}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-600">
                              {r.createdAt ? r.createdAt.slice(0, 10) : '-'}
                            </td>
                            <td className="px-4 py-3 font-mono font-bold text-emerald-600">
                              {r.type === 'personal_budget' ? '-' : `S/ ${(r.salePrice || 0).toFixed(2)}`}
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-700">
                              {r.type === 'personal_budget'
                                ? `S/ ${(r.totalPersonalBudget || 0).toFixed(2)}`
                                : `S/ ${(r.totalCost || 0).toFixed(2)}`}
                            </td>
                            <td className="px-4 py-3 font-mono font-bold text-blue-600">
                              {r.type === 'personal_budget' ? '-' : `S/ ${(r.netProfit || 0).toFixed(2)}`}
                            </td>
                            <td className="px-4 py-3 font-mono font-bold text-slate-800">
                              {r.type === 'personal_budget' ? '-' : `${(r.netMarginPercent || 0).toFixed(1)}%`}
                            </td>
                            <td className="px-4 py-3 font-mono text-amber-600">
                              {r.minRoas ? `${r.minRoas.toFixed(2)}x` : '-'}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditRecordModal(r)}
                                  className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                  title="Editar Cálculo (Título, Costos, Precio)"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleLoadRecordIntoCalculator(r)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                  title="Cargar en Calculadora"
                                >
                                  <FolderOpen className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRecord(r.id)}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Eliminar Registro"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            }

            // Cards Grid View
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredRecords.map((r) => {
                  const isUnit = r.type === 'individual';
                  const isCombo = r.type === 'combo';
                  const isBudget = r.type === 'personal_budget';

                  return (
                    <div
                      key={r.id}
                      className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all space-y-4"
                    >
                      <div>
                        {/* Header & Badges */}
                        <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isCombo
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                  : isBudget
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}
                            >
                              {isCombo ? 'Combo / Pack' : isBudget ? 'Presupuesto Personal' : 'Por Unidad'}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">
                              {r.createdAt ? r.createdAt.slice(0, 10) : ''}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditRecordModal(r)}
                              className="text-slate-400 hover:text-amber-600 p-1 rounded-md transition-colors cursor-pointer"
                              title="Editar registro"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRecord(r.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer"
                              title="Eliminar registro"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Title & Notes */}
                        <div className="mt-3">
                          <h4 className="text-sm font-extrabold text-slate-900">{r.title}</h4>
                          {r.productName && !isBudget && (
                            <div className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                              <Tag className="w-3 h-3 text-slate-400" />
                              <span>{r.productName}</span>
                            </div>
                          )}
                          {r.notes && (
                            <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed italic">
                              "{r.notes}"
                            </p>
                          )}
                        </div>

                        {/* Financial Metrics Box */}
                        {isBudget ? (
                          <div className="mt-4 bg-emerald-50/60 border border-emerald-100 rounded-xl p-3.5 space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-600 font-medium">Presupuesto Mensual:</span>
                              <span className="font-mono font-bold text-slate-900">
                                S/ {(r.totalPersonalBudget || 0).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-600 font-medium">Volumen Estimado:</span>
                              <span className="font-mono font-bold text-slate-700">
                                {r.monthlyEstimatedSales || 0} prendas/mes
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-xs pt-1 border-t border-emerald-200/60">
                              <span className="text-emerald-800 font-bold">Cuota por Prenda:</span>
                              <span className="font-mono font-black text-emerald-700 text-sm">
                                S/ {(r.personalExpenseQuota || 0).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4 bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-slate-500 font-medium">Precio:</span>
                              <span className="font-mono font-black text-emerald-600 text-base">
                                S/ {(r.salePrice || 0).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-xs text-slate-600">
                              <span>Costo Total:</span>
                              <span className="font-mono font-semibold">S/ {(r.totalCost || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs pt-1.5 border-t border-slate-200">
                              <span className="font-bold text-slate-700">Ganancia Neta:</span>
                              <span className="font-mono font-bold text-blue-600">
                                S/ {(r.netProfit || 0).toFixed(2)} ({((r.netMarginPercent || 0)).toFixed(1)}%)
                              </span>
                            </div>
                            {r.minRoas && (
                              <div className="flex justify-between items-center text-[11px] text-amber-700 font-medium">
                                <span>ROAS Mínimo:</span>
                                <span className="font-mono font-bold">{r.minRoas.toFixed(2)}x</span>
                              </div>
                            )}

                            {isCombo && r.comboItems && r.comboItems.length > 0 && (
                              <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 space-y-1.5">
                                <span className="font-bold text-slate-700 block">Prendas en el Combo:</span>
                                {r.comboItems.map((item, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-[10px] bg-white p-1.5 rounded border border-slate-100 font-mono">
                                    <span className="font-bold text-indigo-900 truncate max-w-[140px]">{item.quantity}x {item.name || 'Prenda'}</span>
                                    <div className="text-right text-[10px]">
                                      <span className="text-emerald-600 font-bold">S/ {(item.costPrice || item.regularSalePrice || 0).toFixed(2)}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditRecordModal(r)}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                            <span>Editar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleLoadRecordIntoCalculator(r)}
                            className="bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                            <span>Cargar</span>
                          </button>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (isBudget) {
                                const msg = `💰 *PRESUPUESTO PERSONAL MENSUAL D'RAYO*\n• Presupuesto: S/ ${(r.totalPersonalBudget || 0).toFixed(2)}\n• Ventas Estimadas: ${r.monthlyEstimatedSales} prendas/mes\n• Cuota de vida por prenda: S/ ${(r.personalExpenseQuota || 0).toFixed(2)}`;
                                navigator.clipboard.writeText(msg);
                              } else {
                                const msg = `📊 *REGISTRO DE PRECIO: ${r.title}*\n• Precio Venta: S/ ${(r.salePrice || 0).toFixed(2)}\n• Costo Total: S/ ${(r.totalCost || 0).toFixed(2)}\n• Ganancia Neta: S/ ${(r.netProfit || 0).toFixed(2)} (${(r.netMarginPercent || 0).toFixed(1)}%)\n${r.minRoas ? `• ROAS Mínimo: ${r.minRoas.toFixed(2)}x\n` : ''}${r.notes ? `• Notas: ${r.notes}` : ''}`;
                                navigator.clipboard.writeText(msg);
                              }
                              if (showToast) {
                                showToast('Resumen copiado al portapapeles');
                              } else {
                                setUpdatedSuccessMsg('¡Resumen copiado al portapapeles!');
                                setTimeout(() => setUpdatedSuccessMsg(null), 2500);
                              }
                            }}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar Ficha</span>
                          </button>

                          {r.productId && onUpdateProductPrice && r.salePrice && (
                            <button
                              type="button"
                              onClick={() => {
                                onUpdateProductPrice(
                                  r.productId!,
                                  Math.round(r.salePrice!),
                                  r.productCostPrice || 0
                                );
                                if (showToast) {
                                  showToast(`¡Precio de "${r.productName}" actualizado en inventario!`);
                                }
                              }}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                              title="Aplicar este precio al catálogo/inventario"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Inventario</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: GUARDAR CÁLCULO EN REGISTROS DE LA BASE DE DATOS */}
      {/* ========================================================= */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Save className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Guardar Cálculo en Registros / Base de Datos
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {saveModalType === 'combo'
                      ? 'Registro de Combo u Oferta comercial'
                      : saveModalType === 'personal_budget'
                      ? 'Presupuesto de Vida & Gastos Personales'
                      : 'Cotización / Margen de Prenda Individual'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Metrics Recap */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5 text-xs">
              <span className="font-bold text-slate-700 block">Resumen del Cálculo a Guardar:</span>
              {saveModalType === 'personal_budget' ? (
                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Presupuesto Mensual:</span>
                    <strong className="text-emerald-700">S/ {totalMonthlyPersonalBudget.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Cuota por Prenda:</span>
                    <strong className="text-slate-900">S/ {calculatedPersonalQuotaPerUnit.toFixed(2)}</strong>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Precio:</span>
                    <strong className="text-emerald-600">
                      S/ {(saveModalType === 'combo' ? numComboTargetPrice : effectiveSalePrice).toFixed(2)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Costo Total:</span>
                    <strong className="text-slate-700">
                      S/ {(saveModalType === 'combo' ? totalComboExpenseCost : totalUnitExpenseCost).toFixed(2)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Margen Neto:</span>
                    <strong className="text-blue-600">
                      {(saveModalType === 'combo' ? comboNetMargin : unitNetMarginAfterPersonal).toFixed(1)}%
                    </strong>
                  </div>
                </div>
              )}
            </div>

            {/* Inputs */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Título del Registro / Cálculo:</label>
                <input
                  type="text"
                  value={saveTitle}
                  onChange={(e) => setSaveTitle(e.target.value)}
                  placeholder="Ej: Polera Oversize - Cotización Verano"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Notas / Observaciones Estratégicas:</label>
                <textarea
                  rows={3}
                  value={saveNotes}
                  onChange={(e) => setSaveNotes(e.target.value)}
                  placeholder="Ej: Considera CPA de S/ 15 en Meta Ads y envío gratis a Lima Metropolitana..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSaving || !saveTitle.trim()}
                onClick={handleConfirmSaveRecord}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-2.5 rounded-xl font-bold text-xs shadow-md shadow-emerald-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{isSaving ? 'Guardando...' : 'Confirmar y Guardar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDITAR CÁLCULO GUARDADO EN EL HISTORIAL */}
      {/* ========================================================= */}
      {editingRecord && (() => {
        const isBudget = editingRecord.type === 'personal_budget';
        const isCombo = editingRecord.type === 'combo';

        // Live preview calculations for the modal
        const curSale = Number(editRecSalePrice) || 0;
        const curCost = Number(editRecCostPrice) || 0;
        const curCpa = Number(editRecCpa) || 0;
        const curShip = Number(editRecShipping) || 0;
        const curPack = Number(editRecPackaging) || 0;
        const curQuota = Number(editRecPersonalQuota) || 0;
        const curTotalCost = curCost + curCpa + curShip + curPack + curQuota;
        const curNetProfit = curSale - curTotalCost;
        const curMargin = curSale > 0 ? (curNetProfit / curSale) * 100 : 0;
        const curRoas = (curCpa > 0 && curNetProfit + curCpa > 0) ? curSale / (curNetProfit + curCpa) : (curCpa > 0 ? curSale / curCpa : 1);

        const curBudgetTotal = Number(editRecBudgetTotal) || 0;
        const curBudgetSales = Number(editRecBudgetSales) || 1;
        const curBudgetQuota = curBudgetSales > 0 ? curBudgetTotal / curBudgetSales : 0;

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shadow-2xs">
                    <Edit2 className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Editar Cálculo Guardado
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`px-2 py-0.2 rounded-md text-[10px] font-bold ${
                          isCombo
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : isBudget
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {isCombo ? 'Combo / Pack' : isBudget ? 'Presupuesto Personal' : 'Por Unidad'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {editingRecord.createdAt ? editingRecord.createdAt.slice(0, 10) : ''}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <div className="space-y-4">
                
                {/* 1. Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-blue-600" />
                    <span>Título del Registro</span>
                  </label>
                  <input
                    type="text"
                    value={editRecTitle}
                    onChange={(e) => setEditRecTitle(e.target.value)}
                    placeholder="Ej. Polera Oversize - Cotización Verano"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* 2. Values for Unit or Combo */}
                {!isBudget && (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Precio (S/)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editRecSalePrice}
                          onChange={(e) => setEditRecSalePrice(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Costo Prenda (S/)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editRecCostPrice}
                          onChange={(e) => setEditRecCostPrice(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          CPA Anuncio (S/)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editRecCpa}
                          onChange={(e) => setEditRecCpa(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-semibold text-purple-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Envío (S/)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editRecShipping}
                          onChange={(e) => setEditRecShipping(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Empaque / Extra (S/)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editRecPackaging}
                          onChange={(e) => setEditRecPackaging(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Cuota Vida (S/)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editRecPersonalQuota}
                          onChange={(e) => setEditRecPersonalQuota(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-semibold text-emerald-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Live Metric Recap */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Métricas Recalculadas en Vivo
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                        <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                          <span className="text-slate-400 text-[10px] block">Costo Total:</span>
                          <span className="font-bold text-slate-800">S/ {curTotalCost.toFixed(2)}</span>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                          <span className="text-slate-400 text-[10px] block">Ganancia Neta:</span>
                          <span className={`font-bold ${curNetProfit >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                            S/ {curNetProfit.toFixed(2)}
                          </span>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                          <span className="text-slate-400 text-[10px] block">Margen Neto:</span>
                          <span className={`font-bold ${curMargin >= 30 ? 'text-emerald-600' : curMargin >= 15 ? 'text-amber-600' : 'text-rose-600'}`}>
                            {curMargin.toFixed(1)}%
                          </span>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                          <span className="text-slate-400 text-[10px] block">ROAS Mínimo:</span>
                          <span className="font-bold text-amber-600">{curRoas.toFixed(2)}x</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* 2. Values for Personal Budget */}
                {isBudget && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Presupuesto Mensual Total (S/)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editRecBudgetTotal}
                          onChange={(e) => setEditRecBudgetTotal(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Ventas Estimadas (Prendas/mes)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={editRecBudgetSales}
                          onChange={(e) => setEditRecBudgetSales(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-emerald-900 block">
                          Cuota Recalculada por Prenda:
                        </span>
                        <span className="text-[11px] text-emerald-700 font-mono">
                          S/ {curBudgetTotal.toFixed(2)} ÷ {curBudgetSales} prendas
                        </span>
                      </div>
                      <span className="text-lg font-black font-mono text-emerald-800">
                        S/ {curBudgetQuota.toFixed(2)}
                      </span>
                    </div>
                  </>
                )}

                {/* 3. Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>Notas / Observaciones Estratégicas</span>
                  </label>
                  <textarea
                    rows={2}
                    value={editRecNotes}
                    onChange={(e) => setEditRecNotes(e.target.value)}
                    placeholder="Observaciones de precios, CPA proyectado o notas..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                  />
                </div>

              </div>

              {/* Actions Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    handleLoadRecordIntoCalculator(editingRecord);
                    setEditingRecord(null);
                  }}
                  className="w-full sm:w-auto px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Cargar en Calculadora Activa</span>
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setEditingRecord(null)}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={isSavingEdit || !editRecTitle.trim()}
                    onClick={handleSaveEditedPricingRecord}
                    className="flex-1 sm:flex-none px-5 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-md shadow-amber-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSavingEdit ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{isSavingEdit ? 'Guardando...' : 'Guardar Cambios'}</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
};
