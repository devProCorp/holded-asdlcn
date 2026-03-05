import { useState, useMemo } from 'react';
import { useDocuments, useExpensesAccounts } from '../hooks/useHolded';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { formatCurrency, formatDate } from '../utils/format';
import {
  Target, AlertTriangle, CheckCircle, Calendar, Save, RotateCcw,
  ChevronDown, ChevronRight, TrendingDown, TrendingUp, Pencil, X,
  Sparkles, ArrowDownRight, ArrowUpRight, Gauge,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, Cell, LabelList, PieChart, Pie,
} from 'recharts';

const CATEGORY_MAP = {
  '600': { name: 'Compras mercaderias', icon: '🥩' },
  '601': { name: 'Materias primas', icon: '📦' },
  '602': { name: 'Otros aprovisionamientos', icon: '📦' },
  '608': { name: 'Devoluciones compras', icon: '↩️' },
  '621': { name: 'Alquileres y renting', icon: '🏢' },
  '622': { name: 'Reparaciones', icon: '🔧' },
  '623': { name: 'Servicios profesionales', icon: '👔' },
  '624': { name: 'Transportes', icon: '🚛' },
  '625': { name: 'Seguros', icon: '🛡️' },
  '626': { name: 'Servicios bancarios', icon: '🏦' },
  '627': { name: 'Publicidad y marketing', icon: '📢' },
  '628': { name: 'Suministros', icon: '💡' },
  '629': { name: 'Otros servicios', icon: '📋' },
  '631': { name: 'Tributos', icon: '🏛️' },
  '640': { name: 'Sueldos y salarios', icon: '💰' },
  '642': { name: 'Seg. Social empresa', icon: '🏥' },
  '662': { name: 'Intereses prestamos', icon: '📊' },
  '669': { name: 'Otros gastos financieros', icon: '💸' },
  '680': { name: 'Amortizacion intangible', icon: '📉' },
  '681': { name: 'Amortizacion inmovilizado', icon: '📉' },
};

const STORAGE_KEY = 'holded_budgets';

// Objetivos predefinidos por categoria (editar aqui para proximas revisiones)
const DEFAULT_BUDGETS = {
  '600': 95000,   // Compras mercaderias — actual ~96.3k, objetivo reducir ~1.4%
  '602': 400,     // Otros aprovisionamientos — actual ~424
  '621': 11500,   // Alquileres y renting — actual ~11.8k, objetivo reducir ~2.4%
  '622': 250,     // Reparaciones — actual ~205, margen para imprevistos
  '623': 50,      // Servicios profesionales — actual ~33
  '624': 3800,    // Transportes — actual ~3.9k, objetivo reducir ~3%
  '627': 3500,    // Publicidad y marketing — actual ~3.8k, objetivo reducir ~7%
  '628': 5200,    // Suministros — actual ~5.4k, objetivo reducir ~4%
  '629': 6500,    // Otros servicios — actual ~7k, objetivo reducir ~7%
};

const GRADIENTS = {
  red: 'from-red-500 to-rose-600',
  blue: 'from-blue-500 to-indigo-600',
  amber: 'from-amber-500 to-orange-600',
  green: 'from-emerald-500 to-green-600',
};

const getPresetRange = (key) => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (key) {
    case 'this_month': return { from: new Date(y, m, 1), to: now };
    case 'last_month': return { from: new Date(y, m - 1, 1), to: new Date(y, m, 0) };
    case 'this_quarter': { const q = Math.floor(m / 3) * 3; return { from: new Date(y, q, 1), to: now }; }
    case 'last_quarter': { const q = Math.floor(m / 3) * 3; return { from: new Date(y, q - 3, 1), to: new Date(y, q, 0) }; }
    case 'this_year': return { from: new Date(y, 0, 1), to: now };
    case 'last_year': return { from: new Date(y - 1, 0, 1), to: new Date(y - 1, 11, 31) };
    case 'all': default: return { from: null, to: null };
  }
};
const toInputDate = (d) => d ? d.toISOString().split('T')[0] : '';

