import { AlertCircle } from 'lucide-react';

export default function ErrorMessage({ error }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
      <AlertCircle size={20} />
      <div>
        <p className="font-medium">Error al cargar datos</p>
        <p className="text-sm">{error?.message || 'Error desconocido'}</p>
      </div>
    </div>
  );
}
