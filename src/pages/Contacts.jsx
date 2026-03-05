import { useContacts } from '../hooks/useHolded';
import DataTable from '../components/DataTable';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const columns = [
  { key: 'name', label: 'Nombre', sortable: true },
  { key: 'tradeName', label: 'Nombre comercial', sortable: true, render: (row) => row.tradeName || '-' },
  { key: 'email', label: 'Email', sortable: true, render: (row) => row.email || '-' },
  { key: 'phone', label: 'Telefono', render: (row) => row.phone || row.mobile || '-' },
  {
    key: 'type',
    label: 'Tipo',
    sortable: true,
    render: (row) => {
      const types = { client: 'Cliente', supplier: 'Proveedor', creditor: 'Acreedor', debtor: 'Deudor' };
      const colors = {
        client: 'bg-blue-100 text-blue-700',
        supplier: 'bg-purple-100 text-purple-700',
        creditor: 'bg-orange-100 text-orange-700',
        debtor: 'bg-red-100 text-red-700',
      };
      const type = row.type || '';
      if (!type) return <span className="text-gray-400">-</span>;
      return (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${colors[type] || 'bg-gray-100 text-gray-700'}`}>
          {types[type] || type}
        </span>
      );
    },
  },
  { key: 'code', label: 'NIF/CIF', sortable: true },
  {
    key: 'billAddress.city',
    label: 'Ciudad',
    sortable: true,
    render: (row) => row.billAddress?.city || '-',
  },
  {
    key: 'clientRecord',
    label: 'Cuenta',
    render: (row) => {
      const parts = [];
      if (row.clientRecord?.num) parts.push(`C: ${row.clientRecord.num}`);
      if (row.supplierRecord?.num) parts.push(`P: ${row.supplierRecord.num}`);
      return parts.length > 0 ? <span className="text-xs text-gray-500">{parts.join(' | ')}</span> : '-';
    },
  },
];

export default function Contacts() {
  const { data, isLoading, error } = useContacts();

  if (isLoading) return <LoadingSpinner text="Cargando contactos..." />;
  if (error) return <ErrorMessage error={error} />;

  const contacts = data || [];
  const clients = contacts.filter(c => c.type === 'client').length;
  const suppliers = contacts.filter(c => c.type === 'supplier').length;
  const other = contacts.length - clients - suppliers;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold">Contactos</h2>
        <div className="flex gap-4 text-sm text-gray-500">
          <span>{contacts.length} total</span>
          {clients > 0 && <span className="text-blue-600">{clients} clientes</span>}
          {suppliers > 0 && <span className="text-purple-600">{suppliers} proveedores</span>}
          {other > 0 && <span>{other} otros</span>}
        </div>
      </div>
      <DataTable columns={columns} data={contacts} searchKeys={['name', 'tradeName', 'email', 'code', 'phone', 'mobile']} />
    </div>
  );
}