// Donut gauge for the hero section
function BudgetGauge({ spent, budget }) {
  const pct = budget > 0 ? Math.min((spent / budget) * 100, 150) : 0;
  const isOver = spent > budget && budget > 0;
  const color = budget <= 0 ? '#94a3b8' : isOver ? '#ef4444' : pct > 80 ? '#f59e0b' : '#10b981';
  const remaining = budget > 0 ? Math.max(budget - spent, 0) : 0;
  const data = budget > 0
    ? [{ value: Math.min(spent, budget) }, { value: remaining }, ...(isOver ? [{ value: spent - budget }] : [])]
    : [{ value: 1 }];

  return (
    <div className="relative w-36 h-36">
      <PieChart width={144} height={144}>
        <Pie
          data={data}
          cx={67} cy={67}
          innerRadius={48} outerRadius={65}
          startAngle={220} endAngle={-40}
          paddingAngle={2}
          dataKey="value"
          stroke="none"
        >
          <Cell fill={color} />
          <Cell fill={budget > 0 ? '#e5e7eb' : '#e5e7eb'} />
          {isOver && <Cell fill="#fca5a5" />}
        </Pie>
      </PieChart>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black" style={{ color }}>{budget > 0 ? Math.round(pct) : 0}%</span>
        <span className="text-[9px] text-gray-400 uppercase tracking-widest">usado</span>
      </div>
    </div>
  );
}

