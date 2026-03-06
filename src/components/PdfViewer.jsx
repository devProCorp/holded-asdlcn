import { useState, useEffect } from 'react';
import { X, Download, Loader2, FileText } from 'lucide-react';
import { getDocumentPdf } from '../api/holded';

export default function PdfViewer({ docType, documentId, docNumber, onClose }) {
  const [pdfData, setPdfData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPdfData(null);

    getDocumentPdf(docType, documentId)
      .then((base64) => {
        if (!cancelled) {
          setPdfData(base64);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [docType, documentId]);

  const handleDownload = () => {
    if (!pdfData) return;
    const byteCharacters = atob(pdfData);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docNumber || 'documento'}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={onClose}>
      <div
        className="bg-neutral-900 rounded-xl shadow-2xl w-[90vw] h-[90vh] max-w-5xl flex flex-col border border-neutral-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-neutral-400" />
            <span className="font-medium text-neutral-200">{docNumber || 'Documento'}</span>
          </div>
          <div className="flex items-center gap-2">
            {pdfData && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors"
              >
                <Download size={14} />
                Descargar
              </button>
            )}
            <button onClick={onClose} className="p-1.5 hover:bg-neutral-800 rounded-lg transition-colors text-neutral-500">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden">
          {loading && (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 size={32} className="animate-spin text-neutral-400" />
              <p className="text-sm text-neutral-500 mt-3">Cargando PDF...</p>
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center justify-center h-full text-red-400">
              <p className="font-medium">Error al cargar el PDF</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}
          {pdfData && (
            <iframe
              src={`data:application/pdf;base64,${pdfData}`}
              className="w-full h-full border-0"
              title={`PDF ${docNumber}`}
            />
          )}
        </div>
      </div>
    </div>
  );
}
