import { useExpensesAccounts } from '../hooks/useHolded';
import DataTable from '../components/DataTable';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const columns = [
  {
    key: 'accountNum',
    label: 'Num cuenta',
    sortable: true,
  },
  { key: 'name', label: 'Nombre', sortable: true },
  {
    key: 'color',
    label: '',
    render: (row) => row.color ? (
      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: row.color }} />
    ) : null,
  },
];

export default function Expenses() {
  const { data, isLoading, error } = useExpensesAccounts();

  if (isLoading) return <LoadingSpinner text="Cargando cuentas de gastos..." />;
  if (error) return <ErrorMessage error={error} />;

  const accounts = data || [];

  // Group by account number prefix (first 3 digits)
  const groups = {};
  accounts.forEach(acc => {
    const prefix = String(acc.accountNum || '').substring(0, 3);
    const groupLabels = {
      '600': 'Compras',
      '601': 'Compras materias primas',
      '602': 'Otros aprovisionamientos',
      '608': 'Devoluciones',
      '621': 'Arrendamientos',
      '622': 'Reparaciones',
      '623': 'Servicios profesionales',
      '624': 'Transportes',
      '625': 'Primas de seguros',
      '626': 'Servicios bancarios',
      '627': 'Publicidad y RRPP',
      '628': 'Suministros',
      '629': 'Otros servicios',
      '631': 'Tributos',
      '640': 'Sueldos y salarios',
      '642': 'Seg. Social empresa',
      '649': 'Otros gastos sociales',
      '662': 'Intereses deudas',
      '669': 'Otros gastos financieros',
      '680': 'Amortizacion intangible',
      '681': 'Amortizacion inmovilizado',
      '694': 'Perdidas deterioro',
      '706': 'Descuentos',
    };
    const label = groupLabels[prefix] || `Grupo ${prefix}`;
    if (!groups[prefix]) groups[prefix] = { label, count: 0 };
    groups[prefix].count++;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Cuentas de gastos</h2>
        <span className="text-sm text-neutral-500">{accounts.length} cuentas</span>
      </div>

      {/* Summary by group */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)).map(([prefix, { label, count }]) => (
          <div key={prefix} className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs">
            <span className="text-neutral-500">{label}:</span> <span className="font-medium">{count}</span>
          </div>
        ))}
      </div>

      <DataTable columns={columns} data={accounts} searchKeys={['name', 'accountNum']} />
    </div>
  );
}
