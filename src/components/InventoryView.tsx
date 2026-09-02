import React, { useState, useMemo } from 'react';
import { Product, Sale, DailySaleRecord, PricingCalculationRecord, ComboItem } from '../types';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Edit2,
  Trash2,
  Layers,
  Sparkles,
  Filter,
  CheckCircle2,
  Box,
  TrendingUp,
  DollarSign,
  Coins,
  ArrowUpDown,
  Download,
  Copy,
  ChevronDown,
  ChevronUp,
  Info,
  X,
  PlusCircle,
  ExternalLink,
  ShoppingBag,
  Zap,
  BarChart3,
  Check,
  Percent,
  Warehouse,
  History,
  Tag
} from 'lucide-react';
import { EditProductModal } from './EditProductModal';
import { getStoredCategories, registerCategory } from '../lib/storage';

interface InventoryViewProps {
  products: Product[];
  sales?: Sale[];
  dailyRecords?: DailySaleRecord[];
  pricingRecords?: PricingCalculationRecord[];
  onAddProduct: (product: Product) => void;
  onUpdateStock: (productId: string, newStock: number) => void;
  onDeleteProduct: (productId: string) => void;
  onEditProduct?: (updatedProduct: Product) => void;
  onOpenNewProductModal: () => void;
  onOpenNewComboModal?: () => void;
}

type SortField =
  | 'marginPct'
  | 'stock'
  | 'stockAsc'
  | 'inventoryValue'
  | 'salePrice'
  | 'costPrice'
  | 'salesVolume'
  | 'name';

