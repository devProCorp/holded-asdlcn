import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileDown } from 'lucide-react';
import { useDocuments } from '../hooks/useHolded';
import DataTable from '../components/DataTable';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import PdfViewer from '../components/PdfViewer';
import { formatCurrency, formatDate } from '../utils/format';

const docTypes = [
  { value: 'invoice', label: 'Facturas venta' },
  { value: 'purchase', label: 'Facturas compra' },
  { value: 'estimate', label: 'Presupuestos' },
  { value: 'proform', label: 'Proformas' },
  { value: 'waybill', label: 'Albaranes' },
  { value: 'salesorder', label: 'Pedidos venta' },
  { value: 'purchaseorder', label: 'Pedidos compra' },
  { value: 'creditnote', label: 'Notas credito' },
  { value: 'purchaserefund', label: 'Devol. compra' },
];

export default function Invoices() {
  const [searchParams] = useSearchParams();
  const [docType, setDocType] = useState(searchParams.get('type') || 'invoice');
  const { data, isLoading, error } = useDocuments(docType);
  const [pdfModal, setPdfModal] = useState(null);

  useEffect(() => {
    const type = searchParams.get('type');
    if (type && docTypes.some(dt => dt.value === type)) {
      setDocType(type);
    }
  }, [searchParams]);

  const columns = [
    { key: 'docNumber', label: 'Numero', sortable: true },
    {
      key: 'contactName',
      label: 'Contacto',
      sortable: true,
      render: (row) => (
        <span className="truncate block max-w-[200px]" title={row.contactName}>
          {row.contactName?.split(' (')[0] || '-'}
        </span>
      ),
    },
    { key: 'date', label: 'Fecha', sortable: true, render: (row) => formatDate(row.date) },
    { key: 'subtotal', label: 'Base', sortable: true, render: (row) => formatCurrency(row.subtotal) },
    { key: 'tax', label: 'IVA', sortable: true, render: (row) => formatCurrency(row.tax) },
    { key: 'total', label: 'Total', sortable: true, render: (row) => <span className="font-medium">{formatCurrency(row.total)}</span> },
    {
      key: 'paymentsPending',
      label: 'Pendiente',
      sortable: true,
      render: (row) => {
        const pending = Number(row.paymentsPending) || 0;
        return pending > 0 ? <span className="text-orange-400 font-medium">{formatCurrency(pending)}</span> : <span className="text-green-400">-</span>;
      },
    },
    {
      key: 'status',
      label: 'Estado',
      render: (row) => {
        const isPaid = Number(row.paymentsPending) === 0 && Number(row.total) > 0;
        if (row.draft) return <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-800 text-neutral-400">Borrador</span>;
        if (isPaid) return <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-950/40 text-green-400">Pagado</span>;
        return <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-orange-950/40 text-orange-400">Pendiente</span>;
      },
    },
    {
      key: 'pdf',
      label: 'PDF',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setPdfModal({ id: row.id, docNumber: row.docNumber });
          }}
          className="p-1.5 text-neutral-400 hover:bg-neutral-800 rounded-lg transition-colors"
          title="Ver PDF"
        >
          <FileDown size={16} />
        </button>
      ),
    },
  ];

  const docs = data || [];
  const totalAmount = docs.reduce((s, d) => s + (Number(d.total) || 0), 0);
  const totalPending = docs.reduce((s, d) => s + (Number(d.paymentsPending) || 0), 0);
  const totalPaid = docs.reduce((s, d) => s + (Number(d.paymentsTotal) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold">Documentos</h2>
      </div>

      {/* Doc type tabs */}
      <div className="flex gap-2 flex-wrap">
        {docTypes.map((dt) => (
          <button
            key={dt.value}
            onClick={() => setDocType(dt.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              docType === dt.value
                ? 'bg-white text-black border-white'
                : 'bg-transparent text-neutral-400 border-neutral-700 hover:bg-neutral-800'
            }`}
          >
            {dt.label}
          </button>
        ))}
      </div>

      {isLoading && <LoadingSpinner text="Cargando documentos..." />}
      {error && <ErrorMessage error={error} />}
      {!isLoading && !error && (
        <>
          {/* Summary stats */}
          <div className="flex gap-6 flex-wrap text-sm">
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2">
              <span className="text-neutral-500">Documentos:</span> <span className="font-medium">{docs.length}</span>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2">
              <span className="text-neutral-500">Total:</span> <span className="font-medium">{formatCurrency(totalAmount)}</span>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2">
              <span className="text-neutral-500">Cobrado/Pagado:</span> <span className="font-medium text-green-400">{formatCurrency(totalPaid)}</span>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2">
              <span className="text-neutral-500">Pendiente:</span> <span className="font-medium text-orange-400">{formatCurrency(totalPending)}</span>
            </div>
          </div>
          <DataTable columns={columns} data={docs} searchKeys={['docNumber', 'contactName']} />
        </>
      )}

      {/* PDF Modal */}
      {pdfModal && (
        <PdfViewer
          docType={docType}
          documentId={pdfModal.id}
          docNumber={pdfModal.docNumber}
          onClose={() => setPdfModal(null)}
        />
      )}
    </div>
  );
}