// Custom tooltip
const BudgetTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const budget = d.budget || 0;
  const spent = d.spent || 0;
  const diff = budget > 0 ? spent - budget : 0;
  return (
    <div className="bg-gray-900 text-white rounded-xl shadow-2xl px-4 py-3 text-xs border border-gray-700 min-w-[180px]">
      <p className="font-bold text-sm mb-2 border-b border-gray-700 pb-2">{d.icon} {d.fullName}</p>
      <div className="space-y-1.5">
        <div className="flex justify-between">
          <span className="text-gray-400">Gastado</span>
          <span className="font-bold">{formatCurrency(spent)}</span>
        </div>
        {budget > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-400">Objetivo</span>
            <span className="font-bold text-blue-400">{formatCurrency(budget)}</span>
          </div>
        )}
        {budget > 0 && (
          <div className={`flex justify-between pt-1.5 border-t border-gray-700 ${diff > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            <span>{diff > 0 ? 'Excedido' : 'Disponible'}</span>
            <span className="font-black">{diff > 0 ? '+' : ''}{formatCurrency(Math.abs(diff))}</span>
          </div>
        )}
        {!budget && <p className="text-gray-500 italic">Sin objetivo definido</p>}
      </div>
    </div>
  );
};

export default function Budget() {
  const purchases = useDocuments('purchase');
  const expensesQuery = useExpensesAccounts();

  const [datePreset, setDatePreset] = useState('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [budgets, setBudgets] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && Object.keys(saved).length > 0) return saved;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_BUDGETS));
      return { ...DEFAULT_BUDGETS };
    } catch {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_BUDGETS));
      return { ...DEFAULT_BUDGETS };
    }
  });
  const [editingBudget, setEditingBudget] = useState(null);
  const [editValue, setEditValue] = useState('');

  const isLoading = purchases.isLoading || expensesQuery.isLoading;
  const error = purchases.error || expensesQuery.error;
  const purchaseData = purchases.data || [];
  const expenseData = expensesQuery.data || [];

  const dateRange = useMemo(() => {
    if (datePreset === 'custom') {
      return { from: customFrom ? new Date(customFrom + 'T00:00:00') : null, to: customTo ? new Date(customTo + 'T23:59:59') : null };
    }
    return getPresetRange(datePreset);
  }, [datePreset, customFrom, customTo]);

  const filteredPurchases = useMemo(() => {
    return purchaseData.filter((doc) => {
      if (!doc.date) return false;
      const d = new Date(doc.date * 1000);
      if (dateRange.from && d < dateRange.from) return false;
      if (dateRange.to && d > dateRange.to) return false;
      return true;
    });
  }, [purchaseData, dateRange]);

  const accountMap = useMemo(() => {
    const map = {};
    expenseData.forEach(acc => { map[acc.id] = { name: acc.name, num: acc.accountNum }; });
    return map;
  }, [expenseData]);

  const { categoryTotals, categoryDetails } = useMemo(() => {
    const totals = {};
    const details = {};
    filteredPurchases.forEach((doc) => {
      const contact = doc.contactName?.split(' (')[0] || 'Desconocido';
      (doc.products || []).forEach((line) => {
        const accInfo = accountMap[line.account];
        const accNum = accInfo?.num ? String(accInfo.num) : '';
        const prefix = accNum.substring(0, 3);
        const catInfo = CATEGORY_MAP[prefix] || { name: `Cuenta ${accNum || line.account}`, icon: '📄' };
        const lineTotal = (Number(line.price) || 0) * (Number(line.units) || 1);
        if (lineTotal === 0) return;
        if (!totals[prefix]) totals[prefix] = { ...catInfo, total: 0, count: 0 };
        totals[prefix].total += lineTotal;
        totals[prefix].count += 1;
        if (!details[prefix]) details[prefix] = [];
        details[prefix].push({ account: accInfo?.name || line.account, accountNum: accNum, amount: lineTotal, contact, desc: line.desc || line.name || '', date: doc.date, docNumber: doc.docNumber });
      });
    });
    return { categoryTotals: totals, categoryDetails: details };
  }, [filteredPurchases, accountMap]);

  const dateLabel = useMemo(() => {
    if (datePreset === 'all') return 'Todo el periodo';
    const f = dateRange.from; const t = dateRange.to;
    if (f && t) return `${f.toLocaleDateString('es-ES')} — ${t.toLocaleDateString('es-ES')}`;
    if (f) return `Desde ${f.toLocaleDateString('es-ES')}`;
    return 'Todo el periodo';
  }, [dateRange, datePreset]);

  if (isLoading) return <LoadingSpinner text="Cargando datos..." />;
  if (error) return <ErrorMessage error={error} />;

  const sortedCategories = Object.entries(categoryTotals).sort(([, a], [, b]) => b.total - a.total);
  const totalExpenseAmount = sortedCategories.reduce((s, [, c]) => s + c.total, 0);
  const hasBudgets = Object.values(budgets).some(v => v > 0);
  const totalBudget = sortedCategories.reduce((s, [p]) => s + (Number(budgets[p]) || 0), 0);
  const totalOverAmount = sortedCategories.reduce((s, [p, c]) => { const b = Number(budgets[p]) || 0; return s + (b > 0 && c.total > b ? c.total - b : 0); }, 0);
  const totalSavings = totalBudget > 0 ? Math.max(totalBudget - totalExpenseAmount, 0) : 0;
  const overCount = sortedCategories.filter(([p, c]) => budgets[p] && c.total > budgets[p]).length;
  const okCount = sortedCategories.filter(([p, c]) => budgets[p] && c.total <= budgets[p]).length;
  const globalPct = totalBudget > 0 ? (totalExpenseAmount / totalBudget) * 100 : 0;

  // Chart data
  const chartData = sortedCategories.map(([prefix, cat]) => {
    const budget = Number(budgets[prefix]) || 0;
    const spent = Math.round(cat.total * 100) / 100;
    const isOver = budget > 0 && spent > budget;
    const pct = budget > 0 ? Math.round((spent / budget) * 100) : 0;
    return {
      prefix,
      name: cat.name.length > 18 ? cat.name.substring(0, 18) + '...' : cat.name,
      fullName: cat.name,
      icon: cat.icon,
      spent,
      budget: Math.round(budget * 100) / 100,
      pct,
      withinBudget: budget > 0 ? Math.round(Math.min(spent, budget) * 100) / 100 : spent,
      overBudget: isOver ? Math.round((spent - budget) * 100) / 100 : 0,
      fill: budget > 0 ? (isOver ? '#ef4444' : pct > 80 ? '#f59e0b' : '#10b981') : '#94a3b8',
      overFill: isOver ? '#fecaca' : 'transparent',
    };
  });

  const getExpandedDetails = (prefix) => {
    const items = categoryDetails[prefix] || [];
    const byAccount = {};
    items.forEach(d => {
      if (!byAccount[d.account]) byAccount[d.account] = { account: d.account, accountNum: d.accountNum, total: 0, items: [] };
      byAccount[d.account].total += d.amount;
      byAccount[d.account].items.push(d);
    });
    return Object.values(byAccount).sort((a, b) => b.total - a.total);
  };

  const handlePreset = (key) => {
    setDatePreset(key);
    setExpandedCategory(null);
    if (key !== 'custom') { const r = getPresetRange(key); setCustomFrom(r.from ? toInputDate(r.from) : ''); setCustomTo(r.to ? toInputDate(r.to) : ''); }
  };

  const saveBudget = (prefix, value) => {
    const num = parseFloat(value);
    const updated = { ...budgets };
    if (isNaN(num) || num <= 0) delete updated[prefix]; else updated[prefix] = num;
    setBudgets(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setEditingBudget(null);
  };

  const autoSetBudgets = () => {
    const updated = { ...budgets };
    sortedCategories.forEach(([p, c]) => { updated[p] = Math.round(c.total); });
    setBudgets(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const clearBudgets = () => { setBudgets({ ...DEFAULT_BUDGETS }); localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_BUDGETS)); };

  const presets = [
    { key: 'all', label: 'Todo' }, { key: 'this_month', label: 'Este mes' }, { key: 'last_month', label: 'Mes anterior' },
    { key: 'this_quarter', label: 'Este trimestre' }, { key: 'last_quarter', label: 'Trim. anterior' },
    { key: 'this_year', label: 'Este año' }, { key: 'last_year', label: 'Año anterior' }, { key: 'custom', label: 'Personalizado' },
  ];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">

      {/* ════════════ HERO SECTION ════════════ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-emerald-500/10 to-transparent rounded-full translate-y-1/2 -translate-x-1/4" />

        <div className="relative flex flex-col lg:flex-row items-center gap-8">
          {/* Left: title + stats */}
          <div className="flex-1 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Target size={20} className="text-blue-400" />
                <span className="text-xs font-semibold uppercase tracking-widest text-blue-400">Control de gastos</span>
              </div>
              <h2 className="text-3xl font-black tracking-tight">Objetivos de ahorro</h2>
              <p className="text-sm text-gray-400 mt-1">{filteredPurchases.length} facturas de compra &middot; {dateLabel}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp size={12} className="text-red-400" />
                  <span className="text-[10px] uppercase tracking-wider text-gray-500">Gastado</span>
                </div>
                <p className="text-lg font-black text-red-400">{formatCurrency(totalExpenseAmount)}</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                <div className="flex items-center gap-1.5 mb-1">
                  <Target size={12} className="text-blue-400" />
                  <span className="text-[10px] uppercase tracking-wider text-gray-500">Objetivo</span>
                </div>
                <p className="text-lg font-black text-blue-400">{hasBudgets ? formatCurrency(totalBudget) : '---'}</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                <div className="flex items-center gap-1.5 mb-1">
                  <ArrowUpRight size={12} className="text-orange-400" />
                  <span className="text-[10px] uppercase tracking-wider text-gray-500">Excedido</span>
                </div>
                <p className="text-lg font-black text-orange-400">{hasBudgets ? formatCurrency(totalOverAmount) : '---'}</p>
                {overCount > 0 && <p className="text-[10px] text-gray-500 mt-0.5">{overCount} categorias</p>}
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                <div className="flex items-center gap-1.5 mb-1">
                  <ArrowDownRight size={12} className="text-emerald-400" />
                  <span className="text-[10px] uppercase tracking-wider text-gray-500">Disponible</span>
                </div>
                <p className="text-lg font-black text-emerald-400">{hasBudgets ? formatCurrency(totalSavings) : '---'}</p>
                {okCount > 0 && <p className="text-[10px] text-gray-500 mt-0.5">{okCount} categorias ok</p>}
              </div>
            </div>
          </div>

          {/* Right: gauge */}
          <div className="flex flex-col items-center gap-2">
            <BudgetGauge spent={totalExpenseAmount} budget={totalBudget} />
            <span className="text-[10px] uppercase tracking-widest text-gray-500">
              {globalPct > 100 ? 'Presupuesto excedido' : globalPct > 80 ? 'Cerca del limite' : 'Dentro del objetivo'}
            </span>
          </div>
        </div>
      </div>

      {/* ════════════ TOOLBAR ════════════ */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Date presets */}
        <div className="flex gap-1.5 flex-wrap items-center bg-white rounded-xl border border-gray-200 p-1.5">
          <Calendar size={14} className="text-gray-400 ml-1.5" />
          {presets.map(p => (
            <button key={p.key} onClick={() => handlePreset(p.key)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${datePreset === p.key
                ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-wrap items-center">
          <button onClick={autoSetBudgets}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-sm">
            <Sparkles size={12} /> Auto-generar
          </button>
          {hasBudgets && (
            <button onClick={clearBudgets}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <RotateCcw size={12} /> Restaurar
            </button>
          )}
        </div>
      </div>

      {/* Custom date inputs (only when custom selected) */}
      {datePreset === 'custom' && (
        <div className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 font-medium">Desde</label>
            <input type="date" value={customFrom} onChange={e => { setCustomFrom(e.target.value); setDatePreset('custom'); setExpandedCategory(null); }}
              className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 font-medium">Hasta</label>
            <input type="date" value={customTo} onChange={e => { setCustomTo(e.target.value); setDatePreset('custom'); setExpandedCategory(null); }}
              className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400" />
          </div>
          {datePreset !== 'all' && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
              {filteredPurchases.length} de {purchaseData.length} facturas
            </span>
          )}
        </div>
      )}

      {sortedCategories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
          <Gauge size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-400 font-medium">No hay gastos en el rango seleccionado</p>
        </div>
      ) : (
        <>
          {/* ════════════ BAR CHART ════════════ */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 pt-5 pb-2 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-800">Gasto real vs Objetivo</h3>
              <div className="flex gap-4 mt-2">
                <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Dentro
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Alerta
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
                  <span className="w-2.5 h-2.5 rounded-sm bg-red-500" /> Excedido
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
                  <span className="w-2.5 h-2.5 rounded-sm bg-gray-400" /> Sin objetivo
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
                  <span className="w-4 h-0.5 bg-blue-500 rounded" /> Objetivo
                </span>
              </div>
            </div>
            <div className="px-4 py-4">
              <ResponsiveContainer width="100%" height={Math.max(chartData.length * 56, 220)}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 80, top: 8, bottom: 8 }} barSize={24} barGap={8}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                    axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11, fill: '#374151', fontWeight: 500 }}
                    axisLine={false} tickLine={false} />
                  <ReTooltip content={<BudgetTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                  <Bar dataKey="withinBudget" stackId="a" radius={[0, 0, 0, 0]} animationDuration={800}>
                    {chartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                  <Bar dataKey="overBudget" stackId="a" radius={[0, 6, 6, 0]} animationDuration={800}>
                    {chartData.map((d, i) => <Cell key={i} fill={d.overFill} />)}
                    <LabelList
                      dataKey="spent"
                      position="right"
                      formatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k €` : `${v} €`}
                      style={{ fontSize: 10, fill: '#6b7280', fontWeight: 700 }}
                    />
                  </Bar>
                  {/* Budget reference markers as vertical lines */}
                  {chartData.filter(d => d.budget > 0).map((d, i) => {
                    const maxSpent = Math.max(...chartData.map(c => c.spent));
                    // Show line if budget is within visible range
                    if (d.budget <= maxSpent * 1.5) {
                      return null; // We'll use custom reference below
                    }
                    return null;
                  })}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ════════════ CATEGORY CARDS ════════════ */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold text-gray-800">Detalle por categoria</h3>
              <p className="text-[11px] text-gray-400">Clic en una categoria para ver el desglose completo</p>
            </div>

            {sortedCategories.map(([prefix, cat]) => {
              const pctOfTotal = totalExpenseAmount > 0 ? (cat.total / totalExpenseAmount) * 100 : 0;
              const budget = Number(budgets[prefix]) || 0;
              const pctBudget = budget > 0 ? (cat.total / budget) * 100 : 0;
              const isOver = budget > 0 && cat.total > budget;
              const overAmount = isOver ? cat.total - budget : 0;
              const remaining = budget > 0 && !isOver ? budget - cat.total : 0;
              const isEditing = editingBudget === prefix;
              const isExpanded = expandedCategory === prefix;

              let statusStyle = { ring: 'ring-gray-200', bg: 'bg-white', barColor: '#94a3b8', badgeBg: 'bg-gray-100', badgeText: 'text-gray-600' };
              if (budget > 0) {
                if (isOver) statusStyle = { ring: 'ring-red-200', bg: 'bg-white', barColor: '#ef4444', badgeBg: 'bg-red-50', badgeText: 'text-red-700' };
                else if (pctBudget > 80) statusStyle = { ring: 'ring-amber-200', bg: 'bg-white', barColor: '#f59e0b', badgeBg: 'bg-amber-50', badgeText: 'text-amber-700' };
                else statusStyle = { ring: 'ring-emerald-200', bg: 'bg-white', barColor: '#10b981', badgeBg: 'bg-emerald-50', badgeText: 'text-emerald-700' };
              }

              return (
                <div key={prefix} className={`rounded-2xl ${statusStyle.bg} ring-1 ${statusStyle.ring} shadow-sm overflow-hidden transition-shadow hover:shadow-md`}>
                  <div className="p-5">
                    {/* Top row */}
                    <div className="flex items-start gap-4">
                      {/* Left: icon + name + expand */}
                      <button onClick={() => setExpandedCategory(isExpanded ? null : prefix)}
                        className="flex items-center gap-3 group min-w-0 flex-shrink">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-gray-50 ring-1 ring-gray-200 group-hover:ring-gray-300 transition-all">
                          {cat.icon}
                        </div>
                        <div className="text-left min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-gray-800 truncate">{cat.name}</span>
                            {isExpanded ? <ChevronDown size={13} className="text-gray-400 shrink-0" /> : <ChevronRight size={13} className="text-gray-400 shrink-0" />}
                          </div>
                          <span className="text-[11px] text-gray-400">{cat.count} items &middot; {pctOfTotal.toFixed(1)}% del total</span>
                        </div>
                      </button>

                      <div className="flex-1" />

                      {/* Center: amounts */}
                      <div className="flex items-center gap-6 flex-wrap">
                        {/* Spent */}
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">Gastado</p>
                          <p className="text-base font-black tabular-nums" style={{ color: statusStyle.barColor }}>{formatCurrency(cat.total)}</p>
                        </div>

                        {/* Objective */}
                        <div className="text-right min-w-[100px]">
                          <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">Objetivo</p>
                          {isEditing ? (
                            <div className="flex items-center gap-1.5 justify-end">
                              <input type="number" value={editValue} onChange={e => setEditValue(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') saveBudget(prefix, editValue); if (e.key === 'Escape') setEditingBudget(null); }}
                                autoFocus
                                className="w-24 px-2 py-1 text-xs border border-blue-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-blue-50/50" />
                              <button onClick={() => saveBudget(prefix, editValue)} className="p-1 text-blue-600 hover:bg-blue-50 rounded-md"><Save size={13} /></button>
                              <button onClick={() => setEditingBudget(null)} className="p-1 text-gray-400 hover:bg-gray-50 rounded-md"><X size={13} /></button>
                            </div>
                          ) : (
                            <button onClick={() => { setEditingBudget(prefix); setEditValue(budget > 0 ? String(budget) : ''); }}
                              className="group/edit flex items-center gap-1.5 text-base font-black tabular-nums text-blue-600 hover:text-blue-700 transition-colors">
                              {budget > 0 ? formatCurrency(budget) : <span className="text-gray-300 text-sm font-medium">Definir</span>}
                              <Pencil size={11} className="opacity-0 group-hover/edit:opacity-100 transition-opacity text-blue-400" />
                            </button>
                          )}
                        </div>

                        {/* Status badge */}
                        <div className="min-w-[110px] text-right">
                          {budget > 0 ? (
                            isOver ? (
                              <span className={`inline-flex items-center gap-1 text-xs font-bold ${statusStyle.badgeText} ${statusStyle.badgeBg} px-3 py-1.5 rounded-full`}>
                                <AlertTriangle size={11} />
                                +{formatCurrency(overAmount)}
                              </span>
                            ) : (
                              <span className={`inline-flex items-center gap-1 text-xs font-bold ${statusStyle.badgeText} ${statusStyle.badgeBg} px-3 py-1.5 rounded-full`}>
                                <CheckCircle size={11} />
                                -{formatCurrency(remaining)}
                              </span>
                            )
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-4">
                      {budget > 0 ? (
                        <div>
                          <div className="relative w-full h-2.5 bg-gray-100 rounded-full overflow-visible">
                            <div className="absolute top-0 left-0 h-2.5 rounded-full transition-all duration-700 ease-out"
                              style={{ width: `${Math.min(pctBudget, 100)}%`, backgroundColor: statusStyle.barColor }} />
                            {isOver && (
                              <div className="absolute top-0 left-full h-2.5 bg-red-200 rounded-r-full"
                                style={{ width: `${Math.min((pctBudget - 100) * 0.5, 20)}%` }} />
                            )}
                          </div>
                          <div className="flex justify-between mt-1.5">
                            <span className="text-[10px] font-medium" style={{ color: statusStyle.barColor }}>{Math.round(pctBudget)}% del objetivo</span>
                            <span className="text-[10px] text-gray-400">{formatCurrency(budget)}</span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full">
                            <div className="h-1.5 rounded-full bg-gray-300 transition-all duration-700" style={{ width: `${Math.max(pctOfTotal, 0.5)}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (() => {
                    const groups = getExpandedDetails(prefix);
                    const groupTotal = groups.reduce((s, g) => s + g.total, 0);
                    return (
                      <div className="border-t border-gray-200 bg-gradient-to-b from-gray-50/80 to-white">
                        {/* Sub-account summary strip */}
                        <div className="px-5 py-3 flex items-center gap-3 border-b border-gray-100 bg-white/60 backdrop-blur-sm">
                          <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Subcuentas</span>
                          <div className="flex-1 flex gap-2 flex-wrap">
                            {groups.map((g) => {
                              const gPct = groupTotal > 0 ? (g.total / groupTotal) * 100 : 0;
                              return (
                                <span key={g.account} className="inline-flex items-center gap-1.5 text-[10px] bg-gray-100 text-gray-600 pl-1 pr-2 py-0.5 rounded-full">
                                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: statusStyle.barColor }} />
                                  {g.account.length > 22 ? g.account.substring(0, 22) + '...' : g.account}
                                  <span className="font-bold text-gray-800">{Math.round(gPct)}%</span>
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        {groups.map((group, gi) => (
                          <div key={group.account} className={gi < groups.length - 1 ? 'border-b border-gray-100' : ''}>
                            {/* Sub-account header */}
                            <div className="flex items-center justify-between px-5 py-3 bg-white sticky top-0 z-10">
                              <div className="flex items-center gap-2.5">
                                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black text-white"
                                  style={{ backgroundColor: statusStyle.barColor }}>
                                  {gi + 1}
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-gray-800">{group.account}</p>
                                  <p className="text-[10px] text-gray-400">{group.accountNum} &middot; {group.items.length} movimientos</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-black text-gray-900 tabular-nums">{formatCurrency(group.total)}</p>
                                <p className="text-[10px] text-gray-400">{groupTotal > 0 ? ((group.total / groupTotal) * 100).toFixed(1) : 0}% de la categoria</p>
                              </div>
                            </div>

                            {/* Items table */}
                            <div className="mx-5 mb-4 rounded-xl border border-gray-100 overflow-hidden">
                              {/* Table header */}
                              <div className="grid grid-cols-[72px_1fr_1fr_90px_100px] bg-gray-50 px-4 py-2 text-[10px] uppercase tracking-wider text-gray-400 font-semibold border-b border-gray-100">
                                <span>Fecha</span>
                                <span>Proveedor</span>
                                <span>Concepto</span>
                                <span className="text-right">N. Doc</span>
                                <span className="text-right">Importe</span>
                              </div>
                              {/* Table rows */}
                              {group.items.sort((a, b) => (b.date || 0) - (a.date || 0)).map((item, j) => {
                                const itemPct = group.total > 0 ? (item.amount / group.total) * 100 : 0;
                                return (
                                  <div key={j} className="group relative grid grid-cols-[72px_1fr_1fr_90px_100px] items-center px-4 py-2.5 text-xs border-b border-gray-50 last:border-0 hover:bg-blue-50/40 transition-colors">
                                    {/* Background bar showing proportion */}
                                    <div className="absolute inset-y-0 left-0 opacity-[0.04] transition-opacity group-hover:opacity-[0.08]"
                                      style={{ width: `${itemPct}%`, backgroundColor: statusStyle.barColor }} />

                                    <span className="relative text-gray-400 tabular-nums font-medium">{formatDate(item.date)}</span>
                                    <span className="relative truncate text-gray-800 font-semibold pr-2" title={item.contact}>{item.contact}</span>
                                    <span className="relative truncate text-gray-500 pr-2" title={item.desc}>{item.desc || '—'}</span>
                                    <span className="relative text-gray-400 truncate text-right font-mono text-[11px]" title={item.docNumber}>{item.docNumber}</span>
                                    <span className="relative text-right font-black text-gray-900 tabular-nums">{formatCurrency(item.amount)}</span>
                                  </div>
                                );
                              })}
                              {/* Sub-account total row */}
                              <div className="grid grid-cols-[72px_1fr_1fr_90px_100px] items-center px-4 py-2.5 bg-gray-50 border-t border-gray-200">
                                <span />
                                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">{group.items.length} registros</span>
                                <span />
                                <span className="text-[10px] text-right uppercase tracking-wider text-gray-400 font-semibold">Total</span>
                                <span className="text-right text-xs font-black text-gray-900 tabular-nums">{formatCurrency(group.total)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