type StockFilter = 'all' | 'healthy' | 'low' | 'out_of_stock';

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  sales = [],
  dailyRecords = [],
  pricingRecords = [],
  onAddProduct,
  onUpdateStock,
  onDeleteProduct,
  onEditProduct,
  onOpenNewProductModal,
  onOpenNewComboModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState<'all' | 'individual' | 'combo'>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<StockFilter>('all');
  const [sortBy, setSortBy] = useState<SortField>('marginPct');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Modals state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [detailedProduct, setDetailedProduct] = useState<Product | null>(null);
  const [quickStockModal, setQuickStockModal] = useState<{ product: Product; addedQty: number; reason: string } | null>(null);
  const [copiedSku, setCopiedSku] = useState<string | null>(null);
  const [directStockInput, setDirectStockInput] = useState<{ id: string; value: string } | null>(null);
  const [expandedCombos, setExpandedCombos] = useState<Record<string, boolean>>({});

  const toggleComboExpanded = (id: string) => {
    setExpandedCombos((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Categories list
  const allKnownCategories = useMemo(() => {
    return Array.from(
      new Set([...getStoredCategories(), ...products.map((p) => p.category).filter(Boolean)])
    );
  }, [products]);

  const categories = ['all', ...allKnownCategories];

  // Calculate sales metrics per product across sales and dailyRecords
  const productSalesMap = useMemo(() => {
    const map: Record<string, { unitsSold: number; revenue: number; ordersCount: number }> = {};

    // 1. From standard Sales items
    sales.forEach((sale) => {
      if (sale.status === 'Cancelada') return;
      sale.items.forEach((item) => {
        const key = item.productId || item.productName.toLowerCase().trim();
        if (!map[key]) {
          map[key] = { unitsSold: 0, revenue: 0, ordersCount: 0 };
        }
        map[key].unitsSold += item.quantity;
        map[key].revenue += item.quantity * item.unitPrice;
        map[key].ordersCount += 1;
      });
    });

    // 2. From WhatsApp daily sales records if matched by product name
    dailyRecords.forEach((dr) => {
      if (!dr.defaultProduct) return;
      const key = dr.defaultProduct.toLowerCase().trim();
      if (!map[key]) {
        map[key] = { unitsSold: 0, revenue: 0, ordersCount: 0 };
      }
      map[key].unitsSold += dr.salesCount || 0;
      map[key].revenue += (dr.salesCount || 0) * (dr.unitPrice || 0);
      map[key].ordersCount += dr.salesCount > 0 ? 1 : 0;
    });

    return map;
  }, [sales, dailyRecords]);

  // Helper to get units sold for a product
  const getProductSales = (prod: Product) => {
    const byId = productSalesMap[prod.id];
    if (byId) return byId;
    const byName = productSalesMap[prod.name.toLowerCase().trim()];
    if (byName) return byName;
    return { unitsSold: 0, revenue: 0, ordersCount: 0 };
  };

  // Global Inventory KPIs
  const totalProducts = products.length;
  const totalCombos = products.filter((p) => p.type === 'combo').length;
  const totalIndividuals = products.filter((p) => p.type !== 'combo').length;

  const totalStockUnits = products.reduce((acc, p) => acc + (p.stock || 0), 0);
  const totalInventoryCostValue = products.reduce((acc, p) => acc + (p.stock || 0) * (p.costPrice || 0), 0);
  const totalInventorySaleValue = products.reduce((acc, p) => acc + (p.stock || 0) * (p.salePrice || 0), 0);
  const totalProjectedGrossProfit = totalInventorySaleValue - totalInventoryCostValue;
  const avgMarginPct = totalInventorySaleValue > 0 ? (totalProjectedGrossProfit / totalInventorySaleValue) * 100 : 0;

  const lowStockCount = products.filter((p) => (p.stock || 0) > 0 && (p.stock || 0) <= (p.minStock || 0)).length;
  const outOfStockCount = products.filter((p) => (p.stock || 0) <= 0).length;
  const healthyStockCount = products.filter((p) => (p.stock || 0) > (p.minStock || 0)).length;

  // Filtered and Sorted Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const isCombo = p.type === 'combo';
      const matchesType =
        selectedType === 'all' ||
        (selectedType === 'combo' && isCombo) ||
        (selectedType === 'individual' && !isCombo);

      const comboItemsText = p.comboItems ? p.comboItems.map((ci) => ci.productName).join(' ') : '';
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.notes && p.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        comboItemsText.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;

      const stockVal = p.stock || 0;
      const minStockVal = p.minStock || 0;
      const matchesStockStatus =
        stockStatusFilter === 'all' ||
        (stockStatusFilter === 'healthy' && stockVal > minStockVal) ||
        (stockStatusFilter === 'low' && stockVal > 0 && stockVal <= minStockVal) ||
        (stockStatusFilter === 'out_of_stock' && stockVal <= 0);

      return matchesSearch && matchesCategory && matchesType && matchesStockStatus;
    });
  }, [products, searchTerm, selectedCategory, selectedType, stockStatusFilter]);

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      const aSales = getProductSales(a);
      const bSales = getProductSales(b);

      const aMargin = a.salePrice > 0 ? ((a.salePrice - a.costPrice) / a.salePrice) * 100 : 0;
      const bMargin = b.salePrice > 0 ? ((b.salePrice - b.costPrice) / b.salePrice) * 100 : 0;

      const aVal = (a.stock || 0) * (a.salePrice || 0);
      const bVal = (b.stock || 0) * (b.salePrice || 0);

      let diff = 0;
      switch (sortBy) {
        case 'marginPct':
          diff = bMargin - aMargin;
          break;
        case 'stock':
          diff = (b.stock || 0) - (a.stock || 0);
          break;
        case 'stockAsc':
          diff = (a.stock || 0) - (b.stock || 0);
          break;
        case 'inventoryValue':
          diff = bVal - aVal;
          break;
        case 'salePrice':
          diff = (b.salePrice || 0) - (a.salePrice || 0);
          break;
        case 'costPrice':
          diff = (b.costPrice || 0) - (a.costPrice || 0);
          break;
        case 'salesVolume':
          diff = bSales.unitsSold - aSales.unitsSold;
          break;
        case 'name':
          diff = a.name.localeCompare(b.name);
          break;
        default:
          diff = 0;
      }

      return sortDirection === 'asc' ? -diff : diff;
    });
  }, [filteredProducts, sortBy, sortDirection, productSalesMap]);

  // Copy SKU handler
  const handleCopySku = (sku: string) => {
    navigator.clipboard.writeText(sku);
    setCopiedSku(sku);
    setTimeout(() => setCopiedSku(null), 2000);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (products.length === 0) return;

    const headers = [
      'SKU',
      'Tipo',
      'Nombre del Producto',
      'Categoría',
      'Costo Unitario (S/)',
      'Precio Venta (S/)',
      'Margen Unitario (S/)',
      'Margen %',
      'Stock Actual',
      'Stock Mínimo',
      'Estado Stock',
      'Costo Total en Stock (S/)',
      'Venta Potencial en Stock (S/)',
      'Ganancia Proyectada Stock (S/)',
      'Unidades Vendidas',
      'Ingresos Históricos (S/)',
      'Notas'
    ];

    const rows = products.map((p) => {
      const isCombo = p.type === 'combo';
      const profitUnit = (p.salePrice || 0) - (p.costPrice || 0);
      const marginPct = p.salePrice > 0 ? (profitUnit / p.salePrice) * 100 : 0;
      const invCost = (p.stock || 0) * (p.costPrice || 0);
      const invSale = (p.stock || 0) * (p.salePrice || 0);
      const invProfit = invSale - invCost;
      const salesData = getProductSales(p);

      let status = 'Saludable';
      if (p.stock <= 0) status = 'Agotado';
      else if (p.stock <= p.minStock) status = 'Stock Bajo';

      return [
        `"${p.sku}"`,
        `"${isCombo ? 'Combo / Pack' : 'Individual'}"`,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.category || 'General'}"`,
        (p.costPrice || 0).toFixed(2),
        (p.salePrice || 0).toFixed(2),
        profitUnit.toFixed(2),
        `${marginPct.toFixed(1)}%`,
        p.stock || 0,
        p.minStock || 0,
        `"${status}"`,
        invCost.toFixed(2),
        invSale.toFixed(2),
        invProfit.toFixed(2),
        salesData.unitsSold,
        salesData.revenue.toFixed(2),
        `"${(p.notes || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Inventario_DRAYO_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Seed streetwear sample products if user wants starter demo data
  const handleSeedStreetwearCatalog = () => {
    const starterProducts: Product[] = [
      {
        id: `p-${Date.now()}-1`,
        sku: 'DRY-OVR-01',
        name: 'Polera Oversize Heavyweight Acid Wash',
        category: 'Camisetas Oversize',
        costPrice: 28.5,
        salePrice: 69.9,
        stock: 35,
        minStock: 8,
        notes: 'Algodón reactivo 24/1 pesado 240g, estampado en serigrafía tacto cero',
      },
      {
        id: `p-${Date.now()}-2`,
        sku: 'DRY-HOD-02',
        name: 'Hoodie Boxy Fit French Terry 400g',
        category: 'Hoodies & Polerones',
        costPrice: 48.0,
        salePrice: 129.9,
        stock: 22,
        minStock: 5,
        notes: 'Franela reactiva 100% algodón, capucha doble tela y bolsillo canguro reforzado',
      },
      {
        id: `p-${Date.now()}-3`,
        sku: 'DRY-CRG-03',
        name: 'Pantalón Cargo Streetwear Ripstop',
        category: 'Pantalones & Joggers',
        costPrice: 38.0,
        salePrice: 99.0,
        stock: 18,
        minStock: 6,
        notes: 'Tela drill táctico antidesgarro con 6 bolsillos utilitarios y pretina elasticada',
      },
      {
        id: `p-${Date.now()}-4`,
        sku: 'DRY-CAP-04',
        name: 'Gorra Trucker Vintage Bordada D\'RAYO',
        category: 'Gorras & Accesorios',
        costPrice: 16.0,
        salePrice: 45.0,
        stock: 40,
        minStock: 10,
        notes: 'Malla trasera premium con broche ajustable y bordado de alto relieve frontal',
      },
      {
        id: `p-${Date.now()}-5`,
        sku: 'DRY-CMB-01',
        name: 'Pack D\'RAYO: 2 Poleras Oversize + Gorra Vintage',
        category: 'Edición Limitada',
        type: 'combo',
        costPrice: 73.0,
        salePrice: 159.9,
        stock: 15,
        minStock: 3,
        comboItems: [
          { productName: 'Polera Oversize Acid Wash', quantity: 2, unitCost: 28.5 },
          { productName: 'Gorra Trucker Vintage', quantity: 1, unitCost: 16.0 }
        ],
        notes: 'Combo estrella de campaña publicitaria Meta Ads con alta conversión',
      }
    ];

    starterProducts.forEach((p) => onAddProduct(p));
  };

  // Duplicate a product
  const handleDuplicateProduct = (prod: Product) => {
    const duplicated: Product = {
      ...prod,
      id: `p-${Date.now()}`,
      sku: `${prod.sku}-CPY`,
      name: `${prod.name} (Copia)`,
      stock: 0,
    };
    onAddProduct(duplicated);
  };

  // Handle Quick Batch Stock Inflow
  const handleApplyQuickStock = () => {
    if (!quickStockModal) return;
    const current = quickStockModal.product.stock || 0;
    const added = quickStockModal.addedQty || 0;
    onUpdateStock(quickStockModal.product.id, Math.max(0, current + added));
    setQuickStockModal(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Bar & Action Triggers */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Warehouse className="w-5 h-5 text-blue-600" />
              <span>Inventario y Catálogo de Productos</span>
            </h2>
            <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-0.5 rounded-full font-bold border border-blue-200">
              {totalProducts} SKUs Registrados
            </span>
            <span className="bg-purple-50 text-purple-700 text-xs px-2.5 py-0.5 rounded-full font-bold border border-purple-200 flex items-center gap-1">
              <Layers className="w-3 h-3" />
              <span>{totalCombos} Combos</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Control integral de costos de producción, precios sugeridos, stock físico en taller, márgenes y rotación de ventas.
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCSV}
            title="Descargar reporte detallado en archivo CSV compatible con Excel"
            className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3.5 py-2.5 rounded-xl transition-all active:scale-95 text-xs sm:text-sm border border-slate-200 cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Exportar</span> Excel / CSV
          </button>

          <button
            onClick={onOpenNewProductModal}
            className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs shadow-blue-600/20 active:scale-95 text-xs sm:text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nuevo Producto</span>
          </button>

          {onOpenNewComboModal && (
            <button
              onClick={onOpenNewComboModal}
              className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs shadow-purple-600/20 active:scale-95 text-xs sm:text-sm cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>Nuevo Combo / Pack</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Executive Intelligence Inventory KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Total Stock Units */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Prendas en Stock
            </span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
              <Box className="w-4 h-4" />
            </div>
          </div>
          <h3 style={{ fontSize: '29px', lineHeight: '1.2' }} className="font-black text-slate-900 font-mono mt-1 tracking-tight">
            {totalStockUnits.toLocaleString()} <span className="text-sm font-sans font-medium text-slate-500">piezas</span>
          </h3>
          <p className="text-[10.5px] text-slate-500 mt-1">
            Distribuidas en {totalProducts} modelos
          </p>
        </div>

        {/* Capital Invertido (Costo Almacén) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Capital en Almacén
            </span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <h3 style={{ fontSize: '29px', lineHeight: '1.2' }} className="font-black text-slate-900 font-mono mt-1 tracking-tight">
            S/ {totalInventoryCostValue.toFixed(2)}
          </h3>
          <p className="text-[10.5px] text-amber-700 font-medium mt-1">
            Costo total de confección
          </p>
        </div>

        {/* Valor de Venta Potencial */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Valor Comercial PVP
            </span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <h3 style={{ fontSize: '29px', lineHeight: '1.2' }} className="font-black text-emerald-600 font-mono mt-1 tracking-tight">
            S/ {totalInventorySaleValue.toFixed(2)}
          </h3>
          <p className="text-[10.5px] text-emerald-700 font-medium mt-1">
            Ingreso proyectado total
          </p>
        </div>

        {/* Ganancia Neta Proyectada del Stock */}
        <div className="bg-white p-4 rounded-2xl border border-teal-200 bg-linear-to-b from-teal-50/30 to-white shadow-2xs">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">
              Ganancia Proyectada
            </span>
            <div className="p-1.5 bg-teal-50 text-teal-700 rounded-lg border border-teal-200">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h3 style={{ fontSize: '29px', lineHeight: '1.2' }} className="font-black text-teal-700 font-mono mt-1 tracking-tight">
            S/ {totalProjectedGrossProfit.toFixed(2)}
          </h3>
          <p className="text-[10.5px] text-teal-700 font-bold mt-1">
            Margen promedio: {avgMarginPct.toFixed(1)}%
          </p>
        </div>

        {/* Alertas de Stock Saludables / Bajos */}
        <div className="col-span-2 sm:col-span-1 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Salud de Stock
            </span>
            <div className="p-1.5 bg-slate-100 text-slate-600 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span
              onClick={() => setStockStatusFilter(stockStatusFilter === 'healthy' ? 'all' : 'healthy')}
              className={`text-[10.5px] px-2 py-0.5 rounded-full font-bold cursor-pointer transition-all ${
                stockStatusFilter === 'healthy'
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
              }`}
              title="Filtrar stock saludable"
            >
              🟢 {healthyStockCount} OK
            </span>

            {lowStockCount > 0 && (
              <span
                onClick={() => setStockStatusFilter(stockStatusFilter === 'low' ? 'all' : 'low')}
                className={`text-[10.5px] px-2 py-0.5 rounded-full font-bold cursor-pointer transition-all ${
                  stockStatusFilter === 'low'
                    ? 'bg-amber-600 text-white ring-2 ring-amber-300'
                    : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 animate-pulse'
                }`}
                title="Filtrar stock bajo"
              >
                ⚠️ {lowStockCount} Bajos
              </span>
            )}

            {outOfStockCount > 0 && (
              <span
                onClick={() => setStockStatusFilter(stockStatusFilter === 'out_of_stock' ? 'all' : 'out_of_stock')}
                className={`text-[10.5px] px-2 py-0.5 rounded-full font-bold cursor-pointer transition-all ${
                  stockStatusFilter === 'out_of_stock'
                    ? 'bg-rose-600 text-white ring-2 ring-rose-300'
                    : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                }`}
                title="Filtrar agotados"
              >
                🔴 {outOfStockCount} Agotados
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Low Stock Alert Banner */}
      {lowStockCount > 0 && stockStatusFilter !== 'low' && (
        <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 text-amber-900 flex items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <strong className="font-bold block text-amber-950">
                ¡Atención! Tienes {lowStockCount} productos con stock en nivel crítico o por agotarse
              </strong>
              <span className="text-amber-800">
                Revisa el punto de reposición con tu taller o confeccionistas para evitar quiebres de stock en tus campañas de anuncios.
              </span>
            </div>
          </div>
          <button
            onClick={() => setStockStatusFilter('low')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shrink-0 transition-colors shadow-2xs cursor-pointer"
          >
            Ver Productos Afectados
          </button>
        </div>
      )}

      {/* 4. Controls, Filters & Sorting Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3.5">
        {/* Top filter row: Type tabs + Search bar + Category */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Type Segments */}
          <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/70 self-start">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedType === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({products.length})
            </button>
            <button
              onClick={() => setSelectedType('individual')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedType === 'individual'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>Individuales ({totalIndividuals})</span>
            </button>
            <button
              onClick={() => setSelectedType('combo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedType === 'combo'
                  ? 'bg-white text-purple-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              <span>Combos / Packs ({totalCombos})</span>
            </button>
          </div>

          {/* Search, Category & Sorting */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 lg:justify-end">
            {/* Search Input */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por SKU, prenda o combo..."
                className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-slate-900 pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition-colors shadow-2xs"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category dropdown */}
            <div className="relative w-full sm:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-slate-900 px-3 py-2 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition-colors cursor-pointer shadow-2xs"
              >
                <option value="all">Todas las Categorías</option>
                {categories
                  .filter((c) => c !== 'all')
                  .map((cat) => (
                    <option key={cat} value={cat}>
                      {cat} ({products.filter((p) => p.category === cat).length})
                    </option>
                  ))}
              </select>
            </div>

            {/* Sorter dropdown */}
            <div className="relative w-full sm:w-52">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortField)}
                className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-slate-900 px-3 py-2 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition-colors cursor-pointer shadow-2xs"
              >
                <option value="marginPct">📊 Mayor Margen (%)</option>
                <option value="inventoryValue">💰 Mayor Valor en Stock (S/)</option>
                <option value="stock">📦 Mayor Stock Disponible</option>
                <option value="stockAsc">⚠️ Menor Stock (Crítico)</option>
                <option value="salePrice">🏷️ Mayor Precio Venta</option>
                <option value="costPrice">🧵 Mayor Costo Fabricación</option>
                <option value="salesVolume">🚀 Más Vendidos (Rotación)</option>
                <option value="name">🔤 Nombre (A-Z)</option>
              </select>
            </div>

            {/* Sort direction toggle */}
            <button
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              title={sortDirection === 'asc' ? 'Orden Ascendente' : 'Orden Descendente'}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-colors shrink-0 cursor-pointer flex items-center justify-center"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Active Filters Pill Bar */}
        {(stockStatusFilter !== 'all' || selectedCategory !== 'all' || selectedType !== 'all' || searchTerm) && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 flex-wrap text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filtros activos:
            </span>

            {stockStatusFilter !== 'all' && (
              <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 border border-slate-200">
                <span>Estado: {stockStatusFilter === 'healthy' ? 'Saludable' : stockStatusFilter === 'low' ? 'Stock Bajo' : 'Agotado'}</span>
                <button onClick={() => setStockStatusFilter('all')} className="hover:text-rose-600">×</button>
              </span>
            )}

            {selectedCategory !== 'all' && (
              <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 border border-slate-200">
                <span>Categoría: {selectedCategory}</span>
                <button onClick={() => setSelectedCategory('all')} className="hover:text-rose-600">×</button>
              </span>
            )}

            {selectedType !== 'all' && (
              <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 border border-slate-200">
                <span>Tipo: {selectedType === 'combo' ? 'Combos' : 'Individuales'}</span>
                <button onClick={() => setSelectedType('all')} className="hover:text-rose-600">×</button>
              </span>
            )}

            {searchTerm && (
              <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 border border-slate-200">
                <span>Búsqueda: "{searchTerm}"</span>
                <button onClick={() => setSearchTerm('')} className="hover:text-rose-600">×</button>
              </span>
            )}

            <button
              onClick={() => {
                setStockStatusFilter('all');
                setSelectedCategory('all');
                setSelectedType('all');
                setSearchTerm('');
              }}
              className="text-blue-600 hover:text-blue-800 font-bold ml-auto cursor-pointer"
            >
              Limpiar todos los filtros
            </button>
          </div>
        )}
      </div>

      {/* 5. Comprehensive Pro Products Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/90 text-slate-500 uppercase font-bold text-[11px] border-b border-slate-200 select-none">
              <tr>
                <th className="py-3.5 px-4">Prenda / Modelo / SKU</th>
                <th className="py-3.5 px-4">Categoría</th>
                <th className="py-3.5 px-4 text-right">Costo Unitario</th>
                <th className="py-3.5 px-4 text-right">Precio Venta (PVP)</th>
                <th className="py-3.5 px-4 text-right">Margen Bruto</th>
                <th className="py-3.5 px-4 text-center">Stock en Almacén</th>
                <th className="py-3.5 px-4 text-right">Valor en Stock</th>
                <th className="py-3.5 px-4 text-center">Ventas / Rotación</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedProducts.length > 0 ? (
                sortedProducts.map((prod) => {
                  const isCombo = prod.type === 'combo';
                  const cost = prod.costPrice || 0;
                  const price = prod.salePrice || 0;
                  const profitUnit = price - cost;
                  const marginPct = price > 0 ? (profitUnit / price) * 100 : 0;
                  const stockVal = prod.stock || 0;
                  const minStockVal = prod.minStock || 0;
                  const isLowStock = stockVal > 0 && stockVal <= minStockVal;
                  const isOutOfStock = stockVal <= 0;

                  const totalCostInStock = stockVal * cost;
                  const totalSaleInStock = stockVal * price;
                  const totalProfitInStock = totalSaleInStock - totalCostInStock;

                  const salesData = getProductSales(prod);

                  return (
                    <tr
                      key={prod.id}
                      className={`transition-colors group ${
                        isOutOfStock
                          ? 'bg-rose-50/20 hover:bg-rose-50/40'
                          : isCombo
                          ? 'bg-purple-50/15 hover:bg-purple-50/30'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* 1. Prenda / SKU / Tipo */}
                      <td className="py-3.5 px-4 min-w-[220px]">
                        <div className="flex items-center gap-2 mb-1">
                          <button
                            onClick={() => handleCopySku(prod.sku)}
                            title="Haz clic para copiar SKU"
                            className="font-mono text-[10px] text-slate-500 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-1.5 py-0.5 rounded font-bold transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <span>{prod.sku}</span>
                            {copiedSku === prod.sku ? (
                              <Check className="w-2.5 h-2.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-2.5 h-2.5 opacity-60" />
                            )}
                          </button>

                          {isCombo ? (
                            <span className="bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-md text-[10px] flex items-center gap-1 border border-purple-200">
                              <Layers className="w-2.5 h-2.5" />
                              <span>Combo Pack</span>
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-600 font-semibold px-1.5 py-0.5 rounded text-[10px]">
                              Individual
                            </span>
                          )}
                        </div>

                        <div className="flex items-start gap-2">
                          <p
                            onClick={() => setDetailedProduct(prod)}
                            className="font-bold text-slate-900 text-xs sm:text-sm hover:text-blue-600 cursor-pointer transition-colors leading-snug"
                          >
                            {prod.name}
                          </p>
                        </div>

                        {/* If Combo: Show collapsible included items */}
                        {isCombo && prod.comboItems && prod.comboItems.length > 0 && (
                          <div className="mt-1.5">
                            <button
                              type="button"
                              onClick={() => toggleComboExpanded(prod.id)}
                              className="flex items-center gap-1 text-[10px] font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100/80 px-2 py-0.5 rounded-md border border-purple-200 transition-colors cursor-pointer"
                            >
                              <Layers className="w-2.5 h-2.5" />
                              <span>
                                {expandedCombos[prod.id] ? 'Ocultar prendas' : `Ver ${prod.comboItems.length} prendas del pack`}
                              </span>
                              {expandedCombos[prod.id] ? (
                                <ChevronUp className="w-3 h-3 ml-0.5" />
                              ) : (
                                <ChevronDown className="w-3 h-3 ml-0.5" />
                              )}
                            </button>

                            {expandedCombos[prod.id] && (
                              <div className="mt-1.5 p-2 bg-purple-50/50 border border-purple-200 rounded-lg flex flex-col gap-1 shadow-2xs">
                                <span className="text-[9.5px] font-bold text-purple-900 uppercase tracking-wider">
                                  Prendas incluidas en este combo:
                                </span>
                                <div className="flex flex-wrap items-center gap-1">
                                  {prod.comboItems.map((ci, idx) => (
                                    <span
                                      key={idx}
                                      className="bg-white border border-purple-200 text-purple-900 text-[10px] px-2 py-0.5 rounded-md font-medium shadow-2xs flex items-center gap-1"
                                    >
                                      <span className="font-bold text-purple-700 bg-purple-100 px-1 rounded text-[9px]">
                                        {ci.quantity}x
                                      </span>
                                      <span>{ci.productName}</span>
                                      {ci.unitCost ? (
                                        <span className="text-[9px] text-slate-400 font-mono">
                                          (S/ {ci.unitCost.toFixed(2)})
                                        </span>
                                      ) : null}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {prod.notes && (
                          <p className="text-[10px] text-slate-400 truncate max-w-xs mt-0.5 italic">
                            {prod.notes}
                          </p>
                        )}
                      </td>

                      {/* 2. Categoría */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                            isCombo
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {prod.category || 'General'}
                        </span>
                      </td>

                      {/* 3. Costo Unitario */}
                      <td className="py-3.5 px-4 text-right font-mono whitespace-nowrap">
                        <span className="font-semibold text-slate-700">
                          S/ {cost.toFixed(2)}
                        </span>
                        {isCombo && (
                          <span className="text-[9px] text-slate-400 block font-sans">
                            (costo total prendas)
                          </span>
                        )}
                      </td>

                      {/* 4. Precio Venta */}
                      <td className="py-3.5 px-4 text-right font-mono whitespace-nowrap">
                        <span className="font-bold text-emerald-600 text-xs sm:text-sm">
                          S/ {price.toFixed(2)}
                        </span>
                        {isCombo && (
                          <span className="text-[9px] text-emerald-700 block font-sans font-medium">
                            PVP combo
                          </span>
                        )}
                      </td>

                      {/* 5. Margen Bruto */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="font-bold text-teal-700 block font-mono">
                          +S/ {profitUnit.toFixed(2)}
                        </span>
                        <div className="flex items-center justify-end gap-1.5 mt-0.5">
                          <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                marginPct >= 50
                                  ? 'bg-emerald-500'
                                  : marginPct >= 30
                                  ? 'bg-blue-500'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(5, marginPct))}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono font-bold">
                            {marginPct.toFixed(1)}%
                          </span>
                        </div>
                      </td>

                      {/* 6. Stock con Steppers interactivos & Edición Rápida */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onUpdateStock(prod.id, Math.max(0, stockVal - 1))}
                            className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors cursor-pointer border border-slate-200"
                            title="Restar 1 de stock"
                          >
                            -
                          </button>

                          {directStockInput?.id === prod.id ? (
                            <input
                              type="number"
                              autoFocus
                              value={directStockInput.value}
                              onChange={(e) => setDirectStockInput({ id: prod.id, value: e.target.value })}
                              onBlur={() => {
                                const val = parseInt(directStockInput.value, 10);
                                if (!isNaN(val) && val >= 0) {
                                  onUpdateStock(prod.id, val);
                                }
                                setDirectStockInput(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const val = parseInt(directStockInput.value, 10);
                                  if (!isNaN(val) && val >= 0) {
                                    onUpdateStock(prod.id, val);
                                  }
                                  setDirectStockInput(null);
                                } else if (e.key === 'Escape') {
                                  setDirectStockInput(null);
                                }
                              }}
                              className="w-16 text-center font-mono font-bold text-xs py-0.5 px-1 bg-white border-2 border-blue-500 rounded-lg shadow-inner outline-none"
                            />
                          ) : (
                            <span
                              onClick={() => setDirectStockInput({ id: prod.id, value: String(stockVal) })}
                              title="Haz clic para escribir la cantidad exacta de stock"
                              className={`font-mono font-bold text-xs px-2.5 py-1 rounded-full border cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all ${
                                isOutOfStock
                                  ? 'bg-rose-50 text-rose-700 border-rose-200 font-black'
                                  : isLowStock
                                  ? 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse font-extrabold'
                                  : isCombo
                                  ? 'bg-purple-50 text-purple-900 border-purple-200'
                                  : 'bg-slate-50 text-slate-800 border-slate-200'
                              }`}
                            >
                              {stockVal} {isCombo ? 'packs' : 'un.'}
                            </span>
                          )}

                          <button
                            onClick={() => onUpdateStock(prod.id, stockVal + 1)}
                            className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors cursor-pointer border border-slate-200"
                            title="Sumar 1 de stock"
                          >
                            +
                          </button>
                        </div>

                        {/* Stock health label */}
                        <div className="mt-1">
                          {isOutOfStock ? (
                            <span className="text-[9px] font-black text-rose-600 uppercase tracking-tight">
                              🔴 Agotado
                            </span>
                          ) : isLowStock ? (
                            <span className="text-[9px] font-bold text-amber-700">
                              ⚠️ Mín: {minStockVal}
                            </span>
                          ) : (
                            <span className="text-[9px] text-slate-400">
                              Mín: {minStockVal}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 7. Valoración en Stock */}
                      <td className="py-3.5 px-4 text-right font-mono whitespace-nowrap">
                        <div className="text-slate-900 font-bold text-xs">
                          S/ {totalSaleInStock.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Costo: S/ {totalCostInStock.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-teal-700 font-semibold">
                          Ganancia: +S/ {totalProfitInStock.toFixed(2)}
                        </div>
                      </td>

                      {/* 8. Ventas / Rotación */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="font-mono font-bold text-xs text-slate-800">
                          {salesData.unitsSold} <span className="font-sans font-normal text-[10px] text-slate-500">vendidas</span>
                        </div>
                        <div className="text-[10px] text-emerald-700 font-mono font-semibold">
                          S/ {salesData.revenue.toFixed(2)}
                        </div>
                      </td>

                      {/* 9. Acciones Rápidas */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {/* Ver Ficha Técnica */}
                          <button
                            onClick={() => setDetailedProduct(prod)}
                            title="Ver ficha técnica completa del producto"
                            className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                          >
                            <BarChart3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Entrada rápida de lote */}
                          <button
                            onClick={() => setQuickStockModal({ product: prod, addedQty: 10, reason: 'Ingreso de producción / taller' })}
                            title="Entrada rápida de lote (+10, +20, etc.)"
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                          </button>

                          {/* Editar */}
                          <button
                            onClick={() => setEditingProduct(prod)}
                            title={isCombo ? 'Editar Combo' : 'Editar producto'}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              isCombo
                                ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
                                : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200'
                            }`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Duplicar */}
                          <button
                            onClick={() => handleDuplicateProduct(prod)}
                            title="Duplicar como nuevo producto"
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Eliminar */}
                          <button
                            onClick={() => {
                              if (window.confirm(`¿Estás seguro de eliminar "${prod.name}" del catálogo?`)) {
                                onDeleteProduct(prod.id);
                              }
                            }}
                            title="Eliminar producto"
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 px-4 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
                        <Package className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">
                        {products.length === 0
                          ? 'Aún no tienes productos registrados en el inventario'
                          : 'No se encontraron productos con los filtros seleccionados'}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {products.length === 0
                          ? 'Comienza creando tus primeras prendas o carga el catálogo de muestra D\'RAYO con poleras oversize, hoodies y combos listos para usar.'
                          : 'Intenta cambiar los términos de búsqueda o restablecer los filtros de categoría y estado.'}
                      </p>

                      <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
                        {products.length === 0 ? (
                          <>
                            <button
                              onClick={onOpenNewProductModal}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
                            >
                              + Registrar Producto
                            </button>
                            <button
                              onClick={handleSeedStreetwearCatalog}
                              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Cargar Catálogo D'RAYO Demo</span>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              setSearchTerm('');
                              setSelectedCategory('all');
                              setSelectedType('all');
                              setStockStatusFilter('all');
                            }}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                          >
                            Restablecer todos los filtros
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Stats */}
        {sortedProducts.length > 0 && (
          <div className="bg-slate-50/80 px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
            <div>
              Mostrando <strong className="text-slate-900">{sortedProducts.length}</strong> de <strong className="text-slate-900">{products.length}</strong> productos
            </div>
            <div className="flex items-center gap-4 font-mono">
              <span>Stock Total Filtrado: <strong className="text-slate-900">{sortedProducts.reduce((acc, p) => acc + (p.stock || 0), 0)} unds</strong></span>
              <span>Valor Venta: <strong className="text-emerald-700">S/ {sortedProducts.reduce((acc, p) => acc + (p.stock || 0) * (p.salePrice || 0), 0).toFixed(2)}</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* 6. Modal de Ficha Técnica / Radiografía del Producto */}
      {detailedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full max-h-[92dvh] flex flex-col shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-5 shrink-0 bg-slate-50/70 rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl ${
                  detailedProduct.type === 'combo' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {detailedProduct.type === 'combo' ? <Layers className="w-5 h-5" /> : <Box className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {detailedProduct.sku}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-600">
                      {detailedProduct.category}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 mt-0.5">
                    {detailedProduct.name}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setDetailedProduct(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Financial Breakdown Card */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2.5">
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Economía por Prenda (Unitario)</span>
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center font-mono pt-1">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-500 font-sans block">Costo Prenda</span>
                    <span className="text-sm font-bold text-slate-700">S/ {(detailedProduct.costPrice || 0).toFixed(2)}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-500 font-sans block">Precio Venta (PVP)</span>
                    <span className="text-sm font-bold text-emerald-600">S/ {(detailedProduct.salePrice || 0).toFixed(2)}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-teal-200 shadow-2xs bg-teal-50/30">
                    <span className="text-[10px] text-teal-800 font-sans block">Margen Bruto</span>
                    <span className="text-sm font-bold text-teal-700">
                      +S/ {((detailedProduct.salePrice || 0) - (detailedProduct.costPrice || 0)).toFixed(2)}
                    </span>
                    <span className="text-[9.5px] text-teal-800 font-sans block">
                      ({detailedProduct.salePrice > 0 ? ((((detailedProduct.salePrice - detailedProduct.costPrice) / detailedProduct.salePrice) * 100).toFixed(1)) : 0}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Stock in Warehouse & Batch Value */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                  <Warehouse className="w-3.5 h-3.5 text-blue-600" />
                  <span>Valoración del Lote Actual en Almacén</span>
                </h4>
                <div className="grid grid-cols-3 gap-2 font-mono text-center">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-sans block">Stock Disponible</span>
                    <span className="text-base font-black text-slate-900">{detailedProduct.stock || 0} unds</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-sans block">Capital Invertido</span>
                    <span className="text-sm font-bold text-slate-800">S/ {((detailedProduct.stock || 0) * (detailedProduct.costPrice || 0)).toFixed(2)}</span>
                  </div>
                  <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-200">
                    <span className="text-[10px] text-emerald-800 font-sans block">Venta Potencial</span>
                    <span className="text-sm font-bold text-emerald-700">S/ {((detailedProduct.stock || 0) * (detailedProduct.salePrice || 0)).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Sales Performance */}
              {(() => {
                const s = getProductSales(detailedProduct);
                return (
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
                    <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                      <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                      <span>Rendimiento Histórico de Ventas</span>
                    </h4>
                    <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Unidades Vendidas Registradas:</span>
                        <span className="text-base font-black text-slate-900 font-mono">{s.unitsSold} prendas</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 block text-[11px]">Ingreso Total Generado:</span>
                        <span className="text-base font-black text-emerald-600 font-mono">S/ {s.revenue.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Combo Items if combo */}
              {detailedProduct.type === 'combo' && detailedProduct.comboItems && (
                <div className="bg-purple-50/60 border border-purple-200 rounded-2xl p-4 space-y-2">
                  <h4 className="font-bold text-purple-900 text-xs flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-700" />
                    <span>Prendas que componen este Pack / Combo:</span>
                  </h4>
                  <div className="space-y-1 font-mono">
                    {detailedProduct.comboItems.map((ci, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white p-2 rounded-lg border border-purple-200">
                        <span className="text-purple-950 font-sans font-medium">{ci.quantity}x {ci.productName}</span>
                        <span className="text-slate-500 text-[11px]">Costo: S/ {(ci.unitCost || 0).toFixed(2)} c/u</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {detailedProduct.notes && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-700 block text-[11px] mb-0.5">Notas / Ficha Técnica:</span>
                  <p className="text-slate-600 leading-relaxed text-[11.5px]">{detailedProduct.notes}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/70 rounded-b-3xl shrink-0">
              <button
                onClick={() => {
                  setEditingProduct(detailedProduct);
                  setDetailedProduct(null);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors cursor-pointer text-xs flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Editar Prenda</span>
              </button>
              <button
                onClick={() => setDetailedProduct(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-colors cursor-pointer text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal de Entrada Rápida de Lote (Añadir Stock) */}
      {quickStockModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-5 shrink-0 bg-emerald-50/60 rounded-t-3xl">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-600" />
                <span>Entrada de Lote de Producción</span>
              </h3>
              <button
                onClick={() => setQuickStockModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10.5px] text-slate-500 block font-mono">{quickStockModal.product.sku}</span>
                <strong className="text-sm text-slate-900 block font-bold">{quickStockModal.product.name}</strong>
                <span className="text-[11px] text-slate-600 block mt-0.5">
                  Stock actual en taller: <strong className="font-mono text-slate-900">{quickStockModal.product.stock || 0} unidades</strong>
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  Cantidad de prendas a ingresar al stock (+):
                </label>
                <input
                  type="number"
                  min="1"
                  value={quickStockModal.addedQty}
                  onChange={(e) => setQuickStockModal({ ...quickStockModal, addedQty: parseInt(e.target.value, 10) || 0 })}
                  className="w-full bg-white border border-slate-300 text-slate-900 px-3 py-2 rounded-xl text-sm font-mono font-bold focus:outline-none focus:border-emerald-500 shadow-inner"
                />

                {/* Quick Add Buttons */}
                <div className="flex items-center gap-2 mt-2">
                  {[10, 20, 50, 100].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setQuickStockModal({ ...quickStockModal, addedQty: qty })}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 rounded-lg font-mono text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      +{qty}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-900 font-mono text-xs flex justify-between items-center">
                <span>Nuevo Stock Resultante:</span>
                <strong className="text-sm text-emerald-800">
                  {(quickStockModal.product.stock || 0) + (quickStockModal.addedQty || 0)} unidades
                </strong>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50 rounded-b-3xl">
              <button
                type="button"
                onClick={() => setQuickStockModal(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApplyQuickStock}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
              >
                Confirmar Ingreso al Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Modal de Edición de Producto / Combo */}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          products={products}
          existingCategories={allKnownCategories}
          onClose={() => setEditingProduct(null)}
          onSaveProduct={(updated) => {
            if (onEditProduct) {
              onEditProduct(updated);
            }
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
};
