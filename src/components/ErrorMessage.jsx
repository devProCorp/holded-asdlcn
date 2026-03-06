import { AlertCircle } from 'lucide-react';

export default function ErrorMessage({ error }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-red-950/30 border border-red-900/50 rounded-xl text-red-400">
      <AlertCircle size={20} />
      <div>
        <p className="font-medium">Error al cargar datos</p>
        <p className="text-sm">{error?.message || 'Error desconocido'}</p>
      </div>
    </div>
  );
}
