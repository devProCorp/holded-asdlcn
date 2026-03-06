import { useState } from 'react';
import { useProducts, useServices } from '../hooks/useHolded';
import DataTable from '../components/DataTable';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { formatCurrency } from '../utils/format';

const productColumns = [
  { key: 'name', label: 'Nombre', sortable: true },
  { key: 'sku', label: 'SKU', sortable: true },
  { key: 'price', label: 'Precio', sortable: true, render: (row) => formatCurrency(row.price) },
  {
    key: 'stock',
    label: 'Stock',
    sortable: true,
    render: (row) => {
      const stock = Number(row.stock) || 0;
      return (
        <span className={stock <= 0 ? 'text-red-400 font-medium' : stock < 10 ? 'text-orange-400 font-medium' : ''}>
          {stock}
        </span>
      );
    },
  },
  { key: 'barcode', label: 'Codigo barras', render: (row) => row.barcode || '-' },
];

const serviceColumns = [
  { key: 'name', label: 'Nombre', sortable: true },
  { key: 'sku', label: 'SKU', sortable: true },
  { key: 'price', label: 'Precio', sortable: true, render: (row) => formatCurrency(row.price) },
  { key: 'desc', label: 'Descripcion', render: (row) => row.desc || '-' },
];

export default function Products() {
  const [tab, setTab] = useState('products');
  const products = useProducts();
  const services = useServices();

  const isLoading = tab === 'products' ? products.isLoading : services.isLoading;
  const error = tab === 'products' ? products.error : services.error;
  const data = tab === 'products' ? products.data : services.data;
  const items = data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Productos y servicios</h2>
        <div className="flex border border-neutral-700 rounded-lg overflow-hidden">
          <button
            onClick={() => setTab('products')}
            className={`px-4 py-2 text-sm font-medium ${tab === 'products' ? 'bg-white text-black' : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'}`}
          >
            Productos ({products.data?.length || 0})
          </button>
          <button
            onClick={() => setTab('services')}
            className={`px-4 py-2 text-sm font-medium ${tab === 'services' ? 'bg-white text-black' : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'}`}
          >
            Servicios ({services.data?.length || 0})
          </button>
        </div>
      </div>

      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage error={error} />}
      {!isLoading && !error && (
        items.length > 0 ? (
          <DataTable
            columns={tab === 'products' ? productColumns : serviceColumns}
            data={items}
            searchKeys={['name', 'sku', 'barcode']}
          />
        ) : (
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-10 text-center text-neutral-500">
            No hay {tab === 'products' ? 'productos' : 'servicios'} registrados
          </div>
        )
      )}
    </div>
  );
}
