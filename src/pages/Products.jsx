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
        <span className={stock <= 0 ? 'text-red-600 font-medium' : stock < 10 ? 'text-orange-600 font-medium' : ''}>
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
        <div className="flex border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setTab('products')}
            className={`px-4 py-2 text-sm font-medium ${tab === 'products' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            Productos ({products.data?.length || 0})
          </button>
          <button
            onClick={() => setTab('services')}
            className={`px-4 py-2 text-sm font-medium ${tab === 'services' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
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
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
            No hay {tab === 'products' ? 'productos' : 'servicios'} registrados
          </div>
        )
      )}
    </div>
  );
}
