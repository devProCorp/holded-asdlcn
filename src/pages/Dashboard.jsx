import { useState, useMemo } from 'react';
import { useContacts, useDocuments, useTreasury, usePayments, useExpensesAccounts } from '../hooks/useHolded';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { formatCurrency, formatDate } from '../utils/format';
import { Users, FileText, Building2, CreditCard, Wallet, TrendingUp, TrendingDown, ShoppingCart, ChevronDown, ChevronRight, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#14b8a6', '#a855f7', '#eab308', '#64748b'];

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

// Quick date range presets
const getPresetRange = (key) => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (key) {
    case 'this_month':
      return { from: new Date(y, m, 1), to: now };
    case 'last_month':
      return { from: new Date(y, m - 1, 1), to: new Date(y, m, 0) };
    case 'this_quarter': {
      const qStart = Math.floor(m / 3) * 3;
      return { from: new Date(y, qStart, 1), to: now };
    }
    case 'last_quarter': {
      const qStart = Math.floor(m / 3) * 3;
      return { from: new Date(y, qStart - 3, 1), to: new Date(y, qStart, 0) };
    }
    case 'this_year':
      return { from: new Date(y, 0, 1), to: now };
    case 'last_year':
      return { from: new Date(y - 1, 0, 1), to: new Date(y - 1, 11, 31) };
    case 'all':
    default:
      return { from: null, to: null };
  }
};

const toInputDate = (date) => {
  if (!date) return '';
  return date.toISOString().split('T')[0];
};

