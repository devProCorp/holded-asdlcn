import { useState, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown } from 'lucide-react';

export default function DataTable({ columns, data, searchKeys = [], pageSize = 15 }) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!search || searchKeys.length === 0) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      searchKeys.some((key) => {
        const val = key.split('.').reduce((o, k) => o?.[k], row);
        return String(val ?? '').toLowerCase().includes(q);
      })
    );
  }, [data, search, searchKeys]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = sortKey.split('.').reduce((o, k) => o?.[k], a) ?? '';
      const bVal = sortKey.split('.').reduce((o, k) => o?.[k], b) ?? '';
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortDir === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filtered, sortKey, sortDir]);

  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(sorted.length / pageSize);

  const handleSort = (key) => {
    if (!key) return;
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <div className="bg-neutral-900 rounded-xl border border-neutral-800">
      {searchKeys.length > 0 && (
        <div className="p-4 border-b border-neutral-800">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="w-full pl-9 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-transparent"
            />
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-800">
              {columns.map((col) => (
                <th
                  key={col.key || col.label}
                  className={`px-4 py-3 text-left font-medium text-neutral-500 ${col.sortable ? 'cursor-pointer select-none hover:text-neutral-300' : ''}`}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-neutral-600">
                  No se encontraron resultados
                </td>
              </tr>
            ) : (
              paged.map((row, i) => (
                <tr key={row.id || row._id || i} className="border-b border-neutral-800/50 hover:bg-neutral-800/40">
                  {columns.map((col) => (
                    <td key={col.key || col.label} className="px-4 py-3">
                      {col.render ? col.render(row) : col.key?.split('.').reduce((o, k) => o?.[k], row) ?? '-'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-800">
          <span className="text-xs text-neutral-500">
            {sorted.length} resultados - Pagina {page + 1} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-3 py-1 text-xs border border-neutral-700 rounded-md text-neutral-400 disabled:opacity-40 hover:bg-neutral-800"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1 text-xs border border-neutral-700 rounded-md text-neutral-400 disabled:opacity-40 hover:bg-neutral-800"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
