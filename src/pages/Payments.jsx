import { usePayments, useTreasury } from '../hooks/useHolded';
import DataTable from '../components/DataTable';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { formatCurrency, formatDate } from '../utils/format';

const columns = [
  {
    key: 'desc',
    label: 'Descripcion',
    sortable: true,
    render: (row) => (
      <span className="truncate block max-w-[250px]" title={row.desc}>
        {row.desc || '-'}
      </span>
    ),
  },
  {
    key: 'contactName',
    label: 'Contacto',
    sortable: true,
    render: (row) => (
      <span className="truncate block max-w-[180px]" title={row.contactName}>
        {row.contactName || '-'}
      </span>
    ),
  },
  { key: 'date', label: 'Fecha', sortable: true, render: (row) => formatDate(row.date) },
  {
    key: 'amount',
    label: 'Importe',
    sortable: true,
    render: (row) => {
      const amount = Number(row.amount) || 0;
      return <span className={`font-medium ${amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(amount)}</span>;
    },
  },
  {
    key: 'documentType',
    label: 'Tipo doc',
    render: (row) => {
      const types = { trans: 'Transaccion', invoice: 'Factura', purchase: 'Compra' };
      return types[row.documentType] || row.documentType || '-';
    },
  },
];

export default function Payments() {
  const { data, isLoading, error } = usePayments();
  const treasury = useTreasury();

  if (isLoading) return <LoadingSpinner text="Cargando pagos..." />;
  if (error) return <ErrorMessage error={error} />;

  const payments = data || [];
  const totalIncome = payments.filter(p => Number(p.amount) > 0).reduce((s, p) => s + Number(p.amount), 0);
  const totalExpense = payments.filter(p => Number(p.amount) < 0).reduce((s, p) => s + Math.abs(Number(p.amount)), 0);

  // Map bankId to treasury name
  const treasuryMap = {};
  (treasury.data || []).forEach(t => { treasuryMap[t.id] = t.name; });

  const enrichedPayments = payments.map(p => ({
    ...p,
    bankName: treasuryMap[p.bankId] || '-',
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold">Pagos</h2>
        <div className="flex gap-6 text-sm">
          <span className="text-green-400 font-medium">Ingresos: {formatCurrency(totalIncome)}</span>
          <span className="text-red-400 font-medium">Gastos: {formatCurrency(totalExpense)}</span>
          <span className="text-neutral-500 font-medium">Neto: {formatCurrency(totalIncome - totalExpense)}</span>
        </div>
      </div>
      <DataTable
        columns={[
          ...columns,
          { key: 'bankName', label: 'Cuenta', render: (row) => <span className="text-xs truncate block max-w-[150px]">{row.bankName}</span> },
        ]}
        data={enrichedPayments}
        searchKeys={['desc', 'contactName']}
      />
    </div>
  );
}