export default function Dashboard() {
  const contacts = useContacts();
  const invoices = useDocuments('invoice');
  const purchases = useDocuments('purchase');
  const treasury = useTreasury();
  const payments = usePayments();
  const expenses = useExpensesAccounts();
  const [expandedCategory, setExpandedCategory] = useState(null);

  // Date filter state
  const [datePreset, setDatePreset] = useState('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const queries = [contacts, invoices, purchases, treasury, payments, expenses];
  const isLoading = queries.some(q => q.isLoading);
  const error = queries.find(q => q.error)?.error;

  const invoiceData = invoices.data || [];
  const purchaseData = purchases.data || [];
  const contactData = contacts.data || [];
  const treasuryData = treasury.data || [];
  const paymentData = payments.data || [];
  const expenseData = expenses.data || [];

  // Resolve active date range
  const dateRange = useMemo(() => {
    if (datePreset === 'custom') {
      return {
        from: customFrom ? new Date(customFrom + 'T00:00:00') : null,
        to: customTo ? new Date(customTo + 'T23:59:59') : null,
      };
    }
    return getPresetRange(datePreset);
  }, [datePreset, customFrom, customTo]);

  // Filter purchases by date range
  const filteredPurchases = useMemo(() => {
    return purchaseData.filter((doc) => {
      if (!doc.date) return false;
      const docDate = new Date(doc.date * 1000);
      if (dateRange.from && docDate < dateRange.from) return false;
      if (dateRange.to && docDate > dateRange.to) return false;
      return true;
    });
  }, [purchaseData, dateRange]);

  // Build account ID -> account info map
  const accountMap = useMemo(() => {
    const map = {};
    expenseData.forEach(acc => {
      map[acc.id] = { name: acc.name, num: acc.accountNum };
    });
    return map;
  }, [expenseData]);

  // EXPENSE BREAKDOWN (filtered by date)
  const { categoryTotals, categoryDetails } = useMemo(() => {
    const totals = {};
    const details = {};

    filteredPurchases.forEach((doc) => {
      const contact = doc.contactName?.split(' (')[0] || 'Desconocido';
      (doc.products || []).forEach((line) => {
        const accId = line.account;
        const accInfo = accountMap[accId];
        const accNum = accInfo?.num ? String(accInfo.num) : '';
        const prefix = accNum.substring(0, 3);
        const catInfo = CATEGORY_MAP[prefix] || { name: `Cuenta ${accNum || accId}`, icon: '📄' };
        const lineTotal = (Number(line.price) || 0) * (Number(line.units) || 1);

        if (lineTotal === 0) return;

        if (!totals[prefix]) totals[prefix] = { ...catInfo, total: 0, count: 0 };
        totals[prefix].total += lineTotal;
        totals[prefix].count += 1;

        if (!details[prefix]) details[prefix] = [];
        details[prefix].push({
          account: accInfo?.name || accId,
          accountNum: accNum,
          amount: lineTotal,
          contact,
          desc: line.desc || line.name || '',
          date: doc.date,
          docNumber: doc.docNumber,
        });
      });
    });

    return { categoryTotals: totals, categoryDetails: details };
  }, [filteredPurchases, accountMap]);

  const dateLabel = useMemo(() => {
    if (datePreset === 'all') return 'Todo el periodo';
    const f = dateRange.from;
    const t = dateRange.to;
    if (f && t) return `${f.toLocaleDateString('es-ES')} — ${t.toLocaleDateString('es-ES')}`;
    if (f) return `Desde ${f.toLocaleDateString('es-ES')}`;
    if (t) return `Hasta ${t.toLocaleDateString('es-ES')}`;
    return 'Todo el periodo';
  }, [dateRange, datePreset]);

  if (isLoading) return <LoadingSpinner text="Cargando dashboard..." />;
  if (error) return <ErrorMessage error={error} />;

  // Invoice totals
  const totalInvoiced = invoiceData.reduce((sum, d) => sum + (Number(d.total) || 0), 0);
  const totalInvoicePaid = invoiceData.reduce((sum, d) => sum + (Number(d.paymentsTotal) || 0), 0);
  const totalInvoicePending = invoiceData.reduce((sum, d) => sum + (Number(d.paymentsPending) || 0), 0);

  // Purchase totals (all)
  const totalPurchased = purchaseData.reduce((sum, d) => sum + (Number(d.total) || 0), 0);
  const totalPurchasePending = purchaseData.reduce((sum, d) => sum + (Number(d.paymentsPending) || 0), 0);

  // Treasury balance
  const totalBalance = treasuryData.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);

  const sortedCategories = Object.entries(categoryTotals).sort(([, a], [, b]) => b.total - a.total);
  const totalExpenseAmount = sortedCategories.reduce((s, [, c]) => s + c.total, 0);

  const expensePieData = sortedCategories
    .slice(0, 10)
    .map(([, cat]) => ({ name: cat.name, value: Math.round(cat.total * 100) / 100 }));

  // Monthly chart
  const monthlyMap = {};
  const addToMonthly = (docs, key) => {
    docs.forEach((doc) => {
      const date = doc.date ? new Date(doc.date * 1000) : null;
      if (!date || isNaN(date.getTime())) return;
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap[month]) monthlyMap[month] = { month, ventas: 0, compras: 0 };
      monthlyMap[month][key] += Number(doc.total) || 0;
    });
  };
  addToMonthly(invoiceData, 'ventas');
  addToMonthly(purchaseData, 'compras');
  const monthlyChartData = Object.values(monthlyMap)
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12)
    .map(d => ({ ...d, ventas: Math.round(d.ventas * 100) / 100, compras: Math.round(d.compras * 100) / 100 }));

  // Invoice status pie
  const invPaidCount = invoiceData.filter(d => Number(d.paymentsPending) === 0 && Number(d.total) > 0).length;
  const invDraftCount = invoiceData.filter(d => d.draft).length;
  const invPendingCount = invoiceData.length - invPaidCount - invDraftCount;
  const invoiceStatusPie = [
    { name: 'Pagadas', value: invPaidCount },
    { name: 'Pendientes', value: invPendingCount },
    { name: 'Borrador', value: invDraftCount },
  ].filter(d => d.value > 0);

  // Top suppliers
  const supplierMap = {};
  purchaseData.forEach((p) => {
    const name = p.contactName?.split(' (')[0] || 'Desconocido';
    supplierMap[name] = (supplierMap[name] || 0) + (Number(p.total) || 0);
  });
  const topSuppliers = Object.entries(supplierMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([name, total]) => ({ name: name.length > 20 ? name.substring(0, 20) + '...' : name, total: Math.round(total * 100) / 100 }));

  const recentPurchases = [...purchaseData].sort((a, b) => (b.date || 0) - (a.date || 0)).slice(0, 5);
  const recentInvoices = [...invoiceData].sort((a, b) => (b.date || 0) - (a.date || 0)).slice(0, 5);

  const getExpandedDetails = (prefix) => {
    const details = categoryDetails[prefix] || [];
    const byAccount = {};
    details.forEach(d => {
      const key = d.account;
      if (!byAccount[key]) byAccount[key] = { account: key, accountNum: d.accountNum, total: 0, items: [] };
      byAccount[key].total += d.amount;
      byAccount[key].items.push(d);
    });
    return Object.values(byAccount).sort((a, b) => b.total - a.total);
  };

  const handlePreset = (key) => {
    setDatePreset(key);
    setExpandedCategory(null);
    if (key !== 'custom') {
      const range = getPresetRange(key);
      setCustomFrom(range.from ? toInputDate(range.from) : '');
      setCustomTo(range.to ? toInputDate(range.to) : '');
    }
  };

  const presets = [
    { key: 'all', label: 'Todo' },
    { key: 'this_month', label: 'Este mes' },
    { key: 'last_month', label: 'Mes anterior' },
    { key: 'this_quarter', label: 'Este trimestre' },
    { key: 'last_quarter', label: 'Trim. anterior' },
    { key: 'this_year', label: 'Este año' },
    { key: 'last_year', label: 'Año anterior' },
    { key: 'custom', label: 'Personalizado' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Balance tesoreria" value={formatCurrency(totalBalance)} icon={Building2} color={totalBalance >= 0 ? 'green' : 'red'} to="/treasury" />
        <StatCard title="Facturado (ventas)" value={formatCurrency(totalInvoiced)} icon={TrendingUp} color="green" subtitle={`Cobrado: ${formatCurrency(totalInvoicePaid)}`} to="/invoices?type=invoice" />
        <StatCard title="Pendiente cobro" value={formatCurrency(totalInvoicePending)} icon={TrendingDown} color="orange" subtitle={`${invoiceData.length} facturas`} to="/invoices?type=invoice" />
        <StatCard title="Total compras" value={formatCurrency(totalPurchased)} icon={ShoppingCart} color="purple" subtitle={`${purchaseData.length} facturas compra`} to="/invoices?type=purchase" />
        <StatCard title="Compras pendientes pago" value={formatCurrency(totalPurchasePending)} icon={Wallet} color="red" to="/invoices?type=purchase" />
        <StatCard title="Contactos" value={contactData.length} icon={Users} color="blue" to="/contacts" />
        <StatCard title="Pagos registrados" value={paymentData.length} icon={CreditCard} color="cyan" to="/payments" />
        <StatCard title="Cuentas de gasto" value={expenseData.length} icon={FileText} color="purple" to="/expenses" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-medium text-gray-500 mb-4">Ventas vs Compras (mensual)</h3>
          {monthlyChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="ventas" fill="#10b981" radius={[4, 4, 0, 0]} name="Ventas" />
                <Bar dataKey="compras" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Compras" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm py-10 text-center">Sin datos</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-medium text-gray-500 mb-4">Estado facturas venta</h3>
          {invoiceStatusPie.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={invoiceStatusPie} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={5} dataKey="value">
                    {invoiceStatusPie.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {invoiceStatusPie.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    {entry.name}: {entry.value}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-400 text-sm py-10 text-center">Sin facturas</p>
          )}
        </div>
      </div>

      {/* ===== EXPENSE BREAKDOWN SECTION WITH DATE FILTER ===== */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold">Desglose de gastos</h3>
            <p className="text-sm text-gray-500 mt-1">
              Analisis por categoria contable — {filteredPurchases.length} facturas de compra
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Total gastos (base)</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(totalExpenseAmount)}</p>
          </div>
        </div>

        {/* Date filter toolbar */}
        <div className="mb-6 space-y-3">
          {/* Preset buttons */}
          <div className="flex gap-2 flex-wrap">
            <Calendar size={16} className="text-gray-400 mt-1.5" />
            {presets.map((p) => (
              <button
                key={p.key}
                onClick={() => handlePreset(p.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  datePreset === p.key
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom date inputs (always visible for quick tweaking, highlighted when custom) */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">Desde:</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => {
                  setCustomFrom(e.target.value);
                  setDatePreset('custom');
                  setExpandedCategory(null);
                }}
                className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">Hasta:</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => {
                  setCustomTo(e.target.value);
                  setDatePreset('custom');
                  setExpandedCategory(null);
                }}
                className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <span className="text-xs text-gray-400 ml-2">{dateLabel}</span>
            {datePreset !== 'all' && (
              <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-full font-medium">
                {filteredPurchases.length} de {purchaseData.length} facturas
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        {sortedCategories.length === 0 ? (
          <p className="text-gray-400 text-center py-10">No hay gastos en el rango seleccionado</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie chart */}
            <div>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={expensePieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    innerRadius={50}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name.length > 15 ? name.substring(0, 15) + '...' : name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ strokeWidth: 1 }}
                  >
                    {expensePieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Category bars */}
            <div className="space-y-2">
              {sortedCategories.map(([prefix, cat], i) => {
                const pct = totalExpenseAmount > 0 ? (cat.total / totalExpenseAmount) * 100 : 0;
                return (
                  <div key={prefix}>
                    <button
                      onClick={() => setExpandedCategory(expandedCategory === prefix ? null : prefix)}
                      className="w-full text-left group"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">{cat.icon}</span>
                        <span className="text-sm font-medium flex-1">{cat.name}</span>
                        <span className="text-sm font-bold">{formatCurrency(cat.total)}</span>
                        <span className="text-xs text-gray-400 w-12 text-right">{pct.toFixed(1)}%</span>
                        {expandedCategory === prefix
                          ? <ChevronDown size={14} className="text-gray-400" />
                          : <ChevronRight size={14} className="text-gray-400" />
                        }
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div
                          className="h-2.5 rounded-full transition-all"
                          style={{
                            width: `${Math.max(pct, 0.5)}%`,
                            backgroundColor: COLORS[i % COLORS.length],
                          }}
                        />
                      </div>
                    </button>

                    {expandedCategory === prefix && (
                      <div className="mt-2 mb-3 ml-6 bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
                        {getExpandedDetails(prefix).map((group) => (
                          <div key={group.account} className="border-b border-gray-100 last:border-0">
                            <div className="flex items-center justify-between px-4 py-2 bg-gray-50">
                              <div>
                                <span className="text-xs font-medium text-gray-700">{group.account}</span>
                                <span className="text-xs text-gray-400 ml-2">({group.accountNum})</span>
                              </div>
                              <span className="text-xs font-bold text-gray-700">{formatCurrency(group.total)}</span>
                            </div>
                            <table className="w-full text-xs">
                              <tbody>
                                {group.items
                                  .sort((a, b) => b.amount - a.amount)
                                  .slice(0, 10)
                                  .map((item, j) => (
                                    <tr key={j} className="border-t border-gray-50 hover:bg-white">
                                      <td className="px-4 py-1.5 text-gray-500 w-20">{formatDate(item.date)}</td>
                                      <td className="px-2 py-1.5 text-gray-600 truncate max-w-[120px]" title={item.contact}>{item.contact}</td>
                                      <td className="px-2 py-1.5 text-gray-400 truncate max-w-[100px]" title={item.desc}>{item.desc || '-'}</td>
                                      <td className="px-2 py-1.5 text-gray-500 truncate max-w-[80px]" title={item.docNumber}>{item.docNumber}</td>
                                      <td className="px-4 py-1.5 text-right font-medium text-gray-700">{formatCurrency(item.amount)}</td>
                                    </tr>
                                  ))}
                                {group.items.length > 10 && (
                                  <tr>
                                    <td colSpan={5} className="px-4 py-1.5 text-center text-gray-400">
                                      y {group.items.length - 10} lineas mas...
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Top suppliers chart */}
      {topSuppliers.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-medium text-gray-500 mb-4">Top proveedores por volumen de compras</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topSuppliers} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={160} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="total" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent documents tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-medium text-gray-500 mb-4">Ultimas facturas de venta</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-3 py-2 text-left text-gray-500 font-medium">Num</th>
                  <th className="px-3 py-2 text-left text-gray-500 font-medium">Cliente</th>
                  <th className="px-3 py-2 text-right text-gray-500 font-medium">Total</th>
                  <th className="px-3 py-2 text-center text-gray-500 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((inv) => {
                  const isPaid = Number(inv.paymentsPending) === 0 && Number(inv.total) > 0;
                  return (
                    <tr key={inv.id} className="border-b border-gray-100">
                      <td className="px-3 py-2 font-medium">{inv.docNumber || '-'}</td>
                      <td className="px-3 py-2 truncate max-w-[150px]">{inv.contactName?.split(' (')[0] || '-'}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(inv.total)}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          inv.draft ? 'bg-gray-100 text-gray-600' : isPaid ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {inv.draft ? 'Borrador' : isPaid ? 'Pagada' : 'Pendiente'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {recentInvoices.length === 0 && (
                  <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-400">Sin facturas</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-medium text-gray-500 mb-4">Ultimas compras</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-3 py-2 text-left text-gray-500 font-medium">Num</th>
                  <th className="px-3 py-2 text-left text-gray-500 font-medium">Proveedor</th>
                  <th className="px-3 py-2 text-right text-gray-500 font-medium">Total</th>
                  <th className="px-3 py-2 text-center text-gray-500 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {recentPurchases.map((p) => {
                  const isPaid = Number(p.paymentsPending) === 0 && Number(p.total) > 0;
                  return (
                    <tr key={p.id} className="border-b border-gray-100">
                      <td className="px-3 py-2 font-medium">{p.docNumber || '-'}</td>
                      <td className="px-3 py-2 truncate max-w-[150px]">{p.contactName?.split(' (')[0] || '-'}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(p.total)}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          p.draft ? 'bg-gray-100 text-gray-600' : isPaid ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {p.draft ? 'Borrador' : isPaid ? 'Pagada' : 'Pendiente'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
